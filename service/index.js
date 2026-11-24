const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const express = require('express');
const { randomUUID } = require('node:crypto');
const app = express();
const DB = require('./database.js');

const authCookieName = 'token';

// The service port. In production the front-end code is statically hosted by the service on the same port.
const port = Number(process.env.PORT || process.argv[2] || 4000);

// JSON body parsing using built-in middleware
app.use(express.json());

// Use the cookie parser middleware for tracking authentication tokens
app.use(cookieParser());

const path = require('path');

const frontendPath = path.join(__dirname, '..', 'dist');

app.use(express.static(frontendPath));

// Router for service endpoints
const apiRouter = express.Router();
app.use(`/api`, apiRouter);

apiRouter.get('/health', async (_req, res) => {
    try {
        await DB.ping();
        res.status(200).json({ status: 'ok', database: 'connected' });
    } catch (err) {
        console.error('MongoDB health check failed:', err);
        res.status(503).json({ status: 'error', database: 'unavailable' });
    }
});

// CreateAuth a new user
apiRouter.post('/auth/create', async (req, res) => {
    if (await findUser('email', req.body.email)) {
        res.status(409).send({ msg: 'Existing user' });
    } else {
        const user = await createUser(req.body.email, req.body.password);

        setAuthCookie(res, user.token);
        res.send({ email: user.email });
    }
});

// GetAuth login an existing user
apiRouter.post('/auth/login', async (req, res) => {
    const user = await findUser('email', req.body.email);
    if (user) {
        if (await bcrypt.compare(req.body.password, user.password)) {
            user.token = randomUUID();
            await DB.updateUser(user);
            setAuthCookie(res, user.token);
            res.send({ email: user.email });
            return;
        }
    }
    res.status(401).send({ msg: 'Unauthorized' });
});

// Restore the client session from the httpOnly authentication cookie.
apiRouter.get('/auth/me', verifyAuth, (req, res) => {
    res.send({ email: req.user.email });
});

// DeleteAuth logout a user
apiRouter.delete('/auth/logout', async (req, res) => {
    const user = await findUser('token', req.cookies[authCookieName]);
    if (user) {
        await DB.updateUserRemoveAuth(user);
    }
    res.clearCookie(authCookieName);
    res.status(204).end();
});

// Middleware to verify that the user is authorized to call an endpoint
async function verifyAuth(req, res, next) {
    const user = await findUser('token', req.cookies[authCookieName]);
    if (user) {
        req.user = user;
        next();
    } else {
        res.status(401).send({ msg: 'Unauthorized' });
    }
}


// GetSearch
apiRouter.get('/searches', verifyAuth, async (req, res) => {
    const searches = await DB.getSearches(req.user.email);
    res.send(searches);
});

// SubmitSearch
apiRouter.post('/search', verifyAuth, async (req, res) => {
    const searches = await updateSearches(req.user.email, req.body);
    res.send(searches);
});

// Default error handler
/** @type {import('express').ErrorRequestHandler} */
function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    console.error('Request failed:', err);
    res.status(500).json({
        type: err.name || 'InternalServerError',
        message: err.message || 'An unexpected error occurred.',
    });
}
app.use(errorHandler);

// Return the application's default page if the path is unknown
app.use((_req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

async function updateSearches(email, newSearch) {
    await DB.addSearch(email, newSearch);
    return DB.getSearches(email);
}

async function createUser(email, password) {
    const passwordHash = await bcrypt.hash(password, 10);

    const user = {
        email: email,
        password: passwordHash,
        token: randomUUID(),
    };
    await DB.addUser(user);

    return user;
}

async function findUser(field, value) {
    if (!value) return null;

    if (field === 'token') {
        return DB.getUserByToken(value);
    }
    return DB.getUser(value);
}

// setAuthCookie in the HTTP response
function setAuthCookie(res, authToken) {
    res.cookie(authCookieName, authToken, {
        maxAge: 1000 * 60 * 60 * 24 * 365,
        secure: true,
        httpOnly: true,
        sameSite: 'strict',
    });
}

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
