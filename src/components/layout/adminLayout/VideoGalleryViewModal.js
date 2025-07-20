import App from '@/core/App.js';
import '@/components/ui/Modal.js';
import '@/components/ui/Button.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

/**
 * Video Gallery View Modal Component
 * 
 * Modal for viewing video galleries with embedded videos
 */
class VideoGalleryViewModal extends App {
    constructor() {
        super();
        this.videoGalleryData = null;
        this.loading = false;
        
        this.set('videoGalleryData', null);
        this.set('loading', false);
    }

    connectedCallback() {
        super.connectedCallback();
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.addEventListener('click', (e) => {
            const copyButton = e.target.closest('[data-action="copy-link"]');
            if (copyButton) {
                e.preventDefault();
                const link = copyButton.dataset.link;
                this.copyToClipboard(link);
            }

            const shareButton = e.target.closest('[data-action="share-link"]');
            if (shareButton) {
                e.preventDefault();
                const link = shareButton.dataset.link;
                this.shareLink(link);
            }

            const deleteButton = e.target.closest('[data-action="delete-video"]');
            if (deleteButton) {
                e.preventDefault();
                const index = parseInt(deleteButton.dataset.index);
                this.deleteVideo(index);
            }
        });
    }

    setVideoGalleryData(data) {
        this.set('videoGalleryData', data);
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            Toast.show({
                title: 'Success',
                message: 'Link copied to clipboard',
                variant: 'success',
                duration: 2000
            });
        }).catch(() => {
            Toast.show({
                title: 'Error',
                message: 'Failed to copy link',
                variant: 'error',
                duration: 2000
            });
        });
    }

    shareLink(link) {
        if (navigator.share) {
            navigator.share({
                title: 'Video Gallery',
                text: 'Check out this video gallery',
                url: link
            });
        } else {
            this.copyToClipboard(link);
        }
    }

    async deleteVideo(index) {
        const videoGalleryData = this.get('videoGalleryData');
        if (!videoGalleryData || !videoGalleryData.video_links) return;

        const videoLinks = [...videoGalleryData.video_links];
        const deletedLink = videoLinks[index];
        videoLinks.splice(index, 1);
        
        try {
            this.set('loading', true);

            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Please log in to delete video',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            const data = {
                name: videoGalleryData.name,
                description: videoGalleryData.description,
                is_active: videoGalleryData.is_active,
                video_links: videoLinks
            };

            const response = await api.withToken(token).put(`/video-galleries/${videoGalleryData.id}`, data);

            Toast.show({
                title: 'Success',
                message: 'Video deleted successfully',
                variant: 'success',
                duration: 3000
            });

            // Update the local data
            videoGalleryData.video_links = videoLinks;
            this.set('videoGalleryData', { ...videoGalleryData });

            // Dispatch event to parent component
            this.dispatchEvent(new CustomEvent('video-gallery-video-deleted', {
                detail: { videoGallery: response.data.data },
                bubbles: true
            }));

        } catch (error) {
            console.error('❌ Error deleting video:', error);
            
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to delete video',
                variant: 'error',
                duration: 3000
            });
        } finally {
            this.set('loading', false);
        }
    }

    getEmbedUrl(url) {
        if (!url) return null;

        // YouTube
        if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
            const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
            return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
        }

        // Facebook
        if (url.includes('facebook.com/') && url.includes('/videos/')) {
            const videoId = url.match(/\/videos\/(\d+)/)?.[1];
            return videoId ? `https://www.facebook.com/plugins/video.php?href=https://www.facebook.com/videos/${videoId}` : null;
        }

        // Vimeo
        if (url.includes('vimeo.com/')) {
            const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
            return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
        }

        // Dailymotion
        if (url.includes('dailymotion.com/video/')) {
            const videoId = url.match(/dailymotion\.com\/video\/([^_]+)/)?.[1];
            return videoId ? `https://www.dailymotion.com/embed/video/${videoId}` : null;
        }

        return null;
    }

    close() {
        const modal = this.querySelector('ui-modal');
        if (modal) {
            modal.close();
        }
    }

    render() {
        const videoGalleryData = this.get('videoGalleryData');
        const loading = this.get('loading');

        if (!videoGalleryData) {
            return `<ui-modal title="View Video Gallery" size="xl">
                <div class="text-center py-8 text-gray-500">
                    <p>No video gallery data available</p>
                </div>
            </ui-modal>`;
        }

        return `
            <ui-modal title="View Video Gallery" size="xl">
                <div class="space-y-6">
                    <!-- Gallery Info -->
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">${videoGalleryData.name}</h3>
                        ${videoGalleryData.description ? `
                            <p class="text-gray-600 mb-3">${videoGalleryData.description}</p>
                        ` : ''}
                        <div class="flex items-center gap-4 text-sm text-gray-500">
                            <span>Status: ${videoGalleryData.is_active ? 'Active' : 'Inactive'}</span>
                            <span>Videos: ${videoGalleryData.video_links ? videoGalleryData.video_links.length : 0}</span>
                            <span>Created: ${new Date(videoGalleryData.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>

                    <!-- Videos Grid -->
                    ${videoGalleryData.video_links && videoGalleryData.video_links.length > 0 ? `
                        <div>
                            <h4 class="text-md font-medium text-gray-700 mb-4">Videos</h4>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                ${videoGalleryData.video_links.map((link, index) => {
                                    const embedUrl = this.getEmbedUrl(link);
                                    return `
                                        <div class="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                            <div class="aspect-video bg-gray-100">
                                                ${embedUrl ? `
                                                    <iframe 
                                                        src="${embedUrl}" 
                                                        frameborder="0" 
                                                        allowfullscreen
                                                        class="w-full h-full">
                                                    </iframe>
                                                ` : `
                                                    <div class="flex items-center justify-center h-full">
                                                        <p class="text-gray-500 text-sm">Unsupported video format</p>
                                                    </div>
                                                `}
                                            </div>
                                            <div class="p-4">
                                                <div class="flex items-center justify-between mb-2">
                                                    <span class="text-sm text-gray-600">Video ${index + 1}</span>
                                                    <ui-button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        data-action="delete-video"
                                                        data-index="${index}"
                                                        class="text-red-500 hover:text-red-700">
                                                        <i class="fas fa-trash"></i>
                                                    </ui-button>
                                                </div>
                                                <p class="text-xs text-gray-500 truncate mb-3">${link}</p>
                                                <div class="flex gap-2">
                                                    <ui-button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        data-action="copy-link"
                                                        data-link="${link}"
                                                        class="flex-1">
                                                        <i class="fas fa-copy mr-1"></i>
                                                        Copy
                                                    </ui-button>
                                                    <ui-button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        data-action="share-link"
                                                        data-link="${link}"
                                                        class="flex-1">
                                                        <i class="fas fa-share mr-1"></i>
                                                        Share
                                                    </ui-button>
                                                </div>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    ` : `
                        <div class="text-center py-8 text-gray-500">
                            <p>No videos in this gallery</p>
                        </div>
                    `}
                </div>

                <div slot="footer" class="flex justify-end">
                    <ui-button
                        type="button"
                        variant="outline"
                        @click="${() => this.close()}"
                        disabled="${loading}">
                        Close
                    </ui-button>
                </div>
            </ui-modal>
        `;
    }
}

customElements.define('video-gallery-view-modal', VideoGalleryViewModal);
export default VideoGalleryViewModal; 