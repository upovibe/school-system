import App from '@/core/App.js';
import Toast from '@/components/ui/Toast.js';

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
        this.set('error', null);
        this.set('event', null);
    }

    connectedCallback() {
        super.connectedCallback();
        
        // Check if slug attribute is provided and load data
        const slug = this.getAttribute('slug');
        if (slug) {
            this.loadEventData(slug);
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
        if (!imagePath) return null;
        
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
        const error = this.get('error');
        const event = this.get('event');
        
        if (loading) {
            return `
                <div class="flex items-center justify-center min-h-96">
                    <div class="text-center">
                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p class="text-gray-600">Loading event...</p>
                    </div>
                </div>
            `;
        }

        if (!loading && (error || !event)) {
            return `
                <div class="flex items-center justify-center min-h-96">
                    <div class="text-center">
                        <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
                        <h1 class="text-2xl font-bold text-gray-800 mb-2">Event Not Found</h1>
                        <p class="text-gray-600 mb-6">The event you're looking for doesn't exist or has been removed.</p>
                        <a href="/public/community/events" 
                           class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
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
                <ui-breadcrumb-item>${event.title || 'Event Details'}</ui-breadcrumb-item>
            </ui-breadcrumb>

            <!-- Event Banner - Always show (placeholder if no image) -->
            <div class="relative w-full h-96 rounded-2xl overflow-hidden shadow-lg mb-6">
                ${event.banner_image ? `
                    <img src="/api/${event.banner_image}" 
                         alt="${event.title}" 
                         class="w-full h-full object-cover"
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                ` : ''}
                <div class="absolute inset-0 ${event.banner_image ? 'hidden' : 'flex'} items-center justify-center bg-gray-100">
                    <div class="text-center">
                        <i class="fas fa-calendar-alt text-gray-400 text-6xl mb-4"></i>
                        <h2 class="text-2xl font-bold text-gray-700 mb-2">${event.title || 'Event'}</h2>
                        <p class="text-lg text-gray-600">${event.category ? event.category.charAt(0).toUpperCase() + event.category.slice(1) : 'Event'} • ${this.formatDate(event.start_date || event.event_date)}</p>
                    </div>
                </div>
                
                <!-- Status Badge - Absolute positioned at top-right corner -->
                <div class="absolute top-4 right-4 z-10">
                    <span class="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${statusBadge.class} shadow-lg">
                        <i class="${statusBadge.icon} mr-2"></i>
                        ${statusBadge.text}
                    </span>
                </div>
                
                <!-- Location - Absolute positioned at bottom-left corner -->
                ${event.location ? `
                    <div class="absolute bottom-4 left-4 z-10">
                        <div class="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 text-white">
                            <div class="flex items-center gap-2">
                                <i class="fas fa-map-marker-alt text-red-400"></i>
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
                                <h1 class="text-3xl font-bold text-gray-900 mb-2">${event.title || 'Untitled Event'}</h1>
                                ${event.subtitle ? `<p class="text-lg text-gray-600">${event.subtitle}</p>` : ''}
                            </div>
                            <div class="flex gap-3 ml-4">
                                <i onclick="navigator.share ? navigator.share({title: '${event.title}', url: window.location.href}) : navigator.clipboard.writeText(window.location.href)" 
                                   class="fas fa-share size-8 text-gray-600 hover:text-blue-600 cursor-pointer transition-colors border border-gray-300 rounded-lg p-1.5"></i>
                                <i onclick="navigator.clipboard.writeText(window.location.href).then(() => { Toast.show({ message: 'Event URL copied to clipboard!', variant: 'success', duration: 3000 }); })" 
                                   class="fas fa-copy size-8 text-gray-600 hover:text-gray-800 cursor-pointer transition-colors border border-gray-300 rounded-lg p-1.5"></i>
                            </div>
                        </div>

                        <!-- Description -->
                        ${event.description ? `
                            <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                <h3 class="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                                <div class="prose prose-sm max-w-none text-gray-700">
                                    ${event.description}
                                </div>
                            </div>
                        ` : ''}

                        <!-- Dates and Category -->
                        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <div class="space-y-4">
                                <!-- Start Date & Time -->
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <i class="fas fa-calendar text-blue-600"></i>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-600">Start Date & Time</p>
                                        <div class="flex items-center gap-2">
                                            <p class="font-semibold text-gray-900">${this.formatDate(event.start_date)}</p>
                                            <p class="text-sm text-gray-600 font-semibold bg-gray-100 px-2 py-1 rounded-md">${this.formatTime(event.start_date)}</p>
                                        </div>
                                    </div>
                                </div>

                                <!-- End Date & Time -->
                                ${event.end_date ? `
                                    <div class="flex items-center gap-3">
                                        <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                            <i class="fas fa-calendar-times text-red-600"></i>
                                        </div>
                                        <div>
                                            <p class="text-sm text-gray-600">End Date & Time</p>
                                            <div class="flex items-center gap-2">
                                                <p class="font-semibold text-gray-900">${this.formatDate(event.end_date)}</p>
                                                <p class="text-sm text-gray-600 font-semibold bg-gray-100 px-2 py-1 rounded-md">${this.formatTime(event.end_date)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ` : ''}

                                <!-- Category -->
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <i class="fas fa-tag text-purple-600"></i>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-600">Category</p>
                                        <p class="font-semibold text-gray-900">${event.category || 'General'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Right Container -->
                    <div class="space-y-6">
                        <!-- Event List -->
                        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <h3 class="text-lg font-semibold text-gray-900 mb-4">Event List</h3>
                            <div class="space-y-4">
                                <!-- Content will be added here later -->
                            </div>
                        </div>

                        <!-- Content -->
                        ${event.content ? `
                            <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                <h3 class="text-lg font-semibold text-gray-900 mb-3">Details</h3>
                                <div class="prose prose-sm max-w-none text-gray-700">
                                    ${event.content}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('app-event-view', EventView);
export default EventView; 