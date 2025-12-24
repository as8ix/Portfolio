import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// TODO: Replace the following with your app's Firebase project configuration
// See: https://firebase.google.com/docs/web/learn-more#config-object
const firebaseConfig = {
    apiKey: "AIzaSyAsMx0eNtj5p1bfKeRFvPXR6-EDkNosOWA",
    authDomain: "portfolio-bed2b.firebaseapp.com",
    projectId: "portfolio-bed2b",
    storageBucket: "portfolio-bed2b.firebasestorage.app",
    messagingSenderId: "406886920408",
    appId: "1:406886920408:web:16031877bfc7805215e7ad",
    measurementId: "G-DF28S28B4W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// Analytics (optional, wrapped in try/catch in case not supported in environment)
let analytics;
try {
    analytics = getAnalytics(app);
} catch (e) {
    console.log("Analytics not supported in this environment");
}

export { auth, db, analytics };
