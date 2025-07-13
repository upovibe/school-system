import App from '@/core/App.js';
import store from '@/core/store.js';
import '@/components/ui/Link.js';
import '@/components/ui/Toast.js';
import '@/components/ui/DropdownMenu.js';
import '@/components/ui/Avatar.js';

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
        // Load user data first before calling super
        this.loadUserData();
        
        // Subscribe to global state (following header pattern)
        this.unsubscribe = store.subscribe((newState) => {
            this.set('isAuthenticated', newState.isAuthenticated);
        });

        this.setupEventListeners();
        
        // Call super after user data is loaded
        super.connectedCallback();
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
        } else {
            this.currentUser = null;
        }
    }

    setupEventListeners() {
        // Handle sidebar toggle
        this.addEventListener('click', (e) => {
            if (e.target.matches('[data-sidebar-toggle]')) {
                e.preventDefault();
                e.stopPropagation();
                this.toggleSidebar();
            }
        });

        // Handle logout from dropdown menu
        this.addEventListener('item-click', (e) => {
            if (e.detail.text === 'Logout') {
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
        return roleItems[userRole] || [];
    }

    render() {
        // If no user data, try to load it again
        if (!this.currentUser) {
            this.loadUserData();
            return '<div class="flex h-screen bg-gray-50 items-center justify-center"><div class="text-gray-500">Loading...</div></div>';
        }
        
        const userRole = this.currentUser?.role || 'User';
        const userName = this.currentUser?.name || this.currentUser?.username || 'User';
        const userEmail = this.currentUser?.email || '';
        const navigationItems = this.getNavigationItems();

        return `
            <div class="min-h-screen bg-gray-50 p-2">
                <!-- Main Container -->
                <div class="flex h-[calc(100vh-2rem)] gap-4">
                    <!-- Mobile/Tablet Sidebar Overlay -->
                    <div 
                        data-sidebar-overlay
                        class="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 xl:hidden hidden"
                        onclick="this.closest('app-dashboard').toggleSidebar()"
                    ></div>

                    <!-- Sidebar -->
                    <aside 
                        data-sidebar
                        class="fixed inset-y-0 left-0 z-50 w-64 bg-white text-gray-900 transform -translate-x-full xl:translate-x-0 xl:static transition-all duration-300 rounded-none xl:rounded-2xl ease-in-out shadow-lg overflow-hidden"
                    >
                        <!-- Sidebar Header -->
                        <div class="flex items-center justify-between h-16 px-4 border-b border-gray-200">
                            <div class="flex items-center space-x-3">
                                <img class="w-8 h-8 rounded-full" src="/src/assets/logo.png" alt="Logo" />
                                <span class="text-lg font-semibold text-gray-900">School System</span>
                            </div>
                            <button 
                                type="button"
                                data-sidebar-toggle
                                class="xl:hidden size-8 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            >
                                <i class="fas fa-times text-lg"></i>
                            </button>
                        </div>



                        <!-- Navigation -->
                        <nav class="px-4 py-4 flex-1 overflow-y-auto flex flex-col gap-2">
                            ${navigationItems.map(item => `
                                <ui-link 
                                    href="${item.href}"
                                    class="group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors no-underline relative ${
                                        item.active 
                                            ? 'bg-blue-600 text-white' 
                                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }"
                                    title="${this.sidebarCollapsed ? item.label : ''}"
                                >
                                    <i class="${item.icon} w-5 h-5 transition-all duration-300 ${this.sidebarCollapsed ? 'mr-0' : 'mr-3'}"></i>
                                    <span class="transition-all duration-300 ${this.sidebarCollapsed ? 'opacity-0 w-0 overflow-hidden max-w-0 hidden' : 'opacity-100 w-auto max-w-full'}">${item.label}</span>
                                    ${this.sidebarCollapsed ? `
                                        <div class="absolute left-full ml-2 px-2 py-1 text-xs text-gray-900 bg-white border border-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                                            ${item.label}
                                        </div>
                                    ` : ''}
                                </ui-link>
                            `).join('')}
                        </nav>

                        <!-- Sidebar Footer -->
                        <div class="p-4 border-t border-gray-200">
                            <button 
                                data-logout
                                class="group flex items-center w-full px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors relative"
                                title="${this.sidebarCollapsed ? 'Logout' : ''}"
                            >
                                <i class="fas fa-sign-out-alt w-5 h-5 transition-all duration-300 ${this.sidebarCollapsed ? 'mr-0' : 'mr-3'}"></i>
                                <span class="transition-all duration-300 ${this.sidebarCollapsed ? 'opacity-0 w-0 overflow-hidden max-w-0 hidden' : 'opacity-100 w-auto max-w-full'}">Logout</span>
                                ${this.sidebarCollapsed ? `
                                    <div class="absolute left-full ml-2 px-2 py-1 text-xs text-gray-900 bg-white border border-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                                        Logout
                                    </div>
                                ` : ''}
                            </button>
                        </div>
                    </aside>

                    <!-- Main Content Area -->
                    <div class="flex-1 flex flex-col w-full" data-main-content>
                        <!-- Header -->
                        <header class="sticky top-0 z-30 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50 rounded-2xl">
                            <div class="flex items-center justify-between p-2">
                                <!-- Left side -->
                                <div class="flex items-center gap-4">
                                    <button 
                                        type="button"
                                        data-sidebar-toggle
                                        class="xl:hidden size-8 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                                    >
                                        <i class="fas fa-bars text-lg"></i>
                                    </button>
                                    <h1 class="text-xl font-semibold text-gray-900">
                                        ${this.getPageTitle()}
                                    </h1>
                                </div>

                                <!-- Right side -->
                                <div class="flex items-center space-x-4">
                                    <!-- Notifications -->
                                    <button class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md relative">
                                        <i class="fas fa-bell text-lg"></i>
                                        <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                                    </button>

                                    <!-- User Menu Dropdown -->
                                    <ui-dropdown-menu>
                                        <ui-dropdown-menu-trigger>
                                            <div class="flex items-center space-x-3 p-1 rounded-full hover:bg-gray-100 transition-colors">
                                                <ui-avatar 
                                                    src="${this.currentUser?.profile_image || ''}" 
                                                    alt="${userName}" 
                                                    name="${userName}" 
                                                    size="md"
                                                ></ui-avatar>
                                                <div class="hidden md:block text-left">
                                                    <p class="text-sm font-medium text-gray-700">${userName}</p>
                                                    <p class="text-xs text-gray-500">${userEmail}</p>
                                                </div>
                                            </div>
                                        </ui-dropdown-menu-trigger>
                                        
                                        <ui-dropdown-menu-content>
                                            <ui-dropdown-menu-label>My Account</ui-dropdown-menu-label>
                                            <ui-dropdown-menu-separator></ui-dropdown-menu-separator>
                                            <ui-dropdown-menu-item>
                                                <a href="/profile" data-action="navigate" class="w-full text-left no-underline text-gray-700 hover:text-gray-900 flex items-center">
                                                    <i class="fas fa-user w-4 h-4 mr-3"></i>
                                                    Profile
                                                </a>
                                            </ui-dropdown-menu-item>
                                            <ui-dropdown-menu-item>
                                                <a href="/settings" data-action="navigate" class="w-full text-left no-underline text-gray-700 hover:text-gray-900 flex items-center">
                                                    <i class="fas fa-cog w-4 h-4 mr-3"></i>
                                                    Settings
                                                </a>
                                            </ui-dropdown-menu-item>
                                            <ui-dropdown-menu-separator></ui-dropdown-menu-separator>
                                            <ui-dropdown-menu-item color="red">
                                                <button data-action="logout" class="w-full text-left bg-transparent border-none p-0 m-0 cursor-pointer text-red-500 hover:text-red-700 flex items-center">
                                                    <i class="fas fa-sign-out-alt w-4 h-4 mr-3"></i>
                                                    Logout
                                                </button>
                                            </ui-dropdown-menu-item>
                                        </ui-dropdown-menu-content>
                                    </ui-dropdown-menu>
                                </div>
                            </div>
                        </header>

                        <!-- Page Content Area -->
                        <main class="flex-1 overflow-y-auto p-6 bg-transparent">
                            <slot></slot>
                        </main>
                    </div>
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