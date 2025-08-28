import Router from './core/Router.js';
import './app/setFavicon.js';
import './app/middleware.js';

// Create a new router instance.
const router = new Router();

// Start the router.
router.start('#app');

// Make the router globally available.
window.router = router;

// ========================================
// LOCAL STORAGE CLEARING ON TAB/BROWSER CLOSE
// ========================================
// This system uses sessionStorage to detect new tabs/browser windows.
// sessionStorage is automatically cleared when a tab is closed, making it a reliable
// way to determine if a user is starting a new session.

/**
 * Clear all authentication-related data from localStorage.
 * This is called when a new session (tab/window) is detected.
 */
function clearAuthStorage() {
    try {
        // Clear all authentication-related data
        localStorage.removeItem('userData');
        localStorage.removeItem('token');
        localStorage.removeItem('requiresPasswordChange');
        
        // Clear any other session-related data that might exist
        localStorage.removeItem('lastActivity');
        localStorage.removeItem('sessionStart');
        localStorage.removeItem('rememberMe');
    } catch (error) {
        console.error('❌ Error clearing localStorage:', error);
    }
}

/**
 * Checks if a session is active using sessionStorage. If not, it clears
 * any lingering authentication data from localStorage. This ensures
 * that a new tab or browser window always starts with a clean slate.
 */
function handleSessionState() {
    // If 'session_active' is not 'true', it means this is a new tab/window.
    if (sessionStorage.getItem('session_active') !== 'true') {
        clearAuthStorage();
    }
}

// Run the session check as soon as the script loads.
try {
    handleSessionState();
} catch (error) {
    console.error('❌ Error initializing session state handler:', error);
}
