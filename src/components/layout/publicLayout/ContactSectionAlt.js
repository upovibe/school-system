import App from '@/core/App.js';
import { unescapeJsonFromAttribute } from '@/utils/jsonUtils.js';
import '@/components/ui/Button.js';
import '@/components/ui/Input.js';
import '@/components/ui/Textarea.js';
import '@/components/ui/Toast.js';
import '@/components/ui/ContentDisplay.js';
/**
 * Contact Section Alt Component
 * 
 * Modern contact section with form, information, map, and social media links
 */
class ContactSectionAlt extends App {
    constructor() {
        super();
        this.set('loading', false);
        this.formValues = {
            name: '',
            email: '',
            subject: '',
            message: ''
        };
    }

    connectedCallback() {
        super.connectedCallback();
        this.loadDataFromProps();
        this.setupEventListeners();
        
        // Set initial form validation state
        setTimeout(() => this.validateForm(), 100);
    }

    loadDataFromProps() {
        // Get data from props/attributes
        const colorsAttr = this.getAttribute('colors');
        const pageDataAttr = this.getAttribute('page-data');
        const settingsAttr = this.getAttribute('settings');

        if (colorsAttr) {
            try {
                const colors = JSON.parse(colorsAttr);
                Object.entries(colors).forEach(([key, value]) => {
                    this.set(key, value);
                });
            } catch (error) {
                console.error('Error parsing colors:', error);
            }
        }

        if (pageDataAttr) {
            const pageData = unescapeJsonFromAttribute(pageDataAttr);
            if (pageData) {
                this.set('pageData', pageData);
            }
        }

        if (settingsAttr) {
            const settings = unescapeJsonFromAttribute(settingsAttr);
            if (settings) {
                if (settings.contact_address) this.set('contactAddress', settings.contact_address);
                if (settings.contact_phone) this.set('contactPhone', settings.contact_phone);
                if (settings.contact_email) this.set('contactEmail', settings.contact_email);
                
                // Map settings
                if (settings.map_location_name) this.set('mapLocationName', settings.map_location_name);
                if (settings.map_address) this.set('mapAddress', settings.map_address);
                if (settings.map_latitude) this.set('mapLatitude', settings.map_latitude);
                if (settings.map_longitude) this.set('mapLongitude', settings.map_longitude);
                if (settings.map_embed_url) this.set('mapEmbedUrl', settings.map_embed_url);
                if (settings.map_zoom_level) this.set('mapZoomLevel', settings.map_zoom_level);
                
                // Social media settings
                if (settings.facebook_url) this.set('facebookUrl', settings.facebook_url);
                if (settings.twitter_url) this.set('twitterUrl', settings.twitter_url);
                if (settings.instagram_url) this.set('instagramUrl', settings.instagram_url);
                if (settings.linkedin_url) this.set('linkedinUrl', settings.linkedin_url);
                if (settings.whatsapp_url) this.set('whatsappUrl', settings.whatsapp_url);
                if (settings.youtube_url) this.set('youtubeUrl', settings.youtube_url);
            }
        }
    }

    setupEventListeners() {
        this.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // Capture form values in real-time and validate form
        this.addEventListener('input', (e) => {
            if (e.target.id === 'name' || e.target.name === 'name') {
                this.formValues.name = e.target.value;
            } else if (e.target.id === 'email' || e.target.name === 'email') {
                this.formValues.email = e.target.value;
            } else if (e.target.id === 'subject' || e.target.name === 'subject') {
                this.formValues.subject = e.target.value;
            } else if (e.target.id === 'message' || e.target.name === 'message') {
                this.formValues.message = e.target.value;
            }
            
            // Validate form and update button state
            this.validateForm();
        });
    }

