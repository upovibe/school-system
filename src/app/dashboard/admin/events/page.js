import App from '@/core/App.js';
import '@/components/ui/Card.js';
import '@/components/ui/Button.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Table.js';
import '@/components/ui/Skeleton.js';
import '@/components/ui/Dialog.js';
import '@/components/layout/adminLayout/EventSettingsModal.js';
import '@/components/layout/adminLayout/EventUpdateModal.js';
import '@/components/layout/adminLayout/EventViewModal.js';
import '@/components/layout/adminLayout/EventDeleteDialog.js';
import api from '@/services/api.js';

/**
 * Events Management Page
 * 
 * Displays events data using Table component
 */
class EventsPage extends App {
    constructor() {
        super();
        this.events = null;
        this.loading = false;
        this.showAddModal = false;
        this.showUpdateModal = false;
        this.showViewModal = false;
        this.showDeleteDialog = false;
        this.updateEventData = null;
        this.viewEventData = null;
        this.deleteEventData = null;
    }

    getHeaderCounts() {
        const events = this.get('events') || [];
        const total = events.length;
        const upcoming = events.filter(e => new Date(e.start_date) >= new Date()).length;
        const past = events.filter(e => new Date(e.end_date || e.start_date) < new Date()).length;
        const categories = new Set(events.map(e => e.category || 'Uncategorized')).size;
        return { total, upcoming, past, categories };
    }

