import App from '@/core/App.js';
import '@/components/ui/Modal.js';
import '@/components/ui/Button.js';
import '@/components/ui/Input.js';
import '@/components/ui/Textarea.js';
import '@/components/ui/FileUpload.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Wysiwyg.js';
import api from '@/services/api.js';

/**
 * News Update Modal Component
 * 
 * Modal for updating existing news articles
 */
class NewsUpdateModal extends App {
    constructor() {
        super();
        this.newsData = null;
        this.formData = {
            title: '',
            content: '',
            is_active: true
        };
        this.loading = false;
        this.bannerFile = null;
        this.currentBanner = null;
    }

    connectedCallback() {
        super.connectedCallback();
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.addEventListener('modal-close', () => {
            this.resetForm();
        });

        this.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
    }

    setNewsData(newsData) {
        this.set('newsData', newsData);
        this.set('formData', {
            title: newsData.title || '',
            content: newsData.content || '',
            is_active: newsData.is_active || true
        });
        this.set('currentBanner', newsData.banner_image || null);
        this.set('bannerFile', null);
    }

    resetForm() {
        this.set('newsData', null);
        this.set('formData', {
            title: '',
            content: '',
            is_active: true
        });
        this.set('bannerFile', null);
        this.set('currentBanner', null);
        this.set('loading', false);
        
        // Reset form elements
        const form = this.querySelector('form');
        if (form) {
            form.reset();
        }
        
        // Reset WYSIWYG editor
        const wysiwyg = this.querySelector('ui-wysiwyg');
        if (wysiwyg) {
            wysiwyg.setContent('');
        }
    }

    async handleSubmit() {
        try {
            this.set('loading', true);

            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Please log in to update news',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            const newsData = this.get('newsData');
            const formData = this.get('formData');
            const bannerFile = this.get('bannerFile');

            if (!newsData || !newsData.id) {
                Toast.show({
                    title: 'Error',
                    message: 'No news data to update',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Validate required fields
            if (!formData.title.trim()) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Title is required',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            if (!formData.content.trim()) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Content is required',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Prepare form data for multipart upload
            const submitData = new FormData();
            submitData.append('title', formData.title.trim());
            submitData.append('content', formData.content.trim());
            submitData.append('is_active', formData.is_active ? '1' : '0');

            if (bannerFile) {
                submitData.append('banner', bannerFile);
            }

            // Update news
            const response = await api.withToken(token).put(`/news/${newsData.id}`, submitData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                Toast.show({
                    title: 'Success',
                    message: 'News updated successfully',
                    variant: 'success',
                    duration: 3000
                });

                // Dispatch event with updated news data
                this.dispatchEvent(new CustomEvent('news-updated', {
                    detail: { news: response.data.data }
                }));

                // Close modal
                const modal = this.querySelector('ui-modal');
                if (modal) {
                    modal.close();
                }
            }

        } catch (error) {
            console.error('❌ Error updating news:', error);
            
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to update news',
                variant: 'error',
                duration: 3000
            });
        } finally {
            this.set('loading', false);
        }
    }

    onTitleChange(event) {
        const title = event.target.value;
        this.set('formData', { ...this.get('formData'), title });
    }

    onContentChange(event) {
        const content = event.detail.content;
        this.set('formData', { ...this.get('formData'), content });
    }

    onActiveChange(event) {
        const is_active = event.target.checked;
        this.set('formData', { ...this.get('formData'), is_active });
    }

    onBannerChange(event) {
        const file = event.detail.file;
        this.set('bannerFile', file);
    }

    getImageUrl(imagePath) {
        if (!imagePath) return '';
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
        }
        if (imagePath.startsWith('/')) {
            const baseUrl = window.location.origin;
            return baseUrl + imagePath;
        }
        const baseUrl = window.location.origin;
        const apiPath = '/api';
        return baseUrl + apiPath + '/' + imagePath;
    }

    render() {
        const newsData = this.get('newsData');
        const formData = this.get('formData') || {
            title: '',
            content: '',
            is_active: true
        };
        const loading = this.get('loading');
        const open = this.hasAttribute('open');
        const currentBanner = this.get('currentBanner');

        if (!newsData) {
            return `<ui-modal ${open ? 'open' : ''} size="lg">
                <div slot="header">
                    <h2 class="text-lg font-semibold text-gray-900">Update News Article</h2>
                </div>
                <div class="p-6 text-center text-gray-500">
                    No news data available
                </div>
            </ui-modal>`;
        }

        return `
            <ui-modal ${open ? 'open' : ''} size="lg">
                <div slot="header" class="flex items-center justify-between">
                    <h2 class="text-lg font-semibold text-gray-900">Update News Article</h2>
                </div>

                <form @submit="${this.handleSubmit.bind(this)}" class="space-y-6">
                    <!-- Title -->
                    <div>
                        <label for="title" class="block text-sm font-medium text-gray-700 mb-2">
                            Title *
                        </label>
                        <ui-input
                            id="title"
                            name="title"
                            value="${formData.title}"
                            placeholder="Enter news title"
                            required
                            @input="${this.onTitleChange.bind(this)}"
                        ></ui-input>
                    </div>

                    <!-- Banner Image -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Banner Image
                        </label>
                        ${currentBanner ? `
                            <div class="mb-3">
                                <p class="text-sm text-gray-600 mb-2">Current banner:</p>
                                <img src="${this.getImageUrl(currentBanner)}" alt="Current banner" class="w-full max-w-md h-32 object-cover rounded-lg border">
                            </div>
                        ` : ''}
                        <ui-file-upload
                            accept="image/*"
                            max-size="5MB"
                            @file-selected="${this.onBannerChange.bind(this)}"
                        ></ui-file-upload>
                        <p class="text-xs text-gray-500 mt-1">
                            Recommended size: 1200x600px. Max file size: 5MB
                        </p>
                    </div>

                    <!-- Content -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Content *
                        </label>
                        <ui-wysiwyg
                            content="${formData.content}"
                            placeholder="Enter news content..."
                            @content-change="${this.onContentChange.bind(this)}"
                        ></ui-wysiwyg>
                    </div>

                    <!-- Active Status -->
                    <div class="flex items-center">
                        <input
                            type="checkbox"
                            id="is_active"
                            name="is_active"
                            ${formData.is_active ? 'checked' : ''}
                            @change="${this.onActiveChange.bind(this)}"
                            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        >
                        <label for="is_active" class="ml-2 block text-sm text-gray-900">
                            Active (published)
                        </label>
                    </div>
                </form>

                <div slot="footer" class="flex justify-end space-x-3">
                    <ui-button
                        variant="outline"
                        @click="${() => {
                            const modal = this.querySelector('ui-modal');
                            if (modal) modal.close();
                        }}"
                        disabled="${loading}"
                    >
                        Cancel
                    </ui-button>
                    <ui-button
                        type="submit"
                        variant="primary"
                        @click="${this.handleSubmit.bind(this)}"
                        loading="${loading}"
                        disabled="${loading}"
                    >
                        ${loading ? 'Updating...' : 'Update News'}
                    </ui-button>
                </div>
            </ui-modal>
        `;
    }
}

customElements.define('news-update-modal', NewsUpdateModal);
export default NewsUpdateModal; 