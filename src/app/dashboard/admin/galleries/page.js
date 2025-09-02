import App from '@/core/App.js';
import '@/components/ui/Card.js';
import '@/components/ui/Button.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Table.js';
import '@/components/ui/Skeleton.js';
import '@/components/ui/Dialog.js';

import '@/components/layout/adminLayout/GallerySettingsModal.js';
import '@/components/layout/adminLayout/GalleryUpdateModal.js';
import '@/components/layout/adminLayout/GalleryViewModal.js';
import '@/components/layout/adminLayout/GalleryDeleteDialog.js';
import api from '@/services/api.js';

/**
 * Gallery Management Page
 * 
 * Displays gallery data using Table component
 */
class GalleriesPage extends App {
    constructor() {
        super();
        this.galleries = null;
        this.loading = true; // Start with loading true
        this.showAddModal = false;
        this.showUpdateModal = false;
        this.showViewModal = false;
        this.showDeleteDialog = false;
        this.updateGalleryData = null;
        this.viewGalleryData = null;
        this.deleteGalleryData = null;
        
        // Initialize state properly
        this.set('galleries', null);
        this.set('loading', true); // Start with loading true
        this.set('showAddModal', false);
        this.set('showUpdateModal', false);
        this.set('showViewModal', false);
        this.set('showDeleteDialog', false);
        this.set('updateGalleryData', null);
        this.set('viewGalleryData', null);
        this.set('deleteGalleryData', null);
    }

    getHeaderCounts() {
        const galleries = this.get('galleries') || [];
        const total = galleries.length;
        const active = galleries.filter(g => g?.is_active === true || (g?.status?.toString?.().toLowerCase?.() === 'active')).length;
        const inactive = galleries.filter(g => g?.is_active === false || (g?.status?.toString?.().toLowerCase?.() === 'inactive')).length;
        const categories = new Set(galleries.map(g => g.category || 'Uncategorized')).size;
        return { total, active, inactive, categories };
    }

