import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Switch.js';
import '@/components/ui/Button.js';
import '@/components/ui/Dropdown.js';
import '@/components/ui/Textarea.js';
import '@/components/ui/SearchDropdown.js';
import api from '@/services/api.js';

/**
 * Announcement Update Modal Component
 * 
 * A modal component for updating existing announcements in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - announcement-updated: Fired when an announcement is successfully updated
 * - modal-closed: Fired when modal is closed
 */
class AnnouncementUpdateModal extends HTMLElement {
    constructor() {
        super();
        this.announcementData = null;
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
        this.addFormEventListeners();
    }

    setupEventListeners() {
        // Listen for confirm button click (Update Announcement)
        this.addEventListener('confirm', () => {
            this.updateAnnouncement();
        });

        // Listen for cancel button click
        this.addEventListener('cancel', () => {
            this.close();
        });
    }

    // Wire events for live validation and update
    addFormEventListeners() {
        const titleInput = this.querySelector('ui-input[data-field="title"]');
        const contentInput = this.querySelector('ui-textarea[data-field="content"]');
        const targetAudienceDropdown = this.querySelector('ui-search-dropdown[data-field="target_audience"]');
        const targetClassField = this.querySelector('#target-class-field');
        const updateBtn = this.querySelector('#update-announcement-btn');

        if (titleInput) {
            titleInput.addEventListener('input', () => this.validateForm());
            titleInput.addEventListener('change', () => this.validateForm());
        }
        if (contentInput) {
            contentInput.addEventListener('input', () => this.validateForm());
            contentInput.addEventListener('change', () => this.validateForm());
        }
        if (targetAudienceDropdown) {
            targetAudienceDropdown.addEventListener('change', (e) => {
                this.handleTargetAudienceChange(e);
                this.validateForm();
            });
        }

        // Add event listener for target class dropdown when it becomes available
        this.addEventListener('change', (e) => {
            if (e.target.matches('ui-search-dropdown[data-field="target_class_id"]')) {
                this.validateForm();
            }
        });

        // Add event listeners for search dropdowns
        this.addEventListener('change', (e) => {
            if (e.target.matches('ui-search-dropdown[data-field="announcement_type"]')) {
                this.validateForm();
            }
        });
        if (updateBtn) {
            updateBtn.addEventListener('click', () => this.updateAnnouncement());
        }

        // Initial validation state
        this.validateForm();
    }

    open() {
        this.setAttribute('open', '');
    }

    close() {
        this.removeAttribute('open');
    }

    // Set announcement data for editing
    setAnnouncementData(announcement) {
        this.announcementData = announcement;
        this.populateForm();
    }

    // Populate form with existing announcement data
    populateForm() {
        if (!this.announcementData) return;

        const titleInput = this.querySelector('ui-input[data-field="title"]');
        const contentInput = this.querySelector('ui-textarea[data-field="content"]');
        const targetAudienceDropdown = this.querySelector('ui-search-dropdown[data-field="target_audience"]');
        const announcementTypeDropdown = this.querySelector('ui-search-dropdown[data-field="announcement_type"]');
        const priorityDropdown = this.querySelector('ui-dropdown[data-field="priority"]');
        const isActiveSwitch = this.querySelector('ui-switch[name="is_active"]');
        const isPinnedSwitch = this.querySelector('ui-switch[name="is_pinned"]');

        if (titleInput) titleInput.value = this.announcementData.title || '';
        if (contentInput) contentInput.value = this.announcementData.content || '';
        if (targetAudienceDropdown) targetAudienceDropdown.value = this.announcementData.target_audience || 'all';
        if (announcementTypeDropdown) announcementTypeDropdown.value = this.announcementData.announcement_type || 'general';
        if (priorityDropdown) priorityDropdown.value = this.announcementData.priority || 'normal';
        if (isActiveSwitch) {
            if (Number(this.announcementData.is_active) === 1) {
                isActiveSwitch.setAttribute('checked', '');
            } else {
                isActiveSwitch.removeAttribute('checked');
            }
        }
        if (isPinnedSwitch) {
            if (Number(this.announcementData.is_pinned) === 1) {
                isPinnedSwitch.setAttribute('checked', '');
            } else {
                isPinnedSwitch.removeAttribute('checked');
            }
        }

        // Handle target class field visibility and population
        this.handleTargetAudienceChange({ target: { value: this.announcementData.target_audience } });
        
        // If targeting specific class, populate the class dropdown
        if (this.announcementData.target_audience === 'specific_class' && this.announcementData.target_class_id) {
            this.loadAvailableClasses().then(() => {
                const targetClassDropdown = this.querySelector('ui-search-dropdown[data-field="target_class_id"]');
                if (targetClassDropdown) {
                    targetClassDropdown.value = this.announcementData.target_class_id;
                }
            });
        }
    }

