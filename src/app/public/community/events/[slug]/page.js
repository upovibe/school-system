import App from '@/core/App.js';
import { unescapeJsonFromAttribute } from '@/utils/jsonUtils.js';

// Load Quill CSS for content display
if (!document.querySelector('link[href*="quill"]')) {
    const link = document.createElement('link');
    link.href = 'https://cdn.quilljs.com/1.3.6/quill.snow.css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
}

/**
 * Individual Event Page
 * 
 * Displays detailed information for a specific event based on slug
 */
class EventPage extends App {
    constructor() {
        super();
        this.event = null;
        this.loading = true;
        this.error = null;
    }

    connectedCallback() {
        super.connectedCallback();
        this.loadEventData();
    }

    async loadEventData() {
        try {
            // Get slug from URL path
            const pathSegments = window.location.pathname.split('/');
            const slug = pathSegments[pathSegments.length - 1];
            
            if (!slug) {
                this.error = 'Event not found';
                this.loading = false;
                this.render();
                return;
            }

            // Fetch event data by slug
            const response = await fetch(`/api/events/slug/${slug}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    this.event = data.data;
                } else {
                    this.error = 'Event not found';
                }
            } else {
                this.error = 'Failed to load event';
            }
        } catch (error) {
            console.error('Error loading event:', error);
            this.error = 'Error loading event';
        }
        
        this.loading = false;
        this.render();
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
        if (this.loading) {
            return `
                <div class="min-h-screen bg-gray-50">
                    <div class="container mx-auto px-4 py-8">
                        <div class="flex items-center justify-center min-h-96">
                            <div class="text-center">
                                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                <p class="text-gray-600">Loading event...</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        if (this.error || !this.event) {
            return `
                <div class="min-h-screen bg-gray-50">
                    <div class="container mx-auto px-4 py-8">
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
                    </div>
                </div>
            `;
        }

        const statusBadge = this.getStatusBadge(this.event.status);

        return `
            <div class="min-h-screen bg-gray-50">
                <!-- Header -->
                <div class="bg-white shadow-sm border-b">
                    <div class="container mx-auto px-4 py-4">
                        <div class="flex items-center gap-4">
                            <a href="/public/community/events" 
                               class="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors">
                                <i class="fas fa-arrow-left"></i>
                                <span>Back to Events</span>
                            </a>
                            <div class="h-4 w-px bg-gray-300"></div>
                            <span class="text-gray-500">Event Details</span>
                        </div>
                    </div>
                </div>

                <div class="container mx-auto px-4 py-8">
                    <div class="max-w-4xl mx-auto">
                        <!-- Event Banner -->
                        ${this.event.banner_image ? `
                            <div class="relative w-full h-96 rounded-2xl overflow-hidden shadow-lg mb-8">
                                <img src="${this.getImageUrl(this.event.banner_image)}" 
                                     alt="${this.event.title}" 
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
                                        <h1 class="text-3xl font-bold text-gray-900 mb-2">${this.event.title || 'Untitled Event'}</h1>
                                        <p class="text-gray-600 text-lg">${this.event.subtitle || ''}</p>
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
                                            <p class="font-semibold text-gray-900">${this.formatDate(this.event.start_date || this.event.event_date)}</p>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-3">
                                        <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                            <i class="fas fa-clock text-green-600 text-xl"></i>
                                        </div>
                                        <div>
                                            <p class="text-sm text-gray-600">Time</p>
                                            <p class="font-semibold text-gray-900">${this.formatTime(this.event.start_date || this.event.event_time)}</p>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-3">
                                        <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                            <i class="fas fa-tag text-purple-600 text-xl"></i>
                                        </div>
                                        <div>
                                            <p class="text-sm text-gray-600">Category</p>
                                            <p class="font-semibold text-gray-900">${this.event.category || 'General'}</p>
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
                                        ${this.event.description ? `
                                            <div>
                                                <h3 class="text-xl font-semibold text-gray-900 mb-4">Description</h3>
                                                <div class="prose prose-lg max-w-none">
                                                    ${this.event.description}
                                                </div>
                                            </div>
                                        ` : ''}

                                        <!-- Content -->
                                        ${this.event.content ? `
                                            <div>
                                                <h3 class="text-xl font-semibold text-gray-900 mb-4">Details</h3>
                                                <div class="prose prose-lg max-w-none">
                                                    ${this.event.content}
                                                </div>
                                            </div>
                                        ` : ''}
                                    </div>

                                    <!-- Sidebar -->
                                    <div class="space-y-6">
                                        <!-- Location -->
                                        ${this.event.location ? `
                                            <div class="bg-gray-50 rounded-xl p-6">
                                                <h4 class="font-semibold text-gray-900 mb-3">Location</h4>
                                                <div class="flex items-start gap-3">
                                                    <i class="fas fa-map-marker-alt text-red-500 text-lg mt-1"></i>
                                                    <p class="text-gray-700">${this.event.location}</p>
                                                </div>
                                            </div>
                                        ` : ''}

                                        <!-- Additional Info -->
                                        <div class="bg-gray-50 rounded-xl p-6">
                                            <h4 class="font-semibold text-gray-900 mb-3">Event Information</h4>
                                            <div class="space-y-3">
                                                ${this.event.end_date ? `
                                                    <div class="flex items-center justify-between">
                                                        <span class="text-gray-600">End Date:</span>
                                                        <span class="font-medium">${this.formatDate(this.event.end_date)}</span>
                                                    </div>
                                                ` : ''}
                                                ${this.event.max_participants ? `
                                                    <div class="flex items-center justify-between">
                                                        <span class="text-gray-600">Max Participants:</span>
                                                        <span class="font-medium">${this.event.max_participants}</span>
                                                    </div>
                                                ` : ''}
                                                ${this.event.organizer ? `
                                                    <div class="flex items-center justify-between">
                                                        <span class="text-gray-600">Organizer:</span>
                                                        <span class="font-medium">${this.event.organizer}</span>
                                                    </div>
                                                ` : ''}
                                            </div>
                                        </div>

                                        <!-- Share Event -->
                                        <div class="bg-gray-50 rounded-xl p-6">
                                            <h4 class="font-semibold text-gray-900 mb-3">Share Event</h4>
                                            <div class="flex gap-2">
                                                <button onclick="navigator.share ? navigator.share({title: '${this.event.title}', url: window.location.href}) : navigator.clipboard.writeText(window.location.href)" 
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
                </div>
            </div>
        `;
    }
}

customElements.define('app-event-page', EventPage);
export default EventPage;