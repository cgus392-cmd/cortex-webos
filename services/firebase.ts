import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyA6ad4UWDIp4Len_uT2ZjoZt0zChFCmO2w",
  authDomain: "cortexwebos.firebaseapp.com",
  projectId: "cortexwebos",
  storageBucket: "cortexwebos.firebasestorage.app",
  messagingSenderId: "299757536536",
  appId: "1:299757536536:web:d8ff99f3530790fb818a6d",
  measurementId: "G-RX791QJ62P"
};

// --- INICIALIZACIÓN ---
let app;
let auth: any = null;
let db: any = null;
let googleProvider: any = null;

// Simple check to ensure we aren't using the placeholder text
const isConfigured = firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("REPLACE_WITH");

if (isConfigured) {
    try {
        // Prevent multiple initializations in dev mode
        app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        auth = getAuth(app);
        db = getFirestore(app);
        googleProvider = new GoogleAuthProvider();
    } catch (error) {
        console.error("Cortex Error: Falló la conexión con Firebase.", error);
    }
} else {
    console.warn("Cortex Warning: Firebase no está configurado.");
}

export { 
    auth, 
    db, 
    googleProvider, 
    signInWithPopup, 
    signOut, 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc, 
    onAuthStateChanged, 
    isConfigured,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
    sendPasswordResetEmail
};