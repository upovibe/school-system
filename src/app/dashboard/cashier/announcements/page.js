import App from '@/core/App.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Skeleton.js';
import '@/components/ui/Tabs.js';
import api from '@/services/api.js';

/**
 * Cashier Announcements Page Component (/dashboard/cashier/announcements)
 * 
 * Displays announcements for cashiers in a readable view format with tabs
 */
class CashierAnnouncementsPage extends App {
    constructor() {
        super();
        this.announcements = null;
        this.loading = false;
        this.currentCashier = null;
        this.activeTab = 'pinned'; // Default active tab
    }

    // Get current cashier information
    getCurrentCashier() {
        try {
            const raw = localStorage.getItem('userData');
            if (raw) {
                const user = JSON.parse(raw);
                return {
                    id: user.id,
                    name: user.name || [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || 'Cashier',
                    role: user.role || 'cashier'
                };
            }
        } catch (error) {
            console.error('Error parsing user data:', error);
        }
        return null;
    }

    // Get announcements by type for tabs
    getAnnouncementsByType(type) {
        const announcements = this.get('announcements') || [];
        
        switch (type) {
            case 'pinned':
                return announcements.filter(a => Number(a.is_pinned) === 1);
            case 'general':
                return announcements.filter(a => 
                    a.announcement_type === 'general' || 
                    !a.announcement_type || 
                    a.announcement_type === ''
                );
            case 'financial':
                return announcements.filter(a => 
                    a.announcement_type === 'financial' || 
                    a.announcement_type === 'payment' || 
                    a.announcement_type === 'fee' ||
                    a.announcement_type === 'billing'
                );
            case 'events':
                return announcements.filter(a => 
                    a.announcement_type === 'event' || 
                    a.announcement_type === 'activity' || 
                    a.announcement_type === 'celebration'
                );
            case 'reminders':
                return announcements.filter(a => 
                    a.announcement_type === 'reminder' || 
                    a.announcement_type === 'notice' || 
                    a.announcement_type === 'update'
                );
            case 'emergency':
                return announcements.filter(a => 
                    a.announcement_type === 'emergency' || 
                    a.priority === 'urgent'
                );
            default:
                return announcements;
        }
    }

    // Get tab counts for header
    getTabCounts() {
        const announcements = this.get('announcements') || [];
        return {
            pinned: this.getAnnouncementsByType('pinned').length,
            general: this.getAnnouncementsByType('general').length,
            financial: this.getAnnouncementsByType('financial').length,
            events: this.getAnnouncementsByType('events').length,
            reminders: this.getAnnouncementsByType('reminders').length,
            emergency: this.getAnnouncementsByType('emergency').length
        };
    }

    // Summary counts for header
    getHeaderCounts() {
        const announcements = this.get('announcements') || [];
        const total = announcements.length;
        let active = 0;
        let pinned = 0;
        let highPriority = 0;
        let cashierSpecific = 0;
        let generalAnnouncements = 0;
        
        announcements.forEach((announcement) => {
            const isActive = Number(announcement.is_active) === 1;
            const isPinned = Number(announcement.is_pinned) === 1;
            const isHighPriority = announcement.priority === 'high';
            const isCashierSpecific = announcement.target_audience === 'cashier';
            
            if (isActive) active += 1;
            if (isPinned) pinned += 1;
            if (isHighPriority) highPriority += 1;
            if (isCashierSpecific) cashierSpecific += 1;
            else generalAnnouncements += 1;
        });
        
        return { total, active, pinned, highPriority, cashierSpecific, generalAnnouncements };
    }

    connectedCallback() {
        super.connectedCallback();
        document.title = 'Announcements | School System';
        this.currentCashier = this.getCurrentCashier();
        this.loadData();
        this.addEventListener('click', this.handleHeaderActions.bind(this));
        this.addEventListener('tab-change', this.handleTabChange.bind(this));
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

    showAnnouncementsInfo() {
        const dialog = document.createElement('ui-dialog');
        dialog.setAttribute('open', '');
        dialog.innerHTML = `
            <div slot="header" class="flex items-center">
                <i class="fas fa-bullhorn text-blue-500 mr-2"></i>
                <span class="font-semibold">About Cashier Announcements</span>
            </div>
            <div slot="content" class="space-y-4">
                <div>
                    <h4 class="font-semibold text-gray-900 mb-2">What are Cashier Announcements?</h4>
                    <p class="text-gray-700">Stay informed about important financial updates, payment procedures, and general school information relevant to cashier operations.</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Cashier-Specific</span>
                        <span class="text-sm text-gray-600">Announcements targeted specifically for cashiers</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">General Announcements</span>
                        <span class="text-sm text-gray-600">For all staff members in the school</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Priority Levels</span>
                        <span class="text-sm text-gray-600">Normal, High, Urgent</span>
                    </div>
                </div>
                <div class="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p class="text-sm text-blue-800">
                        <i class="fas fa-info-circle mr-1"></i>
                        Pinned announcements appear at the top. High priority announcements are highlighted for your attention.
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
                    message: 'Please log in to view announcements',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Load cashier announcements data
            const response = await api.withToken(token).get('/cashier/announcements');
            
            if (response.data && response.data.success) {
                // Filter announcements for cashiers (all + cashier-specific)
                const allAnnouncements = response.data.data || [];
                const cashierAnnouncements = allAnnouncements.filter(announcement => 
                    announcement.target_audience === 'all' || 
                    announcement.target_audience === 'cashier'
                );
                
                // Sort announcements: pinned first, then by priority, then by date
                const sortedAnnouncements = cashierAnnouncements.sort((a, b) => {
                    // Pinned announcements first
                    if (Number(a.is_pinned) === 1 && Number(b.is_pinned) === 0) return -1;
                    if (Number(a.is_pinned) === 0 && Number(b.is_pinned) === 1) return 1;
                    
                    // Then by priority
                    const priorityOrder = { 'urgent': 3, 'high': 2, 'normal': 1, 'low': 0 };
                    const aPriority = priorityOrder[a.priority] || 1;
                    const bPriority = priorityOrder[b.priority] || 1;
                    if (aPriority !== bPriority) return bPriority - aPriority;
                    
                    // Finally by creation date (newest first)
                    return new Date(b.created_at) - new Date(a.created_at);
                });
                
                this.set('announcements', sortedAnnouncements);
            } else {
                Toast.show({
                    title: 'Error',
                    message: response.data?.message || 'Failed to load announcements',
                    variant: 'error',
                    duration: 3000
                });
            }
        } catch (error) {
            console.error('Error loading announcements:', error);
            Toast.show({
                title: 'Error',
                message: 'Failed to load announcements. Please try again.',
                variant: 'error',
                duration: 3000
            });
        } finally {
            this.set('loading', false);
        }
    }

    // Render header with statistics
    renderHeader() {
        const c = this.getHeaderCounts();
        const cashier = this.currentCashier;
        
        return `
            <div class="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl shadow-lg p-5 text-white mb-8">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
                    <div>
                        <div class="flex items-center gap-2">
                            <h1 class="text-2xl sm:text-3xl font-bold">Announcements</h1>
                            <button class="text-white/90 mt-2 hover:text-white transition-colors" data-action="show-announcements-info" title="About Cashier Announcements">
                                <i class="fas fa-question-circle text-lg"></i>
                            </button>
                        </div>
                        <p class="text-green-100 text-base sm:text-lg">Welcome, ${cashier?.name || 'Cashier'} - Stay updated with important information</p>
                    </div>
                </div>
                
                <!-- Summary Cards -->
                <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
                    <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                        <div class="flex items-center">
                            <div class="size-10 flex items-center justify-center bg-blue-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                <i class="fas fa-bullhorn text-white text-lg sm:text-xl"></i>
                            </div>
                            <div class="min-w-0 flex-1">
                                <div class="text-xl sm:text-2xl font-bold">${c.total}</div>
                                <div class="text-green-100 text-xs sm:text-sm">Total</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                        <div class="flex items-center">
                            <div class="size-10 flex items-center justify-center bg-green-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                <i class="fas fa-check-circle text-white text-lg sm:text-xl"></i>
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
                            <div class="size-10 flex items-center justify-center bg-orange-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
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
                            <div class="size-10 flex items-center justify-center bg-purple-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                <i class="fas fa-cash-register text-white text-lg sm:text-xl"></i>
                            </div>
                            <div class="min-w-0 flex-1">
                                <div class="text-xl sm:text-2xl font-bold">${c.cashierSpecific}</div>
                                <div class="text-green-100 text-xs sm:text-sm">Cashier-Specific</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                        <div class="flex items-center">
                            <div class="size-10 flex items-center justify-center bg-indigo-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                <i class="fas fa-users text-white text-lg sm:text-xl"></i>
                            </div>
                            <div class="min-w-0 flex-1">
                                <div class="text-xl sm:text-2xl font-bold">${c.generalAnnouncements}</div>
                                <div class="text-green-100 text-xs sm:text-sm">General</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Render announcement card with proper labeling
    renderAnnouncementCard(announcement, index) {
        const isPinned = Number(announcement.is_pinned) === 1;
        const isHighPriority = announcement.priority === 'high';
        const isUrgent = announcement.priority === 'urgent';
        const isCashierSpecific = announcement.target_audience === 'cashier';
        
        // Priority badge styling
        let priorityBadge = '';
        if (isUrgent) {
            priorityBadge = '<span class="inline-flex items-center text-nowrap px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Urgent</span>';
        } else if (isHighPriority) {
            priorityBadge = '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 text-nowrap">High Priority</span>';
        }
        
        // Audience label
        const audienceLabel = isCashierSpecific ? 'Cashier-Specific' : 'General';
        const audienceColor = isCashierSpecific ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';
        
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
                                <i class="fas ${isCashierSpecific ? 'fa-cash-register' : 'fa-users'} mr-1"></i>
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

    // Render content for each tab
    renderTabContent(type, announcements) {
        const announcementsInTab = this.getAnnouncementsByType(type);
        
        if (announcementsInTab.length === 0) {
            return `
                <div class="text-center py-12">
                    <div class="mx-auto h-24 w-24 text-gray-300 mb-4">
                        <i class="fas ${this.getTabIcon(type)} text-6xl"></i>
                    </div>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">No ${this.getTabLabel(type)} Announcements</h3>
                    <p class="text-gray-500">There are no ${this.getTabLabel(type).toLowerCase()} announcements available at the moment.</p>
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

    // Get tab icon
    getTabIcon(type) {
        const icons = {
            'pinned': 'fa-thumbtack',
            'general': 'fa-bullhorn',
            'financial': 'fa-dollar-sign',
            'events': 'fa-calendar-alt',
            'reminders': 'fa-bell',
            'emergency': 'fa-exclamation-triangle'
        };
        return icons[type] || 'fa-bullhorn';
    }

    // Get tab label
    getTabLabel(type) {
        const labels = {
            'pinned': 'Pinned',
            'general': 'General',
            'financial': 'Financial',
            'events': 'Events',
            'reminders': 'Reminders',
            'emergency': 'Emergency'
        };
        return labels[type] || 'General';
    }

    render() {
        const announcements = this.get('announcements');
        const loading = this.get('loading');
        const tabCounts = this.getTabCounts();
        
        return `
            ${this.renderHeader()}
            ${loading ? `
                <!-- Skeleton Loading -->
                <div class="space-y-6">
                    <div class="animate-pulse">
                        <div class="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                        <div class="h-32 bg-gray-200 rounded mb-4"></div>
                        <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                    <div class="animate-pulse">
                        <div class="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                        <div class="h-28 bg-gray-200 rounded mb-4"></div>
                        <div class="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                    <div class="animate-pulse">
                        <div class="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                        <div class="h-36 bg-gray-200 rounded mb-4"></div>
                        <div class="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                </div>
            ` : announcements && announcements.length > 0 ? `
                <!-- Tabs Interface -->
                <div class="rounded-xl overflow-hidden">                    
                    <div class="pt-4">
                        <ui-tabs>
                            <ui-tab-list class="flex items-center justify-center">
                                <ui-tab value="pinned">
                                    <i class="fas fa-thumbtack text-yellow-600 text-lg lg:text-base"></i>
                                    <span class="hidden lg:inline ml-1 font-medium">Pinned (${tabCounts.pinned})</span>
                                </ui-tab>
                                <ui-tab value="general">
                                    <i class="fas fa-bullhorn text-blue-600 text-lg lg:text-base"></i>
                                    <span class="hidden lg:inline ml-1 font-medium">General (${tabCounts.general})</span>
                                </ui-tab>
                                <ui-tab value="financial">
                                    <i class="fas fa-dollar-sign text-green-600 text-lg lg:text-base"></i>
                                    <span class="hidden lg:inline ml-1 font-medium">Financial (${tabCounts.financial})</span>
                                </ui-tab>
                                <ui-tab value="events">
                                    <i class="fas fa-calendar-alt text-purple-600 text-lg lg:text-base"></i>
                                    <span class="hidden lg:inline ml-1 font-medium">Events (${tabCounts.events})</span>
                                </ui-tab>
                                <ui-tab value="reminders">
                                    <i class="fas fa-bell text-amber-600 text-lg lg:text-base"></i>
                                    <span class="hidden lg:inline ml-1 font-medium">Reminders (${tabCounts.reminders})</span>
                                </ui-tab>
                                <ui-tab value="emergency">
                                    <i class="fas fa-exclamation-triangle text-red-600 text-lg lg:text-base"></i>
                                    <span class="hidden lg:inline ml-1 font-medium">Emergency (${tabCounts.emergency})</span>
                                </ui-tab>
                            </ui-tab-list>
                            
                            <!-- Pinned Tab -->
                            <ui-tab-panel value="pinned">
                                ${this.renderTabContent('pinned', announcements)}
                            </ui-tab-panel>
                            
                            <!-- General Tab -->
                            <ui-tab-panel value="general">
                                ${this.renderTabContent('general', announcements)}
                            </ui-tab-panel>
                            
                            <!-- Financial Tab -->
                            <ui-tab-panel value="financial">
                                ${this.renderTabContent('financial', announcements)}
                            </ui-tab-panel>
                            
                            <!-- Events Tab -->
                            <ui-tab-panel value="events">
                                ${this.renderTabContent('events', announcements)}
                            </ui-tab-panel>
                            
                            <!-- Reminders Tab -->
                            <ui-tab-panel value="reminders">
                                ${this.renderTabContent('reminders', announcements)}
                            </ui-tab-panel>
                            
                            <!-- Emergency Tab -->
                            <ui-tab-panel value="emergency">
                                ${this.renderTabContent('emergency', announcements)}
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
                    <p class="text-gray-500">There are no announcements available at the moment.</p>
                    <p class="text-gray-400 text-sm mt-1">Check back later for updates.</p>
                </div>
            `}
        `;
    }
}

customElements.define('app-cashier-announcements-page', CashierAnnouncementsPage);
export default CashierAnnouncementsPage;
