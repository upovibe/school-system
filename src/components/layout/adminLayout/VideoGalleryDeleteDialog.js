import App from '@/core/App.js';
import '@/components/ui/Dialog.js';
import '@/components/ui/Button.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

/**
 * Video Gallery Delete Dialog Component
 * 
 * Dialog for confirming video gallery deletion
 */
class VideoGalleryDeleteDialog extends App {
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
        // Listen for confirm button click (Delete Video Gallery)
        this.addEventListener('confirm', () => {
            this.handleDelete();
        });

        // Listen for cancel button click
        this.addEventListener('cancel', () => {
            this.close();
        });
    }

    setVideoGalleryData(data) {
        this.set('videoGalleryData', data);
    }

    async handleDelete() {
        const videoGalleryData = this.get('videoGalleryData');
        if (!videoGalleryData || !videoGalleryData.id) {
            Toast.show({
                title: 'Error',
                message: 'Video gallery data not found',
                variant: 'error',
                duration: 3000
            });
            return;
        }

        try {
            this.set('loading', true);

            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Please log in to delete video gallery',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            await api.withToken(token).delete(`/video-galleries/${videoGalleryData.id}`);

            Toast.show({
                title: 'Success',
                message: 'Video gallery deleted successfully',
                variant: 'success',
                duration: 3000
            });

            // Dispatch event to parent component
            this.dispatchEvent(new CustomEvent('video-gallery-deleted', {
                detail: { videoGalleryId: videoGalleryData.id },
                bubbles: true
            }));

            this.close();

        } catch (error) {
            console.error('❌ Error deleting video gallery:', error);
            
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to delete video gallery',
                variant: 'error',
                duration: 3000
            });
        } finally {
            this.set('loading', false);
        }
    }

    close() {
        const dialog = this.querySelector('ui-dialog');
        if (dialog) {
            dialog.close();
        }
    }

    render() {
        const videoGalleryData = this.get('videoGalleryData');
        const loading = this.get('loading');

        if (!videoGalleryData) {
            return `<ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                title="Delete Video Gallery">
                <div class="text-center py-8 text-gray-500">
                    <p>No video gallery data available</p>
                </div>
            </ui-dialog>`;
        }

        return `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                title="Delete Video Gallery">
                <div class="space-y-4">
                    <div class="text-center">
                        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                            <i class="fas fa-exclamation-triangle text-red-600 text-xl"></i>
                        </div>
                        <h3 class="text-lg font-medium text-gray-900 mb-2">
                            Delete Video Gallery
                        </h3>
                        <p class="text-sm text-gray-500">
                            Are you sure you want to delete the video gallery 
                            <strong>"${videoGalleryData.name}"</strong>? 
                            This action cannot be undone.
                        </p>
                    </div>

                    ${videoGalleryData.video_links && videoGalleryData.video_links.length > 0 ? `
                        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div class="flex">
                                <div class="flex-shrink-0">
                                    <i class="fas fa-info-circle text-yellow-400"></i>
                                </div>
                                <div class="ml-3">
                                    <h3 class="text-sm font-medium text-yellow-800">
                                        Warning
                                    </h3>
                                    <div class="mt-2 text-sm text-yellow-700">
                                        <p>
                                            This gallery contains ${videoGalleryData.video_links.length} video(s). 
                                            All videos will be permanently removed.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('video-gallery-delete-dialog', VideoGalleryDeleteDialog);
export default VideoGalleryDeleteDialog; 