import App from '@/core/App.js';
import api from '@/services/api.js';

/**
 * Admin Dashboard Page Component (/dashboard/admin)
 * 
 * Comprehensive admin dashboard with statistics cards.
 */
class AdminDashboardPage extends App {
    constructor() {
        super();
        this.stats = {
            users: 0,
            teams: 0,
            applications: 0,
            events: 0,
            galleries: 0,
            videoGalleries: 0,
            news: 0,
            pages: 0,
            logs: 0
        };
        this.loading = true;
        this.currentUser = null;
        
        // Initialize state properly
        this.set('stats', this.stats);
        this.set('loading', true);
        this.set('currentUser', null);
    }

    connectedCallback() {
        super.connectedCallback();
        document.title = 'Admin Dashboard | School System';
        this.loadUserData();
        this.loadStats();
    }

    async loadStats() {
        try {
            this.set('loading', true);
            
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Please log in to view dashboard',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Load all statistics in parallel
            const [
                usersResponse,
                teamsResponse,
                applicationsResponse,
                eventsResponse,
                galleriesResponse,
                videoGalleriesResponse,
                newsResponse,
                pagesResponse,
                logsResponse
            ] = await Promise.all([
                api.withToken(token).get('/users'),
                api.withToken(token).get('/teams'),
                api.withToken(token).get('/applications'),
                api.withToken(token).get('/events'),
                api.withToken(token).get('/galleries'),
                api.withToken(token).get('/video-galleries'),
                api.withToken(token).get('/news'),
                api.withToken(token).get('/pages'),
                api.withToken(token).get('/logs')
            ]);

            this.set('stats', {
                users: usersResponse.data?.length || usersResponse.data.data?.length || 0,
                teams: teamsResponse.data.data?.length || 0,
                applications: applicationsResponse.data.data?.length || 0,
                events: eventsResponse.data.data?.length || 0,
                galleries: galleriesResponse.data.data?.length || 0,
                videoGalleries: videoGalleriesResponse.data.data?.length || 0,
                news: newsResponse.data.data?.length || 0,
                pages: pagesResponse.data.data?.length || 0,
                logs: logsResponse.data.data?.length || 0
            });
            
        } catch (error) {
            console.error('❌ Error loading dashboard stats:', error);
            
            Toast.show({
                title: 'Error',
                message: 'Failed to load dashboard statistics',
                variant: 'error',
                duration: 3000
            });
        } finally {
            this.set('loading', false);
        }
    }

