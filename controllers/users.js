const firestore = require('../firestore');
const bcrypt = require('bcrypt');
const usersRouter = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const isAuthorized = require('../utils/auth');

usersRouter.get('/', async (request, response) => {
    const usersSnap = await firestore.getCollection(request.query.year, 'users').get();
    const users = usersSnap.docs.map(doc => doc.data());

    response.json(users);
});

usersRouter.get('/:id', async (request, response) => {
    try {
        const authorizedUser = await isAuthorized(request, response);

        if (!authorizedUser) {
            return;
        }

        const userSnap = await firestore.getCollection(request.query.year, 'users').doc(request.params.id).get();
        const user = userSnap.data();

        if (user) {
            response.json(user);
        } else {
            response.status(404).end();
        }

    } catch (exception) {
        console.log(exception);
        response.status(400).send({ error: 'Användares id är av fel form!' });
    }
});

usersRouter.post('/', async (request, response) => {
    try {
        const body = request.body;

        /*         const authorizedUser = await isAuthorized(request, response, true);

        if (!authorizedUser) {
            return;
        } */

        const activeYearSnap = await firestore.getProperties().doc('activeYear').get();
        const activeYear = activeYearSnap.data().activeYear.toString();
        if (request.query.year !== activeYear) {
            return response.status(400).json({ error: 'Det går inte att skapa nya användare för tidigare år!' });
        }

        const usersSnap = await firestore.getCollection(request.query.year, 'users').where('username', '==', body.username).get();
        const existingUsers = usersSnap.docs.map(doc => doc.data());
        if (existingUsers.length > 0) {
            return response.status(400).json({ error: 'Användarnamnet måste vara unikt!' });
        }

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(body.password, saltRounds);

        const user = {
            id: uuidv4(),
            name: body.name,
            username: body.username,
            type: body.type,
            passwordHash,
            coefficient: body.coefficient
        };

        await firestore.getCollection(request.query.year, 'users').doc(user.id).set(user);
        response.json(user);
    } catch (exception) {
        console.log(exception);
        response.status(500).json({ error: 'Något katastrofalt har inträffat! :(' });
    }
});

usersRouter.delete('/:id', async (request, response) => {
    try {
        const authorizedUser = await isAuthorized(request, response, true);

        if (!authorizedUser) {
            return;
        }

        const activeYearSnap = await firestore.getProperties().doc('activeYear').get();
        const activeYear = activeYearSnap.data().activeYear.toString();
        if (request.query.year !== activeYear) {
            return response.status(400).json({ error: 'Det går inte att radera användare från tidigare år!' });
        }

        const userSnap = firestore.getCollection(request.query.year, 'users').doc(request.params.id);
        const user = userSnap.data();
        if(!user) {
            return response.status(400).json({ error: 'Användare hittas inte!' });
        }

        if(user.username === 'ruben') {
            return response.status(400).json({ error: 'Ruben kan inte raderas ;)' });
        }

        const removedUser = await firestore.getStore().runTransaction(async t => {
            const removedUserSnap = await t.get(firestore.getCollection(request.query.year, 'users').doc(request.params.id));
            const removedUser = removedUserSnap.data();

            const featsSnap = await t.get(firestore.getCollection(request.query.year, 'feats').where('user', '==', request.params.id));
            for (const feat of featsSnap.docs.map(doc => doc.data())) {
                t.delete(firestore.getCollection(request.query.year, 'feats').doc(feat.id));
            }
            t.delete(firestore.getCollection(request.query.year, 'users').doc(request.params.id));
            return removedUser;
        });

        response.status(204).json(removedUser);
    } catch (exception) {
        console.log(exception);
        response.status(500).json({ error: 'Något katastrofalt har inträffat! :(' });
    }
});

usersRouter.put('/:id', async (request, response) => {
    const body = request.body;
    try {
        const authorizedUser = await isAuthorized(request, response, true);

        if (!authorizedUser) {
            return response.status(400).json({ error: 'Det går inte att editera användare från tidigare år!' });
        }

        const activeYearSnap = await firestore.getProperties().doc('activeYear').get();
        const activeYear = activeYearSnap.data().activeYear.toString();
        if (request.query.year !== activeYear) {
            return;
        }

        const user = {
            username: body.username,
            name: body.name,
            type: body.type,
            coefficient: body.coefficient
        };

        const updatedUserSnap = await firestore.getCollection(body.year, 'users').doc(request.params.id).update(user);
        const updatedUser = updatedUserSnap.data();
        response.json(updatedUser);

    } catch (error) {
        console.log(error);
        response.status(400).send({ error: 'Användarens id är av fel form!' });
    }
});

module.exports = usersRouter;