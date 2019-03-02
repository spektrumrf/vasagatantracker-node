const firestore = require('../firestore');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const loginRouter = require('express').Router();

loginRouter.post('/', async (request, response) => {
    const body = request.body;

    const userSnap = await firestore.getCollection(request.query.year, 'users').where('username', '==', body.username).get();
    const user = userSnap.docs[0] ? userSnap.docs[0].data() : null;
    const passwordCorrect =
        user === null ?
            false :
            await bcrypt.compare(body.password, user.passwordHash);

    if (!(user && passwordCorrect)) {
        return response.status(401).send({ error: 'Användarnamnet eller lösenordet är felaktigt!' });
    }

    const userForToken = {
        username: user.username,
        id: user.id
    };

    const token = jwt.sign(userForToken, process.env.SECRET);

    firestore.getAuth().createCustomToken(user.id)
        .then(function(customToken) {
            return response.status(200).send({ id: user.id, token, firestoreToken: customToken, username: user.username, name: user.name, type: user.type });

        })
        .catch(function(error) {
            return response.status(500).send({ error: 'Kunde inte skapa token, sorry!' });

        });
});

module.exports = loginRouter;