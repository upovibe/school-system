import App from '@/core/App.js';
import '@/components/ui/Table.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Skeleton.js';
import '@/components/ui/Tabs.js';
import '@/components/layout/adminLayout/AnnouncementAddModal.js';
import '@/components/layout/adminLayout/AnnouncementUpdateModal.js';
import '@/components/layout/adminLayout/AnnouncementViewModal.js';
import api from '@/services/api.js';

/**
 * Admin Announcements Management Page
 * 
 * Displays announcements data using Table component (read-only for now)
 */
class AdminAnnouncementsPage extends App {
    constructor() {
        super();
        this.announcements = null;
        this.loading = false;
        this.activeTab = 'table'; // Default active tab
        this.activePreviewTab = 'pinned'; // Default active preview tab
        this.showAddModal = false;
        this.showUpdateModal = false;
        this.showViewModal = false;
        this.updateAnnouncementData = null;
        this.viewAnnouncementData = null;
    }

    // Summary counts for header
    getHeaderCounts() {
        const announcements = this.get('announcements') || [];
        const total = announcements.length;
        let active = 0;
        let inactive = 0;
        let pinned = 0;
        let highPriority = 0;
        
        announcements.forEach((announcement) => {
            const isActive = Number(announcement.is_active) === 1;
            const isPinned = Number(announcement.is_pinned) === 1;
            const isHighPriority = announcement.priority === 'high';
            
            if (isActive) active += 1; else inactive += 1;
            if (isPinned) pinned += 1;
            if (isHighPriority) highPriority += 1;
        });
        
        return { total, active, inactive, pinned, highPriority };
    }

