import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyCL8D80q_Y8JQxbbtkumCZJcTIu0Hoozjk",
  authDomain: "container-tracker-app.firebaseapp.com",
  projectId: "container-tracker-app",
  storageBucket: "container-tracker-app.firebasestorage.app",
  messagingSenderId: "583530963800",
  appId: "1:583530963800:web:a1e6187727a92d21c6bb2d",
  measurementId: "G-LMJQQCR8PL"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
export const googleProvider = new GoogleAuthProvider();

// Configure Google OAuth client ID
googleProvider.setCustomParameters({
  client_id: '583530963800-lv93dv51knh262di48fubhdgosujo9tp.apps.googleusercontent.com'
});

// Set persistence to LOCAL to avoid cross-origin issues
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Auth persistence error:", error);
});