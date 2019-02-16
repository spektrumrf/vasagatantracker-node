const firestore = require('../firestore');
const jwt = require('jsonwebtoken');

const getTokenFrom = (request) => {
    const authorization = request.get('Authorization');
    if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
        return authorization.substring(7);
    }
    return null;
};

const tokenCheck = (request) => {
    const token = getTokenFrom(request);
    const decodedToken = jwt.verify(token, process.env.SECRET);

    if (!token || !decodedToken.id) {
        return false;
    }

    return decodedToken;
};

const isAuthorized = async (request, response, adminRequired) => {
    const decodedToken = tokenCheck(request);
    if (!decodedToken) {
        response.status(401).json({ error: 'Token saknas eller är felaktig, är du säkert inloggad?' });
        return null;
    }

    const authorizedUserSnap = await firestore.getCollection(request.query.year, 'users').doc(decodedToken.id).get();
    const authorizedUser = authorizedUserSnap.data();

    if (!authorizedUser) {
        response.status(401).json({ error: 'Användaren hittas inte, försök logga in på nytt!' });
        return null;
    }

    if (adminRequired && authorizedUser.type !== 'admin') {
        response.status(401).json({ error: 'Denna operation kräver admin-rättigheter!' });
        return null;
    }

    return authorizedUser;
};

module.exports = isAuthorized;