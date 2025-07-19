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
 * Events Section Component
 * 
 * Displays events information with content from the events page
 */
class EventsSection extends App {
    constructor() {
        super();
    }

    connectedCallback() {
        super.connectedCallback();
        this.loadDataFromProps();
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

        // Load events data from API
        this.loadEventsData();
    }

    async loadEventsData() {
        try {
            const response = await fetch('/api/events/active');
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    this.set('events', data.data);
                } else {
                    this.set('events', []);
                }
            } else {
                console.error('Failed to fetch events:', response.statusText);
                this.set('events', []);
            }
        } catch (error) {
            console.error('Error fetching events:', error);
            this.set('events', []);
        }
        
        // Render with the loaded data
        this.render();
        
        // Add event listeners after render
        this.setupTabFiltering();
    }

    setupTabFiltering() {
        // Wait for the DOM to be ready
        setTimeout(() => {
            const tabsContainer = this.querySelector('#events-tabs');
            if (!tabsContainer) return;

            // Listen for tab changes using the ui-tabs component's internal events
            tabsContainer.addEventListener('click', (event) => {
                const tabButton = event.target.closest('ui-tab button');
                if (tabButton) {
                    const tabItem = tabButton.closest('ui-tab');
                    const selectedTab = tabItem.getAttribute('value');
                    this.filterEventsByStatus(selectedTab);
                }
            });

            // Also listen for the tab-changed event if it exists
            tabsContainer.addEventListener('tab-changed', (event) => {
                const selectedTab = event.detail.value;
                this.filterEventsByStatus(selectedTab);
            });

            // Initial filter (show upcoming by default)
            this.filterEventsByStatus('upcoming');
        }, 100);
    }

    filterEventsByStatus(status) {
        const eventCards = this.querySelectorAll('.event-card');
        const eventsList = this.querySelector('#events-list');
        
        if (!eventsList) return;

        let visibleCount = 0;

        eventCards.forEach(card => {
            const cardStatus = card.getAttribute('data-status');
            console.log(`Card status: ${cardStatus}, Filtering for: ${status}`); // Debug log
            if (cardStatus === status) {
                card.style.display = 'block';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        console.log(`Visible count for ${status}: ${visibleCount}`); // Debug log

        // Show/hide empty state message
        const emptyState = eventsList.querySelector('.text-center');
        if (emptyState) {
            emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
        }

        // If no events match the status, show appropriate message
        if (visibleCount === 0) {
            const statusText = status.charAt(0).toUpperCase() + status.slice(1);
            if (!emptyState) {
                const newEmptyState = document.createElement('div');
                newEmptyState.className = 'text-center py-8 text-gray-500';
                newEmptyState.innerHTML = `
                    <i class="fas fa-calendar-times text-2xl mb-2"></i>
                    <p>No ${status} events</p>
                `;
                eventsList.appendChild(newEmptyState);
            } else {
                emptyState.innerHTML = `
                    <i class="fas fa-calendar-times text-2xl mb-2"></i>
                    <p>No ${status} events</p>
                `;
            }
        }
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

    // Helper method to parse banner images from various formats
    getBannerImages(pageData) {
        if (!pageData || !pageData.banner_image) {
            return [];
        }

        let bannerImages = pageData.banner_image;

        // If it's a string, try to parse as JSON
        if (typeof bannerImages === 'string') {
            try {
                const parsed = JSON.parse(bannerImages);
                if (Array.isArray(parsed)) {
                    bannerImages = parsed;
                } else {
                    bannerImages = [bannerImages];
                }
            } catch (e) {
                // If parsing fails, treat as single path
                bannerImages = [bannerImages];
            }
        } else if (!Array.isArray(bannerImages)) {
            // If it's not an array, wrap in array
            bannerImages = [bannerImages];
        }

        // Filter out empty/null values
        return bannerImages.filter(img => img && img.trim() !== '');
    }

    render() {
        const pageData = this.get('pageData');
        const events = this.get('events') || [];
        
        // Get colors from state
        const primaryColor = this.get('primary_color');
        const secondaryColor = this.get('secondary_color');
        const accentColor = this.get('accent_color');
        const textColor = this.get('text_color');
        const hoverPrimary = this.get('hover_primary');
        const hoverSecondary = this.get('hover_secondary');
        const hoverAccent = this.get('hover_accent');

        // Only render if there's content
        if (!pageData?.content || pageData.content.trim() === '') {
            return '';
        }

        // Helper function to get status badge styling
        const getStatusBadge = (status) => {
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
        };

        // Helper function to normalize status for filtering
        const normalizeStatus = (status) => {
            if (!status) return 'unknown';
            const normalized = status.toLowerCase().trim();
            
            // Map common variations to standard statuses
            switch (normalized) {
                case 'upcoming':
                case 'scheduled':
                case 'planned':
                    return 'upcoming';
                case 'ongoing':
                case 'in progress':
                case 'active':
                    return 'ongoing';
                case 'completed':
                case 'finished':
                case 'done':
                    return 'completed';
                case 'cancelled':
                case 'canceled':
                case 'cancelled':
                    return 'cancelled';
                default:
                    return normalized;
            }
        };

        // Helper function to format date
        const formatDate = (dateString) => {
            if (!dateString) return 'TBD';
            try {
                // Handle different date formats from API
                const date = new Date(dateString);
                if (isNaN(date.getTime())) {
                    return dateString;
                }
                return date.toLocaleDateString();
            } catch (error) {
                return dateString;
            }
        };

        // Helper function to format time
        const formatTime = (timeString) => {
            if (!timeString) return 'TBD';
            try {
                // If it's a full datetime string, extract time
                if (timeString.includes(' ')) {
                    const timePart = timeString.split(' ')[1];
                    return timePart.substring(0, 5); // Return HH:MM format
                }
                return timeString;
            } catch (error) {
                return timeString;
            }
        };

        return `
            <!-- Events Section -->
            <section class="mx-auto py-10">
                <!-- Banner Image at Top -->
                ${this.getBannerImages(pageData).length > 0 ? `
                    <div class="mb-8">
                        <div class="relative w-full h-96">
                            <img src="${this.getImageUrl(this.getBannerImages(pageData)[0])}" 
                                 alt="Events Banner" 
                                 class="w-full h-full object-cover rounded-3xl shadow-lg"
                                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                            <div class="absolute inset-0 hidden items-center justify-center bg-gray-50 rounded-3xl">
                                <div class="text-center">
                                    <i class="fas fa-image text-gray-400 text-4xl mb-2"></i>
                                    <p class="text-gray-500 font-medium">Events banner image</p>
                                </div>
                            </div>
                            <!-- Dark gradient overlay from bottom to top -->
                            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent rounded-3xl"></div>
                        </div>
                    </div>
                ` : ''}


                
                <div class="flex flex-col lg:flex-row lg:items-start gap-8">
                    <!-- Content Container -->
                    <div class="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100 flex-1 w-full">
                        <div class="p-5 lg:p-12">
                            <div class="content-preview text-lg leading-relaxed">
                                ${pageData.content}
                            </div>
                            
                            ${window.location.pathname !== '/public/community/events' ? `
                                <div class="mt-8">
                                    <a href="/public/community/events" 
                                       class="inline-flex items-center justify-center gap-2 px-6 py-1.5 bg-[${primaryColor}] text-[${textColor}] font-semibold rounded-lg hover:bg-[${accentColor}] transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 shadow-lg hover:shadow-xl group">
                                        View All Events
                                        <i class="fas fa-arrow-right transition-transform duration-300 group-hover:translate-x-1"></i>
                                    </a>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Events List Container -->
                    <div class="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100 lg:w-3/6 xl:w-2/6">
                        <div class="p-5 lg:p-8">
                            <div class="flex items-center gap-2 mb-6">
                                <i class="fas fa-calendar-alt text-[${primaryColor}] text-xl"></i>
                                <h3 class="text-xl font-semibold text-[${secondaryColor}]">All Events</h3>
                            </div>
                            
                            <!-- Tabs Component -->
                            <ui-tabs class="w-full" id="events-tabs">
                                <ui-tab-list class="mb-6">
                                    <ui-tab value="upcoming">Upcoming</ui-tab>
                                    <ui-tab value="ongoing">Ongoing</ui-tab>
                                    <ui-tab value="completed">Completed</ui-tab>
                                    <ui-tab value="cancelled">Cancelled</ui-tab>
                                </ui-tab-list>
                                
                                <!-- Single Events List Container -->
                                <div class="max-h-96 overflow-y-auto mx-auto p-5 pr-1 rounded-xl border border-gray-200 mt-5 space-y-4" id="events-list">
                                    ${events.length > 0 ? events.map(event => {
                                        const statusBadge = getStatusBadge(event.status);
                                        const normalizedStatus = normalizeStatus(event.status);
                                        return `
                                            <div class="bg-gray-50 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 border-l-4 border-[${primaryColor}] event-card" data-status="${normalizedStatus}">
                                                <div class="flex items-start justify-between">
                                                    <div class="flex-1 min-w-0">
                                                        <h4 class="font-semibold text-[${secondaryColor}] mb-1 truncate" title="${event.title || 'Untitled Event'}">${event.title || 'Untitled Event'}</h4>
                                                        <div class="flex items-center gap-4 text-sm text-gray-600">
                                                            <span class="flex items-center gap-1">
                                                                <i class="fas fa-calendar text-[${primaryColor}]"></i>
                                                                ${formatDate(event.start_date || event.event_date)}
                                                            </span>
                                                            <span class="flex items-center gap-1">
                                                                <i class="fas fa-clock text-[${primaryColor}]"></i>
                                                                ${formatTime(event.start_date || event.event_time)}
                                                            </span>
                                                        </div>
                                                        <div class="mt-2">
                                                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[${primaryColor}] bg-opacity-10 text-[${primaryColor}]">
                                                                <i class="fas fa-tag mr-1"></i>
                                                                ${event.category || 'General'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div class="ml-4 flex-shrink-0">
                                                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusBadge.class}">
                                                            <i class="${statusBadge.icon} mr-1 text-xs"></i>
                                                            ${statusBadge.text}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        `;
                                    }).join('') : `
                                        <div class="text-center py-8 text-gray-500">
                                            <i class="fas fa-calendar-times text-2xl mb-2"></i>
                                            <p>No events available</p>
                                        </div>
                                    `}
                                </div>
                            </ui-tabs>
                        </div>
                    </div>
                </div>
                

            </section>
        `;
    }
}

customElements.define('events-section', EventsSection);
export default EventsSection; 