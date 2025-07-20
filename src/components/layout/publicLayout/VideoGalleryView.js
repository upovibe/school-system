import App from '@/core/App.js';
import Toast from '@/components/ui/Toast.js';
import { fetchColorSettings } from '@/utils/colorSettings.js';
import '@/components/common/PageLoader.js';
import '@/components/ui/ContentDisplay.js';

/**
 * Video Gallery View Component
 * 
 * Displays detailed information for a specific video gallery
 * Can be used in individual video gallery pages or modals
 */
class VideoGalleryView extends App {
    constructor() {
        super();
        // Initialize with loading state
        this.set('loading', true);
        this.set('colorsLoaded', false);
        this.set('videoGallery', null);
        this.set('error', null);
    }

    // Method to copy gallery URL to clipboard and show toast
    copyGalleryUrl() {
        const videoGallery = this.get('videoGallery');
        const galleryName = videoGallery?.name ? videoGallery.name.charAt(0).toUpperCase() + videoGallery.name.slice(1) : 'Video Gallery';
        
        navigator.clipboard.writeText(window.location.href).then(() => {
            Toast.show({ 
                message: `${galleryName} copied to clipboard!`, 
                variant: 'success', 
                duration: 3000 
            });
        });
    }

    async connectedCallback() {
        super.connectedCallback();
        
        // Load colors from settings
        await this.loadColorsFromSettings();
        
        // Check if slug attribute is provided and load data
        const slug = this.getAttribute('slug');
        if (slug) {
            this.loadVideoGalleryData(slug);
        }
    }

    async loadColorsFromSettings() {
        try {
            // Fetch colors from API
            const colors = await fetchColorSettings();
            
            // Set colors in component state
            Object.entries(colors).forEach(([key, value]) => {
                this.set(key, value);
            });
            
            // Mark colors as loaded
            this.set('colorsLoaded', true);
        } catch (error) {
            this.set('colorsLoaded', true);
        }
    }

    // Watch for slug attribute changes
    static get observedAttributes() {
        return ['slug'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'slug' && newValue && newValue !== oldValue) {
            this.loadVideoGalleryData(newValue);
        }
    }

