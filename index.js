const http = require('http');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const middleware = require('./utils/middleware');
const featRouter = require('./controllers/feats');
const userRouter = require('./controllers/users');
const loginRouter = require('./controllers/login');
const locationRouter = require('./controllers/locations');
const proofRouter = require('./controllers/proofs');
const propertiesRouter = require('./controllers/properties');
const config = require('./utils/config');

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

app.use(middleware.logger);

app.use('/api/login', loginRouter);
app.use('/api/users', userRouter);
app.use('/api/feats', featRouter);
app.use('/api/locations', locationRouter);
app.use('/api/proofs', proofRouter);
app.use('/api/properties', propertiesRouter);

app.use(middleware.error);

const server = http.createServer(app);

server.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
});

server.on('close', () => {
});

module.exports = {
    app, server
};