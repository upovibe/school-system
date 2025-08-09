import App from '@/core/App.js';
import '@/components/ui/Table.js';
import '@/components/ui/Button.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Skeleton.js';
import '@/components/layout/adminLayout/VideoGallerySettingsModal.js';
import '@/components/layout/adminLayout/VideoGalleryUpdateModal.js';
import '@/components/layout/adminLayout/VideoGalleryViewModal.js';
import '@/components/layout/adminLayout/VideoGalleryDeleteDialog.js';
import api from '@/services/api.js';

/**
 * Video Gallery Management Page
 * 
 * Dedicated page for managing video galleries
 */
class VideoGalleriesPage extends App {
    constructor() {
        super();
        this.videoGalleries = null;
        this.loading = true;
        this.showAddModal = false;
        this.showUpdateModal = false;
        this.showViewModal = false;
        this.showDeleteDialog = false;
        this.updateVideoGalleryData = null;
        this.viewVideoGalleryData = null;
        this.deleteVideoGalleryData = null;
        
        // Initialize state properly
        this.set('videoGalleries', null);
        this.set('loading', true);
        this.set('showAddModal', false);
        this.set('showUpdateModal', false);
        this.set('showViewModal', false);
        this.set('showDeleteDialog', false);
        this.set('updateVideoGalleryData', null);
        this.set('viewVideoGalleryData', null);
        this.set('deleteVideoGalleryData', null);
    }

    getHeaderCounts() {
        const videos = this.get('videoGalleries') || [];
        const total = videos.length;
        const active = videos.filter(v => v?.is_active === true || (v?.status?.toString?.().toLowerCase?.() === 'active')).length;
        const inactive = videos.filter(v => v?.is_active === false || (v?.status?.toString?.().toLowerCase?.() === 'inactive')).length;
        const categories = new Set(videos.map(v => v.category || 'Uncategorized')).size;
        return { total, active, inactive, categories };
    }

