require('firebase/firestore');
require('firebase/auth');
require('dotenv').config();

const admin = require('firebase-admin');

admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    }),
    storageBucket: 'vasagatantracker-spektrumrf.appspot.com',
    databaseURL: 'https://vasagatantracker-spektrumrf.firebaseio.com'
});

admin.firestore().settings({ timestampsInSnapshots: true });

const getAuth = () => {
    return admin.auth();
};

const getDatabase = (year) => {
    return admin.firestore().collection('years').doc(year);
};

const getCollection = (year, name) => {
    return admin.firestore().collection('years').doc(year).collection(name);
};

const getProperties = () => {
    return admin.firestore().collection('properties');
};

const getStore = () => {
    return admin.firestore();
};

const getBucket = () => {
    return admin.storage().bucket();
};

module.exports = { getDatabase, getCollection, getAuth, getStore, getBucket, getProperties };