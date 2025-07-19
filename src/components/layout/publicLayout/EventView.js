import App from '@/core/App.js';

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
        console.log('EventView connectedCallback called'); // Debug log
        
        // Check if slug attribute is provided and load data
        const slug = this.getAttribute('slug');
        if (slug) {
            console.log('EventView received slug:', slug);
            this.loadEventData(slug);
        }
    }

    // Watch for slug attribute changes
    static get observedAttributes() {
        return ['slug'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'slug' && newValue && newValue !== oldValue) {
            console.log('EventView slug changed to:', newValue);
            this.loadEventData(newValue);
        }
    }

    // Method to load event data (can be called externally)
    async loadEventData(slug) {
        try {
            console.log('Loading event data for slug:', slug); // Debug log
            
            if (!slug) {
                this.set('error', 'Event not found');
                this.set('loading', false);
                return;
            }

            // Fetch event data by slug
            const apiUrl = `/api/events/slug/${slug}`;
            console.log('Fetching from:', apiUrl); // Debug log
            
            const response = await fetch(apiUrl);
            console.log('Response status:', response.status); // Debug log
            
            if (response.ok) {
                const data = await response.json();
                console.log('Response data:', data); // Debug log
                if (data.success && data.data) {
                    this.set('event', data.data);
                } else {
                    this.set('error', 'Event not found');
                }
            } else {
                console.error('Response not ok:', response.status, response.statusText); // Debug log
                this.set('error', 'Failed to load event');
            }
        } catch (error) {
            console.error('Error loading event:', error);
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
        
        console.log('EventView render called - loading:', loading, 'error:', error, 'event:', event); // Debug log
        
        if (loading) {
            console.log('Showing loading spinner'); // Debug log
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
            console.log('Showing error or no event'); // Debug log
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
        console.log('Rendering main event content'); // Debug log

        return `
            <!-- Breadcrumb -->
            <ui-breadcrumb separator="chevron" color="primary">
                <ui-breadcrumb-item href="/public">Home</ui-breadcrumb-item>
                <ui-breadcrumb-item href="/public/community">Community</ui-breadcrumb-item>
                <ui-breadcrumb-item href="/public/community/events">Events</ui-breadcrumb-item>
                <ui-breadcrumb-item>${event.title || 'Event Details'}</ui-breadcrumb-item>
            </ui-breadcrumb>

            <div class="max-w-4xl mx-auto">
                <!-- Event Banner -->
                ${event.banner_image ? `
                    <div class="relative w-full h-96 rounded-2xl overflow-hidden shadow-lg mb-8">
                        <img src="${this.getImageUrl(event.banner_image)}" 
                             alt="${event.title}" 
                             class="w-full h-full object-cover"
                             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <div class="absolute inset-0 hidden items-center justify-center bg-gray-100">
                            <div class="text-center">
                                <i class="fas fa-image text-gray-400 text-4xl mb-2"></i>
                                <p class="text-gray-500 font-medium">Event banner</p>
                            </div>
                        </div>
                        <!-- Dark gradient overlay -->
                        <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                    </div>
                ` : ''}

                <!-- Event Content -->
                <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <!-- Event Header -->
                    <div class="p-8 border-b border-gray-100">
                        <div class="flex items-start justify-between mb-4">
                            <div class="flex-1">
                                <h1 class="text-3xl font-bold text-gray-900 mb-2">${event.title || 'Untitled Event'}</h1>
                                <p class="text-gray-600 text-lg">${event.subtitle || ''}</p>
                            </div>
                            <span class="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${statusBadge.class}">
                                <i class="${statusBadge.icon} mr-2"></i>
                                ${statusBadge.text}
                            </span>
                        </div>

                        <!-- Event Meta -->
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div class="flex items-center gap-3">
                                <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-calendar text-blue-600 text-xl"></i>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-600">Date</p>
                                    <p class="font-semibold text-gray-900">${this.formatDate(event.start_date || event.event_date)}</p>
                                </div>
                            </div>
                            <div class="flex items-center gap-3">
                                <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-clock text-green-600 text-xl"></i>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-600">Time</p>
                                    <p class="font-semibold text-gray-900">${this.formatTime(event.start_date || event.event_time)}</p>
                                </div>
                            </div>
                            <div class="flex items-center gap-3">
                                <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-tag text-purple-600 text-xl"></i>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-600">Category</p>
                                    <p class="font-semibold text-gray-900">${event.category || 'General'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Event Details -->
                    <div class="p-8">
                        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <!-- Main Content -->
                            <div class="lg:col-span-2 space-y-6">
                                <!-- Description -->
                                ${event.description ? `
                                    <div>
                                        <h3 class="text-xl font-semibold text-gray-900 mb-4">Description</h3>
                                        <div class="prose prose-lg max-w-none">
                                            ${event.description}
                                        </div>
                                    </div>
                                ` : ''}

                                <!-- Content -->
                                ${event.content ? `
                                    <div>
                                        <h3 class="text-xl font-semibold text-gray-900 mb-4">Details</h3>
                                        <div class="prose prose-lg max-w-none">
                                            ${event.content}
                                        </div>
                                    </div>
                                ` : ''}
                            </div>

                            <!-- Sidebar -->
                            <div class="space-y-6">
                                <!-- Location -->
                                ${event.location ? `
                                    <div class="bg-gray-50 rounded-xl p-6">
                                        <h4 class="font-semibold text-gray-900 mb-3">Location</h4>
                                        <div class="flex items-start gap-3">
                                            <i class="fas fa-map-marker-alt text-red-500 text-lg mt-1"></i>
                                            <p class="text-gray-700">${event.location}</p>
                                        </div>
                                    </div>
                                ` : ''}

                                <!-- Additional Info -->
                                <div class="bg-gray-50 rounded-xl p-6">
                                    <h4 class="font-semibold text-gray-900 mb-3">Event Information</h4>
                                    <div class="space-y-3">
                                        ${event.end_date ? `
                                            <div class="flex items-center justify-between">
                                                <span class="text-gray-600">End Date:</span>
                                                <span class="font-medium">${this.formatDate(event.end_date)}</span>
                                            </div>
                                        ` : ''}
                                        ${event.max_participants ? `
                                            <div class="flex items-center justify-between">
                                                <span class="text-gray-600">Max Participants:</span>
                                                <span class="font-medium">${event.max_participants}</span>
                                            </div>
                                        ` : ''}
                                        ${event.organizer ? `
                                            <div class="flex items-center justify-between">
                                                <span class="text-gray-600">Organizer:</span>
                                                <span class="font-medium">${event.organizer}</span>
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>

                                <!-- Share Event -->
                                <div class="bg-gray-50 rounded-xl p-6">
                                    <h4 class="font-semibold text-gray-900 mb-3">Share Event</h4>
                                    <div class="flex gap-2">
                                        <button onclick="navigator.share ? navigator.share({title: '${event.title}', url: window.location.href}) : navigator.clipboard.writeText(window.location.href)" 
                                                class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                                            <i class="fas fa-share mr-2"></i>
                                            Share
                                        </button>
                                        <button onclick="navigator.clipboard.writeText(window.location.href)" 
                                                class="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm">
                                            <i class="fas fa-copy"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('app-event-view', EventView);
export default EventView; 