    // Gradient header consistent with other pages
    renderHeader() {
        const c = this.getHeaderCounts();
        
        return `
            <div class="space-y-8 mb-4">
                <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-5 text-white">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
                        <div>
                            <div class="flex items-center gap-2">
                                <h1 class="text-2xl sm:text-3xl font-bold">Announcements</h1>
                                <button class="text-white/90 mt-2 hover:text-white transition-colors" data-action="show-announcements-info" title="About Announcements">
                                    <i class="fas fa-question-circle text-lg"></i>
                                </button>
                            </div>
                            <p class="text-blue-100 text-base sm:text-lg">Manage school-wide announcements and communications</p>
                        </div>
                        <div class="mt-4 sm:mt-0">
                            <div class="text-right">
                                <div class="text-xl sm:text-2xl font-bold">${c.total}</div>
                                <div class="text-blue-100 text-xs sm:text-sm">Total Announcements</div>
                            </div>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-green-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-check text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.active}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Active</div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-yellow-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-pause-circle text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.inactive}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Inactive</div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-blue-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-thumbtack text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.pinned}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Pinned</div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-red-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-exclamation-triangle text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.highPriority}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">High Priority</div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-purple-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-bullhorn text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.total}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Total</div>
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
        document.title = 'Announcements Management | School System';
        this.loadData();
        this.addEventListener('click', this.handleHeaderActions.bind(this));
        this.addEventListener('tab-change', this.handleTabChange.bind(this));
        
        // Add event listeners for table events
        this.addEventListener('table-add', this.onAdd.bind(this));
        this.addEventListener('table-edit', this.onEdit.bind(this));
        this.addEventListener('table-view', this.onView.bind(this));
        
        // Listen for success events to refresh data
        this.addEventListener('announcement-saved', (event) => {
            // Add the new announcement to the existing data
            const newAnnouncement = event.detail.announcement;
            if (newAnnouncement) {
                const currentAnnouncements = this.get('announcements') || [];
                this.set('announcements', [...currentAnnouncements, newAnnouncement]);
                this.updateTableData();
                // Close the add modal
                this.set('showAddModal', false);
            } else {
                this.loadData();
            }
        });

        this.addEventListener('announcement-updated', (event) => {
            // Update the existing announcement in the data
            const updatedAnnouncement = event.detail.announcement;
            if (updatedAnnouncement) {
                const currentAnnouncements = this.get('announcements') || [];
                const updatedAnnouncements = currentAnnouncements.map(announcement => 
                    announcement.id === updatedAnnouncement.id ? updatedAnnouncement : announcement
                );
                this.set('announcements', updatedAnnouncements);
                this.updateTableData();
                // Close the update modal
                this.set('showUpdateModal', false);
            } else {
                this.loadData();
            }
        });
    }

    handleHeaderActions(event) {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        const action = button.getAttribute('data-action');
        if (action === 'show-announcements-info') {
            this.showAnnouncementsInfo();
        }
    }

    handleTabChange(event) {
        const { detail } = event;
        if (detail && detail.value) {
            this.activeTab = detail.value;
            // The tab content will automatically update through the render method
        }
    }

    onAdd(event) {
        // Close any open modals first
        this.set('showAddModal', true);
    }

    onView(event) {
        const { detail } = event;
        const viewAnnouncement = this.get('announcements').find(announcement => announcement.id === detail.row.id);
        if (viewAnnouncement) {
            // Close any open modals first
            this.set('showAddModal', false);
            this.set('showUpdateModal', false);
            this.set('viewAnnouncementData', viewAnnouncement);
            this.set('showViewModal', true);
            
            // Use requestAnimationFrame for better performance instead of setTimeout
            requestAnimationFrame(() => {
                const viewModal = this.querySelector('announcement-view-modal');
                if (viewModal) {
                    viewModal.setAnnouncementData(viewAnnouncement);
                }
            });
        }
    }

    onEdit(event) {
        const { detail } = event;
        const editAnnouncement = this.get('announcements').find(announcement => announcement.id === detail.row.id);
        if (editAnnouncement) {
            // Close any open modals first
            this.set('showAddModal', false);
            this.set('showUpdateModal', false);
            this.set('showViewModal', false);
            this.set('updateAnnouncementData', editAnnouncement);
            this.set('showUpdateModal', true);
            
            // Use requestAnimationFrame for better performance instead of setTimeout
            requestAnimationFrame(async () => {
                const updateModal = this.querySelector('announcement-update-modal');
                if (updateModal) {
                    await updateModal.setAnnouncementData(editAnnouncement);
                }
            });
        }
    }

    showAnnouncementsInfo() {
        const dialog = document.createElement('ui-dialog');
        dialog.setAttribute('open', '');
        dialog.innerHTML = `
            <div slot="header" class="flex items-center">
                <i class="fas fa-bullhorn text-blue-500 mr-2"></i>
                <span class="font-semibold">About Announcements</span>
            </div>
            <div slot="content" class="space-y-4">
                <div>
                    <h4 class="font-semibold text-gray-900 mb-2">What are Announcements?</h4>
                    <p class="text-gray-700">Announcements are school-wide communications that can be targeted to specific audiences like students, teachers, parents, or specific classes.</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Target Audience</span>
                        <span class="text-sm text-gray-600">all, students, teachers, admin, cashier, specific_class</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Priority Levels</span>
                        <span class="text-sm text-gray-600">low, normal, high, urgent</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Announcement Types</span>
                        <span class="text-sm text-gray-600">general, academic, event, policy, emergency</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Pinning</span>
                        <span class="text-sm text-gray-600">Important announcements can be pinned to stay at the top</span>
                    </div>
                </div>
                <div class="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p class="text-sm text-blue-800">
                        <i class="fas fa-info-circle mr-1"></i>
                        Announcements help keep the school community informed about important updates, events, and policies.
                    </p>
                </div>
            </div>
            <div slot="footer" class="flex justify-end">
                <ui-button color="primary" onclick="this.closest('ui-dialog').close()">Got it</ui-button>
            </div>
        `;
        document.body.appendChild(dialog);
    }

    async loadData() {
        try {
            this.set('loading', true);
            
            // Get the auth token
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

            // Load announcements data
            const response = await api.withToken(token).get('/announcements');
            const rawAnnouncements = response?.data?.data || [];
            
            // Data loaded
            this.set('announcements', rawAnnouncements);
            this.set('loading', false);
            
            // Update table data after render
            this.updateTableData();
            
        } catch (error) {
            this.set('loading', false);
            
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to load announcements data',
                variant: 'error',
                duration: 3000
            });
        }
    }

    // Prepare table data for announcements with safe content handling
    prepareTableData(announcements) {
        if (!announcements || !Array.isArray(announcements)) return [];
        
        return announcements.map((announcement, index) => {
            // Truncate content to prevent JSON issues
            const safeContent = announcement.content ? 
                (announcement.content.length > 100 ? 
                    announcement.content.substring(0, 100) + '...' : 
                    announcement.content) : 'No content';
            
            return {
                id: announcement.id,
                index: index + 1,
                title: announcement.title || 'No Title',
                content: safeContent,
                target_audience: announcement.target_audience || 'all',
                announcement_type: announcement.announcement_type || 'general',
                priority: announcement.priority || 'normal',
                is_active: announcement.is_active ? 'Active' : 'Inactive',
                is_pinned: announcement.is_pinned ? 'Pinned' : 'Not Pinned',
                created_by: announcement.creator_name || 'Unknown',
                created: announcement.created_at ? new Date(announcement.created_at).toLocaleDateString() : 'N/A',
                updated: announcement.updated_at ? new Date(announcement.updated_at).toLocaleDateString() : 'N/A'
            };
        });
    }

    updateTableData() {
        const announcements = this.get('announcements');
        if (!announcements) return;

        // Prepare table data for announcements with safe content handling
        const tableData = this.prepareTableData(announcements);

        // Find the table component and update its data
        const tableComponent = this.querySelector('ui-table');
        if (tableComponent) {
            tableComponent.setAttribute('data', JSON.stringify(tableData));
        }
    }

    // Render announcement card for preview tab
    renderAnnouncementCard(announcement, index) {
        const isPinned = Number(announcement.is_pinned) === 1;
        const isHighPriority = announcement.priority === 'high';
        const isUrgent = announcement.priority === 'urgent';
        const isAdminSpecific = announcement.target_audience === 'admin';
        
        // Priority badge styling
        let priorityBadge = '';
        if (isUrgent) {
            priorityBadge = '<span class="inline-flex items-center text-nowrap px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Urgent</span>';
        } else if (isHighPriority) {
            priorityBadge = '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 text-nowrap">High Priority</span>';
        }
        
        // Audience label
        const audienceLabel = isAdminSpecific ? 'Admin-Specific' : 'General';
        const audienceColor = isAdminSpecific ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';
        
        // Status indicator
        const statusColor = Number(announcement.is_active) === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
        const statusText = Number(announcement.is_active) === 1 ? 'Active' : 'Inactive';
        
        return `
            <div class="bg-white rounded-lg shadow-md border-l-4 ${isPinned ? 'border-l-yellow-500' : isHighPriority ? 'border-l-orange-500' : isUrgent ? 'border-l-red-500' : 'border-l-blue-500'} p-6 mb-6 hover:shadow-lg transition-shadow">
                ${isPinned ? `
                    <div class="flex items-center mb-3">
                        <i class="fas fa-thumbtack text-yellow-500 mr-2"></i>
                        <span class="text-yellow-700 text-sm font-medium">Pinned Announcement</span>
                    </div>
                ` : ''}
                
                <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2">
                            <h3 class="text-xl font-bold text-gray-900">${announcement.title || 'No Title'}</h3>
                            ${priorityBadge}
                        </div>
                        <div class="flex flex-wrap items-center gap-2 mb-3">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${audienceColor}">
                                <i class="fas ${isAdminSpecific ? 'fa-user-shield' : 'fa-users'} mr-1"></i>
                                ${audienceLabel}
                            </span>
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}">
                                <i class="fas fa-circle mr-1 text-xs"></i>
                                ${statusText}
                            </span>
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                <i class="fas fa-tag mr-1"></i>
                                ${announcement.announcement_type || 'General'}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="prose max-w-none">
                    <div class="text-gray-700 leading-relaxed whitespace-pre-wrap">${announcement.content || 'No content available'}</div>
                </div>
                
