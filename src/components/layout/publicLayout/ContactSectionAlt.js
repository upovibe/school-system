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
        this.set('formData', {
            name: '',
            email: '',
            subject: '',
            message: ''
        });
    }

    connectedCallback() {
        super.connectedCallback();
        this.loadDataFromProps();
        this.setupEventListeners();
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
                if (settings.contact_title) this.set('contactTitle', settings.contact_title);
                if (settings.contact_subtitle) this.set('contactSubtitle', settings.contact_subtitle);
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
        this.addEventListener('input', (e) => {
            const input = e.target;
            const field = input.name;
            if (field) {
                const formData = this.get('formData') || {
                    name: '',
                    email: '',
                    subject: '',
                    message: ''
                };
                formData[field] = input.value;
                this.set('formData', { ...formData });
            }
        });

        this.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
    }

    async handleSubmit() {
        try {
            this.set('loading', true);
            
            const formData = this.get('formData') || {
                name: '',
                email: '',
                subject: '',
                message: ''
            };
            
            // Basic validation
            if (!formData.name || !formData.email || !formData.message) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please fill in all required fields',
                    variant: 'error',
                    duration: 3000
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
                    duration: 3000
                });
                return;
            }

            // Here you would typically send the form data to your API
            // For now, we'll just show a success message
            console.log('Contact form data:', formData);
            
            Toast.show({
                title: 'Success',
                message: 'Thank you for your message! We\'ll get back to you soon.',
                variant: 'success',
                duration: 5000
            });

            // Reset form
            this.set('formData', {
                name: '',
                email: '',
                subject: '',
                message: ''
            });

            // Reset form inputs
            const inputs = this.querySelectorAll('input, textarea');
            inputs.forEach(input => {
                input.value = '';
            });

        } catch (error) {
            console.error('Error submitting contact form:', error);
            Toast.show({
                title: 'Error',
                message: 'Failed to send message. Please try again.',
                variant: 'error',
                duration: 3000
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
        const formData = this.get('formData') || {
            name: '',
            email: '',
            subject: '',
            message: ''
        };
        const loading = this.get('loading');
        
        // Get colors from state
        const primaryColor = this.get('primary_color');
        const secondaryColor = this.get('secondary_color');
        const accentColor = this.get('accent_color');
        const textColor = this.get('text_color');

        return `
            <!-- Contact Section Alt -->
            <section class="mx-auto py-10">
                
                <!-- Creative Header -->
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
                            ${(this.get('pageData') && this.get('pageData').title) ? this.get('pageData').title : ''}
                        </h1>
                        <p class="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
                            ${(this.get('pageData') && this.get('pageData').subtitle) ? this.get('pageData').subtitle : ''}
                        </p>
                        <div class="w-32 h-1 bg-gradient-to-r from-[${primaryColor}] via-[${accentColor}] to-[${secondaryColor}] mx-auto rounded-full"></div>
                    </div>
                </div>

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
                                        <h2 class="text-2xl font-bold text-[${secondaryColor}] mb-4">About Our School</h2>
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
                            <div class="bg-white rounded-[2rem] p-6">
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
                                            value="${formData.name}"
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
                                            value="${formData.email}"
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
                                            value="${formData.subject}"
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
                                            required>${formData.message}</ui-textarea>
                                    </div>
                                    
                                    <!-- Submit Button -->
                                    <button
                                        type="submit"
                                        disabled="${loading}"
                                        class="w-full bg-gradient-to-r from-[${primaryColor}] to-[${accentColor}] text-white font-semibold py-3 px-6 rounded-lg hover:from-[${primaryColor}] hover:to-[${accentColor}] transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
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