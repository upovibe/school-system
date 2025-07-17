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
    this.fetchSocialUrls();
    this.setupMobileMenuEvents();

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

  setupMobileMenuEvents() {
    this.addEventListener('click', (e) => {
      const toggleButton = e.target.closest('[data-mobile-toggle]');
      if (toggleButton) {
        e.preventDefault();
        this.toggleMobileMenu();
      }

      const overlay = e.target.closest('[data-mobile-overlay]');
      if (overlay) {
        e.preventDefault();
        this.toggleMobileMenu();
      }

      // Handle mobile submenu toggles
      const submenuToggle = e.target.closest('[data-mobile-submenu-toggle]');
      if (submenuToggle) {
        e.preventDefault();
        this.toggleMobileSubmenu(submenuToggle);
      }
    });

    // Close mobile menu on window resize
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 1024) {
        this.closeMobileMenu();
      }
    });
  }

  toggleMobileMenu() {
    const mobileMenu = this.querySelector('[data-mobile-menu]');
    const overlay = this.querySelector('[data-mobile-overlay]');
    
    if (mobileMenu && overlay) {
      const isOpen = mobileMenu.classList.contains('translate-x-0');
      
      if (isOpen) {
        // Close menu
        mobileMenu.classList.remove('translate-x-0');
        mobileMenu.classList.add('-translate-x-full');
        overlay.classList.remove('opacity-100', 'pointer-events-auto');
        overlay.classList.add('opacity-0', 'pointer-events-none');
      } else {
        // Open menu
        mobileMenu.classList.remove('-translate-x-full');
        mobileMenu.classList.add('translate-x-0');
        overlay.classList.remove('opacity-0', 'pointer-events-none');
        overlay.classList.add('opacity-100', 'pointer-events-auto');
      }
    }
  }

  closeMobileMenu() {
    const mobileMenu = this.querySelector('[data-mobile-menu]');
    const overlay = this.querySelector('[data-mobile-overlay]');
    
    if (mobileMenu && overlay) {
      mobileMenu.classList.remove('translate-x-0');
      mobileMenu.classList.add('-translate-x-full');
      overlay.classList.remove('opacity-100', 'pointer-events-auto');
      overlay.classList.add('opacity-0', 'pointer-events-none');
    }
  }

  toggleMobileSubmenu(toggleButton) {
    const submenu = toggleButton.nextElementSibling;
    const icon = toggleButton.querySelector('i');
    
    if (submenu && icon) {
      const isOpen = submenu.classList.contains('max-h-96');
      
      if (isOpen) {
        // Close submenu
        submenu.classList.remove('max-h-96', 'opacity-100');
        submenu.classList.add('max-h-0', 'opacity-0');
        icon.classList.remove('rotate-180');
      } else {
        // Open submenu
        submenu.classList.remove('max-h-0', 'opacity-0');
        submenu.classList.add('max-h-96', 'opacity-100');
        icon.classList.add('rotate-180');
      }
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

  async fetchSocialUrls() {
    try {
      const socialSettings = [
        'facebook_url',
        'twitter_url',
        'instagram_url',
        'linkedin_url',
        'youtube_url'
      ];

      const socialPromises = socialSettings.map(async (settingKey) => {
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

      const socialResults = await Promise.all(socialPromises);
      
      // Set all social URL values to state
      socialResults.forEach(result => {
        if (result) {
          this.set(result.key, result.value);
        }
      });

    } catch (error) {
      console.error('Error fetching social URLs:', error);
    }
  }

  render() {
    // Get all colors from state
    const themeColor = this.get('theme_color');
    const secondaryColor = this.get('secondary_color');
    const backgroundColor = this.get('background_color');
    const brandTextColor = this.get('brand_text_color');
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

    // Navigation links array with sub-links
    const navigationLinks = [
      { href: '/', label: 'Home' },
      { 
        href: '/public/about', 
        label: 'About',
        subLinks: [
          { href: '/public/about/history', label: 'Our History' },
          { href: '/public/about/mission', label: 'Mission & Vision' },
          { href: '/public/about/values', label: 'Our Values' },
          { href: '/public/about/team', label: 'Our Team' }
        ]
      },
      { 
        href: '/public/courses', 
        label: 'Courses',
        subLinks: [
          { href: '/public/courses/elementary', label: 'Elementary' },
          { href: '/public/courses/middle-school', label: 'Middle School' },
          { href: '/public/courses/high-school', label: 'High School' },
          { href: '/public/courses/extracurricular', label: 'Extracurricular' }
        ]
      },
      { 
        href: '/public/admissions', 
        label: 'Admissions',
        subLinks: [
          { href: '/public/admissions/requirements', label: 'Requirements' },
          { href: '/public/admissions/process', label: 'Application Process' },
          { href: '/public/admissions/fees', label: 'Tuition & Fees' },
          { href: '/public/admissions/scholarships', label: 'Scholarships' }
        ]
      },
      { href: '/public/contact', label: 'Contact' }
    ];

    // Social icons array
    const socialIcons = [
      { key: 'facebook_url', icon: 'fab fa-facebook-f' },
      { key: 'twitter_url', icon: 'fab fa-twitter' },
      { key: 'instagram_url', icon: 'fab fa-instagram' },
      { key: 'linkedin_url', icon: 'fab fa-linkedin-in' },
      { key: 'youtube_url', icon: 'fab fa-youtube' }
    ];

    // Helper function to render navigation links
    const renderNavLinks = (isMobile = false) => {
      return navigationLinks.map(link => {
        if (isMobile) {
          // Mobile version - with collapsible submenus
          return `
            <div class="w-full">
              ${link.subLinks ? `
                <!-- Parent link with submenu toggle -->
                <button data-mobile-submenu-toggle class="w-full text-left text-[${brandTextColor}] hover:text-[${hoverDarkColor}] font-medium transition-all duration-300 ease-in-out py-2 border-b-2 border-transparent hover:border-[${hoverDarkColor}] flex items-center justify-between">
                  <span>${link.label}</span>
                  <i class="fas fa-chevron-down text-xs transition-transform duration-300"></i>
                </button>
                <!-- Collapsible submenu -->
                <div class="max-h-0 opacity-0 overflow-hidden transition-all duration-300 ease-in-out">
                  <div class="ml-4 space-y-2 pt-2">
                    ${link.subLinks.map(subLink => `
                      <ui-link href="${subLink.href}" class="text-[${brandTextColor}] hover:text-[${hoverDarkColor}] font-medium transition-all duration-300 ease-in-out py-1 block text-sm opacity-75 hover:opacity-100">
                        ${subLink.label}
                      </ui-link>
                    `).join('')}
                  </div>
                </div>
              ` : `
                <!-- Simple link without submenu -->
                <ui-link href="${link.href}" class="text-[${brandTextColor}] hover:text-[${hoverDarkColor}] font-medium transition-all duration-300 ease-in-out py-2 border-b-2 border-transparent hover:border-[${hoverDarkColor}] w-full block">
                  ${link.label}
                </ui-link>
              `}
            </div>
          `;
        } else {
          // Desktop version - with dropdown
          return `
            <div class="relative group">
              <ui-link href="${link.href}" class="text-[${brandTextColor}] hover:text-[${themeColor}] font-medium transition-all duration-300 ease-in-out py-2 border-b-4 border-transparent hover:border-[${themeColor}] hover:opacity-100 -mb-3 lg:-mb-4 flex items-center">
                ${link.label}
                ${link.subLinks ? `<i class="fas fa-chevron-down ml-1 text-xs transition-transform group-hover:rotate-180"></i>` : ''}
              </ui-link>
              ${link.subLinks ? `
                <div class="absolute top-full left-0 mt-4 w-48 bg-[${secondaryColor}] border border-[${secondaryColor}] rounded shadow opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-in-out z-50">
                  <div class="py-2">
                    ${link.subLinks.map(subLink => `
                      <ui-link href="${subLink.href}" class="block px-4 py-2 text-[${brandTextColor}] hover:text-[${themeColor}] hover:bg-[${hoverLightColor}] transition-all duration-200 text-sm border-b-2 border-transparent hover:border-[${themeColor}]">
                        ${subLink.label}
                      </ui-link>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </div>
          `;
        }
      }).join('');
    };

    // Helper function to render social icons
    const renderSocialIcons = (isMobile = false) => {
      return socialIcons.map(social => `
        <a href="${this.get(social.key) || '#'}" class="text-[${brandTextColor}] hover:text-[${isMobile ? hoverDarkColor : themeColor}] transition-colors">
          <i class="${social.icon} ${isMobile ? '' : 'text-sm lg:text-base'}"></i>
        </a>
      `).join('');
    };

    return `
      <div class="relative">
        <header class="bg-[${backgroundColor}] border-b-4 border-[${secondaryColor}] border-t-4 border-t-[${themeColor}]">
          <!-- Top header -->
          <div class="flex container mx-auto items-center justify-between p-3 lg:p-5">     

            <!-- Logo - Left side -->
            <ui-link href="/" class="flex items-center">
              <img class="w-40 lg:w-auto max-w-none" src="${this.get('logoUrl')}" alt="School Logo" />
            </ui-link>

            <!-- Contact Information - Hidden on mobile -->
            <div class="hidden lg:flex flex-col text-sm text-[${secondaryColor}] space-y-1">
              ${this.get('contactEmail') ? `
                <div class="flex items-center space-x-2 hover:text-[${hoverDarkColor}]">
                  <i class="fas fa-envelope"></i>
                  <a href="mailto:${this.get('contactEmail')}" class="transition-colors">
                    ${this.get('contactEmail')}
                  </a>
                </div>
              ` : ''}
              ${this.get('contactPhone') ? `
                <div class="flex items-center space-x-2 hover:text-[${hoverDarkColor}]">
                  <i class="fas text-lg fa-phone"></i>
                  <a href="tel:${this.get('contactPhone')}" class="transition-colors">
                    ${this.get('contactPhone')}
                  </a>
                </div>
              ` : ''}
            </div>

            <!-- Mobile Menu Button - Right side -->
            <button data-mobile-toggle class="lg:hidden text-[${secondaryColor}] size-8 rounded-md">
              <i class="fas fa-bars"></i>
            </button>
          </div>

          <!-- Bottom header -->
          <div class="flex container mx-auto items-center justify-between p-3 lg:p-4 bg-[${secondaryColor}]">
            <!-- Navigation Links - Hidden on mobile -->
            <nav class="hidden lg:flex items-center space-x-6">
              ${renderNavLinks(false)}
            </nav>

            <!-- Social Icons -->
            <div class="flex items-center space-x-2 lg:space-x-4">
              ${renderSocialIcons(false)}
            </div>
          </div>
        </header>

        <!-- Mobile Overlay -->
        <div data-mobile-overlay class="fixed inset-0 bg-black bg-opacity-50 z-40 opacity-0 pointer-events-none transition-opacity duration-300 lg:hidden"></div>

        <!-- Mobile Menu -->
        <div data-mobile-menu class="fixed inset-0 bg-[${secondaryColor}] z-50 transform -translate-x-full transition-transform duration-300 lg:hidden">
          <!-- Mobile Header -->
          <div class="flex items-center justify-between p-4 border-b border-[${secondaryColor}]">
            <img class="lg:w-auto w-40 max-w-none" src="${this.get('logoUrl')}" alt="School Logo" />
            <button data-mobile-toggle class="text-[${brandTextColor}] size-8 rounded-md">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <!-- Mobile Content -->
          <div class="h-[calc(100vh-200px)] flex flex-col gap-4 items-start p-4 overflow-y-auto w-full">
            <!-- Mobile Contact Info -->
            <div class="border-b border-[${brandTextColor}] pb-4 w-full">
              <div class="flex flex-col items-center justify-center text-sm text-[${brandTextColor}] space-y-3">
                ${this.get('contactEmail') ? `
                  <div class="flex items-center space-x-3 hover:opacity-50">
                    <i class="fas fa-envelope"></i>
                    <a href="mailto:${this.get('contactEmail')}" class="transition-colors">
                      ${this.get('contactEmail')}
                    </a>
                  </div>
                ` : ''}
                ${this.get('contactPhone') ? `
                  <div class="flex items-center space-x-3 hover:opacity-50">
                    <i class="fas fa-phone"></i>
                    <a href="tel:${this.get('contactPhone')}" class="transition-colors">
                      ${this.get('contactPhone')}
                    </a>
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- Mobile Navigation -->
            <nav class="flex flex-col items-center justify-center space-y-4 w-full">
              ${renderNavLinks(true)}
            </nav>

            <!-- Mobile Social Icons -->
            <div class="flex mx-auto mt-auto items-center justify-center space-x-6">
              ${renderSocialIcons(true)}
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('app-header', Header);
export default Header;