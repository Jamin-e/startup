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
cp "$root_dir/service/index.js" "$root_dir/service/database.js" "$root_dir/service/dbConfig.json" "$root_dir/service/package.json" "$build_dir/service/"
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

# Replace any older PM2 process definition so it cannot keep running the
# pre-deployment script path from the previous directory layout.
pm2 delete "$service" >/dev/null 2>&1 || true
pm2 start "$PWD/index.js" --name "$service" -- 4000
ENDSSH

printf '\n----> Deployment complete: %s on %s\n' "$service" "$hostname"