                <div class="mt-4 pt-4 border-t border-gray-200">
                    <div class="flex items-center justify-between text-sm text-gray-500">
                        <div class="text-left">
                            <span>By: <span class="font-medium text-gray-700">${announcement.creator_name || 'Unknown'}</span></span>
                        </div>
                        <div class="text-right">
                            <div>Created: ${announcement.created_at ? new Date(announcement.created_at).toLocaleDateString() : 'N/A'}</div>
                            ${announcement.updated_at && announcement.updated_at !== announcement.created_at ? 
                                `<div>Updated: ${new Date(announcement.updated_at).toLocaleDateString()}</div>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Get announcements by type for preview tabs (only current user's announcements)
    getAnnouncementsByType(type) {
        const announcements = this.get('announcements') || [];
        const currentUserId = this.getCurrentUserId();
        
        // Filter to show only current user's announcements in preview tabs
        const myAnnouncements = announcements.filter(a => a.created_by == currentUserId);
        
        switch (type) {
            case 'pinned':
                return myAnnouncements.filter(a => Number(a.is_pinned) === 1);
            case 'general':
                return myAnnouncements.filter(a => 
                    a.announcement_type === 'general' || 
                    !a.announcement_type || 
                    a.announcement_type === ''
                );
            case 'academic':
                return myAnnouncements.filter(a => 
                    a.announcement_type === 'academic' || 
                    a.announcement_type === 'exam' || 
                    a.announcement_type === 'assignment' ||
                    a.announcement_type === 'grade'
                );
            case 'events':
                return myAnnouncements.filter(a => 
                    a.announcement_type === 'event' || 
                    a.announcement_type === 'activity' || 
                    a.announcement_type === 'celebration'
                );
            case 'reminders':
                return myAnnouncements.filter(a => 
                    a.announcement_type === 'reminder' || 
                    a.announcement_type === 'notice' || 
                    a.announcement_type === 'update'
                );
            case 'emergency':
                return myAnnouncements.filter(a => 
                    a.announcement_type === 'emergency' || 
                    a.priority === 'urgent'
                );
            default:
                return myAnnouncements;
        }
    }

    // Get current user ID from localStorage
    getCurrentUserId() {
        try {
            const userData = localStorage.getItem('userData');
            if (userData) {
                const parsed = JSON.parse(userData);
                return parsed.id || null;
            }
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
        return null;
    }

    // Get tab counts for preview tabs
    getPreviewTabCounts() {
        const announcements = this.get('announcements') || [];
        return {
            pinned: this.getAnnouncementsByType('pinned').length,
            general: this.getAnnouncementsByType('general').length,
            academic: this.getAnnouncementsByType('academic').length,
            events: this.getAnnouncementsByType('events').length,
            reminders: this.getAnnouncementsByType('reminders').length,
            emergency: this.getAnnouncementsByType('emergency').length
        };
    }

    // Get tab icon
    getPreviewTabIcon(type) {
        const icons = {
            'pinned': 'fa-thumbtack',
            'general': 'fa-bullhorn',
            'academic': 'fa-graduation-cap',
            'events': 'fa-calendar-alt',
            'reminders': 'fa-bell',
            'emergency': 'fa-exclamation-triangle'
        };
        return icons[type] || 'fa-bullhorn';
    }

    // Get tab label
    getPreviewTabLabel(type) {
        const labels = {
            'pinned': 'Pinned',
            'general': 'General',
            'academic': 'Academic',
            'events': 'Events',
            'reminders': 'Reminders',
            'emergency': 'Emergency'
        };
        return labels[type] || 'General';
    }

    // Render content for each preview tab
    renderPreviewTabContent(type, announcements) {
        const announcementsInTab = this.getAnnouncementsByType(type);
        
        if (announcementsInTab.length === 0) {
            return `
                <div class="text-center py-12">
                    <div class="mx-auto h-24 w-24 text-gray-300 mb-4">
                        <i class="fas ${this.getPreviewTabIcon(type)} text-6xl"></i>
                    </div>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">No ${this.getPreviewTabLabel(type)} Announcements</h3>
                    <p class="text-gray-500">There are no ${this.getPreviewTabLabel(type).toLowerCase()} announcements available at the moment.</p>
                    <p class="text-gray-400 text-sm mt-1">Check back later for updates.</p>
                </div>
            `;
        }
        
        return `
            <div class="space-y-6">
                ${announcementsInTab.map((announcement, index) => this.renderAnnouncementCard(announcement, index)).join('')}
            </div>
        `;
    }

    render() {
        const announcements = this.get('announcements');
        const loading = this.get('loading');
        const showAddModal = this.get('showAddModal');
        const showUpdateModal = this.get('showUpdateModal');
        const showViewModal = this.get('showViewModal');
        
        // As admin, show ALL announcements regardless of target audience
        const adminAnnouncements = announcements || [];
        
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
                    <!-- Tabs Section -->
                    <ui-tabs>
                        <ui-tab-list>
                            <ui-tab value="table">Table</ui-tab>
                            <ui-tab value="preview">Preview</ui-tab>
                        </ui-tab-list>
                        
                        <!-- Table Tab Panel -->
                        <ui-tab-panel value="table">
                            <div class="mb-8">
                                <ui-table 
                                    title="Announcements Database"
                                    data='${JSON.stringify(this.prepareTableData(adminAnnouncements))}'
                                    columns='${JSON.stringify([
                                        { key: 'index', label: 'No.', html: false },
                                        { key: 'title', label: 'Title' },
                                        { key: 'content', label: 'Content' },
                                        { key: 'target_audience', label: 'Target Audience' },
                                        { key: 'announcement_type', label: 'Type' },
                                        { key: 'priority', label: 'Priority' },
                                        { key: 'is_active', label: 'Status' },
                                        { key: 'is_pinned', label: 'Pinned' },
                                        { key: 'created_by', label: 'Created By' },
                                        { key: 'updated', label: 'Updated' }
                                    ])}'
                                    sortable
                                    searchable
                                    search-placeholder="Search announcements..."
                                    pagination
                                    page-size="50"
                                    action
                                    addable
                                    print
                                    refresh
                                    bordered
                                    striped
                                    class="w-full">
                                </ui-table>
                            </div>
                        </ui-tab-panel>
                        
                        <!-- Preview Tab Panel -->
                        <ui-tab-panel value="preview">
                            <div class="space-y-6">
                                                                 <div class="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                                     <h3 class="text-lg font-semibold text-gray-900">My Announcements Preview</h3>
                                     <div class="ml-auto flex items-center space-x-4">
                                         <div class="text-sm text-gray-500">
                                             ${this.getCurrentUserId() ? `${this.getAnnouncementsByType('all').length} of my announcements` : '0 of my announcements'}
                                         </div>
                                     </div>
                                 </div>
                                
                                ${adminAnnouncements && adminAnnouncements.length > 0 ? `
                                    <!-- Preview Tabs Interface -->
                                    <div class="rounded-xl overflow-hidden">                    
                                        <div class="pt-4">
                                            <ui-tabs value="pinned">
                                                <ui-tab-list class="flex items-center justify-center">
                                                    <ui-tab value="pinned" selected>
                                                        <i class="fas fa-thumbtack text-yellow-600 text-lg lg:text-base"></i>
                                                        <span class="hidden lg:inline ml-1 font-medium">Pinned (${this.getPreviewTabCounts().pinned})</span>
                                                    </ui-tab>
                                                    <ui-tab value="general">
                                                        <i class="fas fa-bullhorn text-blue-600 text-lg lg:text-base"></i>
                                                        <span class="hidden lg:inline ml-1 font-medium">General (${this.getPreviewTabCounts().general})</span>
                                                    </ui-tab>
                                                    <ui-tab value="academic">
                                                        <i class="fas fa-graduation-cap text-green-600 text-lg lg:text-base"></i>
                                                        <span class="hidden lg:inline ml-1 font-medium">Academic (${this.getPreviewTabCounts().academic})</span>
                                                    </ui-tab>
                                                    <ui-tab value="events">
                                                        <i class="fas fa-calendar-alt text-purple-600 text-lg lg:text-base"></i>
                                                        <span class="hidden lg:inline ml-1 font-medium">Events (${this.getPreviewTabCounts().events})</span>
                                                    </ui-tab>
                                                    <ui-tab value="reminders">
                                                        <i class="fas fa-bell text-amber-600 text-lg lg:text-base"></i>
                                                        <span class="hidden lg:inline ml-1 font-medium">Reminders (${this.getPreviewTabCounts().reminders})</span>
                                                    </ui-tab>
                                                    <ui-tab value="emergency">
                                                        <i class="fas fa-exclamation-triangle text-red-600 text-lg lg:text-base"></i>
                                                        <span class="hidden lg:inline ml-1 font-medium">Emergency (${this.getPreviewTabCounts().emergency})</span>
                                                    </ui-tab>
                                                </ui-tab-list>
                                                
                                                <!-- Pinned Tab -->
                                                <ui-tab-panel value="pinned">
                                                    ${this.renderPreviewTabContent('pinned', adminAnnouncements)}
                                                </ui-tab-panel>
                                                
                                                <!-- General Tab -->
                                                <ui-tab-panel value="general">
                                                    ${this.renderPreviewTabContent('general', adminAnnouncements)}
                                                </ui-tab-panel>
                                                
                                                <!-- Academic Tab -->
                                                <ui-tab-panel value="academic">
                                                    ${this.renderPreviewTabContent('academic', adminAnnouncements)}
                                                </ui-tab-panel>
                                                
                                                <!-- Events Tab -->
                                                <ui-tab-panel value="events">
                                                    ${this.renderPreviewTabContent('events', adminAnnouncements)}
                                                </ui-tab-panel>
                                                
                                                <!-- Reminders Tab -->
                                                <ui-tab-panel value="reminders">
                                                    ${this.renderPreviewTabContent('reminders', adminAnnouncements)}
                                                </ui-tab-panel>
                                                
                                                <!-- Emergency Tab -->
                                                <ui-tab-panel value="emergency">
                                                    ${this.renderPreviewTabContent('emergency', adminAnnouncements)}
                                                </ui-tab-panel>
                                            </ui-tabs>
                                        </div>
                                    </div>
                                ` : `
                                    <!-- No Announcements -->
                                    <div class="text-center py-12">
                                        <div class="mx-auto h-24 w-24 text-gray-300 mb-4">
                                            <i class="fas fa-bullhorn text-6xl"></i>
                                        </div>
                                        <h3 class="text-lg font-medium text-gray-900 mb-2">No Announcements</h3>
                                        <p class="text-gray-500">There are no admin announcements available at the moment.</p>
                                        <p class="text-gray-400 text-sm mt-1">Check back later for updates.</p>
                                    </div>
                                `}
                            </div>
                        </ui-tab-panel>
                    </ui-tabs>
                `}
            </div>
            
            <!-- Add Announcement Modal -->
            <announcement-add-modal ${showAddModal ? 'open' : ''}></announcement-add-modal>
            
            <!-- Update Announcement Modal -->
            <announcement-update-modal ${showUpdateModal ? 'open' : ''}></announcement-update-modal>
            
            <!-- View Announcement Modal -->
            <announcement-view-modal ${showViewModal ? 'open' : ''}></announcement-view-modal>
        `;
    }
}

customElements.define('app-admin-announcements-page', AdminAnnouncementsPage);
export default AdminAnnouncementsPage;
