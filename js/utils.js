import { auth } from './firebase.js';

// Auth state management
export function handleAuthState(user) {
    try {
        const elements = {
            mobile: {
                login: 'mobile-login',
                register: 'mobile-register',
                dashboard: 'mobile-dashboard'
            },
            desktop: {
                login: 'desktop-login',
                register: 'desktop-register',
                dashboard: 'desktop-dashboard'
            },
            hero: {
                cta: 'hero-cta',
                dashboard: 'hero-dashboard'
            }
        };

        // Helper function to update elements
        const updateElements = (type, isAuthenticated) => {
            const { login, register, dashboard } = elements[type];
            
            const loginEl = document.getElementById(login);
            const registerEl = document.getElementById(register);
            const dashboardEl = document.getElementById(dashboard);
            
            if (loginEl) loginEl.classList.toggle('hidden', isAuthenticated);
            if (registerEl) registerEl.classList.toggle('hidden', isAuthenticated);
            if (dashboardEl) dashboardEl.classList.toggle('hidden', !isAuthenticated);
        };

        if (user) {
            // User is authenticated
            updateElements('mobile', true);
            updateElements('desktop', true);
            
            const heroCta = document.getElementById('hero-cta');
            const heroDashboard = document.getElementById('hero-dashboard');
            if (heroCta) heroCta.classList.add('hidden');
            if (heroDashboard) heroDashboard.classList.remove('hidden');
        } else {
            // User is not authenticated
            updateElements('mobile', false);
            updateElements('desktop', false);
            
            const heroCta = document.getElementById('hero-cta');
            const heroDashboard = document.getElementById('hero-dashboard');
            if (heroCta) heroCta.classList.remove('hidden');
            if (heroDashboard) heroDashboard.classList.add('hidden');
        }
    } catch (error) {
        console.error('Error in handleAuthState:', error);
    }
}

// Loading states
export function setLoadingState(isLoading) {
    try {
        document.body.classList.toggle('app-loading', isLoading);
        
        const overlay = document.getElementById('loading-overlay');
        const mainContent = document.getElementById('main-content');
        
        if (!isLoading && overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 300);
        }
        
        if (mainContent) {
            mainContent.style.opacity = isLoading ? '0' : '1';
        }
    } catch (error) {
        console.error('Error in setLoadingState:', error);
    }
}

// Initialize Firebase auth
export async function initializeFirebaseAuth() {
    try {
        setLoadingState(true);
        
        // Check auth state with timeout
        return new Promise((resolve) => {
            const authTimeout = setTimeout(() => {
                console.warn('Auth check timed out');
                handleAuthComplete(null);
                resolve();
            }, 5000);

            const unsubscribe = auth.onAuthStateChanged(
                (user) => {
                    clearTimeout(authTimeout);
                    handleAuthComplete(user);
                    resolve();
                    unsubscribe();
                },
                (error) => {
                    clearTimeout(authTimeout);
                    console.error("Auth error:", error);
                    handleAuthComplete(null);
                    resolve();
                }
            );
        });
    } catch (error) {
        console.error("Firebase init error:", error);
        handleAuthComplete(null);
        return Promise.resolve();
    }
}

function handleAuthComplete(user) {
    handleAuthState(user);
    setLoadingState(false);
    
    // Smooth transition for loading overlay
    setTimeout(() => {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 300);
        }
    }, 500);
}

// Authentication check for protected actions
export function requireAuth(redirectPath, actionName = 'access this feature') {
    return new Promise((resolve, reject) => {
        const user = auth.currentUser;
        
        console.log('requireAuth called with:', { redirectPath, actionName, user: !!user });
        
        if (user) {
            // User is authenticated, proceed
            console.log('User is authenticated, redirecting to:', redirectPath);
            resolve(user);
        } else {
            // User is not authenticated, redirect to login
            console.log('User not authenticated, storing destination:', redirectPath);
            
            // Store the intended destination in sessionStorage
            sessionStorage.setItem('intendedDestination', redirectPath);
            sessionStorage.setItem('intendedAction', actionName);
            
            // Use relative path for login URL
            const loginUrl = `auth/login.html?redirect=${encodeURIComponent(redirectPath)}&action=${encodeURIComponent(actionName)}`;
            
            console.log('Redirecting to login:', loginUrl);
            // Redirect to login
            window.location.href = loginUrl;
            reject(new Error('Authentication required'));
        }
    });
}

// Handle post-login redirect
export function handlePostLoginRedirect() {
    const intendedDestination = sessionStorage.getItem('intendedDestination');
    const intendedAction = sessionStorage.getItem('intendedAction');
    
    if (intendedDestination) {
        // Clear the stored destination
        sessionStorage.removeItem('intendedDestination');
        sessionStorage.removeItem('intendedAction');
        
        // Redirect to intended destination
        window.location.href = intendedDestination;
    } else {
        // Default redirect to dashboard
        window.location.href = '/dashboard/index.html';
    }
}