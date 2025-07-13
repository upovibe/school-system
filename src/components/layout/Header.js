import App from '@/core/App.js';
import store from '@/core/store.js';
import '@/components/ui/Link.js';

/**
 * 📌 App Header Component
 *
 * Displays the main site header with the UPO UI logo and navigation links.
 * Includes a glassmorphic background and responsive icon-to-text behavior.
 */
class Header extends App {
  unsubscribe = null;

  connectedCallback() {
    super.connectedCallback();

    // Subscribe to global state (e.g., for future auth UI)
    this.unsubscribe = store.subscribe((newState) => {
      this.set('isAuthenticated', newState.isAuthenticated);
    });
  }

  disconnectedCallback() {
    // Prevent memory leaks
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  render() {
    return `
      <header class="fixed top-0 left-0 right-0 z-50">
        <div class="flex items-center justify-between h-16 backdrop-blur-sm bg-white/30 px-4 border-b border-gray-200">

          <!-- Logo + Brand Name -->
          <ui-link href="/" class="flex items-center gap-2 no-underline hover:opacity-90 transition-opacity">
            <img class="size-10 rounded-full shadow-sm" src="/src/assets/logo.png" alt="UPO UI Logo" />
            <div class="flex flex-col leading-tight">
              <span class="text-xl font-extrabold text-gray-800 tracking-tight">UPO UI</span>
              <span class="text-xs text-gray-500 font-semibold tracking-wide">Version 1.0.0</span>
            </div>
          </ui-link>

          <!-- Navigation -->
          <nav class="flex items-center space-x-4">
            <!-- Docs Link -->
            <ui-link
              href="https://github.com/upovibe/upoUI"
              class="text-gray-700 hover:text-blue-600 font-medium transition-colors no-underline flex items-center space-x-2 p-2 rounded-md hover:bg-white/50"
            >
              <i class="fas fa-cubes text-xl"></i>
              <span class="hidden md:inline">Docs</span>
            </ui-link>

            <!-- GitHub Link -->
            <ui-link
              href="https://github.com/upovibe/upoUI"
              target="_blank"
              rel="noopener noreferrer"
              class="text-gray-700 hover:text-gray-900 transition-colors no-underline flex items-center space-x-2 p-2 rounded-md hover:bg-white/50"
            >
              <i class="fab fa-github text-xl"></i>
              <span class="hidden md:inline">GitHub</span>
            </ui-link>
          </nav>
        </div>
      </header>
    `;
  }
}

customElements.define('app-header', Header);
export default Header;
