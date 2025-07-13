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
 * 
 * 🔄 DYNAMIC ROLE-BASED REDIRECTS:
 * 
 * Instead of hardcoded redirect paths, this system uses functions that receive
 * the user object and dynamically determine the correct redirect path based on
 * the user's role. This makes the system flexible and role-aware.
 * 
 * Example: redirectTo: (user) => user ? `/dashboard/${user.role}` : '/dashboard'
 * 
 * How it works:
 * 1. When middleware needs to redirect a user, it calls the redirectTo function
 * 2. The function receives the current user object (or null if not authenticated)
 * 3. If user exists and has a role, redirect to /dashboard/{role} (e.g., /dashboard/admin)
 * 4. If no user, fallback to /dashboard
 * 
 * Benefits:
 * ✅ No hardcoded roles in the core system
 * ✅ Automatically works with any role (admin, teacher, student, etc.)
 * ✅ Easy to modify redirect behavior without touching core code
 * ✅ Smart fallbacks for edge cases
 * 
 * Usage Examples:
 * - Admin user tries to access /auth/login → redirected to /dashboard/admin
 * - Teacher user tries to access /auth/login → redirected to /dashboard/teacher
 * - Unauthenticated user tries to access protected page → redirected to /auth/login
 * - User tries to access page they don't have permission for → redirected to their role dashboard
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
    
    // Role-specific dashboard access
    'dashboard/admin': {
        requireAuth: true,
        requireRole: 'admin',
        logAccess: true,
        redirectTo: (user) => user ? `/dashboard/${user.role}` : '/dashboard'
    },
    
    'dashboard/teacher': {
        requireAuth: true,
        requireRole: 'teacher',
        logAccess: true,
        redirectTo: (user) => user ? `/dashboard/${user.role}` : '/dashboard'
    },
    
    'dashboard/student': {
        requireAuth: true,
        requireRole: 'student',
        logAccess: true,
        redirectTo: (user) => user ? `/dashboard/${user.role}` : '/dashboard'
    },
    
    'dashboard/parent': {
        requireAuth: true,
        requireRole: 'parent',
        logAccess: true,
        redirectTo: (user) => user ? `/dashboard/${user.role}` : '/dashboard'
    },
    
    'dashboard/staff': {
        requireAuth: true,
        requireRole: 'staff',
        logAccess: true,
        redirectTo: (user) => user ? `/dashboard/${user.role}` : '/dashboard'
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
    
    // FALLBACK FOR UNKNOWN PAGES
    '*': {
        requireAuth: false,
        logAccess: false,
        redirectTo: (user) => user ? `/dashboard/${user.role}` : '/dashboard'
    }
}; 