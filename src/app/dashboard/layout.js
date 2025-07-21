import App from '@/core/App.js';
import store from '@/core/store.js';
import api from '@/services/api.js';
import '@/components/ui/Link.js';
import '@/components/ui/Toast.js';
import '@/components/ui/DropdownMenu.js';
import '@/components/ui/Avatar.js';
import '@/components/ui/Dialog.js';
import '@/components/layout/authLayout/PasswordChangeDialog.js';

/**
 * Dashboard Layout Component
 * 
 * This layout provides a consistent structure for all dashboard pages with a responsive sidebar and header.
 */
class DashboardLayout extends App {
    constructor() {
        super();
        this.pageContent = '';
        this.currentUser = null;
        this.unsubscribe = null;
        this.sidebarOpen = false;
    }

    connectedCallback() {
        super.connectedCallback();
        document.title = 'Dashboard | School System';
        this.loadUserData();
        this.setupEventListeners();
        this.checkPasswordChangeRequirement();
        
        this.unsubscribe = store.subscribe((newState) => {
            this.set('isAuthenticated', newState.isAuthenticated);
        });
    }

    disconnectedCallback() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    async loadUserData() {
        // Get user ID and token from localStorage
        const userData = localStorage.getItem('userData');
        let userId = null;
        let token = null;
        if (userData) {
            try {
                const parsed = JSON.parse(userData);
                userId = parsed.id;
            } catch (e) {
                userId = null;
            }
        }
        token = localStorage.getItem('token');

        if (userId && token) {
            try {
                const response = await api.withToken(token).get(`/users/${userId}/profile`);
                this.currentUser = response.data;
            } catch (error) {
                // If API fails, fallback to localStorage
                this.currentUser = userData ? JSON.parse(userData) : null;
            }
        } else {
            this.currentUser = userData ? JSON.parse(userData) : null;
        }

        // Check if user needs to change password
        const requiresPasswordChange = localStorage.getItem('requiresPasswordChange') === 'true';
        this.set('requiresPasswordChange', requiresPasswordChange);
    }

    checkPasswordChangeRequirement() {
        const requiresPasswordChange = localStorage.getItem('requiresPasswordChange') === 'true';
        if (this.get('requiresPasswordChange') !== requiresPasswordChange) {
            this.set('requiresPasswordChange', requiresPasswordChange);
        }
    }

