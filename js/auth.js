// auth.js
import { 
  auth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendEmailVerification,
  updateProfile
} from './firebase.js';

// Common utility functions
function showMessage(elementId, message, isError = true) {
  const messageContainer = document.getElementById(elementId);
  messageContainer.textContent = message;
  messageContainer.classList.remove('hidden');
  
  // Set appropriate styling based on error/success
  if (isError) {
    messageContainer.classList.remove('bg-green-100', 'text-green-700');
    messageContainer.classList.add('bg-red-100', 'text-red-700');
  } else {
    messageContainer.classList.remove('bg-red-100', 'text-red-700');
    messageContainer.classList.add('bg-green-100', 'text-green-700');
  }
  
  // Hide after 5 seconds
  setTimeout(() => {
    messageContainer.classList.add('hidden');
  }, 5000);
}

function showLoading(buttonId) {
  const button = document.getElementById(buttonId);
  const buttonText = button.querySelector('#button-text');
  const spinner = button.querySelector('#button-spinner');
  
  button.disabled = true;
  buttonText.classList.add('hidden');
  spinner.classList.remove('hidden');
}

function hideLoading(buttonId) {
  const button = document.getElementById(buttonId);
  const buttonText = button.querySelector('#button-text');
  const spinner = button.querySelector('#button-spinner');
  
  button.disabled = false;
  buttonText.classList.remove('hidden');
  spinner.classList.add('hidden');
}

// Handle registration
export function setupRegistration() {
  const registerForm = document.getElementById('register-form');
  if (!registerForm) return;

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = registerForm['name'].value;
    const email = registerForm['email'].value;
    const password = registerForm['password'].value;
    const termsChecked = registerForm['terms'].checked;
    
    // Validate terms checkbox
    if (!termsChecked) {
      showMessage('message-container', 'You must accept the terms and conditions', true);
      return;
    }
    
    showLoading('register-button');
    
    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update user profile with display name
      await updateProfile(user, {
        displayName: name
      });
      
      // Send email verification
      await sendEmailVerification(user);
      
      showMessage('message-container', 'Registration successful! Please check your email for verification.', false);
      registerForm.reset();
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 3000);
    } catch (error) {
      let errorMessage = 'An error occurred during registration.';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'This email is already registered.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password should be at least 6 characters.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection.';
          break;
        default:
          errorMessage = error.message;
      }
      
      showMessage('message-container', errorMessage, true);
    } finally {
      hideLoading('register-button');
    }
  });
}

// Handle login
export function setupLogin() {
  const loginForm = document.getElementById('login-form');
  if (!loginForm) return;

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = loginForm['email'].value;
    const password = loginForm['password'].value;
    
    showLoading('login-button');
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Check if email is verified
      if (!user.emailVerified) {
        await sendEmailVerification(user);
        showMessage('error-message', 'Please verify your email first. A new verification email has been sent.', true);
        return;
      }
      
      // Redirect to dashboard or home page after successful login
      window.location.href = 'dashboard.html';
    } catch (error) {
      let errorMessage = 'An error occurred during login.';
      
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password. Please try again.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Account temporarily disabled. Try again later or reset your password.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection.';
          break;
        default:
          errorMessage = error.message;
      }
      
      showMessage('error-message', errorMessage, true);
    } finally {
      hideLoading('login-button');
    }
  });
}

// Initialize the appropriate auth setup based on the page
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('register-form')) {
    setupRegistration();
  } else if (document.getElementById('login-form')) {
    setupLogin();
  }
});