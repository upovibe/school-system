import App from '@/core/App.js';
import '@/components/ui/Table.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Skeleton.js';
import api from '@/services/api.js';

/**
 * Teacher Announcements Management Page
 * 
 * Displays teacher's own announcements and announcements relevant to their class
 */
class TeacherAnnouncementsPage extends App {
    constructor() {
        super();
        this.announcements = null;
        this.loading = false;
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
                <div class="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl shadow-lg p-5 text-white">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
                        <div>
                            <div class="flex items-center gap-2">
                                                            <h1 class="text-2xl sm:text-3xl font-bold">My Announcements</h1>
                            <button class="text-white/90 mt-2 hover:text-white transition-colors" data-action="show-announcements-info" title="About Teacher Announcements">
                                <i class="fas fa-question-circle text-lg"></i>
                            </button>
                        </div>
                        <p class="text-green-100 text-base sm:text-lg">Manage announcements you created</p>
                        </div>
                        <div class="mt-4 sm:mt-0">
                            <div class="text-right">
                                <div class="text-xl sm:text-2xl font-bold">${c.total}</div>
                                <div class="text-green-100 text-xs sm:text-sm">Total Announcements</div>
                            </div>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-green-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-check text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.active}</div>
                                    <div class="text-green-100 text-xs sm:text-sm">Active</div>
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
                                    <div class="text-green-100 text-xs sm:text-sm">Inactive</div>
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
                                    <div class="text-green-100 text-xs sm:text-sm">Pinned</div>
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
                                    <div class="text-green-100 text-xs sm:text-sm">High Priority</div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-indigo-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-bullhorn text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.total}</div>
                                    <div class="text-green-100 text-xs sm:text-sm">Total</div>
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
        document.title = 'My Announcements | School System';
        this.loadData();
        this.addEventListener('click', this.handleHeaderActions.bind(this));
    }

    handleHeaderActions(event) {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        const action = button.getAttribute('data-action');
        if (action === 'show-announcements-info') {
            this.showAnnouncementsInfo();
        }
    }

    showAnnouncementsInfo() {
        const dialog = document.createElement('ui-dialog');
        dialog.setAttribute('open', '');
        dialog.innerHTML = `
            <div slot="header" class="flex items-center">
                <i class="fas fa-bullhorn text-green-500 mr-2"></i>
                <span class="font-semibold">About Teacher Announcements</span>
            </div>
            <div slot="content" class="space-y-4">
                <div>
                    <h4 class="font-semibold text-gray-900 mb-2">What are My Announcements?</h4>
                    <p class="text-gray-700">This page shows only the announcements you have created as a teacher.</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Your Announcements</span>
                        <span class="text-sm text-gray-600">View and manage announcements you've created</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Target Audience</span>
                        <span class="text-sm text-gray-600">all, students, teachers, specific_class</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Class Restrictions</span>
                        <span class="text-sm text-gray-600">You can only target your assigned class</span>
                    </div>
                </div>
                <div class="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p class="text-sm text-blue-800">
                        <i class="fas fa-info-circle mr-1"></i>
                        To view all announcements (including those from other teachers), use the "All Announcements" page.
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

            // Load teacher announcements data using teacher-specific endpoint
            // Use the new endpoint that only returns the teacher's own announcements
            const response = await api.withToken(token).get('/teacher/announcements/my');
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

    updateTableData() {
        const announcements = this.get('announcements');
        if (!announcements) return;

        // Prepare table data for announcements with safe content handling
        const tableData = announcements.map((announcement, index) => {
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

        // Find the table component and update its data
        const tableComponent = this.querySelector('ui-table');
        if (tableComponent) {
            tableComponent.setAttribute('data', JSON.stringify(tableData));
        }
    }

    render() {
        const announcements = this.get('announcements');
        const loading = this.get('loading');
        
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
                    <!-- Teacher Announcements Table Section -->
                    <div class="mb-8">
                        <ui-table 
                            title="My Announcements"
                            data="[]"
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
                `}
            </div>
        `;
    }
}

customElements.define('app-teacher-announcements-page', TeacherAnnouncementsPage);
export default TeacherAnnouncementsPage;
