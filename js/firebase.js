// Firebase configuration and initialization
const firebaseConfig = {
  apiKey: "AIzaSyAEik5dGton3H4LyGDzYbNrw6GwutGNOqk",
  authDomain: "vema-7606a.firebaseapp.com",
  projectId: "vema-7606a",
  storageBucket: "vema-7606a.appspot.com",
  messagingSenderId: "127492940070",
  appId: "1:127492940070:web:ddf247a2cb0723ddcbe1e7"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();