const firestore = require('../firestore');
const featsRouter = require('express').Router();
const isAuthorized = require('../utils/auth');
const moment = require('moment');
const uuid = require('uuid/v4');

featsRouter.get('/', async (request, response) => {
    const featsSnap = await firestore.getCollection(request.query.year, 'feats').get();
    const feats = featsSnap.docs.map(doc => doc.data());

    response.json(feats);
});

featsRouter.get('/:id', async (request, response) => {
    try {
        const authorizedUser = await isAuthorized(request, response);

        if (!authorizedUser) {
            return;
        }

        const featSnap = await firestore.getCollection(request.query.year, 'feats').doc(request.params.id).get();
        const feat = featSnap.data();

        if (feat) {
            response.json(feat);
        } else {
            response.status(404).end();
        }

    } catch (exception) {
        console.log(exception);
        response.status(400).send({ error: 'Prestationens id är av fel form' });
    }
});

featsRouter.delete('/:id', async (request, response) => {
    try {

        const authorizedUser = await isAuthorized(request, response, true);

        if (!authorizedUser) {
            return;
        }
        const year = request.query.year;
        const activeYearSnap = await firestore.getProperties().doc('activeYear').get();
        const activeYear = activeYearSnap.data().activeYear.toString();
        if (year !== activeYear) {
            return response.status(400).json({ error: 'Det går inte att radera prestationer från tidigare år!' });
        }
        const featSnap = await firestore.getCollection(year, 'feats').doc(request.params.id).get();
        const feat = featSnap.data();

        await firestore.getStore().runTransaction(async t => {
            t.delete(firestore.getCollection(year, 'feats').doc(request.params.id));
        });

        await Promise.all(feat.proofs.map(proof => {
            return firestore.getBucket().file(proof).delete();
        }));

        response.status(204).json(feat);
    } catch (exception) {
        console.log(exception);
        response.status(400).send({ error: 'Prestationens id är av fel form' });
    }
});

featsRouter.post('/', async (request, response) => {
    const body = request.body;

    try {
        const authorizedUser = await isAuthorized(request, response);

        if (!authorizedUser) {
            return;
        }

        if (body.value === undefined || body.location === undefined) {
            return response.status(400).json({ error: 'Värde eller plats saknas' });
        }

        const activeYearSnap = await firestore.getProperties().doc('activeYear').get();
        const activeYear = activeYearSnap.data().activeYear.toString();
        if (request.query.year !== activeYear) {
            return response.status(400).json({ error: 'Det går inte att skapa nya prestationer för tidigare år!' });
        }

        let proofs = [];
        await Promise.all(body.proofs.map(proof => {
            const proofId = uuid();
            proofs.push(proofId);
            return firestore.getBucket().upload(proof, { destination: proofId });
        }));

        const feat = {
            id: uuid(),
            approved: false,
            value: body.value,
            location: body.location,
            date: moment().unix(),
            user: authorizedUser.id,
            content: body.content ? body.content : {},
            comment: body.comment ? body.comment : '',
            adminComment: '',
            proofs
        };

        await firestore.getStore().runTransaction(async t => {
            t.set(firestore.getCollection(request.query.year, 'feats').doc(feat.id), feat);
        });

        response.json(feat);
    } catch (exception) {
        if (exception.name === 'JsonWebTokenError') {
            response.status(401).json({ error: exception.message });
        } else {
            console.log(exception);
            response.status(500).json({ error: 'Något katastrofalt har inträffat! :(' });
        }
    }
});

featsRouter.put('/:id', async (request, response) => {
    const body = request.body;
    try {

        const authorizedUser = await isAuthorized(request, response, true);

        if (!authorizedUser) {
            return;
        }

        const activeYearSnap = await firestore.getProperties().doc('activeYear').get();
        const activeYear = activeYearSnap.data().activeYear.toString();
        if (request.query.year !== activeYear) {
            return response.status(400).json({ error: 'Det går inte att editera prestationer från tidigare år!' });
        }

        const editedFeat = {
            approved: body.approved,
            date: body.date,
            value: body.value,
            user: body.user,
            location: body.location,
            content: body.content,
            comment: body.comment ? body.comment : '',
            adminComment: body.adminComment ? body.adminComment : ''
        };

        const feat = body.currentFeat;
        const year = request.query.year;
        const type = request.query.type;

        if (type === 'approveFeat') {
            await firestore.getStore().runTransaction(async t => {
                t.update(firestore.getCollection(year, 'feats').doc(feat.id), { approved: true });
            });
        } else if (type === 'editFeat') {
            await firestore.getStore().runTransaction(async t => {
                t.update(firestore.getCollection(year, 'feats').doc(feat.id), editedFeat);
            });
        }
        const updatedFeatSnap = await firestore.getCollection(request.query.year, 'feats').doc(feat.id).get();
        const updatedFeat = updatedFeatSnap.data();
        response.json(updatedFeat);

    } catch (error) {
        console.log(error);
        response.status(400).send({ error: 'Prestationens id är av fel form' });
    }
});

module.exports = featsRouter;