    renderHeader() {
        const c = this.getHeaderCounts();
        return `
            <div class="space-y-8 mb-4">
                <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-5 text-white">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
                        <div>
                            <h1 class="text-2xl sm:text-3xl font-bold">Events</h1>
                            <p class="text-blue-100 text-base sm:text-lg">Manage school events and activities</p>
                        </div>
                        <div class="mt-4 sm:mt-0">
                            <div class="text-right">
                                <div class="text-xl sm:text-2xl font-bold">${c.total}</div>
                                <div class="text-blue-100 text-xs sm:text-sm">Total Events</div>
                            </div>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-6">
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-green-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-play-circle text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.upcoming}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Upcoming</div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-gray-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-history text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.past}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Past</div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-indigo-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-tags text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.categories}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Categories</div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-blue-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-database text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.total}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Records</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    connectedCallback() {
        super.connectedCallback();
        document.title = 'Events Management | School System';
        this.loadData();
        
        // Add event listeners for table events
        this.addEventListener('table-view', this.onView.bind(this));
        this.addEventListener('table-edit', this.onEdit.bind(this));
        this.addEventListener('table-delete', this.onDelete.bind(this));
        this.addEventListener('table-add', this.onAdd.bind(this));
        
        // Listen for success events to refresh data
        this.addEventListener('event-deleted', (event) => {
            // Remove the deleted event from the current data
            const deletedEventId = event.detail.eventId;
            const currentEvents = this.get('events') || [];
            const updatedEvents = currentEvents.filter(event => event.id !== deletedEventId);
            this.set('events', updatedEvents);
            this.updateTableData();
            
            // Close the delete dialog
            this.set('showDeleteDialog', false);
        });
        
        this.addEventListener('event-saved', (event) => {
            // Add the new event to the existing data
            const newEvent = event.detail.event;
            if (newEvent) {
                const currentEvents = this.get('events') || [];
                this.set('events', [...currentEvents, newEvent]);
                this.updateTableData();
                // Close the add modal
                this.set('showAddModal', false);
            } else {
                this.loadData();
            }
        });
        
        this.addEventListener('event-updated', (event) => {
            // Update the existing event in the data
            const updatedEvent = event.detail.event;
            if (updatedEvent) {
                const currentEvents = this.get('events') || [];
                const updatedEvents = currentEvents.map(event => 
                    event.id === updatedEvent.id ? updatedEvent : event
                );
                this.set('events', updatedEvents);
                this.updateTableData();
                // Close the update modal
                this.set('showUpdateModal', false);
            } else {
                this.loadData();
            }
        });
        
        // Listen for modal opened event to pass data
        this.addEventListener('modal-opened', (event) => {
            const modal = event.target;
            if (modal.tagName === 'EVENT-UPDATE-MODAL') {
                const updateEventData = this.get('updateEventData');
                if (updateEventData) {
                    modal.setEventData(updateEventData);
                }
            } else if (modal.tagName === 'EVENT-VIEW-MODAL') {
                const viewEventData = this.get('viewEventData');
                if (viewEventData) {
                    modal.setEventData(viewEventData);
                }
            }
        });
    }

    async loadData() {
        try {
            this.set('loading', true);
            
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Please log in to view data',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Load events data
            const eventsResponse = await api.withToken(token).get('/events');
            
            this.set('events', eventsResponse.data.data);
            this.set('loading', false);
            
        } catch (error) {
            console.error('❌ Error loading data:', error);
            this.set('loading', false);
            
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to load events data',
                variant: 'error',
                duration: 3000
            });
        }
    }

    // Action handlers
    onView(event) {
        const { detail } = event;
        const viewEvent = this.get('events').find(event => event.id === detail.row.id);
        if (viewEvent) {
            this.closeAllModals();
            this.set('viewEventData', viewEvent);
            this.set('showViewModal', true);
            setTimeout(() => {
                const viewModal = this.querySelector('event-view-modal');
                if (viewModal) {
                    viewModal.setEventData(viewEvent);
                }
            }, 0);
        }
    }

    onEdit(event) {
        const { detail } = event;
        const editEvent = this.get('events').find(event => event.id === detail.row.id);
        if (editEvent) {
            this.closeAllModals();
            this.set('updateEventData', editEvent);
            this.set('showUpdateModal', true);
            setTimeout(() => {
                const updateModal = this.querySelector('event-update-modal');
                if (updateModal) {
                    updateModal.setEventData(editEvent);
                }
            }, 0);
        }
    }

    onDelete(event) {
        const { detail } = event;
        const deleteEvent = this.get('events').find(event => event.id === detail.row.id);
        if (deleteEvent) {
            this.closeAllModals();
            this.set('deleteEventData', deleteEvent);
            this.set('showDeleteDialog', true);
            setTimeout(() => {
                const deleteDialog = this.querySelector('event-delete-dialog');
                if (deleteDialog) {
                    deleteDialog.setEventData(deleteEvent);
                }
            }, 0);
        }
    }

    onAdd(event) {
        this.closeAllModals();
        this.set('showAddModal', true);
    }

    onRefresh(event) {
        this.loadData();
    }

    // Update table data without full page reload
    updateTableData() {
        const events = this.get('events');
        if (!events) return;

        // Prepare table data
        const tableData = events.map((event, index) => ({
            id: event.id, // Keep ID for internal use
            index: index + 1, // Add index number for display
            title: event.title,
            category: event.category,
            start_date: new Date(event.start_date).toLocaleDateString(),
            end_date: new Date(event.end_date).toLocaleDateString(),
            location: event.location || 'TBD',
            status: event.status,
            created: new Date(event.created_at).toLocaleString(),
            updated: new Date(event.updated_at).toLocaleString(),
        }));

        // Find the table component and update its data
        const tableComponent = this.querySelector('ui-table');
        if (tableComponent) {
            tableComponent.setAttribute('data', JSON.stringify(tableData));
        }
    }

    // Close all modals and dialogs
    closeAllModals() {
        this.set('showAddModal', false);
        this.set('showUpdateModal', false);
        this.set('showViewModal', false);
        this.set('showDeleteDialog', false);
        this.set('updateEventData', null);
        this.set('viewEventData', null);
        this.set('deleteEventData', null);
    }

    render() {
        const events = this.get('events');
        const loading = this.get('loading');
        const showAddModal = this.get('showAddModal');
        const showUpdateModal = this.get('showUpdateModal');
        const showViewModal = this.get('showViewModal');
        const showDeleteDialog = this.get('showDeleteDialog');
        
        const tableData = events ? events.map((event, index) => ({
            id: event.id, // Keep ID for internal use
            index: index + 1, // Add index number for display
            title: event.title,
            category: event.category,
            start_date: new Date(event.start_date).toLocaleDateString(),
            end_date: new Date(event.end_date).toLocaleDateString(),
            location: event.location || 'TBD',
            status: event.status,
            created: new Date(event.created_at).toLocaleString(),
            updated: new Date(event.updated_at).toLocaleString(),
        })) : [];

        const tableColumns = [
            { key: 'index', label: 'No.' },
            { key: 'title', label: 'Title' },
            { key: 'category', label: 'Category' },
            { key: 'start_date', label: 'Start Date' },
            { key: 'end_date', label: 'End Date' },
            { key: 'location', label: 'Location' },
            { key: 'status', label: 'Status' },
            { key: 'updated', label: 'Updated' }
        ];
        
        return `
            ${this.renderHeader()}
            <div class="bg-white rounded-lg shadow-lg p-4">
                ${loading ? `
                    <!-- Simple Skeleton Loading -->
                    <div class="space-y-4">
                        <ui-skeleton class="h-24 w-full"></ui-skeleton>
                        <ui-skeleton class="h-24 w-full"></ui-skeleton>
                        <ui-skeleton class="h-24 w-full"></ui-skeleton>
                    </div>
                ` : `
                    <!-- Events Table Section -->
                    <div class="mb-8">
                        <ui-table 
                            title="Events Management"
                            data='${JSON.stringify(tableData)}'
                            columns='${JSON.stringify(tableColumns)}'
                            sortable
                            searchable
                            search-placeholder="Search events..."
                            pagination
                            page-size="50"
                            action
                            addable
                            refresh
                            print
                            bordered
                            striped
                            class="w-full">
                        </ui-table>
                    </div>
                `}
            </div>
            
            <!-- Modals and Dialogs -->
            <event-settings-modal ${showAddModal ? 'open' : ''}></event-settings-modal>
            <event-update-modal ${showUpdateModal ? 'open' : ''}></event-update-modal>
            <event-view-modal id="view-modal" ${showViewModal ? 'open' : ''}></event-view-modal>
            <event-delete-dialog ${showDeleteDialog ? 'open' : ''}></event-delete-dialog>
        `;
    }
}

customElements.define('app-events-page', EventsPage);
export default EventsPage;
