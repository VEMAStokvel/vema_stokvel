// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendEmailVerification,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAEik5dGton3H4LyGDzYbNrw6GwutGNOqk",
  authDomain: "vema-7606a.firebaseapp.com",
  projectId: "vema-7606a",
  storageBucket: "vema-7606a.appspot.com",
  messagingSenderId: "127492940070",
  appId: "1:127492940070:web:ddf247a2cb0723ddcbe1e7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Export auth functions
export { 
  auth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendEmailVerification,
  updateProfile
};