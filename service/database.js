const { MongoClient } = require('mongodb');
const fs = require('node:fs');
const path = require('node:path');

function loadConfigFile() {
    const configPath = path.join(__dirname, 'dbconfig.json');
    if (!fs.existsSync(configPath)) return {};
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

const config = loadConfigFile();
let client;

function getCollection(name) {
    if (!client) {
        const url = process.env.MONGODB_URI || (() => {
            const userName = process.env.MONGODB_USERNAME || config.userName;
            const password = process.env.MONGODB_PASSWORD || config.password;
            const hostname = process.env.MONGODB_HOSTNAME || config.hostname;

            if (!userName || !password || !hostname) {
                throw new Error('MongoDB is not configured. Set MONGODB_URI or MONGODB_USERNAME, MONGODB_PASSWORD, and MONGODB_HOSTNAME.');
            }

            return `mongodb+srv://${encodeURIComponent(userName)}:${encodeURIComponent(password)}@${hostname}/?retryWrites=true&w=majority`;
        })();
        client = new MongoClient(url);
    }
    return client.db('startup').collection(name);
}

function getUser(email) {
    return getCollection('user').findOne({ email: email });
}

function getUserByToken(token) {
    return getCollection('user').findOne({ token: token });
}

async function addUser(user) {
    await getCollection('user').insertOne(user);
}

async function updateUser(user) {
    await getCollection('user').updateOne({ email: user.email }, { $set: user });
}

async function updateUserRemoveAuth(user) {
    await getCollection('user').updateOne({ email: user.email }, { $unset: { token: 1 } });
}

async function addSearch(email, search) {
    return getCollection('savedSearch').insertOne({ ...search, userEmail: email });
}
function getSearches(email) {
    const query = { userEmail: email };
    const options = {
        sort: { _id: -1 },
        limit: 10,
    };
    const cursor = getCollection('savedSearch').find(query, options);
    return cursor.toArray();
}

async function ping() {
    getCollection('user');
    await client.db('admin').command({ ping: 1 });
}

module.exports = {
    getUser,
    getUserByToken,
    addUser,
    updateUser,
    updateUserRemoveAuth,
    addSearch,
    getSearches,
    ping,
};
