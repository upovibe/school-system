import '@/app/rootLayout.js';
import middleware from './middleware.js';

/**
 * UPO UI App-Based Router - File-System Routing + Layouts
 * 
 * Supports:
 * - App directory structure: app/page.js, app/about/page.js
 * - Dynamic routes: app/user/[id]/page.js, app/blog/[slug]/page.js
 * - Layout system: app/layout.js wraps all pages
 * - Query parameters: ?tab=settings&filter=active
 * - File-based routing similar to Next.js App Router
 * 
 * Features:
 * - Automatic route discovery from app directory
 * - Layout wrapping for all pages
 * - Dynamic parameter extraction
 * - Fast preloading of static routes
 */

class Router {
    constructor() {
        this.routes = new Map();
        this.dynamicRoutes = new Map();
        this.componentCache = new Map();
        this.layoutCache = null;
        this.currentComponent = null;
        this.outlet = null;
        this.isReady = false;
    }
    
    // Add a route (supports both static and dynamic)
    route(path, componentPath) {
        if (this.isDynamicRoute(path)) {
            this.dynamicRoutes.set(path, componentPath);
        } else {
            this.routes.set(path, componentPath);
        }
        return this;
    }
    
    // Check if route has parameters (Next.js style [param] or old style :param)
    isDynamicRoute(path) {
        return path.includes('[') || path.includes(':') || path.includes('*');
    }
    
