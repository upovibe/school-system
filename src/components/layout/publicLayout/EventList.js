import App from '@/core/App.js';

/**
 * Event List Component
 * 
 * Displays a list of events with filtering by status
 */
class EventList extends App {
    constructor() {
        super();
        this.set('events', []);
    }

    connectedCallback() {
        super.connectedCallback();
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
            if (cardStatus === status) {
                card.style.display = 'block';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

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

    openEventPage(slugOrId) {
        // Navigate to the event page using SPA router
        const eventUrl = `/public/community/events/${slugOrId}`;
        if (window.router) {
            window.router.navigate(eventUrl);
        } else {
            // Fallback to regular navigation if router is not available
            window.location.href = eventUrl;
        }
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

    // Helper function to normalize status for filtering
    normalizeStatus(status) {
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
    }

    // Helper function to format date
    formatDate(dateString) {
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
    }

    // Helper function to format time
    formatTime(timeString) {
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
    }

    render() {
        const events = this.get('events') || [];
        
        // Get colors from parent component or use defaults
        const primaryColor = this.get('primary_color') || '#3b82f6';
        const secondaryColor = this.get('secondary_color') || '#1f2937';

        return `
            <div class="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100">
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
                        <div class="max-h-96 overflow-y-auto mx-auto py-1 rounded-xl mt-5 space-y-4" id="events-list">
                            ${events.length > 0 ? events.map(event => {
                                const statusBadge = this.getStatusBadge(event.status);
                                const normalizedStatus = this.normalizeStatus(event.status);
                                return `
                                    <div class="bg-gray-50 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 border-l-4 border-[${primaryColor}] event-card cursor-pointer hover:bg-gray-100" 
                                         data-status="${normalizedStatus}" 
                                         data-event='${JSON.stringify(event).replace(/'/g, "&apos;")}'
                                         onclick="this.closest('event-list').openEventPage('${event.slug || event.id}')">
                                        <div class="flex items-start justify-between">
                                            <div class="flex-1 min-w-0">
                                                <h4 class="font-semibold text-[${secondaryColor}] mb-1 truncate capitalize" title="${event.title || 'Untitled Event'}">${event.title || 'Untitled Event'}</h4>
                                                <div class="flex items-center gap-4 text-sm text-gray-600">
                                                    <span class="flex items-center gap-1">
                                                        <i class="fas fa-calendar text-[${primaryColor}]"></i>
                                                        ${this.formatDate(event.start_date || event.event_date)}
                                                    </span>
                                                    <span class="flex items-center gap-1">
                                                        <i class="fas fa-clock text-[${primaryColor}]"></i>
                                                        ${this.formatTime(event.start_date || event.event_time)}
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
        `;
    }
}

customElements.define('event-list', EventList);
export default EventList; 