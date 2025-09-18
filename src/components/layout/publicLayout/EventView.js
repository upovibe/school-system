import App from '@/core/App.js';
import Toast from '@/components/ui/Toast.js';
import '@/components/layout/publicLayout/EventList.js';
import { fetchColorSettings } from '@/utils/colorSettings.js';
import '@/components/common/PageLoader.js';
import '@/components/ui/ContentDisplay.js';

/**
 * Event View Component
 * 
 * Displays detailed information for a specific event
 * Can be used in individual event pages or modals
 */
class EventView extends App {
    constructor() {
        super();
        // Initialize with loading state
        this.set('loading', true);
        this.set('colorsLoaded', false);
        this.set('event', null);
        this.set('error', null);
    }

    // Method to copy event URL to clipboard and show toast
    copyEventUrl() {
        const event = this.get('event');
        const eventTitle = event?.title ? event.title.charAt(0).toUpperCase() + event.title.slice(1) : 'Event';
        
        navigator.clipboard.writeText(window.location.href).then(() => {
            Toast.show({ 
                message: `${eventTitle} copied to clipboard!`, 
                variant: 'success', 
                duration: 3000 
            });
        });
    }

    async connectedCallback() {
        super.connectedCallback();
        
        // Load colors from settings
        await this.loadColorsFromSettings();
        
        // Check if slug attribute is provided and load data
        const slug = this.getAttribute('slug');
        if (slug) {
            this.loadEventData(slug);
        }
    }

    async loadColorsFromSettings() {
        try {
            // Fetch colors from API
            const colors = await fetchColorSettings();
            
            // Set colors in component state
            Object.entries(colors).forEach(([key, value]) => {
                this.set(key, value);
            });
            
            // Mark colors as loaded
            this.set('colorsLoaded', true);
        } catch (error) {
            this.set('colorsLoaded', true);
        }
    }

    // Watch for slug attribute changes
    static get observedAttributes() {
        return ['slug'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'slug' && newValue && newValue !== oldValue) {
            this.loadEventData(newValue);
        }
    }

