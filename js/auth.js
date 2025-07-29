import { auth } from './firebase.js';

// Authentication functions
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in
            console.log('User logged in:', user.email);
            if (document.getElementById('user-name')) {
                document.getElementById('user-name').textContent = user.displayName || user.email;
            }
            if (document.getElementById('welcome-name')) {
                document.getElementById('welcome-name').textContent = user.displayName || user.email.split('@')[0];
            }
        } else {
            // User is signed out
            console.log('User not logged in');
            // Redirect to login page if not on auth pages
            if (!window.location.pathname.includes('/auth/')) {
                window.location.href = '/auth/login.html';
            }
        }
    });

    // Logout functionality
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            auth.signOut().then(() => {
                window.location.href = '/auth/login.html';
            }).catch(error => {
                console.error('Logout error:', error);
            });
        });
    }
});

// Login form handler
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = loginForm['email'].value;
        const password = loginForm['password'].value;

        auth.signInWithEmailAndPassword(email, password)
            .then(() => {
                window.location.href = '/dashboard/';
            })
            .catch(error => {
                console.error('Login error:', error);
                alert(error.message);
            });
    });
}

// Register form handler
const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = registerForm['email'].value;
        const password = registerForm['password'].value;
        const name = registerForm['name'].value;

        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Update user profile with name
                return userCredential.user.updateProfile({
                    displayName: name
                });
            })
            .then(() => {
                // Create user document in Firestore
                return db.collection('users').doc(auth.currentUser.uid).set({
                    name: name,
                    email: email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    memberSince: new Date().toISOString().split('T')[0],
                    savingsTotal: 0,
                    stokvels: [],
                    funeralCover: false,
                    storeDiscount: 0
                });
            })
            .then(() => {
                window.location.href = '/dashboard/';
            })
            .catch(error => {
                console.error('Registration error:', error);
                alert(error.message);
            });
    });
}