    setupEventListeners() {
        this.addEventListener('click', (e) => {
            const toggleButton = e.target.closest('[data-sidebar-toggle]');
            if (toggleButton) {
                e.preventDefault();
                this.toggleSidebar();
            }

            const logoutButton = e.target.closest('[data-action="logout"]');
            if (logoutButton) {
                e.preventDefault();
                this.handleLogout();
            }
        });

        document.addEventListener('item-click', (e) => {
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
        const layoutContainer = this.querySelector('[data-layout-container]');
        if (this.sidebarOpen) {
            layoutContainer.classList.add('sidebar-open');
        } else {
            layoutContainer.classList.remove('sidebar-open');
        }
    }

    async handleLogout() {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
        } catch (error) {
            console.warn('Error calling logout API:', error);
        }
        
        localStorage.removeItem('userData');
        localStorage.removeItem('token');
        
        Toast.show({
            title: 'Logout Successful',
            message: 'You have been logged out successfully',
            variant: 'info',
            duration: 2000
        });
        
        setTimeout(() => {
            window.location.href = '/auth/login';
        }, 2000);
    }

    setPageContent(content) {
        this.pageContent = content;
        this.innerHTML = this.render();
    }

    getNavigationItems() {
        const userRole = this.currentUser?.role || 'student';
        const path = window.location.pathname;
        // Grouped navigation structure with short labels
        const roleGroups = {
            admin: [
                {
                    group: 'Dashboard',
                    items: [
                        { label: 'Admin Home', icon: 'fas fa-shield-alt', href: '/dashboard/admin' },
                    ]
                },
                {
                    group: 'Management',
                    items: [
                        { label: 'User Roles', icon: 'fas fa-user-tag', href: '/dashboard/admin/user-role' },
                        { label: 'Users', icon: 'fas fa-users', href: '/dashboard/admin/users' },
                        { label: 'Teams', icon: 'fas fa-user-friends', href: '/dashboard/admin/teams' },
                        { label: 'Applications', icon: 'fas fa-file-signature', href: '/dashboard/admin/applications' },
                        { label: 'Events', icon: 'fas fa-calendar-alt', href: '/dashboard/admin/events' },
                        { label: 'News', icon: 'fas fa-newspaper', href: '/dashboard/admin/news' },
                        { label: 'Gallery', icon: 'fas fa-images', href: '/dashboard/admin/galleries' },
                        { label: 'Video Gallery', icon: 'fas fa-video', href: '/dashboard/admin/video-galleries' },
                    ]
                },
                {
                    group: 'Settings',
                    items: [
                        { label: 'Page Settings', icon: 'fas fa-file-alt', href: '/dashboard/admin/page-settings' },
                        { label: 'System Settings', icon: 'fas fa-cog', href: '/dashboard/admin/system-settings' },
                    ]
                },
                {
                    group: 'Reports',
                    items: [
                        { label: 'System Reports', icon: 'fas fa-chart-bar', href: '/dashboard/admin/system-report' },
                    ]
                }
            ],
            teacher: [
                {
                    group: 'Dashboard',
                    items: [
                        { label: 'Home', icon: 'fas fa-chalkboard-teacher', href: '/dashboard/teacher/dashboard' },
                    ]
                },
                {
                    group: 'Teaching',
                    items: [
                        { label: 'Classes', icon: 'fas fa-book', href: '/dashboard/teacher/classes' },
                        { label: 'Grades', icon: 'fas fa-graduation-cap', href: '/dashboard/teacher/grades' },
                        { label: 'Attendance', icon: 'fas fa-calendar-check', href: '/dashboard/teacher/attendance' },
                    ]
                }
            ],
            student: [
                {
                    group: 'Dashboard',
                    items: [
                        { label: 'Home', icon: 'fas fa-user-graduate', href: '/dashboard/student/dashboard' },
                    ]
                },
                {
                    group: 'Academics',
                    items: [
                        { label: 'Courses', icon: 'fas fa-book-open', href: '/dashboard/student/courses' },
                        { label: 'Assignments', icon: 'fas fa-tasks', href: '/dashboard/student/assignments' },
                        { label: 'Grades', icon: 'fas fa-chart-line', href: '/dashboard/student/grades' },
                    ]
                }
            ],
            parent: [
                {
                    group: 'Dashboard',
                    items: [
                        { label: 'Home', icon: 'fas fa-users', href: '/dashboard/parent/dashboard' },
                    ]
                },
                {
                    group: 'Family',
                    items: [
                        { label: 'Children', icon: 'fas fa-child', href: '/dashboard/parent/children' },
                        { label: 'Reports', icon: 'fas fa-chart-pie', href: '/dashboard/parent/reports' },
                        { label: 'Messages', icon: 'fas fa-comments', href: '/dashboard/parent/messages' },
                    ]
                }
            ],
            staff: [
                {
                    group: 'Dashboard',
                    items: [
                        { label: 'Home', icon: 'fas fa-user-tie', href: '/dashboard/staff/dashboard' },
                    ]
                },
                {
                    group: 'Work',
                    items: [
                        { label: 'Admin', icon: 'fas fa-clipboard-list', href: '/dashboard/staff/admin' },
                        { label: 'Reports', icon: 'fas fa-file-alt', href: '/dashboard/staff/reports' },
                        { label: 'Support', icon: 'fas fa-headset', href: '/dashboard/staff/support' },
                    ]
                }
            ]
        };
        // Mark active
        const groups = (roleGroups[userRole] || []);
        groups.forEach(group => {
            group.items = group.items.map(item => ({ ...item, active: path === item.href }));
        });
        return groups;
    }

    getPageTitle() {
        const path = window.location.pathname;
        const segments = path.split('/').filter(Boolean);
        const lastSegment = segments[segments.length - 1] || 'dashboard';
        const titles = {
            'dashboard': 'Dashboard', 'admin': 'Admin Dashboard', 'teacher': 'Teacher Dashboard',
            'student': 'Student Dashboard', 'parent': 'Parent Dashboard', 'staff': 'Staff Dashboard',
            'profile': 'Profile', 'settings': 'Settings', 'page-settings': 'Page Settings',
            'system-settings': 'System Settings', 'users': 'User Management', 'teams': 'Team Management', 'reports': 'Reports',
            'classes': 'Classes', 'grades': 'Grades', 'attendance': 'Attendance',
            'courses': 'Courses', 'assignments': 'Assignments', 'children': 'My Children',
            'messages': 'Messages', 'user-role': 'User Roles', 'galleries': 'Gallery Management'
        };
        return titles[lastSegment] || 'Dashboard';
    }

    // Helper method to get proper image URL (same as ProfileContent)
    getImageUrl(imagePath) {
        if (!imagePath) return '';
        // If it's already a full URL, return as is
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
        }
        // If it's a relative path starting with /, construct the full URL
        if (imagePath.startsWith('/')) {
            const baseUrl = window.location.origin;
            return baseUrl + imagePath;
        }
        // If it's a relative path without /, construct the URL with /api/ prefix
        const baseUrl = window.location.origin;
        const apiPath = '/api';
        return baseUrl + apiPath + '/' + imagePath;
    }

