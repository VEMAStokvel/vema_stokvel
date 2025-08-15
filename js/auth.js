import { auth } from './firebase.js';

// Common UI functions
function showLoading(buttonId) {
    const button = document.getElementById(buttonId);
    if (button) {
        button.querySelector('#button-text').classList.add('hidden');
        button.querySelector('#button-spinner').classList.remove('hidden');
        button.disabled = true;
    }
}

function hideLoading(buttonId) {
    const button = document.getElementById(buttonId);
    if (button) {
        button.querySelector('#button-text').classList.remove('hidden');
        button.querySelector('#button-spinner').classList.add('hidden');
        button.disabled = false;
    }
}

function showError(message, errorElementId) {
    const errorElement = document.getElementById(errorElementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
        errorElement.classList.add('bg-red-100', 'text-red-700');
    }
}

function showSuccess(message, successElementId) {
    const successElement = document.getElementById(successElementId);
    if (successElement) {
        successElement.textContent = message;
        successElement.classList.remove('hidden');
        successElement.classList.add('bg-green-100', 'text-green-700');
    }
}

// Login function
export function setupLoginForm() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('error-message');
        
        showLoading('login-button');
        errorMessage.classList.add('hidden');
        
        try {
            await auth.signInWithEmailAndPassword(email, password);
            window.location.href = '../dashboard/index.html';
        } catch (error) {
            let errorText;
            switch (error.code) {
                case 'auth/invalid-email': errorText = 'Invalid email address.'; break;
                case 'auth/user-disabled': errorText = 'This account has been disabled.'; break;
                case 'auth/user-not-found': errorText = 'No account found with this email.'; break;
                case 'auth/wrong-password': errorText = 'Incorrect password.'; break;
                default: errorText = 'Login failed. Please try again.';
            }
            showError(errorText, 'error-message');
        } finally {
            hideLoading('login-button');
        }
    });
}

// Register function
export function setupRegisterForm() {
    const registerForm = document.getElementById('register-form');
    if (!registerForm) return;

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const errorMessage = document.getElementById('error-message');
        const successMessage = document.getElementById('success-message');
        
        // Clear previous messages
        errorMessage.classList.add('hidden');
        successMessage.classList.add('hidden');
        
        // Validate passwords
        if (password !== confirmPassword) {
            showError('Passwords do not match.', 'error-message');
            return;
        }
        
        if (password.length < 6) {
            showError('Password must be at least 6 characters.', 'error-message');
            return;
        }
        
        showLoading('register-button');
        
        try {
            // Create user
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            
            // Update profile with name
            await userCredential.user.updateProfile({
                displayName: name
            });
            
            // Show success
            showSuccess('Account created successfully! Redirecting...', 'success-message');
            
            // Redirect
            setTimeout(() => {
                window.location.href = '../dashboard/index.html';
            }, 2000);
        } catch (error) {
            let errorText;
            switch (error.code) {
                case 'auth/email-already-in-use': errorText = 'This email is already registered.'; break;
                case 'auth/invalid-email': errorText = 'Invalid email address.'; break;
                case 'auth/operation-not-allowed': errorText = 'Account creation is currently disabled.'; break;
                case 'auth/weak-password': errorText = 'Password is too weak.'; break;
                default: errorText = 'Registration failed. Please try again.';
            }
            showError(errorText, 'error-message');
        } finally {
            hideLoading('register-button');
        }
    });
}