    async loadUserData() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const stored = localStorage.getItem('userData');
            let userId = null;
            if (stored) {
                try { userId = JSON.parse(stored)?.id || null; } catch (_) { userId = null; }
            }
            if (userId) {
                const resp = await api.withToken(token).get(`/users/${userId}/profile`).catch(() => null);
                if (resp?.data) {
                    this.set('currentUser', resp.data);
                } else if (stored) {
                    try { this.set('currentUser', JSON.parse(stored)); } catch (_) {}
                }
            }
        } catch (error) {
            console.error('❌ Error loading user data:', error);
        }
    }

    render() {
        const stats = this.get('stats') || {
            users: 0,
            teams: 0,
            applications: 0,
            events: 0,
            galleries: 0,
            videoGalleries: 0,
            news: 0,
            pages: 0,
            logs: 0
        };
        const loading = this.get('loading');
        const currentUser = this.get('currentUser');
        const userName = (currentUser && (
            currentUser.name ||
            currentUser.full_name ||
            (currentUser.first_name && currentUser.last_name ? `${currentUser.first_name} ${currentUser.last_name}` : null) ||
            currentUser.username ||
            currentUser.email ||
            currentUser.displayName
        )) || 'Admin';
        
        return `
            <div class="space-y-6">
                <!-- Header -->
                <div class="bg-white shadow rounded-lg p-6">
                    <h1 class="text-2xl font-bold text-gray-900 mb-2">
                        Admin Dashboard
                    </h1>
                    <p class="text-gray-600">
                        Welcome <span class="font-semibold text-blue-600">${userName}</span> as an Admin. Here you can manage all aspects of the school system.
                    </p>
                </div>

                ${loading ? `
                    <!-- Loading Skeleton -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <div class="bg-white shadow rounded-lg p-6 animate-pulse">
                            <div class="flex items-center">
                                <div class="w-12 h-12 bg-gray-200 rounded-lg"></div>
                                <div class="ml-4 flex-1">
                                    <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div class="h-6 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white shadow rounded-lg p-6 animate-pulse">
                            <div class="flex items-center">
                                <div class="w-12 h-12 bg-gray-200 rounded-lg"></div>
                                <div class="ml-4 flex-1">
                                    <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div class="h-6 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white shadow rounded-lg p-6 animate-pulse">
                            <div class="flex items-center">
                                <div class="w-12 h-12 bg-gray-200 rounded-lg"></div>
                                <div class="ml-4 flex-1">
                                    <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div class="h-6 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white shadow rounded-lg p-6 animate-pulse">
                            <div class="flex items-center">
                                <div class="w-12 h-12 bg-gray-200 rounded-lg"></div>
                                <div class="ml-4 flex-1">
                                    <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div class="h-6 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                ` : `
                    <!-- Statistics Cards -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <!-- Users Card -->
                        <div class="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow">
                            <div class="flex items-center">
                                <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-users text-blue-600 text-xl"></i>
                                </div>
                                <div class="ml-4">
                                    <p class="text-sm font-medium text-gray-600">Total Users</p>
                                    <p class="text-2xl font-bold text-gray-900">${stats.users}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Teams Card -->
                        <div class="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow">
                            <div class="flex items-center">
                                <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-user-tie text-green-600 text-xl"></i>
                                </div>
                                <div class="ml-4">
                                    <p class="text-sm font-medium text-gray-600">Team Members</p>
                                    <p class="text-2xl font-bold text-gray-900">${stats.teams}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Applications Card -->
                        <div class="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow">
                            <div class="flex items-center">
                                <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-file-alt text-purple-600 text-xl"></i>
                                </div>
                                <div class="ml-4">
                                    <p class="text-sm font-medium text-gray-600">Applications</p>
                                    <p class="text-2xl font-bold text-gray-900">${stats.applications}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Events Card -->
                        <div class="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow">
                            <div class="flex items-center">
                                <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-calendar-alt text-red-600 text-xl"></i>
                                </div>
                                <div class="ml-4">
                                    <p class="text-sm font-medium text-gray-600">Events</p>
                                    <p class="text-2xl font-bold text-gray-900">${stats.events}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Galleries Card -->
                        <div class="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow">
                            <div class="flex items-center">
                                <div class="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-images text-pink-600 text-xl"></i>
                                </div>
                                <div class="ml-4">
                                    <p class="text-sm font-medium text-gray-600">Galleries</p>
                                    <p class="text-2xl font-bold text-gray-900">${stats.galleries}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Video Galleries Card -->
                        <div class="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow">
                            <div class="flex items-center">
                                <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-video text-orange-600 text-xl"></i>
                                </div>
                                <div class="ml-4">
                                    <p class="text-sm font-medium text-gray-600">Video Galleries</p>
                                    <p class="text-2xl font-bold text-gray-900">${stats.videoGalleries}</p>
                                </div>
                            </div>
                        </div>

                        <!-- News Card -->
                        <div class="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow">
                            <div class="flex items-center">
                                <div class="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-newspaper text-indigo-600 text-xl"></i>
                                </div>
                                <div class="ml-4">
                                    <p class="text-sm font-medium text-gray-600">News</p>
                                    <p class="text-2xl font-bold text-gray-900">${stats.news}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Pages Card -->
                        <div class="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow">
                            <div class="flex items-center">
                                <div class="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-file text-teal-600 text-xl"></i>
                                </div>
                                <div class="ml-4">
                                    <p class="text-sm font-medium text-gray-600">Pages</p>
                                    <p class="text-2xl font-bold text-gray-900">${stats.pages}</p>
                                </div>
                            </div>
                        </div>

                        <!-- System Logs Card -->
                        <div class="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow">
                            <div class="flex items-center">
                                <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-clipboard-list text-orange-600 text-xl"></i>
                                </div>
                                <div class="ml-4">
                                    <p class="text-sm font-medium text-gray-600">System Logs</p>
                                    <p class="text-2xl font-bold text-gray-900">${stats.logs}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Quick Actions -->
                    <div class="bg-white shadow rounded-lg p-6">
                        <h2 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-4">
                            <a href="/dashboard/admin/users" class="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                                <i class="fas fa-users text-blue-600 text-xl mb-2"></i>
                                <span class="text-sm font-medium text-gray-700">Users</span>
                            </a>
                            <a href="/dashboard/admin/teams" class="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                                <i class="fas fa-user-tie text-green-600 text-xl mb-2"></i>
                                <span class="text-sm font-medium text-gray-700">Teams</span>
                            </a>
                            <a href="/dashboard/admin/applications" class="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                                <i class="fas fa-file-alt text-purple-600 text-xl mb-2"></i>
                                <span class="text-sm font-medium text-gray-700">Applications</span>
                            </a>
                            <a href="/dashboard/admin/events" class="flex flex-col items-center p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                                <i class="fas fa-calendar-alt text-red-600 text-xl mb-2"></i>
                                <span class="text-sm font-medium text-gray-700">Events</span>
                            </a>
                            <a href="/dashboard/admin/galleries" class="flex flex-col items-center p-4 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors">
                                <i class="fas fa-images text-pink-600 text-xl mb-2"></i>
                                <span class="text-sm font-medium text-gray-700">Galleries</span>
                            </a>
                            <a href="/dashboard/admin/news" class="flex flex-col items-center p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
                                <i class="fas fa-newspaper text-indigo-600 text-xl mb-2"></i>
                                <span class="text-sm font-medium text-gray-700">News</span>
                            </a>
                            <a href="/dashboard/admin/page-settings" class="flex flex-col items-center p-4 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors">
                                <i class="fas fa-file text-teal-600 text-xl mb-2"></i>
                                <span class="text-sm font-medium text-gray-700">Pages</span>
                            </a>
                            <a href="/dashboard/admin/system-report" class="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
                                <i class="fas fa-clipboard-list text-orange-600 text-xl mb-2"></i>
                                <span class="text-sm font-medium text-gray-700">Reports</span>
                            </a>
                            <a href="/dashboard/admin/video-galleries" class="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
                                <i class="fas fa-video text-orange-600 text-xl mb-2"></i>
                                <span class="text-sm font-medium text-gray-700">Video</span>
                            </a>
                        </div>
                    </div>
                `}
            </div>
        `;
    }
}

customElements.define('app-admin-dashboard-page', AdminDashboardPage);
export default AdminDashboardPage; 