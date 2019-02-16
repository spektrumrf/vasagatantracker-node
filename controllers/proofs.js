const firestore = require('../firestore');
const proofRouter = require('express').Router();

proofRouter.get('/', async (request, response) => {

    const proofsSnap = await firestore.getCollection(request.query.year, 'proofs').get();
    const proofs = proofsSnap.docs.map(doc => doc.data());

    response.json(proofs);
});

proofRouter.get('/:id', async (request, response) => {
    const proofSnap = await firestore.getCollection(request.query.year, 'proofs').doc(request.params.id).get();
    const proof = proofSnap.data();

    response.json(proof);
});

module.exports = proofRouter;