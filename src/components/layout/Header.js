import App from '@/core/App.js';
import store from '@/core/store.js';
import api from '@/services/api.js';
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
    this.fetchSchoolLogo();
    this.fetchContactInfo();

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

  async fetchSchoolLogo() {
    try {
      const response = await api.get('/settings/key/school_logo');
      if (response.data.success && response.data.data.setting_value) {
        this.set('logoUrl', `/api/${response.data.data.setting_value}`);
      }
    } catch (error) {
      console.error('Error fetching school logo:', error);
    }
  }

  async fetchContactInfo() {
    try {
      // Fetch contact email
      const emailResponse = await api.get('/settings/key/contact_email');
      if (emailResponse.data.success && emailResponse.data.data.setting_value) {
        this.set('contactEmail', emailResponse.data.data.setting_value);
      }

      // Fetch contact phone
      const phoneResponse = await api.get('/settings/key/contact_phone');
      if (phoneResponse.data.success && phoneResponse.data.data.setting_value) {
        this.set('contactPhone', phoneResponse.data.data.setting_value);
      }
    } catch (error) {
      console.error('Error fetching contact info:', error);
    }
  }

  render() {
    return `
      <header class="fixed top-0 left-0 right-0 z-50">
        <div class="flex container mx-auto items-center justify-between p-5">

          <!-- Left: Contact Information -->
          <div class="flex flex-col text-sm text-gray-600 space-y-1">
            ${this.get('contactEmail') ? `
              <div class="flex items-center space-x-2">
                <i class="fas fa-envelope text-gray-500"></i>
                <a href="mailto:${this.get('contactEmail')}" class="hover:text-blue-600 transition-colors">
                  ${this.get('contactEmail')}
                </a>
              </div>
            ` : ''}
            ${this.get('contactPhone') ? `
              <div class="flex items-center space-x-2">
                <i class="fas fa-phone text-gray-500"></i>
                <a href="tel:${this.get('contactPhone')}" class="hover:text-blue-600 transition-colors">
                  ${this.get('contactPhone')}
                </a>
              </div>
            ` : ''}
          </div>

          <!-- Center: Logo + Brand Name -->
          <ui-link href="/" class="flex items-center">
            <img class="w-auto max-w-none" src="${this.get('logoUrl') || '/src/assets/logo.png'}" alt="UPO UI Logo" />
          </ui-link>

          <!-- Right: Navigation Links -->
          <nav class="flex items-center space-x-4">
            <!-- About Link -->
            <ui-link
              href="/about"
              class="text-gray-700 hover:text-blue-600 font-medium transition-colors no-underline p-2 rounded-md hover:bg-white/50"
            >
              <span class="hidden md:inline">About</span>
            </ui-link>

            <!-- Contact Link -->
            <ui-link
              href="/contact"
              class="text-gray-700 hover:text-blue-600 font-medium transition-colors no-underline p-2 rounded-md hover:bg-white/50"
            >
              <span class="hidden md:inline">Contact</span>
            </ui-link>
          </nav>
        </div>
      </header>
    `;
  }
}

customElements.define('app-header', Header);
export default Header;

