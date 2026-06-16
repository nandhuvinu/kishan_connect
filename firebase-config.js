// Firebase Configuration
// To use Firebase, you need to:
// 1. Create a Firebase project at https://console.firebase.google.com
// 2. Enable Firestore Database
// 3. Generate a service account key
// 4. Download the JSON file and update the credentials below

const firebase = require('firebase-admin');

// Replace with your Firebase project configuration
// For Firebase, you can either use:
// Option 1: Service Account JSON file
// Option 2: Environment variables

let serviceAccount;
let useFirebase = false;

// Check if Firebase credentials are provided via environment variables
if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  };
  useFirebase = true;
} else {
  // Check if local service account file exists
  const fs = require('fs');
  const path = require('path');
  const serviceAccountPath = path.join(__dirname, 'service-account.json');
  
  if (fs.existsSync(serviceAccountPath)) {
    try {
      serviceAccount = require('./service-account.json');
      useFirebase = true;
    } catch (e) {
      console.log('Firebase service account file found but could not be loaded');
    }
  }
}

// Initialize Firebase if credentials are available
let db = null;
let firestore = null;

if (useFirebase && serviceAccount) {
  try {
    firebase.initializeApp({
      credential: firebase.credential.cert(serviceAccount)
    });
    
    firestore = firebase.firestore();
    console.log('✅ Firebase connected successfully');
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
  }
} else {
  console.log('ℹ️  Firebase not configured. Using local SQLite database.');
  console.log('   To use Firebase, create a service-account.json file or set environment variables.');
}

module.exports = {
  firebase,
  firestore,
  useFirebase,
  db
};
