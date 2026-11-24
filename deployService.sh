#!/usr/bin/env bash
set -Eeuo pipefail

while getopts "k:h:s:" flag; do
    case "${flag}" in
        k) key=${OPTARG} ;;
        h) hostname=${OPTARG} ;;
        s) service=${OPTARG} ;;
        *) exit 2 ;;
    esac
done

if [[ -z "${key:-}" || -z "${hostname:-}" || -z "${service:-}" ]]; then
    printf '\nMissing required parameter.\n'
    printf '  syntax: deployService.sh -k <pem key file> -h <hostname> -s <service>\n\n'
    exit 1
fi

if [[ ! "$service" =~ ^[A-Za-z0-9_-]+$ ]]; then
    printf 'Service name may contain only letters, numbers, underscores, and hyphens.\n' >&2
    exit 1
fi

if [[ ! -f "$key" ]]; then
    printf 'SSH key file not found: %s\n' "$key" >&2
    exit 1
fi

root_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
build_dir="$root_dir/build"
remote_dir="services/$service"

cleanup() {
    rm -rf "$build_dir"
}
trap cleanup EXIT

printf '\n----> Building frontend\n'
cd "$root_dir"
npm ci
npm run build

printf '\n----> Preparing deployment package\n'
rm -rf "$build_dir"
mkdir -p "$build_dir"
cp -R "$root_dir/dist" "$build_dir/dist"
mkdir -p "$build_dir/service"
cp "$root_dir/service/index.js" "$root_dir/service/database.js" "$root_dir/service/dbconfig.json" "$root_dir/service/package.json" "$build_dir/service/"
if [[ -f "$root_dir/service/package-lock.json" ]]; then
    cp "$root_dir/service/package-lock.json" "$build_dir/service/"
fi

printf '\n----> Creating remote deployment directory\n'
ssh -i "$key" "ubuntu@$hostname" "mkdir -p '$remote_dir'"

printf '\n----> Copying deployment package\n'
scp -r -i "$key" "$build_dir/dist" "$build_dir/service" "ubuntu@$hostname:$remote_dir/"

printf '\n----> Installing backend dependencies and restarting service\n'
ssh -i "$key" "ubuntu@$hostname" bash -l -s -- "$remote_dir" "$service" <<'ENDSSH'
set -Eeuo pipefail
remote_dir=$1
service=$2

# Node installed with nvm is often unavailable in a non-interactive SSH shell.
if ! command -v npm >/dev/null 2>&1 && [[ -s "$HOME/.nvm/nvm.sh" ]]; then
    source "$HOME/.nvm/nvm.sh"
fi

if ! command -v npm >/dev/null 2>&1; then
    printf 'npm is not installed or is not on PATH for user %s. Install Node.js/npm on the server, then rerun deployment.\n' "$USER" >&2
    exit 1
fi

cd "$remote_dir/service"
npm ci --omit=dev

# Remove this service's named process and any process still running either the
# old root-level entry point or the newly deployed entry point. The old process
# may have a different PM2 name and otherwise continue serving stale code.
while IFS= read -r process_id; do
    [[ -n "$process_id" ]] || continue
    pm2 delete "$process_id" >/dev/null
done < <(pm2 jlist | node -e '
    const path = require("node:path");
    const [service, legacyPath, currentPath] = process.argv.slice(1);
    const paths = new Set([legacyPath, currentPath].map((value) => path.resolve(value)));
    let input = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => input += chunk);
    process.stdin.on("end", () => {
        for (const proc of JSON.parse(input)) {
            const script = proc.pm2_env && proc.pm2_env.pm_exec_path;
            if (proc.name === service || (script && paths.has(path.resolve(script)))) {
                console.log(proc.pm_id);
            }
        }
    });
' "$service" "$HOME/$remote_dir/index.js" "$PWD/index.js")

PORT=${PORT:-4000} pm2 start "$PWD/index.js" --name "$service"

# Wait for PM2 to report the exact deployed entry point online. Checking once
# immediately after `pm2 start` can pass while the process is still launching.
for attempt in {1..10}; do
    if pm2 jlist | node -e '
    const path = require("node:path");
    const [service, expectedPath] = process.argv.slice(1);
    let input = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => input += chunk);
    process.stdin.on("end", () => {
        const proc = JSON.parse(input).find((item) => item.name === service);
        const actualPath = proc && proc.pm2_env && proc.pm2_env.pm_exec_path;
        const status = proc && proc.pm2_env && proc.pm2_env.status;
        if (proc && status === "online" && path.resolve(actualPath) === path.resolve(expectedPath)) {
            console.log(`Verified PM2 is running ${actualPath}`);
        } else {
            process.exitCode = 1;
        }
    });
' "$service" "$PWD/index.js"; then
        break
    fi
    if [[ "$attempt" -eq 10 ]]; then
        pm2 describe "$service" || true
        printf 'PM2 did not bring %s online. Check `pm2 logs %s --lines 100` on the server.\n' "$PWD/index.js" "$service" >&2
        exit 1
    fi
    sleep 1
done
ENDSSH

printf '\n----> Deployment complete: %s on %s\n' "$service" "$hostname"
