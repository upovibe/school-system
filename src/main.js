import Router from './core/Router.js';

// Create a new router instance.
const router = new Router();

// Start the router.
router.start('#app');

// Make the router globally available.
window.router = router;
