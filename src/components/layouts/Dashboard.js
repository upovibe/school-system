import App from '@/core/App.js';
import store from '@/core/store.js';
import '@/components/ui/Link.js';
import '@/components/ui/Toast.js';

/**
 * 🎯 Dashboard Component with Sidebar and Header
 * 
 * A comprehensive dashboard component that includes:
 * - Responsive sidebar navigation with FontAwesome icons
 * - Header with user info and actions (following existing header pattern)
 * - Role-based navigation items
 * - Mobile-friendly design
 * - Integration with existing dashboard layout
 */
class Dashboard extends App {
    unsubscribe = null;
    sidebarOpen = false;

    connectedCallback() {
        super.connectedCallback();

        // Subscribe to global state (following header pattern)
        this.unsubscribe = store.subscribe((newState) => {
            this.set('isAuthenticated', newState.isAuthenticated);
        });

        this.loadUserData();
        this.setupEventListeners();
    }

    disconnectedCallback() {
        // Prevent memory leaks (following header pattern)
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    loadUserData() {
        const userData = localStorage.getItem('userData');
        if (userData) {
            try {
                this.currentUser = JSON.parse(userData);
            } catch (error) {
                console.error('Error parsing user data:', error);
                this.currentUser = null;
            }
        }
    }

    setupEventListeners() {
        // Handle sidebar toggle
        this.addEventListener('click', (e) => {
            if (e.target.matches('[data-sidebar-toggle]')) {
                this.toggleSidebar();
            }
        });

        // Handle logout
        this.addEventListener('click', (e) => {
            if (e.target.matches('[data-logout]')) {
                this.handleLogout();
            }
        });
    }

    toggleSidebar() {
        this.sidebarOpen = !this.sidebarOpen;
        this.updateSidebarState();
    }

    updateSidebarState() {
        const sidebar = this.querySelector('[data-sidebar]');
        const overlay = this.querySelector('[data-sidebar-overlay]');
        
        if (this.sidebarOpen) {
            sidebar?.classList.add('translate-x-0');
            sidebar?.classList.remove('-translate-x-full');
            overlay?.classList.remove('hidden');
        } else {
            sidebar?.classList.remove('translate-x-0');
            sidebar?.classList.add('-translate-x-full');
            overlay?.classList.add('hidden');
        }
    }

    handleLogout() {
        // Show logout toast
        Toast.show({
            title: 'Logout Successful',
            message: 'You have been logged out successfully',
            variant: 'info',
            duration: 2000
        });

        // Clear user data
        localStorage.removeItem('userData');
        localStorage.removeItem('token');
        
        // Redirect after toast
        setTimeout(() => {
            window.location.href = '/auth/login';
        }, 2000);
    }

    /**
     * Get navigation items based on user role
     */
    getNavigationItems() {
        const baseItems = [
            {
                label: 'Dashboard',
                icon: 'fas fa-tachometer-alt',
                href: '/dashboard',
                active: window.location.pathname === '/dashboard'
            },
            {
                label: 'Profile',
                icon: 'fas fa-user',
                href: '/profile',
                active: window.location.pathname === '/profile'
            },
            {
                label: 'Settings',
                icon: 'fas fa-cog',
                href: '/settings',
                active: window.location.pathname === '/settings'
            }
        ];

        const roleItems = {
            admin: [
                {
                    label: 'Admin Dashboard',
                    icon: 'fas fa-shield-alt',
                    href: '/dashboard/admin',
                    active: window.location.pathname === '/dashboard/admin'
                },
                {
                    label: 'User Management',
                    icon: 'fas fa-users',
                    href: '/admin/users',
                    active: window.location.pathname === '/admin/users'
                },
                {
                    label: 'System Reports',
                    icon: 'fas fa-chart-bar',
                    href: '/admin/reports',
                    active: window.location.pathname === '/admin/reports'
                },
                {
                    label: 'School Settings',
                    icon: 'fas fa-school',
                    href: '/admin/settings',
                    active: window.location.pathname === '/admin/settings'
                }
            ],
            teacher: [
                {
                    label: 'Teacher Dashboard',
                    icon: 'fas fa-chalkboard-teacher',
                    href: '/dashboard/teacher',
                    active: window.location.pathname === '/dashboard/teacher'
                },
                {
                    label: 'My Classes',
                    icon: 'fas fa-book',
                    href: '/teacher/classes',
                    active: window.location.pathname === '/teacher/classes'
                },
                {
                    label: 'Grades',
                    icon: 'fas fa-graduation-cap',
                    href: '/teacher/grades',
                    active: window.location.pathname === '/teacher/grades'
                },
                {
                    label: 'Attendance',
                    icon: 'fas fa-calendar-check',
                    href: '/teacher/attendance',
                    active: window.location.pathname === '/teacher/attendance'
                }
            ],
            student: [
                {
                    label: 'Student Dashboard',
                    icon: 'fas fa-user-graduate',
                    href: '/dashboard/student',
                    active: window.location.pathname === '/dashboard/student'
                },
                {
                    label: 'My Courses',
                    icon: 'fas fa-book-open',
                    href: '/student/courses',
                    active: window.location.pathname === '/student/courses'
                },
                {
                    label: 'Assignments',
                    icon: 'fas fa-tasks',
                    href: '/student/assignments',
                    active: window.location.pathname === '/student/assignments'
                },
                {
                    label: 'Grades',
                    icon: 'fas fa-chart-line',
                    href: '/student/grades',
                    active: window.location.pathname === '/student/grades'
                }
            ],
            parent: [
                {
                    label: 'Parent Dashboard',
                    icon: 'fas fa-users',
                    href: '/dashboard/parent',
                    active: window.location.pathname === '/dashboard/parent'
                },
                {
                    label: 'My Children',
                    icon: 'fas fa-child',
                    href: '/parent/children',
                    active: window.location.pathname === '/parent/children'
                },
                {
                    label: 'Progress Reports',
                    icon: 'fas fa-chart-pie',
                    href: '/parent/reports',
                    active: window.location.pathname === '/parent/reports'
                },
                {
                    label: 'Communications',
                    icon: 'fas fa-comments',
                    href: '/parent/messages',
                    active: window.location.pathname === '/parent/messages'
                }
            ],
            staff: [
                {
                    label: 'Staff Dashboard',
                    icon: 'fas fa-user-tie',
                    href: '/dashboard/staff',
                    active: window.location.pathname === '/dashboard/staff'
                },
                {
                    label: 'Administration',
                    icon: 'fas fa-clipboard-list',
                    href: '/staff/admin',
                    active: window.location.pathname === '/staff/admin'
                },
                {
                    label: 'Reports',
                    icon: 'fas fa-file-alt',
                    href: '/staff/reports',
                    active: window.location.pathname === '/staff/reports'
                },
                {
                    label: 'Support',
                    icon: 'fas fa-headset',
                    href: '/staff/support',
                    active: window.location.pathname === '/staff/support'
                }
            ]
        };

        const userRole = this.currentUser?.role || 'student';
        const roleSpecificItems = roleItems[userRole] || [];

        return [...baseItems, ...roleSpecificItems];
    }

    render() {
        const userRole = this.currentUser?.role || 'User';
        const userName = this.currentUser?.name || this.currentUser?.username || 'User';
        const userEmail = this.currentUser?.email || '';
        const navigationItems = this.getNavigationItems();

        return `
            <div class="flex h-screen bg-gray-50">
                <!-- Mobile Sidebar Overlay -->
                <div 
                    data-sidebar-overlay
                    class="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden hidden"
                    onclick="this.closest('app-dashboard').toggleSidebar()"
                ></div>

                <!-- Sidebar -->
                <aside 
                    data-sidebar
                    class="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform -translate-x-full lg:translate-x-0 transition-transform duration-300 ease-in-out"
                >
                    <!-- Sidebar Header -->
                    <div class="flex items-center justify-between h-16 px-4 border-b border-gray-200">
                        <div class="flex items-center space-x-3">
                            <img class="w-8 h-8 rounded-full" src="/src/assets/logo.png" alt="Logo" />
                            <span class="text-lg font-semibold text-gray-900">School System</span>
                        </div>
                        <button 
                            data-sidebar-toggle
                            class="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        >
                            <i class="fas fa-times text-lg"></i>
                        </button>
                    </div>

                    <!-- User Info -->
                    <div class="px-4 py-4 border-b border-gray-200">
                        <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                                <i class="fas fa-user text-white"></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-medium text-gray-900 truncate">${userName}</p>
                                <p class="text-xs text-gray-500 truncate">${userEmail}</p>
                                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    ${userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Navigation -->
                    <nav class="px-4 py-4 space-y-1 flex-1 overflow-y-auto">
                        ${navigationItems.map(item => `
                            <ui-link 
                                href="${item.href}"
                                class="flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors no-underline ${
                                    item.active 
                                        ? 'bg-blue-100 text-blue-900 border-r-2 border-blue-500' 
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                }"
                            >
                                <i class="${item.icon} w-5 h-5 mr-3"></i>
                                ${item.label}
                            </ui-link>
                        `).join('')}
                    </nav>

                    <!-- Sidebar Footer -->
                    <div class="p-4 border-t border-gray-200">
                        <button 
                            data-logout
                            class="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 hover:text-red-700 transition-colors"
                        >
                            <i class="fas fa-sign-out-alt w-5 h-5 mr-3"></i>
                            Logout
                        </button>
                    </div>
                </aside>

                <!-- Main Content Area -->
                <div class="flex-1 flex flex-col lg:ml-64">
                    <!-- Header (following existing header pattern) -->
                    <header class="bg-white shadow-sm border-b border-gray-200">
                        <div class="flex items-center justify-between px-4 py-4">
                            <!-- Left side -->
                            <div class="flex items-center">
                                <button 
                                    data-sidebar-toggle
                                    class="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 mr-2"
                                >
                                    <i class="fas fa-bars text-lg"></i>
                                </button>
                                <h1 class="text-xl font-semibold text-gray-900">
                                    ${this.getPageTitle()}
                                </h1>
                            </div>

                            <!-- Right side (following header pattern) -->
                            <div class="flex items-center space-x-4">
                                <!-- Notifications -->
                                <button class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md relative">
                                    <i class="fas fa-bell text-lg"></i>
                                    <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                                </button>

                                <!-- User Menu -->
                                <div class="flex items-center space-x-2">
                                    <img class="w-8 h-8 rounded-full" src="/src/assets/logo.png" alt="User" />
                                    <span class="hidden md:block text-sm font-medium text-gray-700">${userName}</span>
                                    <span class="text-xs text-gray-500">(${userRole})</span>
                                </div>
                            </div>
                        </div>
                    </header>

                    <!-- Page Content Area -->
                    <main class="flex-1 overflow-y-auto p-6">
                        <slot></slot>
                    </main>
                </div>
            </div>
        `;
    }

    /**
     * Get the current page title based on the URL
     */
    getPageTitle() {
        const path = window.location.pathname;
        const pathSegments = path.split('/').filter(Boolean);
        
        if (pathSegments.length === 0) return 'Dashboard';
        
        const lastSegment = pathSegments[pathSegments.length - 1];
        const titles = {
            'dashboard': 'Dashboard',
            'admin': 'Admin Dashboard',
            'teacher': 'Teacher Dashboard',
            'student': 'Student Dashboard',
            'parent': 'Parent Dashboard',
            'staff': 'Staff Dashboard',
            'profile': 'Profile',
            'settings': 'Settings',
            'users': 'User Management',
            'reports': 'Reports',
            'classes': 'Classes',
            'grades': 'Grades',
            'attendance': 'Attendance',
            'courses': 'Courses',
            'assignments': 'Assignments',
            'children': 'My Children',
            'messages': 'Messages'
        };
        
        return titles[lastSegment] || 'Dashboard';
    }
}

customElements.define('app-dashboard', Dashboard);
export default Dashboard; 