    // Handle target audience change to show/hide target class field
    async handleTargetAudienceChange(event) {
        const targetAudience = event.target.value;
        const targetClassField = this.querySelector('#target-class-field');
        
        if (targetClassField) {
            if (targetAudience === 'specific_class') {
                targetClassField.classList.remove('hidden');
                // Load available classes when showing the field
                await this.loadAvailableClasses();
            } else {
                targetClassField.classList.add('hidden');
            }
        }
    }

    // Load available classes from API
    async loadAvailableClasses() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await api.withToken(token).get('/announcements/available-classes');
            
            if (response.data.success) {
                const classes = response.data.data || [];
                this.populateClassDropdown(classes);
            }
        } catch (error) {
            console.error('Error loading classes:', error);
            Toast.show({
                title: 'Error',
                message: 'Failed to load available classes',
                variant: 'error',
                duration: 3000
            });
        }
    }

    // Populate the class dropdown with available classes
    populateClassDropdown(classes) {
        const classDropdown = this.querySelector('ui-search-dropdown[data-field="target_class_id"]');
        if (!classDropdown) return;

        // Clear existing options except the first "Select a class..." option
        const firstOption = classDropdown.querySelector('ui-option[value=""]');
        classDropdown.innerHTML = '';
        if (firstOption) {
            classDropdown.appendChild(firstOption);
        }

        // Add class options
        classes.forEach(classItem => {
            const option = document.createElement('ui-option');
            option.setAttribute('value', classItem.id);
            option.textContent = `${classItem.name} Section ${classItem.section} (${classItem.academic_year_display_name || 'N/A'})`;
            classDropdown.appendChild(option);
        });
    }

    // Update the announcement
    async updateAnnouncement() {
        try {
            if (!this.announcementData) {
                Toast.show({
                    title: 'Error',
                    message: 'No announcement data available for update',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Get form data using the data-field attributes for reliable selection
            const titleInput = this.querySelector('ui-input[data-field="title"]');
            const contentInput = this.querySelector('ui-textarea[data-field="content"]');
            const targetAudienceDropdown = this.querySelector('ui-search-dropdown[data-field="target_audience"]');
            const announcementTypeDropdown = this.querySelector('ui-search-dropdown[data-field="announcement_type"]');
            const priorityDropdown = this.querySelector('ui-dropdown[data-field="priority"]');
            const isActiveSwitch = this.querySelector('ui-switch[name="is_active"]');
            const isPinnedSwitch = this.querySelector('ui-switch[name="is_pinned"]');
            const targetClassDropdown = this.querySelector('ui-search-dropdown[data-field="target_class_id"]');

            const announcementData = {
                title: titleInput ? titleInput.value : '',
                content: contentInput ? contentInput.value : '',
                target_audience: targetAudienceDropdown ? targetAudienceDropdown.value : 'all',
                announcement_type: announcementTypeDropdown ? announcementTypeDropdown.value : 'general',
                priority: priorityDropdown ? priorityDropdown.value : 'normal',
                is_active: isActiveSwitch ? (isActiveSwitch.checked ? 1 : 0) : 1,
                is_pinned: isPinnedSwitch ? (isPinnedSwitch.checked ? 1 : 0) : 0
            };

            // Add target_class_id if specific_class is selected
            if (announcementData.target_audience === 'specific_class') {
                announcementData.target_class_id = targetClassDropdown ? targetClassDropdown.value : '';
            }

            // Validate required fields
            if (!announcementData.title) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please fill in the announcement title',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            if (!announcementData.content) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please fill in the announcement content',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Validate target_class_id if specific_class is selected
            if (announcementData.target_audience === 'specific_class') {
                if (!announcementData.target_class_id) {
                    Toast.show({
                        title: 'Validation Error',
                        message: 'Please select a target class when targeting specific class',
                        variant: 'error',
                        duration: 3000
                    });
                    return;
                }
            }

            // Get auth token
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Please log in to update announcements',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Update announcement
            const response = await api.withToken(token).put(`/announcements/${this.announcementData.id}`, announcementData);
            
            // Check if announcement was updated successfully
            if (response.status === 200 || response.data.success) {
                Toast.show({
                    title: 'Success',
                    message: 'Announcement updated successfully',
                    variant: 'success',
                    duration: 3000
                });

                // Get current admin's name from localStorage
                const userData = JSON.parse(localStorage.getItem('userData') || '{}');
                const adminName = userData.name || userData.full_name || 'Unknown Admin';

                // Construct the updated announcement data
                const updatedAnnouncement = {
                    ...this.announcementData,
                    title: announcementData.title,
                    content: announcementData.content,
                    target_audience: announcementData.target_audience,
                    announcement_type: announcementData.announcement_type,
                    priority: announcementData.priority,
                    is_active: announcementData.is_active,
                    is_pinned: announcementData.is_pinned,
                    target_class_id: announcementData.target_class_id || null,
                    updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
                    creator_name: adminName
                };

                // Close modal and dispatch event
                this.close();
                this.dispatchEvent(new CustomEvent('announcement-updated', {
                    detail: { announcement: updatedAnnouncement },
                    bubbles: true,
                    composed: true
                }));
            } else {
                throw new Error(response.data.message || 'Failed to update announcement');
            }

        } catch (error) {
            console.error('❌ Error updating announcement:', error);
            
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to update announcement',
                variant: 'error',
                duration: 3000
            });
        }
    }

    // Validate form and toggle Update button
    validateForm() {
        try {
            const titleInput = this.querySelector('ui-input[data-field="title"]');
            const contentInput = this.querySelector('ui-textarea[data-field="content"]');
            const targetAudienceDropdown = this.querySelector('ui-search-dropdown[data-field="target_audience"]');
            const targetClassDropdown = this.querySelector('ui-search-dropdown[data-field="target_class_id"]');
            const updateBtn = this.querySelector('#update-announcement-btn');
            
            const title = titleInput ? String(titleInput.value || '').trim() : '';
            const content = contentInput ? String(contentInput.value || '').trim() : '';
            const targetAudience = targetAudienceDropdown ? targetAudienceDropdown.value : '';
            const targetClass = targetClassDropdown ? targetClassDropdown.value : '';
            
            let isValid = !!title && !!content && !!targetAudience;
            
            // Additional validation for specific class selection
            if (targetAudience === 'specific_class') {
                isValid = isValid && !!targetClass;
            }
            
            if (updateBtn) {
                if (isValid) {
                    updateBtn.removeAttribute('disabled');
                } else {
                    updateBtn.setAttribute('disabled', '');
                }
            }
        } catch (_) { /* noop */ }
    }

    render() {
        this.innerHTML = `
            <ui-modal 
                ${this.hasAttribute('open') ? 'open' : ''} 
                position="right" 
                close-button="true">
                <div slot="title">Update Announcement</div>
                <form id="announcement-update-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <ui-input 
                            data-field="title"
                            type="text" 
                            placeholder="Enter announcement title"
                            class="w-full">
                        </ui-input>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Content</label>
                        <ui-textarea 
                            data-field="content"
                            placeholder="Enter announcement content"
                            rows="4"
                            class="w-full">
                        </ui-textarea>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                        <ui-search-dropdown data-field="target_audience" value="all" placeholder="Search target audience...">
                            <ui-option value="all">All Users</ui-option>
                            <ui-option value="students">Students Only</ui-option>
                            <ui-option value="teachers">Teachers Only</ui-option>
                            <ui-option value="admin">Admin Only</ui-option>
                            <ui-option value="cashier">Cashier Only</ui-option>
                            <ui-option value="specific_class">Specific Class</ui-option>
                        </ui-search-dropdown>
                    </div>
                    
                    <!-- Conditional Target Class Field -->
                    <div id="target-class-field" class="hidden">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Target Class</label>
                        <ui-search-dropdown data-field="target_class_id" value="" placeholder="Search for a class...">
                            <ui-option value="">Select a class...</ui-option>
                            <!-- Classes will be loaded dynamically -->
                        </ui-search-dropdown>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Announcement Type</label>
                        <ui-search-dropdown data-field="announcement_type" value="general" placeholder="Search announcement type...">
                            <ui-option value="general">General</ui-option>
                            <ui-option value="academic">Academic</ui-option>
                            <ui-option value="event">Event</ui-option>
                            <ui-option value="reminder">Reminder</ui-option>
                            <ui-option value="emergency">Emergency</ui-option>
                            <ui-option value="financial">Financial</ui-option>
                            <ui-option value="payment">Payment</ui-option>
                            <ui-option value="fee">Fee</ui-option>
                            <ui-option value="billing">Billing</ui-option>
                        </ui-search-dropdown>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                        <ui-dropdown data-field="priority" value="normal">
                            <ui-option value="low">Low</ui-option>
                            <ui-option value="normal">Normal</ui-option>
                            <ui-option value="high">High</ui-option>
                            <ui-option value="urgent">Urgent</ui-option>
                        </ui-dropdown>
                    </div>
                    
                    <div class="flex items-center justify-between">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <ui-switch 
                                name="is_active"
                                class="w-full">
                                <span slot="label">Active</span>
                            </ui-switch>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Pin Announcement</label>
                            <ui-switch 
                                name="is_pinned"
                                class="w-full">
                                <span slot="label">Pinned</span>
                            </ui-switch>
                        </div>
                    </div>
                </form>

                <!-- How this works (bottom) -->
                <div class="mt-4 p-3 rounded-md bg-blue-50 border border-blue-100 text-blue-800 text-sm">
                    <div class="flex items-start space-x-2">
                        <i class="fas fa-info-circle mt-0.5"></i>
                        <div>
                            <p class="font-medium">How this works</p>
                            <ul class="list-disc pl-5 mt-1 space-y-1">
                                <li><strong>Title</strong>: Clear, concise title for the announcement.</li>
                                <li><strong>Content</strong>: Detailed information about the announcement.</li>
                                <li><strong>Target Audience</strong>: Who should see this announcement.</li>
                                <li><strong>Type</strong>: Categorizes the announcement for better organization.</li>
                                <li><strong>Priority</strong>: Sets importance level (urgent announcements are highlighted).</li>
                                <li><strong>Active</strong>: Only active announcements are visible to users.</li>
                                <li><strong>Pinned</strong>: Pinned announcements appear at the top of lists.</li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                <div slot="footer" class="flex items-center justify-end gap-2">
                    <ui-button variant="outline" color="secondary" modal-action="cancel">Cancel</ui-button>
                    <ui-button id="update-announcement-btn" color="primary" disabled>Update</ui-button>
                </div>
            </ui-modal>
        `;
    }
}

customElements.define('announcement-update-modal', AnnouncementUpdateModal);
export default AnnouncementUpdateModal;
