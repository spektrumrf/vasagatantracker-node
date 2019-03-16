const firestore = require('../firestore');
const propertiesRouter = require('express').Router();
const isAuthorized = require('../utils/auth');

propertiesRouter.put('/', async (request, response) => {
    const body = request.body;

    const authorizedUser = await isAuthorized(request, response, true);

    if (!authorizedUser) {
        return;
    }

    const activeYearSnap = await firestore.getProperties().doc('activeYear').get();
    const activeYear = activeYearSnap.data().activeYear.toString();
    if (request.query.year !== activeYear.toString()) {
        return response.status(400).json({ error: 'Det går inte att editera egenskaper för tidigare år!' });
    }

    let newProperties;
    if(body.realtimeCutoffTime){
        newProperties = {
            realtimeCutoffTime: body.realtimeCutoffTime,
        };
    }
    if(body.startDate){
        newProperties = {
            ...newProperties,
            startDate: body.startDate
        };
    }

    const properties = await firestore.getDatabase(request.query.year).update(newProperties);

    response.status(200).json(properties);
});

module.exports = propertiesRouter;