    render() {
        if (!this.currentUser) {
            this.loadUserData();
            return `<div class="flex h-screen bg-gray-50 items-center justify-center"><div class="text-gray-500">Loading...</div></div>`;
        }

        const { role = 'User', name, username = 'User', email = '' } = this.currentUser;
        const userName = name || username;
        const navigationGroups = this.getNavigationItems();

        return `
            <style>
                :host {
                    display: block;
                    min-height: 100vh;
                    background-color: #F9FAFB;
                }
                
                [data-layout-container] {
                    display: flex;
                    height: 100vh;
                    width: 100%;
                    overflow: hidden;
                }

                [data-sidebar] {
                    width: 256px;
                    flex-shrink: 0;
                    transform: translateX(-100%);
                    transition: transform 0.3s ease-in-out;
                    z-index: 50;
                }

                @media (min-width: 1280px) {
                    [data-sidebar] {
                        transform: translateX(0);
                    }
                }

                .sidebar-open [data-sidebar] {
                    transform: translateX(0);
                }

                [data-sidebar-overlay] {
                    position: fixed;
                    inset: 0;
                    background-color: rgba(0, 0, 0, 0.5);
                    z-index: 40;
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 0.3s ease-in-out;
                }

                .sidebar-open [data-sidebar-overlay] {
                    opacity: 1;
                    pointer-events: auto;
                }
                
                @media (min-width: 1280px) {
                    [data-sidebar-overlay] {
                        display: none;
                    }
                }

                [data-main-content] {
                    flex-grow: 1;
                    display: flex;
                    flex-direction: column;
                    min-height: 0;
                }
            </style>

            <div data-layout-container>
                <!-- Sidebar Overlay -->
                <div data-sidebar-overlay @click="${() => this.toggleSidebar()}"></div>

                <!-- Sidebar -->
                <aside data-sidebar class="fixed inset-y-0 left-0 bg-gradient-to-b from-blue-600 to-blue-700 text-white flex flex-col shadow-lg">
                    <div class="flex items-center justify-between h-16 px-4 border-b border-blue-500 flex-shrink-0">
                        <div class="flex items-center space-x-3">
                            <img class="w-8 h-8 rounded-full" src="/src/assets/logo.png" alt="Logo" />
                            <span class="text-lg font-semibold">School System</span>
                        </div>
                        <button type="button" data-sidebar-toggle class="xl:hidden size-8 rounded-md text-blue-200 hover:text-white hover:bg-blue-500">
                            <i class="fas fa-times text-lg"></i>
                        </button>
                    </div>

                    <nav class="flex-1 px-4 py-4 overflow-y-auto flex flex-col gap-2">
                        ${navigationGroups.map(group => `
                            <div class="mb-2">
                                <div class="text-xs font-semibold uppercase text-blue-200 mb-1 pl-2 tracking-wide">${group.group}</div>
                                ${group.items.map(item => `
                                    <ui-link 
                                        href="${item.href}"
                                        class="group flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors no-underline ${item.active ? 'bg-white text-blue-700' : 'text-blue-100 hover:bg-blue-500 hover:text-white'}"
                                    >
                                        <i class="${item.icon} size-5 flex items-center justify-center"></i>
                                        <span>${item.label}</span>
                                    </ui-link>
                                `).join('')}
                            </div>
                        `).join('')}
                    </nav>

                    <div class="p-4 border-t border-blue-500 flex-shrink-0">
                        <button data-action="logout" class="group flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-red-200 hover:bg-red-500 hover:text-white rounded-md transition-colors">
                            <i class="fas fa-sign-out-alt size-5 flex items-center justify-center"></i>
                            <span>Logout</span>
                        </button>
                    </div>
                </aside>

                <!-- Main Content -->
                <div class="flex-1 flex flex-col xl:ml-64 overflow-hidden">
                    <!-- Header -->
                    <header class="sticky top-0 z-30 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50 flex-shrink-0">
                        <div class="flex items-center justify-between p-4">
                            <div class="flex items-center gap-4">
                                <button type="button" data-sidebar-toggle class="xl:hidden size-8 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                                    <i class="fas fa-bars text-lg"></i>
                                </button>
                                <h1 class="text-xl font-semibold text-gray-900">${this.getPageTitle()}</h1>
                            </div>

                            <div class="flex items-center space-x-4">
                                <button class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md relative">
                                    <i class="fas fa-bell text-lg"></i>
                                    <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                                </button>

                                <ui-dropdown-menu>
                                    <ui-dropdown-menu-trigger>
                                        <div class="flex items-center p-1 rounded-full hover:bg-gray-100 transition-colors">
                                            <ui-avatar src="${this.getImageUrl(this.currentUser?.profile_image || '')}" alt="${userName}" name="${userName}" size="md"></ui-avatar>
                                        </div>
                                    </ui-dropdown-menu-trigger>
                                    <ui-dropdown-menu-content>
                                        <ui-dropdown-menu-label>My Account</ui-dropdown-menu-label>
                                        <ui-dropdown-menu-separator></ui-dropdown-menu-separator>
                                        <div class="px-3 py-2">
                                            <p class="text-sm font-medium text-gray-700">${userName}</p>
                                            <p class="text-xs text-gray-500">${email}</p>
                                        </div>
                                        <ui-dropdown-menu-separator></ui-dropdown-menu-separator>
                                        <ui-dropdown-menu-item>
                                            <a href="/dashboard/profile" class="w-full text-left no-underline text-gray-700 hover:text-gray-900 flex items-center">
                                                <i class="fas fa-user w-4 h-4 mr-3"></i> Profile
                                            </a>
                                        </ui-dropdown-menu-item>
                                        <ui-dropdown-menu-separator></ui-dropdown-menu-separator>
                                        <ui-dropdown-menu-item color="red">
                                            <button data-action="logout" class="w-full text-left bg-transparent border-none p-0 m-0 cursor-pointer text-red-500 hover:text-red-700 flex items-center">
                                                <i class="fas fa-sign-out-alt w-4 h-4 mr-3"></i> Logout
                                            </button>
                                        </ui-dropdown-menu-item>
                                    </ui-dropdown-menu-content>
                                </ui-dropdown-menu>
                            </div>
                        </div>
                    </header>

                    <!-- Page Content -->
                    <main class="flex-1 bg-transparent overflow-y-auto">
                        <div class="container mx-auto p-6">
                        ${(() => {
                            const requiresPasswordChange = this.get('requiresPasswordChange');
                            return requiresPasswordChange ? 
                                `<auth-password-change-dialog></auth-password-change-dialog>` : 
                                this.pageContent;
                        })()}                        
                        </div>
                    </main>
                </div>
            </div>
        `;
    }
}

customElements.define('app-dashboard-layout', DashboardLayout);
export default DashboardLayout;