    validateForm() {
        // Check if all required fields have values
        const isFormValid = this.formValues.name.trim() !== '' && 
                           this.formValues.email.trim() !== '' && 
                           this.formValues.message.trim() !== '';
        
        // Find the submit button and enable/disable it
        const submitButton = this.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = !isFormValid;
            
            // Update button appearance based on state
            if (isFormValid) {
                submitButton.classList.remove('opacity-50', 'cursor-not-allowed');
                submitButton.classList.add('hover:opacity-90', 'hover:-translate-y-1', 'hover:scale-105', 'hover:shadow-xl');
            } else {
                submitButton.classList.add('opacity-50', 'cursor-not-allowed');
                submitButton.classList.remove('hover:opacity-90', 'hover:-translate-y-1', 'hover:scale-105', 'hover:shadow-xl');
            }
        }
    }

    async handleSubmit() {
        try {
            this.set('loading', true);
            
            // Use the captured form values
            const formData = {
                name: this.formValues.name.trim(),
                email: this.formValues.email.trim(),
                subject: this.formValues.subject.trim(),
                message: this.formValues.message.trim()
            };
            
            // Validate required fields
            if (!formData.name || !formData.email || !formData.message) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please fill in all required fields (Name, Email, and Message)',
                    variant: 'error',
                    duration: 4000
                });
                return;
            }

            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please enter a valid email address',
                    variant: 'error',
                    duration: 4000
                });
                return;
            }
            
            // Send to API
            const response = await fetch('/api/contact/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                Toast.show({
                    title: 'Success',
                    message: result.message || 'Thank you for your message! We\'ll get back to you soon.',
                    variant: 'success',
                    duration: 5000
                });

                // Reset form inputs and captured values
                const nameInput = this.querySelector('input#name');
                const emailInput = this.querySelector('input#email');
                const subjectInput = this.querySelector('input#subject');
                const messageInput = this.querySelector('ui-textarea[name="message"]');
                
                if (nameInput) nameInput.value = '';
                if (emailInput) emailInput.value = '';
                if (subjectInput) subjectInput.value = '';
                if (messageInput) messageInput.value = '';
                
                // Reset captured values
                this.formValues = {
                    name: '',
                    email: '',
                    subject: '',
                    message: ''
                };
                
                // Re-validate form to update button state
                this.validateForm();
            } else {
                throw new Error(result.message || 'Failed to send message');
            }

        } catch (error) {
            console.error('Error submitting contact form:', error);
            Toast.show({
                title: 'Error',
                message: 'Failed to send message. Please try again.',
                variant: 'error',
                duration: 4000
            });
        } finally {
            this.set('loading', false);
        }
    }

    // Helper method to check if any social media links exist
    hasSocialMediaLinks() {
        const facebookUrl = this.get('facebookUrl');
        const twitterUrl = this.get('twitterUrl');
        const instagramUrl = this.get('instagramUrl');
        const linkedinUrl = this.get('linkedinUrl');
        const whatsappUrl = this.get('whatsappUrl');
        const youtubeUrl = this.get('youtubeUrl');
        
        return facebookUrl || twitterUrl || instagramUrl || linkedinUrl || whatsappUrl || youtubeUrl;
    }

    // Helper method to render social media links
    renderSocialMediaLinks() {
        const socialLinks = [
            { key: 'facebookUrl', icon: 'fab fa-facebook', name: 'Facebook', color: '#1877F2' },
            { key: 'twitterUrl', icon: 'fab fa-twitter', name: 'Twitter', color: '#1DA1F2' },
            { key: 'instagramUrl', icon: 'fab fa-instagram', name: 'Instagram', color: '#E4405F' },
            { key: 'linkedinUrl', icon: 'fab fa-linkedin', name: 'LinkedIn', color: '#0A66C2' },
            { key: 'whatsappUrl', icon: 'fab fa-whatsapp', name: 'WhatsApp', color: '#25D366' },
            { key: 'youtubeUrl', icon: 'fab fa-youtube', name: 'YouTube', color: '#FF0000' }
        ];

        const secondaryColor = this.get('secondary_color');
        const primaryColor = this.get('primary_color');

        return socialLinks
            .filter(link => this.get(link.key) && this.get(link.key).trim() !== '')
            .map(link => `
                <a href="${this.get(link.key)}" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   class="group flex flex-col items-center p-4 rounded-xl hover:bg-gray-50 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105">
                    <div class="w-12 h-12 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300"
                         style="background: linear-gradient(135deg, ${link.color}, ${link.color}dd)">
                        <i class="${link.icon} text-white text-xl"></i>
                    </div>
                    <span class="text-sm font-medium text-[${secondaryColor}] group-hover:text-[${primaryColor}] transition-colors">
                        ${link.name}
                    </span>
                </a>
            `).join('');
    }

    render() {
        const loading = this.get('loading');
        const pageData = this.get('pageData');
        
        // Get colors from state
        const primaryColor = this.get('primary_color');
        const secondaryColor = this.get('secondary_color');
        const accentColor = this.get('accent_color');
        const textColor = this.get('text_color');

        return `
            <!-- Contact Section Alt -->
            <section class="mx-auto py-10">
                
                <!-- Contact Banner (matching ContactSection) -->
                ${pageData?.banner_image ? `
                    <div class="relative group rounded-3xl overflow-hidden shadow-2xl mb-16">
                        <!-- Banner Background -->
                        <div class="relative h-80 lg:h-96 overflow-hidden">
                            <img src="/api/${pageData.banner_image}" 
                                 alt="Contact Us" 
                                 class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                            <div class="absolute inset-0 hidden items-center justify-center bg-gray-100">
                                <div class="text-center">
                                    <i class="fas fa-envelope text-gray-400 text-4xl mb-2"></i>
                                    <p class="text-gray-500 font-medium">Contact banner</p>
                                </div>
                            </div>
                            
                            <!-- Overlay with content -->
                            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                            
                            <!-- Content overlay -->
                            <div class="absolute inset-0 flex items-center justify-center p-6">
                                <div class="text-center text-white relative z-10">
                                    <!-- Header with animated icon -->
                                    <div class="flex justify-center mb-6">
                                        <div class="size-10 bg-[${primaryColor}]/20 backdrop-blur-md rounded-lg flex items-center justify-center shadow-lg transform hover:rotate-12 transition-transform duration-300 border border-white/30">
                                            <i class="fas fa-envelope text-white animate-pulse"></i>
                                        </div>
                                    </div>
                                    
                                    <!-- Title and Subtitle -->
                                    <h1 class="text-3xl lg:text-5xl font-bold mb-4 drop-shadow-lg">
                                        ${pageData.title || ''}
                                    </h1>
                                    <p class="text-lg lg:text-xl mb-8 max-w-2xl mx-auto opacity-90 drop-shadow-md">
                                        ${pageData.subtitle || ''}
                                    </p>
                                    
                                    <!-- Mouse Scroll Indicator -->
                                    <div class="flex justify-center">
                                        <div class="flex flex-col items-center text-white cursor-pointer group" onclick="document.getElementById('contact-form').scrollIntoView({behavior: 'smooth'})">
                                            <div class="w-6 h-10 border-2 border-white rounded-full flex justify-center transition-all duration-300 group-hover:scale-110">
                                                <div class="w-1.5 h-3 bg-white rounded-full mt-2 animate-bounce transition-all duration-300"></div>
                                            </div>
                                            <span class="text-sm mt-3 opacity-90 transition-all duration-300 group-hover:opacity-100 group-hover:scale-105 font-medium">Scroll</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ` : `
                    <!-- Creative Header (fallback when no banner) -->
                    <div class="relative mb-16">
                        <!-- Animated Background Shapes -->
                        <div class="absolute inset-0 overflow-hidden">
                            <div class="absolute top-0 left-1/4 w-32 h-32 bg-[${primaryColor}]/10 rounded-full blur-xl animate-pulse"></div>
                            <div class="absolute top-20 right-1/4 w-24 h-24 bg-[${accentColor}]/15 rounded-full blur-lg animate-pulse delay-1000"></div>
                            <div class="absolute bottom-10 left-1/3 w-20 h-20 bg-[${secondaryColor}]/10 rounded-full blur-md animate-pulse delay-500"></div>
                        </div>
                        
                        <div class="relative text-center">
                            <div class="inline-block mb-6">
                                <div class="w-24 h-24 bg-gradient-to-br from-[${primaryColor}] to-[${accentColor}] rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                    <i class="fas fa-envelope text-white text-3xl"></i>
                                </div>
                            </div>
                            <h1 class="text-4xl lg:text-5xl font-bold text-[${secondaryColor}] mb-4 bg-gradient-to-r from-[${primaryColor}] to-[${accentColor}] bg-clip-text text-transparent">
                                ${pageData?.title || 'Contact Us'}
                            </h1>
                            <p class="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
                                ${pageData?.subtitle || 'Get in touch with us today'}
                            </p>
                            <div class="w-32 h-1 bg-gradient-to-r from-[${primaryColor}] via-[${accentColor}] to-[${secondaryColor}] mx-auto rounded-full"></div>
                        </div>
                    </div>
                `}

                <!-- Contact Content -->
                <div class="relative">
                    <!-- Animated Background -->
                    <div class="absolute inset-0">
                        <div class="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[${primaryColor}]/5 via-transparent to-[${accentColor}]/5 rounded-[3rem]"></div>
                        <div class="absolute top-10 left-10 w-20 h-20 bg-[${primaryColor}]/10 rounded-full animate-spin-slow"></div>
                        <div class="absolute bottom-10 right-10 w-16 h-16 bg-[${accentColor}]/10 rounded-full animate-spin-slow-reverse"></div>
                    </div>
                    
                    <div class="relative">
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 p-5 lg:p-8">
                            
                            <!-- Contact Information -->
                            <div class="space-y-8">
                                <!-- Page Content Section -->
                                ${this.get('pageData')?.content ? `
                                    <div class="bg-white rounded-[2rem] p-6">
                                        <content-display 
                                            content="${this.get('pageData').content.replace(/"/g, '&quot;')}"
                                            no-styles>
                                        </content-display>
                                    </div>
                                ` : `
                                    <!-- Office Hours (fallback if no content) -->
                                    <div class="bg-white rounded-[2rem] shadow-2xl p-6">
                                        <h2 class="text-2xl font-bold text-[${secondaryColor}] mb-4">Office Hours</h2>
                                        <div class="space-y-3">
                                            <div class="flex justify-between">
                                                <span class="text-gray-600">Monday - Friday</span>
                                                <span class="font-semibold text-[${secondaryColor}]">8:00 AM - 4:00 PM</span>
                                            </div>
                                            <div class="flex justify-between">
                                                <span class="text-gray-600">Saturday</span>
                                                <span class="font-semibold text-[${secondaryColor}]">9:00 AM - 1:00 PM</span>
                                            </div>
                                            <div class="flex justify-between">
                                                <span class="text-gray-600">Sunday</span>
                                                <span class="font-semibold text-[${secondaryColor}]">Closed</span>
                                            </div>
                                        </div>
                                    </div>
                                `}
                                
                                <div class="bg-white rounded-[2rem] p-6">
                                    <h2 class="text-2xl font-bold text-[${secondaryColor}] mb-6">Contact Information</h2>
                                    
                                    <div class="space-y-6">
                                        <!-- Address -->
                                        <div class="flex items-start gap-4">
                                            <div class="w-12 h-12 bg-gradient-to-r from-[${primaryColor}] to-[${accentColor}] rounded-full flex items-center justify-center flex-shrink-0">
                                                <i class="fas fa-map-marker-alt text-white"></i>
                                            </div>
                                            <div>
                                                <h3 class="font-semibold text-[${secondaryColor}] mb-1">Address</h3>
                                                <p class="text-gray-600">${this.get('contactAddress') || '123 School Street, City, State 12345'}</p>
                                            </div>
                                        </div>
                                        
                                        <!-- Phone -->
                                        <div class="flex items-start gap-4">
                                            <div class="w-12 h-12 bg-gradient-to-r from-[${primaryColor}] to-[${accentColor}] rounded-full flex items-center justify-center flex-shrink-0">
                                                <i class="fas fa-phone text-white"></i>
                                            </div>
                                            <div>
                                                <h3 class="font-semibold text-[${secondaryColor}] mb-1">Phone</h3>
                                                <p class="text-gray-600">${this.get('contactPhone') || '+1 (555) 123-4567'}</p>
                                            </div>
                                        </div>
                                        
                                        <!-- Email -->
                                        <div class="flex items-start gap-4">
                                            <div class="w-12 h-12 bg-gradient-to-r from-[${primaryColor}] to-[${accentColor}] rounded-full flex items-center justify-center flex-shrink-0">
                                                <i class="fas fa-envelope text-white"></i>
                                            </div>
                                            <div>
                                                <h3 class="font-semibold text-[${secondaryColor}] mb-1">Email</h3>
                                                <p class="text-gray-600">${this.get('contactEmail') || 'info@school.edu'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Contact Form -->
                            <div id="contact-form" class="bg-white rounded-[2rem] p-6">
                                <h2 class="text-2xl font-bold text-[${secondaryColor}] mb-6">Send us a Message</h2>
                                
                                <form class="space-y-6">
                                    <!-- Name -->
                                    <div>
                                        <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
                                            Full Name *
                                        </label>
                                        <ui-input
                                            type="text"
                                            id="name"
                                            name="name"
                                            placeholder="Enter your full name"
                                            required>
                                        </ui-input>
                                    </div>
                                    
                                    <!-- Email -->
                                    <div>
                                        <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                                            Email Address *
                                        </label>
                                        <ui-input
                                            type="email"
                                            id="email"
                                            name="email"
                                            placeholder="Enter your email address"
                                            required>
                                        </ui-input>
                                    </div>
                                    
                                    <!-- Subject -->
                                    <div>
                                        <label for="subject" class="block text-sm font-medium text-gray-700 mb-2">
                                            Subject
                                        </label>
                                        <ui-input
                                            type="text"
                                            id="subject"
                                            name="subject"
                                            placeholder="Enter message subject">
                                        </ui-input>
                                    </div>
                                    
                                    <!-- Message -->
                                    <div>
                                        <label for="message" class="block text-sm font-medium text-gray-700 mb-2">
                                            Message *
                                        </label>
                                        <ui-textarea
                                            id="message"
                                            name="message"
                                            rows="5"
                                            placeholder="Enter your message"
                                            required></ui-textarea>
                                    </div>
                                    
                                    <!-- Submit Button -->
                                    <button
                                        type="submit"
                                        disabled
                                        class="w-full bg-gradient-to-r from-[${primaryColor}] to-[${accentColor}] text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform shadow-lg opacity-50 cursor-not-allowed">
                                        ${loading ? `
                                            <div class="flex items-center justify-center gap-2">
                                                <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Sending Message...
                                            </div>
                                        ` : `
                                            <div class="flex items-center justify-center gap-2">
                                                <i class="fas fa-paper-plane"></i>
                                                Send Message
                                            </div>
                                        `}
                                    </button>                                    
                                </form>                                
                                    <!-- Social Media Links -->
                                    ${this.hasSocialMediaLinks() ? `
                                        <div class="border-t border-gray-200 pt-6">
                                            <h3 class="text-lg font-semibold text-[${secondaryColor}] mb-4 text-center">Follow Us</h3>
                                            <div class="grid grid-cols-3 gap-3">
                                                ${this.renderSocialMediaLinks()}
                                            </div>
                                        </div>
                                    ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Map Section -->
                <div class="mt-16">
                    <div class="text-center mb-8">
                        <h2 class="text-3xl font-bold text-[${secondaryColor}] mb-4">Find Us</h2>
                        <p class="text-gray-600 max-w-2xl mx-auto">
                            Visit our campus and experience our facilities firsthand
                        </p>
                        <div class="w-24 h-1 bg-gradient-to-r from-[${primaryColor}] to-[${accentColor}] mx-auto mt-4 rounded-full"></div>
                    </div>
                    
                    <div class="bg-white rounded-[2rem] shadow-2xl overflow-hidden">
                        <!-- Map Header -->
                        <div class="bg-gradient-to-r from-[${primaryColor}] to-[${accentColor}] p-6 text-white">
                            <div class="flex items-center gap-4">
                                <div class="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                    <i class="fas fa-map-marker-alt text-xl"></i>
                                </div>
                                <div>
                                    <h3 class="text-xl font-bold">${this.get('mapLocationName') || 'Our School Campus'}</h3>
                                    <p class="text-white/90">${this.get('mapAddress') || '123 School Street, City, Country'}</p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Map Embed -->
                        <div class="relative h-96">
                            ${this.get('mapEmbedUrl') ? `
                                <iframe 
                                    src="${this.get('mapEmbedUrl')}"
                                    title="${this.get('mapLocationName') || 'School Location'}"
                                    class="w-full h-full"
                                    frameborder="0" 
                                    allowfullscreen>
                                </iframe>
                            ` : `
                                <div class="w-full h-full bg-gray-100 flex items-center justify-center">
                                    <div class="text-center">
                                        <i class="fas fa-map text-gray-400 text-4xl mb-4"></i>
                                        <p class="text-gray-500 mb-2">Map not available</p>
                                        <p class="text-sm text-gray-400">Please configure map settings</p>
                                    </div>
                                </div>
                            `}
                        </div>
                        
                        <!-- Map Info -->
                        <div class="p-6 bg-gray-50">
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                                <div>
                                    <i class="fas fa-map-marker-alt text-[${primaryColor}] text-xl mb-2"></i>
                                    <h4 class="font-semibold text-[${secondaryColor}]">Location</h4>
                                    <p class="text-gray-600 text-sm">${this.get('mapLocationName') || 'Our School Campus'}</p>
                                </div>
                                <div>
                                    <i class="fas fa-route text-[${primaryColor}] text-xl mb-2"></i>
                                    <h4 class="font-semibold text-[${secondaryColor}]">Coordinates</h4>
                                    <p class="text-gray-600 text-sm">${this.get('mapLatitude') || '40.7128'}, ${this.get('mapLongitude') || '-74.0060'}</p>
                                </div>
                                <div>
                                    <i class="fas fa-search-plus text-[${primaryColor}] text-xl mb-2"></i>
                                    <h4 class="font-semibold text-[${secondaryColor}]">Zoom Level</h4>
                                    <p class="text-gray-600 text-sm">${this.get('mapZoomLevel') || '15'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        `;
    }
}

customElements.define('contact-section-alt', ContactSectionAlt);
export default ContactSectionAlt; 