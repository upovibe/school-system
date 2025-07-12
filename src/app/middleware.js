/**
 * 🚀 Layout-Centric Middleware Configuration
 * 
 * This system works with LAYOUTS OR DIRECT PAGES:
 * 
 * LAYOUT-BASED RULES (Automatic):
 * - Auth layout applies to ALL /auth/* pages automatically
 * - Dashboard layout applies to ALL /dashboard/* pages automatically
 * - Root layout applies to pages without specific layouts
 * 
 * PAGE-SPECIFIC OVERRIDES (Only when needed):
 * - Override layout rules for specific pages
 * - Add custom behavior for standalone pages
 * 
 * SMART PRIORITY:
 * 1. Page-specific overrides (highest priority)
 * 2. Layout-based rules (automatic default)
 * 3. System defaults (fallback)
 */

export default {
    // LAYOUT-BASED RULES (apply to all pages in that layout)
    'auth': {
        requireAuth: false,
        redirectIfAuth: true,
        redirectTo: (user) => user ? `/dashboard/${user.role}` : '/dashboard',
        logAccess: false
    },
    
    'dashboard': {
        requireAuth: true,
        logAccess: true,
        notifyOnAccess: false
    },
    
    // STANDALONE PAGES (no layout, custom behavior)
    '': {
        requireAuth: false,
        logAccess: false
    },
    
    'about': {
        requireAuth: false,
        logAccess: false
    },
    
    'contact': {
        requireAuth: false,
        logAccess: false
    },
    
    'profile': {
        requireAuth: true,
        logAccess: true,
        notifyOnAccess: false
    },
    
    'settings': {
        requireAuth: true,
        logAccess: true,
        notifyOnAccess: false
    },
    
    'admin/users': {
        requireAuth: true,
        requireRole: 'admin',
        logAccess: true,
        notifyOnAccess: true
    },
    
    // PAGE-SPECIFIC OVERRIDES (only when needed)
    'auth/login': {
        redirectIfAuth: true,
        redirectTo: (user) => user ? `/dashboard/${user.role}` : '/dashboard'
    },
    
    'auth/register': {
        redirectIfAuth: true,
        redirectTo: (user) => user ? `/dashboard/${user.role}` : '/dashboard'
    },
    
    'auth/forgot-password': {
        redirectIfAuth: true,
        redirectTo: (user) => user ? `/dashboard/${user.role}` : '/dashboard'
    },
    
    'dashboard/admin': {
        requireRole: 'admin',
        notifyOnAccess: true,
        redirectTo: (user) => user ? `/dashboard/${user.role}` : '/dashboard'
    },
    
    'dashboard/teacher': {
        requireRole: 'teacher',
        redirectTo: (user) => user ? `/dashboard/${user.role}` : '/dashboard'
    },
    
    'dashboard/student': {
        requireRole: 'student',
        redirectTo: (user) => user ? `/dashboard/${user.role}` : '/dashboard'
    },
    
    'dashboard/parent': {
        requireRole: 'parent',
        redirectTo: (user) => user ? `/dashboard/${user.role}` : '/dashboard'
    },
    
    'dashboard/staff': {
        requireRole: 'staff',
        redirectTo: (user) => user ? `/dashboard/${user.role}` : '/dashboard'
    },
    
    // ERROR PAGES
    '404': {
        requireAuth: false,
        logAccess: false,
        redirectTo: (user) => user ? `/dashboard/${user.role}` : '/dashboard'
    },
    
    'maintenance': {
        requireAuth: false,
        logAccess: false,
        redirectTo: (user) => user ? `/dashboard/${user.role}` : '/dashboard'
    },
    
    // FALLBACK FOR UNKNOWN PAGES
    '*': {
        requireAuth: false,
        logAccess: false,
        redirectTo: (user) => user ? `/dashboard/${user.role}` : '/dashboard'
    }
}; 