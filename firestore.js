require('firebase/firestore');
require('firebase/auth');
const storage = require('firebase/storage');
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

const getStorage = () => {
    return storage;
};

module.exports = { getDatabase, getCollection, getAuth, getStore, getStorage, getProperties };