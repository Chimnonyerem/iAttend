import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCnPS39fZuYt8N9mwIhW1d0mY6O6BZRPmc",
  authDomain: "vpresent.firebaseapp.com",
  projectId: "vpresent",
  storageBucket: "vpresent.firebasestorage.app",
  messagingSenderId: "419510496963",
  appId: "1:419510496963:web:5f060f268b494c409f7c76"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
