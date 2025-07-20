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
        this.loading = false;
        this.showAddModal = false;
        this.showUpdateModal = false;
        this.showViewModal = false;
        this.showDeleteDialog = false;
        this.updateGalleryData = null;
        this.viewGalleryData = null;
        this.deleteGalleryData = null;
        
        // Initialize state properly
        this.set('galleries', null);
        this.set('loading', false);
        this.set('showAddModal', false);
        this.set('showUpdateModal', false);
        this.set('showViewModal', false);
        this.set('showDeleteDialog', false);
        this.set('updateGalleryData', null);
        this.set('viewGalleryData', null);
        this.set('deleteGalleryData', null);
    }

    connectedCallback() {
        super.connectedCallback();
        document.title = 'Gallery Management | School System';
        this.loadData();
        
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

            // Load galleries data
            const galleriesResponse = await api.withToken(token).get('/galleries');
            
            this.set('galleries', galleriesResponse.data.data);
            this.set('loading', false);
            
        } catch (error) {
            console.error('❌ Error loading data:', error);
            this.set('loading', false);
            
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to load galleries data',
                variant: 'error',
                duration: 3000
            });
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
        if (!galleries) return;

        // Prepare table data
        const tableData = galleries.map((gallery, index) => ({
            id: gallery.id, // Keep ID for internal use
            index: index + 1, // Add index number for display
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
            id: gallery.id, // Keep ID for internal use
            index: index + 1, // Add index number for display
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
            // { key: 'slug', label: 'Slug' },
            { key: 'images_count', label: 'Images' },
            { key: 'status', label: 'Status' },
            { key: 'updated', label: 'Updated' }
        ];
        
        return `
            <div class="bg-white rounded-lg shadow-lg p-4">
                ${loading ? `
                    <!-- Simple Skeleton Loading -->
                    <div class="space-y-4">
                        <ui-skeleton class="h-24 w-full"></ui-skeleton>
                        <ui-skeleton class="h-24 w-full"></ui-skeleton>
                        <ui-skeleton class="h-24 w-full"></ui-skeleton>
                    </div>
                ` : `
                    <!-- Gallery Table Section -->
                    <div class="mb-8">
                        ${galleries && galleries.length > 0 ? `
                            <ui-table 
                                title="Gallery Management"
                                data='${JSON.stringify(tableData)}'
                                columns='${JSON.stringify(tableColumns)}'
                                sortable
                                searchable
                                search-placeholder="Search galleries..."
                                pagination
                                page-size="10"
                                action
                                addable
                                refresh
                                print
                                bordered
                                striped
                                class="w-full">
                            </ui-table>
                        ` : `
                            <div class="text-center py-8 text-gray-500">
                                <p>No galleries found in database</p>
                            </div>
                        `}
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