    // Method to load event data (can be called externally)
    async loadEventData(slug) {
        try {
            if (!slug) {
                this.set('error', 'Event not found');
                this.set('loading', false);
                return;
            }

            // Fetch event data by slug
            const apiUrl = `/api/events/slug/${slug}`;
            
            const response = await fetch(apiUrl);
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    this.set('event', data.data);
                } else {
                    this.set('error', 'Event not found');
                }
            } else {
                this.set('error', 'Failed to load event');
            }
        } catch (error) {
            this.set('error', 'Error loading event');
        }
        
        this.set('loading', false);
    }

    // Helper method to get proper image URL
    getImageUrl(imagePath) {
        if (!imagePath) return '';
        
        // If it's already a full URL, return as is
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
        }
        
        // If it's a relative path starting with /, construct the full URL
        if (imagePath.startsWith('/')) {
            const baseUrl = window.location.origin;
            return baseUrl + imagePath;
        }
        
        // If it's a relative path without /, construct the URL
        const baseUrl = window.location.origin;
        const apiPath = '/api';
        return baseUrl + apiPath + '/' + imagePath;
    }

    // Helper function to get status badge styling
    getStatusBadge(status) {
        switch (status?.toLowerCase()) {
            case 'upcoming':
                return {
                    class: 'bg-blue-100 text-blue-800',
                    icon: 'fas fa-clock',
                    text: 'Upcoming'
                };
            case 'ongoing':
                return {
                    class: 'bg-green-100 text-green-800',
                    icon: 'fas fa-play',
                    text: 'Ongoing'
                };
            case 'completed':
                return {
                    class: 'bg-gray-100 text-gray-800',
                    icon: 'fas fa-check',
                    text: 'Completed'
                };
            case 'cancelled':
                return {
                    class: 'bg-red-100 text-red-800',
                    icon: 'fas fa-times',
                    text: 'Cancelled'
                };
            default:
                return {
                    class: 'bg-gray-100 text-gray-800',
                    icon: 'fas fa-circle',
                    text: status || 'Unknown'
                };
        }
    }

    // Helper function to format date
    formatDate(dateString) {
        if (!dateString) return 'TBD';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return dateString;
            }
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    }

    // Helper function to format time
    formatTime(timeString) {
        if (!timeString) return 'TBD';
        try {
            if (timeString.includes(' ')) {
                const timePart = timeString.split(' ')[1];
                return timePart.substring(0, 5);
            }
            return timeString;
        } catch (error) {
            return timeString;
        }
    }

    render() {
        const loading = this.get('loading');
        const colorsLoaded = this.get('colorsLoaded');
        const error = this.get('error');
        const event = this.get('event');
        
        // Get colors from state
        const primaryColor = this.get('primary_color');
        const secondaryColor = this.get('secondary_color');
        const accentColor = this.get('accent_color');
        const textColor = this.get('text_color');
        const darkColor = this.get('dark_color');
        
        // Show loading if either colors or event data is still loading
        if (loading || !colorsLoaded) {
            return `<page-loader></page-loader>`;
        }

        if (!loading && (error || !event)) {
            return `
                <div class="flex items-center justify-center min-h-96">
                    <div class="text-center">
                        <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
                        <h1 class="text-2xl font-bold text-gray-800 mb-2">Event Not Found</h1>
                        <p class="text-gray-600 mb-6">The event you're looking for doesn't exist or has been removed.</p>
                        <a href="/public/community/events" 
                           class="inline-flex items-center gap-2 px-6 py-3 bg-[${primaryColor}] text-[${textColor}] font-semibold rounded-lg hover:bg-[${accentColor}] transition-colors">
                            <i class="fas fa-arrow-left"></i>
                            Back to Events
                        </a>
                    </div>
                </div>
            `;
        }

        const statusBadge = this.getStatusBadge(event.status);

        return `
            <!-- Breadcrumb -->
            <ui-breadcrumb separator="chevron" color="primary">
                <ui-breadcrumb-item href="/">Home</ui-breadcrumb-item>
                <ui-breadcrumb-item href="/public/community">Community</ui-breadcrumb-item>
                <ui-breadcrumb-item href="/public/community/events">Events</ui-breadcrumb-item>
                <ui-breadcrumb-item>${event.title ? event.title.charAt(0).toUpperCase() + event.title.slice(1) : 'Event Details'}</ui-breadcrumb-item>
            </ui-breadcrumb>

            <!-- Event Banner - Always show (placeholder if no image) -->
            <div class="relative w-full h-96 rounded-2xl overflow-hidden shadow-lg my-6">
                ${event.banner_image ? `
                    <img src="/api/${event.banner_image}" 
                         alt="${event.title}" 
                         class="w-full h-full object-cover"
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                ` : ''}
                <div class="absolute inset-0 ${event.banner_image ? 'hidden' : 'flex'} items-center justify-center bg-gray-100">
                    <div class="text-center">
                        <i class="fas fa-calendar-alt text-gray-400 text-6xl mb-4"></i>
                        <h2 class="text-2xl font-bold text-gray-700 mb-2">${event.title ? event.title.charAt(0).toUpperCase() + event.title.slice(1) : 'Event'}</h2>
                        <p class="text-lg text-gray-600">${event.category ? event.category.charAt(0).toUpperCase() + event.category.slice(1) : 'Event'} • ${this.formatDate(event.start_date || event.event_date)}</p>
                    </div>
                </div>
                
                <!-- Status Badge - Absolute positioned at top-right corner -->
                <div class="absolute top-4 right-4 z-10">
                    <span class="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-[${primaryColor}] bg-opacity-10 text-[${primaryColor}] shadow-lg">
                        <i class="${statusBadge.icon} mr-2"></i>
                        ${statusBadge.text}
                    </span>
                </div>
                
                <!-- Location - Absolute positioned at bottom-left corner -->
                ${event.location ? `
                    <div class="absolute bottom-4 left-4 z-10">
                        <div class="bg-[${darkColor}] bg-opacity-70 backdrop-blur-sm rounded-lg px-4 py-2 text-[${textColor}]">
                            <div class="flex items-center gap-2">
                                <i class="fas fa-map-marker-alt text-[${primaryColor}]"></i>
                                <span class="text-sm font-medium">${event.location}</span>
                            </div>
                        </div>
                    </div>
                ` : ''}
                
                <!-- Dark gradient overlay for images -->
                ${event.banner_image ? `
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                ` : ''}
            </div>

            <!-- Two Container Layout Under Banner -->
            <div class="mx-auto px-4">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    <!-- Left Container -->
                    <div class="space-y-6">
                        <!-- Title with Share/Copy buttons -->
                        <div class="flex items-start justify-between">
                            <div class="flex-1">
                                <h1 class="text-3xl font-bold text-[${secondaryColor}] mb-2">${event.title ? event.title.charAt(0).toUpperCase() + event.title.slice(1) : 'Untitled Event'}</h1>
                                ${event.subtitle ? `<p class="text-lg text-gray-600">${event.subtitle}</p>` : ''}
                            </div>
                            <div class="flex gap-3 ml-4">
                                <i onclick="navigator.share ? navigator.share({title: '${event.title}', url: window.location.href}) : navigator.clipboard.writeText(window.location.href)" 
                                   class="fas fa-share size-8 text-gray-600 hover:text-[${primaryColor}] cursor-pointer transition-colors border border-gray-300 rounded-lg p-1.5"></i>
                                <i onclick="this.closest('app-event-view').copyEventUrl()" 
                                   class="fas fa-copy size-8 text-gray-600 hover:text-gray-800 cursor-pointer transition-colors border border-gray-300 rounded-lg p-1.5"></i>
                            </div>
                        </div>

                        <!-- Description -->
                        ${event.description ? `
                            <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                <h3 class="text-lg font-semibold text-[${secondaryColor}] mb-3">Description</h3>
                                <content-display 
                                    content="${event.description.replace(/"/g, '&quot;')}"
                                    no-styles>
                                </content-display>
                            </div>
                        ` : ''}

                        <!-- Content -->
                        ${event.content ? `
                            <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                <h3 class="text-lg font-semibold text-[${secondaryColor}] mb-3">Event Details</h3>
                                <content-display 
                                    content="${event.content.replace(/"/g, '&quot;')}"
                                    no-styles>
                                </content-display>
                            </div>
                        ` : ''}

                        <!-- Dates and Category -->
                        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <div class="space-y-4">
                                <!-- Start Date & Time -->
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 bg-[${primaryColor}] bg-opacity-10 rounded-lg flex items-center justify-center">
                                        <i class="fas fa-calendar text-[${primaryColor}]"></i>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-600">Start Date & Time</p>
                                        <div class="flex items-center gap-2">
                                            <p class="font-semibold text-[${secondaryColor}]">${this.formatDate(event.start_date)}</p>
                                            <p class="text-sm text-gray-600 font-semibold bg-gray-100 px-2 py-1 rounded-md">${this.formatTime(event.start_date)}</p>
                                        </div>
                                    </div>
                                </div>

                                <!-- End Date & Time -->
                                ${event.end_date ? `
                                    <div class="flex items-center gap-3">
                                        <div class="w-10 h-10 bg-[${accentColor}] bg-opacity-10 rounded-lg flex items-center justify-center">
                                            <i class="fas fa-calendar-times text-[${accentColor}]"></i>
                                        </div>
                                        <div>
                                            <p class="text-sm text-gray-600">End Date & Time</p>
                                            <div class="flex items-center gap-2">
                                                <p class="font-semibold text-[${secondaryColor}]">${this.formatDate(event.end_date)}</p>
                                                <p class="text-sm text-gray-600 font-semibold bg-gray-100 px-2 py-1 rounded-md">${this.formatTime(event.end_date)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ` : ''}

                                <!-- Category -->
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 bg-[${darkColor}] bg-opacity-10 rounded-lg flex items-center justify-center">
                                        <i class="fas fa-tag text-[${darkColor}]"></i>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-600">Category</p>
                                        <p class="font-semibold text-[${secondaryColor}]">${event.category || 'General'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Right Container -->
                    <div class="space-y-6">
                        <!-- Event List -->
                        <event-list></event-list>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('app-event-view', EventView);
export default EventView; 