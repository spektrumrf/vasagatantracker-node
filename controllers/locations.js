const firestore = require('../firestore');
const locationRouter = require('express').Router();
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const isAuthorized = require('../utils/auth');

locationRouter.get('/', async (request, response) => {

    const locationsSnap = await firestore.getCollection(request.query.year, 'locations').get();
    const locations = locationsSnap.docs.map(doc => doc.data());

    response.json(locations);
});

locationRouter.get('/:id', async (request, response) => {

    const locationSnap = await firestore.getCollection(request.query.year, 'locations').doc(request.params.id).get();
    const location = locationSnap.data();

    response.json(location);
});

locationRouter.post('/', async (request, response) => {
    try {
        const body = request.body;

        const authorizedUser = await isAuthorized(request, response, true);

        if (!authorizedUser) {
            return;
        }

        const activeYearSnap = await firestore.getProperties().doc('activeYear').get();
        const activeYear = activeYearSnap.data().activeYear.toString();
        if (request.query.year !== activeYear) {
            return response.status(400).json({ error: 'Det går inte att skapa nya platser för tidigare år!' });
        }

        const location = {
            id: uuidv4(),
            name: body.name
        };

        await firestore.getCollection(request.query.year, 'locations').doc(location.id).set(location);

        response.json(location);
    } catch (exception) {
        console.log(exception);
        response.status(500).json({ error: 'Något katastrofalt har inträffat! :(' });
    }
});

locationRouter.delete('/:id', async (request, response) => {
    try {
        const authorizedUser = await isAuthorized(request, response, true);

        if (!authorizedUser) {
            return;
        }

        const activeYearSnap = await firestore.getProperties().doc('activeYear').get();
        const activeYear = activeYearSnap.data().activeYear.toString();
        if (request.query.year !== activeYear) {
            return response.status(400).json({ error: 'Det går inte att radera platser från tidigare år!' });
        }

        const removedLocation = await firestore.getStore().runTransaction(async t => {
            const removedLocationSnap = await t.get(firestore.getCollection(request.query.year, 'locations').doc(request.params.id));
            const removedLocation = removedLocationSnap.data();
            const featsSnap = await t.get(firestore.getCollection(request.query.year, 'feats').where('location', '==', request.params.id));
            for (const feat of featsSnap.docs.map(doc => doc.data())) {
                t.delete(firestore.getCollection(request.query.year, 'feats').doc(feat.id));
            }
            t.delete(firestore.getCollection(request.query.year, 'locations').doc(request.params.id));
            return removedLocation;
        });

        response.status(204).json(removedLocation);
    } catch (exception) {
        console.log(exception);
        response.status(500).json({ error: 'Något katastrofalt har inträffat! :(' });
    }
});

module.exports = locationRouter;