    // Method to load video gallery data (can be called externally)
    async loadVideoGalleryData(slug) {
        try {
            if (!slug) {
                this.set('error', 'Video gallery not found');
                this.set('loading', false);
                return;
            }

            // Fetch video gallery data by slug
            const apiUrl = `/api/video-galleries/slug/${slug}`;
            
            const response = await fetch(apiUrl);
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    this.set('videoGallery', data.data);
                } else {
                    this.set('error', 'Video gallery not found');
                }
            } else {
                this.set('error', 'Failed to load video gallery');
            }
        } catch (error) {
            this.set('error', 'Error loading video gallery');
        }
        
        this.set('loading', false);
    }

    // Helper function to format date
    formatDate(dateString) {
        if (!dateString) return 'TBD';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return dateString;
            }
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    }

    // Helper function to get video platform and ID from URL
    getVideoInfo(videoUrl) {
        if (!videoUrl) return { platform: 'unknown', id: null, embedUrl: null };
        
        // YouTube
        if (videoUrl.includes('youtube.com/watch') || videoUrl.includes('youtu.be/')) {
            let videoId = null;
            if (videoUrl.includes('youtube.com/watch')) {
                const urlParams = new URLSearchParams(videoUrl.split('?')[1]);
                videoId = urlParams.get('v');
            } else if (videoUrl.includes('youtu.be/')) {
                videoId = videoUrl.split('youtu.be/')[1];
            }
            return {
                platform: 'youtube',
                id: videoId,
                embedUrl: videoId ? `https://www.youtube.com/embed/${videoId}` : null
            };
        }
        
        // Facebook
        if (videoUrl.includes('facebook.com/')) {
            return {
                platform: 'facebook',
                id: videoUrl,
                embedUrl: videoUrl.replace('www.facebook.com', 'www.facebook.com/plugins/video.php')
            };
        }
        
        // Vimeo
        if (videoUrl.includes('vimeo.com/')) {
            const videoId = videoUrl.split('vimeo.com/')[1];
            return {
                platform: 'vimeo',
                id: videoId,
                embedUrl: videoId ? `https://player.vimeo.com/video/${videoId}` : null
            };
        }
        
        // Dailymotion
        if (videoUrl.includes('dailymotion.com/')) {
            const videoId = videoUrl.split('dailymotion.com/video/')[1];
            return {
                platform: 'dailymotion',
                id: videoId,
                embedUrl: videoId ? `https://www.dailymotion.com/embed/video/${videoId}` : null
            };
        }
        
        // Default fallback
        return {
            platform: 'unknown',
            id: videoUrl,
            embedUrl: videoUrl
        };
    }

    render() {
        const loading = this.get('loading');
        const colorsLoaded = this.get('colorsLoaded');
        const error = this.get('error');
        const videoGallery = this.get('videoGallery');
        
        // Get colors from state
        const primaryColor = this.get('primary_color');
        const secondaryColor = this.get('secondary_color');
        const accentColor = this.get('accent_color');
        const textColor = this.get('text_color');
        
        // Show loading if either colors or gallery data is still loading
        if (loading || !colorsLoaded) {
            return `<page-loader></page-loader>`;
        }

        if (!loading && (error || !videoGallery)) {
            return `
                <div class="flex items-center justify-center min-h-96">
                    <div class="text-center">
                        <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
                        <h1 class="text-2xl font-bold text-gray-800 mb-2">Video Gallery Not Found</h1>
                        <p class="text-gray-600 mb-6">The video gallery you're looking for doesn't exist or has been removed.</p>
                        <a href="/public/gallery" 
                           class="inline-flex items-center gap-2 px-6 py-3 bg-[${primaryColor}] text-[${textColor}] font-semibold rounded-lg hover:bg-[${accentColor}] transition-colors">
                            <i class="fas fa-arrow-left"></i>
                            Back to Gallery
                        </a>
                    </div>
                </div>
            `;
        }

        return `
            <!-- Breadcrumb -->
            <ui-breadcrumb separator="chevron" color="primary">
                <ui-breadcrumb-item href="/">Home</ui-breadcrumb-item>
                <ui-breadcrumb-item href="/public/gallery">Gallery</ui-breadcrumb-item>
                <ui-breadcrumb-item href="/public/gallery/videos">Videos</ui-breadcrumb-item>
                <ui-breadcrumb-item>${videoGallery.name ? videoGallery.name.charAt(0).toUpperCase() + videoGallery.name.slice(1) : 'Video Gallery Details'}</ui-breadcrumb-item>
            </ui-breadcrumb>

            <!-- Video Gallery Banner -->
            <div class="relative w-full h-96 bg-gradient-to-br from-[${primaryColor}] to-[${accentColor}] rounded-2xl overflow-hidden shadow-lg my-6 flex items-center justify-center">
                <div class="text-center text-white">
                    <i class="fas fa-video text-6xl mb-4"></i>
                    <p class="text-2xl font-semibold">${videoGallery.name}</p>
                    <p class="text-lg opacity-90">Video Gallery</p>
                </div>
                
                <!-- Share/Copy buttons - Absolute positioned at top-right corner -->
                <div class="absolute top-4 right-4 z-10 flex gap-3">
                    <i onclick="navigator.share ? navigator.share({title: '${videoGallery.name}', url: window.location.href}) : navigator.clipboard.writeText(window.location.href)" 
                       class="fas fa-share size-8 text-white hover:text-gray-200 cursor-pointer transition-colors bg-black bg-opacity-50 rounded-lg p-1.5 backdrop-blur-sm"></i>
                    <i onclick="this.closest('app-video-gallery-view').copyGalleryUrl()" 
                       class="fas fa-copy size-8 text-white hover:text-gray-200 cursor-pointer transition-colors bg-black bg-opacity-50 rounded-lg p-1.5 backdrop-blur-sm"></i>
                </div>
                
                <!-- Video Count Badge -->
                <div class="absolute top-6 left-6">
                    <span class="bg-black bg-opacity-50 text-white text-sm px-3 py-1 rounded-full backdrop-blur-sm">
                        ${videoGallery.video_links ? videoGallery.video_links.length : 0} ${videoGallery.video_links && videoGallery.video_links.length === 1 ? 'video' : 'videos'}
                    </span>
                </div>
            </div>

            <!-- Video Gallery Title and Description -->
            <div class="my-6">
                <h1 class="text-3xl lg:text-4xl font-bold text-[${secondaryColor}] mb-4">
                    ${videoGallery.name}
                </h1>
                ${videoGallery.description ? `
                    <p class="text-lg text-gray-600 leading-relaxed mb-4">
                        ${videoGallery.description}
                    </p>
                ` : ''}
                <div class="w-24 h-1 bg-gradient-to-r from-[${primaryColor}] to-[${accentColor}] rounded-full"></div>
            </div>

            <!-- Video Gallery Videos Grid -->
            ${videoGallery.video_links && videoGallery.video_links.length > 0 ? `
                <div class="bg-[${primaryColor}]/5 rounded-3xl shadow p-8 mb-6">
                    <div class="mb-6">
                        <h2 class="text-2xl font-bold text-[${secondaryColor}] mb-2">${videoGallery.video_links.length} Video${videoGallery.video_links.length === 1 ? '' : 's'}</h2>
                        <p class="text-gray-600">Watch all ${videoGallery.video_links.length} videos in this gallery</p>
                    </div>
                    
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        ${videoGallery.video_links.map((videoUrl, index) => {
                            const videoInfo = this.getVideoInfo(videoUrl);
                            return `
                                <div class="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                                    <div class="relative aspect-video">
                                        ${videoInfo.embedUrl ? `
                                            <iframe 
                                                src="${videoInfo.embedUrl}" 
                                                title="${videoGallery.name} - Video ${index + 1}"
                                                class="w-full h-full rounded-2xl"
                                                frameborder="0" 
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                                allowfullscreen>
                                            </iframe>
                                        ` : `
                                            <div class="w-full h-full bg-gray-100 rounded-2xl flex items-center justify-center">
                                                <div class="text-center">
                                                    <i class="fas fa-video text-gray-400 text-4xl mb-2"></i>
                                                    <p class="text-gray-500">Video not available</p>
                                                    <a href="${videoUrl}" target="_blank" class="text-blue-500 hover:underline mt-2 inline-block">
                                                        View on ${videoInfo.platform}
                                                    </a>
                                                </div>
                                            </div>
                                        `}
                                        
                                        <!-- Video Number Badge -->
                                        <div class="absolute top-3 left-3">
                                            <span class="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
                                                ${index + 1}
                                            </span>
                                        </div>
                                        
                                        <!-- Platform Badge -->
                                        <div class="absolute top-3 right-3">
                                            <span class="bg-[${primaryColor}] text-white text-xs px-2 py-1 rounded-full capitalize">
                                                ${videoInfo.platform}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <!-- Video Link -->
                                    <div class="p-4">
                                        <a href="${videoUrl}" target="_blank" 
                                           class="inline-flex items-center gap-2 text-[${primaryColor}] hover:text-[${accentColor}] transition-colors">
                                            <i class="fas fa-external-link-alt"></i>
                                            <span class="text-sm">View on ${videoInfo.platform}</span>
                                        </a>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            ` : `
                <div class="bg-white rounded-2xl shadow-lg p-8 mb-6 text-center">
                    <div class="w-32 h-32 bg-gradient-to-br from-[${primaryColor}] to-[${accentColor}] rounded-full flex items-center justify-center mx-auto mb-6">
                        <i class="fas fa-video text-white text-4xl"></i>
                    </div>
                    <h3 class="text-2xl font-bold text-[${secondaryColor}] mb-3">No Videos Available</h3>
                    <p class="text-gray-600 mb-6">This video gallery doesn't have any videos yet.</p>
                    <a href="/public/gallery" 
                       class="inline-flex items-center gap-2 px-6 py-3 bg-[${primaryColor}] text-[${textColor}] font-semibold rounded-lg hover:bg-[${accentColor}] transition-colors">
                        <i class="fas fa-arrow-left"></i>
                        Back to Gallery
                    </a>
                </div>
            `}
        `;
    }
}

customElements.define('app-video-gallery-view', VideoGalleryView);
export default VideoGalleryView; 