    // Convert route pattern to regex (supports both [param] and :param syntax)
    createRouteRegex(pattern) {
        const paramNames = [];
        let regexStr = pattern
            .replace(/\//g, '\\/')
            // Handle [param] syntax (Next.js style)
            .replace(/\[(\w+)\]/g, (match, paramName) => {
                paramNames.push(paramName);
                return '([^/]+)';
            })
            // Handle :param syntax (traditional)
            .replace(/:\w+/g, (match) => {
                paramNames.push(match.slice(1)); // Remove the ':'
                return '([^/]+)';
            })
            // Handle wildcard
            .replace(/\*/g, '(.*)');
        
        return {
            regex: new RegExp(`^${regexStr}$`),
            paramNames
        };
    }
    
    // Match current path against dynamic routes
    matchDynamicRoute(currentPath) {
        for (const [pattern, componentPath] of this.dynamicRoutes) {
            const { regex, paramNames } = this.createRouteRegex(pattern);
            const match = currentPath.match(regex);
            
            if (match) {
                const params = {};
                paramNames.forEach((name, index) => {
                    params[name] = match[index + 1];
                });
                
                return {
                    componentPath,
                    params,
                    pattern
                };
            }
        }
        return null;
    }
    
    // Parse query parameters
    parseQueryParams(search = window.location.search) {
        const params = {};
        if (search.startsWith('?')) {
            search.slice(1).split('&').forEach(param => {
                const [key, value] = param.split('=');
                if (key) {
                    params[decodeURIComponent(key)] = decodeURIComponent(value || '');
                }
            });
        }
        return params;
    }
    
    // Navigate to a path
    navigate(path) {
        history.pushState(null, null, path);
        this.render();
    }
    
    // Start the router
    async start(outletSelector = '#app') {
        this.outlet = document.querySelector(outletSelector);
        
        if (!this.outlet) {
            console.error(`Router outlet '${outletSelector}' not found`);
            return;
        }
        
        // Preload ALL static components first
        await this.preloadAllComponents();
        
        this.isReady = true;
        
        // Listen for back/forward navigation
        window.addEventListener('popstate', () => {
            this.render();
        });

        // Intercept clicks on local links
        document.body.addEventListener('click', e => {
            const link = e.target.closest('a');
            if (link && link.origin === window.location.origin) {
                e.preventDefault();
                this.navigate(link.pathname);
            }
        });
        
        // Initial render (now instant)
        this.render();
        
        return this;
    }
    
    // Preload all static components and layout
    async preloadAllComponents() {
        // Load layout component first
        try {
            const layoutModule = await import('@/app/rootLayout.js');
            this.layoutCache = layoutModule.default;
        } catch (error) {
            console.error('❌ Failed to load layout:', error);
        }
        
        // Load all static page components
        const loadPromises = Array.from(this.routes.entries()).map(async ([path, componentPath]) => {
            try {
                const module = await import(`@/${componentPath}`);
                this.componentCache.set(path, module.default);
            } catch (error) {
                console.error(`❌ Failed to load: ${componentPath}`, error);
            }
        });
        
        await Promise.all(loadPromises);
    }
    
    // Load dynamic component if not cached
    async loadDynamicComponent(componentPath, cacheKey) {
        if (this.componentCache.has(cacheKey)) {
            return this.componentCache.get(cacheKey);
        }
        
        try {
            const module = await import(`@/${componentPath}`);
            this.componentCache.set(cacheKey, module.default);
            return module.default;
        } catch (error) {
            console.error(`❌ Failed to load dynamic component: ${componentPath}`, error);
            return null;
        }
    }
    
    // Try to load a page automatically based on URL path
    async tryAutoLoad(path) {
        // Smart pattern detection - try most likely patterns first
        const pathSegments = path.split('/').filter(Boolean);
        const possiblePaths = [];
        const attemptedPaths = [];
        const errors = [];
        
        // If root path, try these
        if (path === '/') {
            possiblePaths.push('app/page.js', 'app/home.js', 'app/index.js');
        }
        // For multi-segment paths, prioritize dynamic routes first (more likely)
        else if (pathSegments.length > 1) {
            // Try static patterns first (group folders)
            possiblePaths.push(
                `app${path}/page.js`,                  // Next.js style: /auth/signin → app/auth/signin/page.js
                `app${path}.js`                        // Simple style: /auth/signin → app/auth/signin.js
            );
            
            // Try common dynamic patterns
            const [first, second] = pathSegments;
            possiblePaths.push(
                `app/${first}/[id]/page.js`,           // Most common: app/user/[id]/page.js
                `app/${first}/[slug]/page.js`,         // Second most common
                `app/${first}/[${second}]/page.js`     // Generic dynamic
            );
            
            // Try deeper nested dynamic routes
            if (pathSegments.length >= 4) {
                const [first, second, third] = pathSegments;
                possiblePaths.push(
                    `app/${first}/${second}/${third}/[id]/page.js`,  // app/dashboard/admin/users/[id]/page.js
                    `app/${first}/${second}/[id]/page.js`,           // app/dashboard/admin/[id]/page.js
                    `app/${first}/[id]/page.js`                      // app/dashboard/[id]/page.js
                );
            }
        }
        // For single-segment paths, try static patterns first
        else {
            possiblePaths.push(
                `app${path}.js`,                       // Simple style: /contact → app/contact.js
                `app${path}/page.js`,                  // Next.js style: /contact → app/contact/page.js
                `app${path}/index.js`,                 // Index style: /contact → app/contact/index.js
                `app${path}/${path.split('/').pop()}.js`  // Named style: /contact → app/contact/contact.js
            );
        }
        
        // Try each pattern and collect detailed error information
        for (const componentPath of possiblePaths) {
            attemptedPaths.push(componentPath);
            try {
                const module = await import(`@/${componentPath}`);
                
                // Cache it for next time and extract params if dynamic
                this.componentCache.set(path, module.default);
                
                // If this was a dynamic route, extract and store params
                if (componentPath.includes('[') && componentPath.includes(']')) {
                    const params = this.extractDynamicParams(componentPath, path);
                    this.componentCache.set(`${path}:params`, params);
                }
                
                return module.default;
            } catch (error) {
                errors.push({
                    path: componentPath,
                    error: error.message,
                    stack: error.stack
                });
                // Continue to next pattern
                continue;
            }
        }
        
        // If we get here, no component was found - render detailed error
        this.renderComponentError(path, attemptedPaths, errors);
        return null;
    }
    

    
    // Extract parameters from dynamic route
    extractDynamicParams(componentPath, actualPath) {
        const params = {};
        
        // Convert component path to pattern
        const pattern = componentPath
            .replace('app', '')
            .replace('/page.js', '')
            .replace('.js', '');
        
        const patternSegments = pattern.split('/').filter(Boolean);
        const actualSegments = actualPath.split('/').filter(Boolean);
        
        patternSegments.forEach((segment, index) => {
            if (segment.startsWith('[') && segment.endsWith(']')) {
                const paramName = segment.slice(1, -1);
                params[paramName] = actualSegments[index];
            }
        });
        
        return params;
    }
    
    // Render the current route (supports both static and dynamic)
    async render() {
        if (!this.isReady) return; // Don't render until components are loaded
        
        // Dispatch an event to notify components of the route change
        window.dispatchEvent(new CustomEvent('route-changed', { detail: { path: window.location.pathname } }));

        const path = window.location.pathname || '/';
        const queryParams = this.parseQueryParams(window.location.search);
        
        // Execute middleware before rendering
        const middlewareResult = await middleware.execute(path, { queryParams });
        
        if (!middlewareResult.success) {
            console.log(`🚫 Middleware blocked access to ${path}: ${middlewareResult.reason}`);
            
            if (middlewareResult.redirect) {
                // Redirect to specified path
                this.navigate(middlewareResult.redirect);
                return;
            } else {
                // Show 404 for blocked access
                this.renderNotFound();
                return;
            }
        }
        
        // Handle index.html redirect to clean URL with base path
        if (window.location.pathname.includes('/index.html')) {
            history.replaceState(null, null, '/');
            this.render(); // Re-render with clean URL
            return;
        }
        
        let ComponentClass = null;
        let routeParams = {};
        let routeInfo = null;
        
        // Try static route first
        ComponentClass = this.componentCache.get(path);
        
        // If no static route, try dynamic routes
        if (!ComponentClass) {
            const dynamicMatch = this.matchDynamicRoute(path);
            if (dynamicMatch) {
                routeParams = dynamicMatch.params;
                routeInfo = dynamicMatch;
                
                // For dynamic routes, use component path + params as cache key
                const cacheKey = `${dynamicMatch.componentPath}#${JSON.stringify(routeParams)}`;
                ComponentClass = await this.loadDynamicComponent(dynamicMatch.componentPath, cacheKey);
            }
        }
        
        // If no manual route found, try auto-loading
        if (!ComponentClass) {
            ComponentClass = await this.tryAutoLoad(path);
            
            // Check if auto-loaded component has dynamic params
            if (ComponentClass && this.componentCache.has(`${path}:params`)) {
                routeParams = this.componentCache.get(`${path}:params`);
            }
        }

        if (!ComponentClass) {
            this.renderNotFound();
            return;
        }

        try {
            // Convert class name to tag name (PascalCase to kebab-case)
            const tagName = `app-${ComponentClass.name
                .replace(/([A-Z])/g, '-$1')
                .toLowerCase()
                .replace(/^-/, '')
            }`;

            // Create page content
            const pageContent = `<${tagName}></${tagName}>`;

            // --- LAYOUT OVERRIDE LOGIC ---
            const pathSegments = path.split('/').filter(Boolean);
            let customLayoutTagName = null;
            let CustomLayoutClass = null;

            if (pathSegments.length > 0) {
                const routeGroup = pathSegments[0];
                const layoutPath = `@/app/${routeGroup}/layout.js`;
                try {
                    const layoutModule = await import(layoutPath);
                    CustomLayoutClass = layoutModule.default;
                    customLayoutTagName = `app-${CustomLayoutClass.name.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')}`;
                } catch (e) {
                    // This is expected if no custom layout exists.
                }
            }
            
            if (customLayoutTagName && CustomLayoutClass) {
                // Use the custom layout if it was found
                let customLayoutElement = this.outlet.querySelector(customLayoutTagName);
                
                if (!customLayoutElement) {
                    // Only create new layout if it doesn't exist
                    this.outlet.innerHTML = `<${customLayoutTagName}></${customLayoutTagName}>`;
                    customLayoutElement = this.outlet.querySelector(customLayoutTagName);
                }
                
                if (customLayoutElement && customLayoutElement.setPageContent) {
                    customLayoutElement.setPageContent(pageContent);
                }
            } else {
                // Otherwise, use the default root layout
                let layoutElement = this.outlet.querySelector('root-layout');
                
                if (!layoutElement) {
                    // Only create new layout if it doesn't exist
                    this.outlet.innerHTML = `<root-layout></root-layout>`;
                    layoutElement = this.outlet.querySelector('root-layout');
                }
                
                if (layoutElement && layoutElement.setPageContent) {
                    layoutElement.setPageContent(pageContent);
                }
            }

            // Pass route data to the page component
            const componentElement = this.outlet.querySelector(tagName);
            if (componentElement) {
                if (Object.keys(routeParams).length > 0) {
                    componentElement.set('routeParams', routeParams);
                }
                if (Object.keys(queryParams).length > 0) {
                    componentElement.set('queryParams', queryParams);
                }
                componentElement.set('routeInfo', {
                    path,
                    params: routeParams,
                    query: queryParams,
                    pattern: routeInfo?.pattern || path
                });
            }

        } catch (error) {
            console.error(`Failed to render route: ${path}`, error);
            this.renderError();
        }
    }
    
    // Render 404 page
    renderNotFound() {
        this.outlet.innerHTML = `
            <div class="flex items-center justify-center min-h-screen bg-gray-50">
                <div class="text-center">
                    <h1 class="text-6xl font-bold text-gray-300 mb-4">404</h1>
                    <p class="text-xl text-gray-600 mb-8">Page not found</p>
                    <p class="text-sm text-gray-500 mb-8">Path: ${window.location.pathname}</p>
                    <button onclick="router.navigate('/')" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                        Go Home
                    </button>
                </div>
            </div>
        `;
    }
    
    // Render error page
    renderError() {
        this.outlet.innerHTML = `
            <div class="flex items-center justify-center min-h-screen bg-gray-50">
                <div class="text-center">
                    <h1 class="text-4xl font-bold text-red-600 mb-4">Error</h1>
                    <p class="text-xl text-gray-600 mb-8">Failed to load page</p>
                    <button onclick="location.reload()" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                        Refresh Page
                    </button>
                </div>
            </div>
        `;
    }
    
    // Render a detailed error message for a failed component load
    renderComponentError(path, attemptedPaths, errors) {
        // Log detailed error information to console
        console.group(`🔍 Component Load Error for: ${path}`);
        console.log('Attempted paths:');
        attemptedPaths.forEach((path, index) => {
            console.log(`  ${index + 1}. ${path}`);
        });
        console.log('Errors:');
        errors.forEach((error, index) => {
            console.error(`  ${index + 1}. ${error.path}:`, error.error);
            if (error.stack) {
                console.log('     Stack:', error.stack);
            }
        });
        console.groupEnd();
        
        // Show user-friendly error message
        this.outlet.innerHTML = `
            <div class="flex items-center justify-center min-h-screen bg-gray-50">
                <div class="text-center max-w-2xl mx-auto px-4">
                    <h1 class="text-6xl font-bold text-red-600 mb-4">⚠️</h1>
                    <h2 class="text-2xl font-bold text-gray-800 mb-4">Component Not Found</h2>
                    <p class="text-lg text-gray-600 mb-6">The page component for <code class="bg-gray-200 px-2 py-1 rounded">${path}</code> could not be loaded.</p>
                    
                    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
                        <h3 class="font-semibold text-yellow-800 mb-2">What was tried:</h3>
                        <ul class="text-sm text-yellow-700 space-y-1">
                            ${attemptedPaths.map(p => `<li>• ${p}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                        <h3 class="font-semibold text-red-800 mb-2">Errors encountered:</h3>
                        <ul class="text-sm text-red-700 space-y-1">
                            ${errors.map(err => `<li>• ${err.path}: ${err.error}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                        <h3 class="font-semibold text-blue-800 mb-2">How to fix:</h3>
                        <ul class="text-sm text-blue-700 space-y-1">
                            <li>• Check if the component file exists in the correct location</li>
                            <li>• Verify the component exports a default class</li>
                            <li>• Ensure the file path matches the URL structure</li>
                            <li>• Check browser console for detailed error information</li>
                        </ul>
                    </div>
                    
                    <div class="flex gap-4 justify-center">
                        <button onclick="router.navigate('/')" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                            Go Home
                        </button>
                        <button onclick="location.reload()" class="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors">
                            Refresh Page
                        </button>
                    </div>
                </div>
            </div>
        `;
    }


    
    // Get current route info
    getCurrentRoute() {
        const path = window.location.pathname || '/';
        const queryParams = this.parseQueryParams();
        const dynamicMatch = this.matchDynamicRoute(path);
        
        return {
            path,
            params: dynamicMatch?.params || {},
            query: queryParams,
            pattern: dynamicMatch?.pattern || path
        };
    }
    
    // Get all routes
    getRoutes() {
        return {
            static: Array.from(this.routes.keys()),
            dynamic: Array.from(this.dynamicRoutes.keys())
        };
    }
    
    // Helper: Generate URL with parameters
    buildUrl(pattern, params = {}, query = {}) {
        let url = pattern;
        
        // Replace parameters
        Object.entries(params).forEach(([key, value]) => {
            url = url.replace(`:${key}`, encodeURIComponent(value));
        });
        
        // Add query parameters
        const queryString = Object.entries(query)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');
        
        if (queryString) {
            url += `?${queryString}`;
        }
        
        return url;
    }
}

export default Router; 