    renderHeader() {
        const c = this.getHeaderCounts();
        return `
            <div class="space-y-8 mb-4">
                <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-5 text-white">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
                        <div>
                            <h1 class="text-2xl sm:text-3xl font-bold">Video Galleries</h1>
                            <p class="text-blue-100 text-base sm:text-lg">Manage video gallery posts</p>
                        </div>
                        <div class="mt-4 sm:mt-0">
                            <div class="text-right">
                                <div class="text-xl sm:text-2xl font-bold">${c.total}</div>
                                <div class="text-blue-100 text-xs sm:text-sm">Total Items</div>
                            </div>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-6">
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-green-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-check text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.active}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Active</div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-yellow-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-pause-circle text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.inactive}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Inactive</div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-indigo-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-tags text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.categories}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Categories</div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-blue-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-video text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.total}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Records</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    connectedCallback() {
        super.connectedCallback();
        document.title = 'Video Gallery Management | School System';
        this.loadData();
        
        // Add event listeners for table events
        this.addEventListener('table-view', this.onView.bind(this));
        this.addEventListener('table-edit', this.onEdit.bind(this));
        this.addEventListener('table-delete', this.onDelete.bind(this));
        this.addEventListener('table-add', this.onAdd.bind(this));
        
        // Listen for success events to refresh data
        this.addEventListener('video-gallery-deleted', (event) => {
            // Remove the deleted video gallery from the current data
            const deletedVideoGalleryId = event.detail.videoGalleryId;
            const currentVideoGalleries = this.get('videoGalleries') || [];
            const updatedVideoGalleries = currentVideoGalleries.filter(videoGallery => videoGallery.id !== deletedVideoGalleryId);
            this.set('videoGalleries', updatedVideoGalleries);
            this.updateTableData();
            
            // Close the delete dialog
            this.set('showDeleteDialog', false);
        });
        
        this.addEventListener('video-gallery-saved', (event) => {
            // Add the new video gallery to the existing data
            const newVideoGallery = event.detail.videoGallery;
            if (newVideoGallery) {
                const currentVideoGalleries = this.get('videoGalleries') || [];
                this.set('videoGalleries', [...currentVideoGalleries, newVideoGallery]);
                this.updateTableData();
                // Close the add modal
                this.set('showAddModal', false);
            } else {
                this.loadData();
            }
        });
        
        this.addEventListener('video-gallery-updated', (event) => {
            // Update the existing video gallery in the data
            const updatedVideoGallery = event.detail.videoGallery;
            if (updatedVideoGallery) {
                const currentVideoGalleries = this.get('videoGalleries') || [];
                const updatedVideoGalleriesList = currentVideoGalleries.map(videoGallery => 
                    videoGallery.id === updatedVideoGallery.id ? updatedVideoGallery : videoGallery
                );
                this.set('videoGalleries', updatedVideoGalleriesList);
                this.updateTableData();
                // Close the update modal
                this.set('showUpdateModal', false);
            } else {
                this.loadData();
            }
        });
        
        this.addEventListener('video-gallery-video-deleted', (event) => {
            // Update the existing video gallery in the data when a video is deleted
            const updatedVideoGallery = event.detail.videoGallery;
            if (updatedVideoGallery) {
                const currentVideoGalleries = this.get('videoGalleries') || [];
                const updatedVideoGalleriesList = currentVideoGalleries.map(videoGallery => 
                    videoGallery.id === updatedVideoGallery.id ? updatedVideoGallery : videoGallery
                );
                this.set('videoGalleries', updatedVideoGalleriesList);
                this.updateTableData();
                // Update the view modal data if it's open
                if (this.get('showViewModal')) {
                    this.set('viewVideoGalleryData', updatedVideoGallery);
                    const viewModal = this.querySelector('video-gallery-view-modal');
                    if (viewModal) {
                        viewModal.setVideoGalleryData(updatedVideoGallery);
                    }
                }
            } else {
                this.loadData();
            }
        });
        
        // Listen for modal opened event to pass data
        this.addEventListener('modal-opened', (event) => {
            const modal = event.target;
            if (modal.tagName === 'VIDEO-GALLERY-UPDATE-MODAL') {
                const updateVideoGalleryData = this.get('updateVideoGalleryData');
                if (updateVideoGalleryData) {
                    modal.setVideoGalleryData(updateVideoGalleryData);
                }
            } else if (modal.tagName === 'VIDEO-GALLERY-VIEW-MODAL') {
                const viewVideoGalleryData = this.get('viewVideoGalleryData');
                if (viewVideoGalleryData) {
                    modal.setVideoGalleryData(viewVideoGalleryData);
                }
            }
        });
    }

    async loadData() {
        try {
            this.set('loading', true);
            
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Please log in to view data',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Load video galleries data
            const videoGalleriesResponse = await api.withToken(token).get('/video-galleries');
            this.set('videoGalleries', videoGalleriesResponse.data.data);
            
        } catch (error) {
            console.error('❌ Error loading video galleries:', error);
            
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to load video galleries',
                variant: 'error',
                duration: 3000
            });
        } finally {
            this.set('loading', false);
        }
    }

    onView(event) {
        const { detail } = event;
        const viewVideoGallery = this.get('videoGalleries').find(videoGallery => videoGallery.id === detail.row.id);
        if (viewVideoGallery) {
            this.closeAllModals();
            this.set('viewVideoGalleryData', viewVideoGallery);
            this.set('showViewModal', true);
            setTimeout(() => {
                const viewModal = this.querySelector('video-gallery-view-modal');
                if (viewModal) {
                    viewModal.setVideoGalleryData(viewVideoGallery);
                }
            }, 0);
        }
    }

    onEdit(event) {
        const { detail } = event;
        const editVideoGallery = this.get('videoGalleries').find(videoGallery => videoGallery.id === detail.row.id);
        if (editVideoGallery) {
            this.closeAllModals();
            this.set('updateVideoGalleryData', editVideoGallery);
            this.set('showUpdateModal', true);
            setTimeout(() => {
                const updateModal = this.querySelector('video-gallery-update-modal');
                if (updateModal) {
                    updateModal.setVideoGalleryData(editVideoGallery);
                }
            }, 0);
        }
    }

    onDelete(event) {
        const { detail } = event;
        const deleteVideoGallery = this.get('videoGalleries').find(videoGallery => videoGallery.id === detail.row.id);
        if (deleteVideoGallery) {
            this.closeAllModals();
            this.set('deleteVideoGalleryData', deleteVideoGallery);
            this.set('showDeleteDialog', true);
            setTimeout(() => {
                const deleteDialog = this.querySelector('video-gallery-delete-dialog');
                if (deleteDialog) {
                    deleteDialog.setVideoGalleryData(deleteVideoGallery);
                }
            }, 0);
        }
    }

    onAdd(event) {
        this.closeAllModals();
        this.set('showAddModal', true);
    }

    onRefresh(event) {
        this.loadData();
    }

    // Update table data without full page reload
    updateTableData() {
        const videoGalleries = this.get('videoGalleries');
        
        if (videoGalleries) {
            // Prepare video gallery table data
            const videoTableData = videoGalleries.map((videoGallery, index) => ({
                id: videoGallery.id,
                index: index + 1,
                name: videoGallery.name,
                slug: videoGallery.slug,
                videos_count: videoGallery.video_links ? videoGallery.video_links.length : 0,
                status: videoGallery.is_active ? 'Active' : 'Inactive',
                created: new Date(videoGallery.created_at).toLocaleString(),
                updated: new Date(videoGallery.updated_at).toLocaleString(),
            }));

            // Find the video table component and update its data
            const videoTableComponent = this.querySelector('ui-table');
            if (videoTableComponent) {
                videoTableComponent.setAttribute('data', JSON.stringify(videoTableData));
            }
        }
    }

    // Close all modals and dialogs
    closeAllModals() {
        this.set('showAddModal', false);
        this.set('showUpdateModal', false);
        this.set('showViewModal', false);
        this.set('showDeleteDialog', false);
        this.set('updateVideoGalleryData', null);
        this.set('viewVideoGalleryData', null);
        this.set('deleteVideoGalleryData', null);
    }

    render() {
        const videoGalleries = this.get('videoGalleries');
        const loading = this.get('loading');
        const showAddModal = this.get('showAddModal');
        const showUpdateModal = this.get('showUpdateModal');
        const showViewModal = this.get('showViewModal');
        const showDeleteDialog = this.get('showDeleteDialog');
        
        const videoTableData = videoGalleries ? videoGalleries.map((videoGallery, index) => ({
            id: videoGallery.id,
            index: index + 1,
            name: videoGallery.name,
            slug: videoGallery.slug,
            videos_count: videoGallery.video_links ? videoGallery.video_links.length : 0,
            status: videoGallery.is_active ? 'Active' : 'Inactive',
            created: new Date(videoGallery.created_at).toLocaleString(),
            updated: new Date(videoGallery.updated_at).toLocaleString(),
        })) : [];

        const videoTableColumns = [
            { key: 'index', label: 'No.' },
            { key: 'name', label: 'Name' },
            { key: 'videos_count', label: 'Videos' },
            { key: 'status', label: 'Status' },
            { key: 'updated', label: 'Updated' }
        ];
        
        return `
            ${this.renderHeader()}
            <div class="bg-white rounded-lg shadow-lg p-4">
                ${loading ? `
                    <!-- Video Galleries Skeleton Loading -->
                    <div class="space-y-4">
                        <ui-skeleton class="h-24 w-full"></ui-skeleton>
                        <ui-skeleton class="h-24 w-full"></ui-skeleton>
                        <ui-skeleton class="h-24 w-full"></ui-skeleton>
                    </div>
                ` : `
                    <!-- Video Galleries Table Section -->
                    <div class="mb-8">
                        <ui-table 
                            title="Video Gallery Management"
                            data='${JSON.stringify(videoTableData)}'
                            columns='${JSON.stringify(videoTableColumns)}'
                            sortable
                            searchable
                            search-placeholder="Search video galleries..."
                            pagination
                            page-size="50"
                            action
                            addable
                            refresh
                            print
                            bordered
                            striped
                            class="w-full">
                        </ui-table>
                    </div>
                `}
            </div>
            
            <!-- Video Gallery Modals and Dialogs -->
            <video-gallery-settings-modal ${showAddModal ? 'open' : ''}></video-gallery-settings-modal>
            <video-gallery-update-modal ${showUpdateModal ? 'open' : ''}></video-gallery-update-modal>
            <video-gallery-view-modal id="video-view-modal" ${showViewModal ? 'open' : ''}></video-gallery-view-modal>
            <video-gallery-delete-dialog ${showDeleteDialog ? 'open' : ''}></video-gallery-delete-dialog>
        `;
    }
}

customElements.define('app-video-galleries-page', VideoGalleriesPage);
export default VideoGalleriesPage; 