import App from '@/core/App.js';
import store from '@/core/store.js';
import api from '@/services/api.js';
import '@/components/ui/Link.js';

class Header extends App {
  unsubscribe = null;

  connectedCallback() {
    super.connectedCallback();
    this.fetchSchoolLogo();
    this.fetchContactInfo();
    this.fetchColorSettings();

    // Subscribe to global state (e.g., for future auth UI)
    this.unsubscribe = store.subscribe((newState) => {
      this.set('isAuthenticated', newState.isAuthenticated);
    });
  }

  disconnectedCallback() {
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
      const emailResponse = await api.get('/settings/key/contact_email');
      if (emailResponse.data.success && emailResponse.data.data.setting_value) {
        this.set('contactEmail', emailResponse.data.data.setting_value);
      }

      const phoneResponse = await api.get('/settings/key/contact_phone');
      if (phoneResponse.data.success && phoneResponse.data.data.setting_value) {
        this.set('contactPhone', phoneResponse.data.data.setting_value);
      }
    } catch (error) {
      console.error('Error fetching contact info:', error);
    }
  }

  async fetchColorSettings() {
    try {
      // Fetch all color settings
      const colorSettings = [
        'background_color',
        'brand_text_color', 
        'secondary_color',
        'theme_color',
        'hover_light_color',
        'hover_dark_color',
        'text_secondary_color',
        'success_color',
        'error_color',
        'warning_color'
      ];

      const colorPromises = colorSettings.map(async (settingKey) => {
        try {
          const response = await api.get(`/settings/key/${settingKey}`);
          if (response.data.success && response.data.data.setting_value) {
            return { key: settingKey, value: response.data.data.setting_value };
          }
        } catch (error) {
          console.error(`Error fetching ${settingKey}:`, error);
        }
        return null;
      });

      const colorResults = await Promise.all(colorPromises);
      
      // Set all color values to state
      colorResults.forEach(result => {
        if (result) {
          this.set(result.key, result.value);
        }
      });

    } catch (error) {
      console.error('Error fetching color settings:', error);
    }
  }

  render() {
    // Get all colors from state
    const backgroundColor = this.get('background_color');
    const brandTextColor = this.get('brand_text_color');
    const secondaryColor = this.get('secondary_color');
    const themeColor = this.get('theme_color');
    const hoverLightColor = this.get('hover_light_color');
    const hoverDarkColor = this.get('hover_dark_color');
    const textSecondaryColor = this.get('text_secondary_color');
    const successColor = this.get('success_color');
    const errorColor = this.get('error_color');
    const warningColor = this.get('warning_color');
    
    // Only render if we have the essential colors
    if (!backgroundColor || !brandTextColor || !secondaryColor) {
      return '';
    }

    return `
      <header class="fixed top-0 left-0 right-0 z-50 bg-[${backgroundColor}]">
        <!-- Top header -->
        <div class="flex container mx-auto items-center justify-between p-5">     

          <!-- Center: Logo + Brand Name -->
          <ui-link href="/" class="flex items-center">
            <img class="w-auto max-w-none" src="${this.get('logoUrl') || '/src/assets/logo.png'}" alt="UPO UI Logo" />
          </ui-link>

          <!-- Left: Contact Information -->
          <div class="flex flex-col text-sm text-[${secondaryColor}] space-y-1">
            ${this.get('contactEmail') ? `
              <div class="flex items-center space-x-2 hover:opacity-50">
                <i class="fas fa-envelope"></i>
                <a href="mailto:${this.get('contactEmail')}" class="transition-colors">
                  ${this.get('contactEmail')}
                </a>
              </div>
            ` : ''}
            ${this.get('contactPhone') ? `
              <div class="flex items-center space-x-2 hover:opacity-50">
                <i class="fas fa-phone"></i>
                <a href="tel:${this.get('contactPhone')}" class="transition-colors">
                  ${this.get('contactPhone')}
                </a>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Bottom header -->
        <div class="flex container mx-auto items-center justify-between p-4 bg-[${secondaryColor}]">
          <!-- Navigation Links -->
          <nav class="flex items-center space-x-6">
            <ui-link href="/" class="text-[${brandTextColor}] hover:text-[${hoverDarkColor}] font-medium transition-colors">
              Home
            </ui-link>
            <ui-link href="/about" class="text-[${brandTextColor}] hover:text-[${hoverDarkColor}] font-medium transition-colors">
              About
            </ui-link>
            <ui-link href="/courses" class="text-[${brandTextColor}] hover:text-[${hoverDarkColor}] font-medium transition-colors">
              Courses
            </ui-link>
            <ui-link href="/admissions" class="text-[${brandTextColor}] hover:text-[${hoverDarkColor}] font-medium transition-colors">
              Admissions
            </ui-link>
            <ui-link href="/contact" class="text-[${brandTextColor}] hover:text-[${hoverDarkColor}] font-medium transition-colors">
              Contact
            </ui-link>
          </nav>

          <!-- Social Icons -->
          <div class="flex items-center space-x-4">
            <a href="#" class="text-[${brandTextColor}] hover:text-[${hoverDarkColor}] transition-colors">
              <i class="fab fa-facebook-f"></i>
            </a>
            <a href="#" class="text-[${brandTextColor}] hover:text-[${hoverDarkColor}] transition-colors">
              <i class="fab fa-twitter"></i>
            </a>
            <a href="#" class="text-[${brandTextColor}] hover:text-[${hoverDarkColor}] transition-colors">
              <i class="fab fa-instagram"></i>
            </a>
            <a href="#" class="text-[${brandTextColor}] hover:text-[${hoverDarkColor}] transition-colors">
              <i class="fab fa-linkedin-in"></i>
            </a>
            <a href="#" class="text-[${brandTextColor}] hover:text-[${hoverDarkColor}] transition-colors">
              <i class="fab fa-youtube"></i>
            </a>
          </div>
        </div>
      </header>
    `;
  }
}

customElements.define('app-header', Header);
export default Header;