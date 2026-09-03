import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  projectId: "gen-lang-client-0186551733",
  appId: "1:934403051170:web:7e3f2b4a3289e6db7991fb",
  apiKey: "AIzaSyCzKqxTlVptk1uEUP4Ek2-lZ6vxSA7WmQc",
  authDomain: "gen-lang-client-0186551733.firebaseapp.com",
  storageBucket: "gen-lang-client-0186551733.firebasestorage.app",
  messagingSenderId: "934403051170"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-ogagenticintelli-35e0c872-c7ca-41d0-9698-de8295f98dc4");
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