    renderHeader() {
        const c = this.getHeaderCounts();
        return `
            <div class="space-y-8 mb-4">
                <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-5 text-white">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
                        <div>
                            <div class="flex items-center gap-2">
                                <h1 class="text-2xl sm:text-3xl font-bold">Galleries</h1>
                                <button class="text-white/90 mt-2 hover:text-white transition-colors" data-action="show-galleries-info" title="About Galleries">
                                    <i class="fas fa-question-circle text-lg"></i>
                                </button>
                            </div>
                            <p class="text-blue-100 text-base sm:text-lg">Manage image galleries</p>
                        </div>
                        <div class="mt-4 sm:mt-0">
                            <div class="text-right">
                                <div class="text-xl sm:text-2xl font-bold">${c.total}</div>
                                <div class="text-blue-100 text-xs sm:text-sm">Total Galleries</div>
                            </div>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
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
                                    <i class="fas fa-images text-white text-lg sm:text-xl"></i>
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
        document.title = 'Photo Gallery Management | School System';
        this.loadData();
        this.addEventListener('click', this.handleHeaderActions.bind(this));
        
        // Add event listeners for table events
        this.addEventListener('table-view', this.onView.bind(this));
        this.addEventListener('table-edit', this.onEdit.bind(this));
        this.addEventListener('table-delete', this.onDelete.bind(this));
        this.addEventListener('table-add', this.onAdd.bind(this));
        
        // Listen for success events to refresh data
        this.addEventListener('gallery-deleted', (event) => {
            // Remove the deleted gallery from the current data
            const deletedGalleryId = event.detail.galleryId;
            const currentGalleries = this.get('galleries') || [];
            const updatedGalleries = currentGalleries.filter(gallery => gallery.id !== deletedGalleryId);
            this.set('galleries', updatedGalleries);
            this.updateTableData();
            
            // Close the delete dialog
            this.set('showDeleteDialog', false);
        });
        
        this.addEventListener('gallery-saved', (event) => {
            // Add the new gallery to the existing data
            const newGallery = event.detail.gallery;
            if (newGallery) {
                const currentGalleries = this.get('galleries') || [];
                this.set('galleries', [...currentGalleries, newGallery]);
                this.updateTableData();
                // Close the add modal
                this.set('showAddModal', false);
            } else {
                this.loadData();
            }
        });
        
        this.addEventListener('gallery-updated', (event) => {
            // Update the existing gallery in the data
            const updatedGallery = event.detail.gallery;
            if (updatedGallery) {
                const currentGalleries = this.get('galleries') || [];
                const updatedGalleriesList = currentGalleries.map(gallery => 
                    gallery.id === updatedGallery.id ? updatedGallery : gallery
                );
                this.set('galleries', updatedGalleriesList);
                this.updateTableData();
                // Close the update modal
                this.set('showUpdateModal', false);
            } else {
                this.loadData();
            }
        });
        
        this.addEventListener('gallery-image-deleted', (event) => {
            // Update the existing gallery in the data when an image is deleted
            const updatedGallery = event.detail.gallery;
            if (updatedGallery) {
                const currentGalleries = this.get('galleries') || [];
                const updatedGalleriesList = currentGalleries.map(gallery => 
                    gallery.id === updatedGallery.id ? updatedGallery : gallery
                );
                this.set('galleries', updatedGalleriesList);
                this.updateTableData();
                // Update the view modal data if it's open
                if (this.get('showViewModal')) {
                    this.set('viewGalleryData', updatedGallery);
                    const viewModal = this.querySelector('gallery-view-modal');
                    if (viewModal) {
                        viewModal.setGalleryData(updatedGallery);
                    }
                }
            } else {
                this.loadData();
            }
        });
        
        // Listen for modal opened event to pass data
        this.addEventListener('modal-opened', (event) => {
            const modal = event.target;
            if (modal.tagName === 'GALLERY-UPDATE-MODAL') {
                const updateGalleryData = this.get('updateGalleryData');
                if (updateGalleryData) {
                    modal.setGalleryData(updateGalleryData);
                }
            } else if (modal.tagName === 'GALLERY-VIEW-MODAL') {
                const viewGalleryData = this.get('viewGalleryData');
                if (viewGalleryData) {
                    modal.setGalleryData(viewGalleryData);
                }
            }
        });


    }

    handleHeaderActions(event) {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        const action = button.getAttribute('data-action');
        if (action === 'show-galleries-info') {
            this.showGalleriesInfo();
        }
    }

    showGalleriesInfo() {
        const dialog = document.createElement('ui-dialog');
        dialog.setAttribute('open', '');
        dialog.innerHTML = `
            <div slot="header" class="flex items-center">
                <i class="fas fa-images text-blue-500 mr-2"></i>
                <span class="font-semibold">About Galleries</span>
            </div>
            <div slot="content" class="space-y-4">
                <div>
                    <h4 class="font-semibold text-gray-900 mb-2">What is managed here?</h4>
                    <p class="text-gray-700">Photo galleries used on the public site. Organize images by gallery and category; control visibility with status.</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Name & Slug</span>
                        <span class="text-sm text-gray-600">Public title and unique URL key</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Images</span>
                        <span class="text-sm text-gray-600">Upload and manage gallery photos</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Status</span>
                        <span class="text-sm text-gray-600">Active galleries appear on the website</span>
                    </div>
                </div>
            </div>
            <div slot="footer" class="flex justify-end">
                <ui-button color="primary" onclick="this.closest('ui-dialog').close()">Got it</ui-button>
            </div>
        `;
        document.body.appendChild(dialog);
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

            // Load photo galleries data
            const galleriesResponse = await api.withToken(token).get('/galleries');
            this.set('galleries', galleriesResponse.data.data);
            
        } catch (error) {
            console.error('❌ Error loading data:', error);
            
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to load galleries data',
                variant: 'error',
                duration: 3000
            });
        } finally {
            this.set('loading', false);
        }
    }

    // Action handlers
    onView(event) {
        const { detail } = event;
        const viewGallery = this.get('galleries').find(gallery => gallery.id === detail.row.id);
        if (viewGallery) {
            this.closeAllModals();
            this.set('viewGalleryData', viewGallery);
            this.set('showViewModal', true);
            setTimeout(() => {
                const viewModal = this.querySelector('gallery-view-modal');
                if (viewModal) {
                    viewModal.setGalleryData(viewGallery);
                }
            }, 0);
        }
    }

    onEdit(event) {
        const { detail } = event;
        const editGallery = this.get('galleries').find(gallery => gallery.id === detail.row.id);
        if (editGallery) {
            this.closeAllModals();
            this.set('updateGalleryData', editGallery);
            this.set('showUpdateModal', true);
            setTimeout(() => {
                const updateModal = this.querySelector('gallery-update-modal');
                if (updateModal) {
                    updateModal.setGalleryData(editGallery);
                }
            }, 0);
        }
    }

    onDelete(event) {
        const { detail } = event;
        const deleteGallery = this.get('galleries').find(gallery => gallery.id === detail.row.id);
        if (deleteGallery) {
            this.closeAllModals();
            this.set('deleteGalleryData', deleteGallery);
            this.set('showDeleteDialog', true);
            setTimeout(() => {
                const deleteDialog = this.querySelector('gallery-delete-dialog');
                if (deleteDialog) {
                    deleteDialog.setGalleryData(deleteGallery);
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
        const galleries = this.get('galleries');
        
        if (galleries) {
            // Prepare gallery table data
            const tableData = galleries.map((gallery, index) => ({
                id: gallery.id,
                index: index + 1,
                name: gallery.name,
                slug: gallery.slug,
                images_count: gallery.images ? gallery.images.length : 0,
                status: gallery.is_active ? 'Active' : 'Inactive',
                created: new Date(gallery.created_at).toLocaleString(),
                updated: new Date(gallery.updated_at).toLocaleString(),
            }));

            // Find the table component and update its data
            const tableComponent = this.querySelector('ui-table');
            if (tableComponent) {
                tableComponent.setAttribute('data', JSON.stringify(tableData));
            }
        }
    }

    // Close all modals and dialogs
    closeAllModals() {
        this.set('showAddModal', false);
        this.set('showUpdateModal', false);
        this.set('showViewModal', false);
        this.set('showDeleteDialog', false);
        this.set('updateGalleryData', null);
        this.set('viewGalleryData', null);
        this.set('deleteGalleryData', null);
    }

    render() {
        const galleries = this.get('galleries');
        const loading = this.get('loading');
        const showAddModal = this.get('showAddModal');
        const showUpdateModal = this.get('showUpdateModal');
        const showViewModal = this.get('showViewModal');
        const showDeleteDialog = this.get('showDeleteDialog');
        
        const tableData = galleries ? galleries.map((gallery, index) => ({
            id: gallery.id,
            index: index + 1,
            name: gallery.name,
            slug: gallery.slug,
            images_count: gallery.images ? gallery.images.length : 0,
            status: gallery.is_active ? 'Active' : 'Inactive',
            created: new Date(gallery.created_at).toLocaleString(),
            updated: new Date(gallery.updated_at).toLocaleString(),
        })) : [];

        const tableColumns = [
            { key: 'index', label: 'No.' },
            { key: 'name', label: 'Name' },
            { key: 'images_count', label: 'Images' },
            { key: 'status', label: 'Status' },
            { key: 'updated', label: 'Updated' }
        ];
        
        return `
            ${this.renderHeader()}
            <div class="bg-white rounded-lg shadow-lg p-4">
                ${loading ? `
                    <!-- Gallery Skeleton Loading -->
                    <div class="space-y-4">
                        <ui-skeleton class="h-24 w-full"></ui-skeleton>
                        <ui-skeleton class="h-24 w-full"></ui-skeleton>
                        <ui-skeleton class="h-24 w-full"></ui-skeleton>
                    </div>
                ` : `
                    <!-- Gallery Table Section -->
                    <div class="mb-8">
                        <ui-table 
                            title="Gallery Management"
                            data='${JSON.stringify(tableData)}'
                            columns='${JSON.stringify(tableColumns)}'
                            sortable
                            searchable
                            search-placeholder="Search galleries..."
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
            
            <!-- Modals and Dialogs -->
            <gallery-settings-modal ${showAddModal ? 'open' : ''}></gallery-settings-modal>
            <gallery-update-modal ${showUpdateModal ? 'open' : ''}></gallery-update-modal>
            <gallery-view-modal id="view-modal" ${showViewModal ? 'open' : ''}></gallery-view-modal>
            <gallery-delete-dialog ${showDeleteDialog ? 'open' : ''}></gallery-delete-dialog>
        `;
    }
}

customElements.define('app-galleries-page', GalleriesPage);
export default GalleriesPage; 