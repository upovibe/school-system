import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Switch.js';
import '@/components/ui/Dropdown.js';
import api from '@/services/api.js';

/**
 * Subject Update Modal Component
 * 
 * A modal component for updating existing subjects in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - subject-updated: Fired when a subject is successfully updated
 * - modal-closed: Fired when modal is closed
 */
class SubjectUpdateModal extends HTMLElement {
    constructor() {
        super();
        this.subjectData = null;
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for confirm button click (Update Subject)
        this.addEventListener('confirm', () => {
            this.updateSubject();
        });

        // Listen for cancel button click
        this.addEventListener('cancel', () => {
            this.close();
        });
    }

    open() {
        this.setAttribute('open', '');
    }

    close() {
        this.removeAttribute('open');
    }

    // Set subject data for editing
    setSubjectData(subject) {
        this.subjectData = subject;
        this.populateForm();
    }

    // Populate form with existing subject data
    populateForm() {
        if (!this.subjectData) return;

        const nameInput = this.querySelector('ui-input[data-field="name"]');
        const codeInput = this.querySelector('ui-input[data-field="code"]');
        const descriptionInput = this.querySelector('ui-input[data-field="description"]');
        const categoryDropdown = this.querySelector('ui-dropdown[name="category"]');
        const statusSwitch = this.querySelector('ui-switch[name="status"]');

        if (nameInput) nameInput.value = this.subjectData.name || '';
        if (codeInput) codeInput.value = this.subjectData.code || '';
        if (descriptionInput) descriptionInput.value = this.subjectData.description || '';
        if (categoryDropdown) categoryDropdown.value = this.subjectData.category || 'core';
        if (statusSwitch) {
            if (this.subjectData.status === 'active') {
                statusSwitch.setAttribute('checked', '');
            } else {
                statusSwitch.removeAttribute('checked');
            }
        }
    }

    // Update the subject
    async updateSubject() {
        try {
            if (!this.subjectData) {
                Toast.show({
                    title: 'Error',
                    message: 'No subject data available for update',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Get form data using the data-field attributes for reliable selection
            const nameInput = this.querySelector('ui-input[data-field="name"]');
            const codeInput = this.querySelector('ui-input[data-field="code"]');
            const descriptionInput = this.querySelector('ui-input[data-field="description"]');
            const categoryDropdown = this.querySelector('ui-dropdown[name="category"]');
            const statusSwitch = this.querySelector('ui-switch[name="status"]');

            const subjectData = {
                name: nameInput ? nameInput.value : '',
                code: codeInput ? codeInput.value : '',
                description: descriptionInput ? descriptionInput.value : '',
                category: categoryDropdown ? categoryDropdown.value : 'core',
                status: statusSwitch ? (statusSwitch.checked ? 'active' : 'inactive') : 'active'
            };

            console.log('Subject update data being sent:', subjectData); // Debug log

            // Validate required fields
            if (!subjectData.name) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please fill in the subject name',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            if (!subjectData.code) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please fill in the subject code',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Get auth token
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Please log in to update subjects',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Update subject
            const response = await api.withToken(token).put(`/subjects/${this.subjectData.id}`, subjectData);
            
            // Check if subject was updated successfully
            if (response.status === 200 || response.data.success) {
                Toast.show({
                    title: 'Success',
                    message: 'Subject updated successfully',
                    variant: 'success',
                    duration: 3000
                });

                // Construct the updated subject data
                const updatedSubject = {
                    ...this.subjectData,
                    name: subjectData.name,
                    code: subjectData.code,
                    description: subjectData.description,
                    category: subjectData.category,
                    status: subjectData.status,
                    updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
                };

                // Close modal and dispatch event
                this.close();
                this.dispatchEvent(new CustomEvent('subject-updated', {
                    detail: { subject: updatedSubject },
                    bubbles: true,
                    composed: true
                }));
            } else {
                throw new Error(response.data.message || 'Failed to update subject');
            }

        } catch (error) {
            console.error('❌ Error updating subject:', error);
            
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to update subject',
                variant: 'error',
                duration: 3000
            });
        }
    }

    render() {
        this.innerHTML = `
            <ui-modal 
                ${this.hasAttribute('open') ? 'open' : ''} 
                position="right" 
                close-button="true">
                <div slot="title">Update Subject</div>
                <form id="subject-update-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
                        <ui-input 
                            data-field="name"
                            type="text" 
                            placeholder="Enter subject name"
                            class="w-full">
                        </ui-input>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Subject Code</label>
                        <ui-input 
                            data-field="code"
                            type="text" 
                            placeholder="Enter subject code (e.g., MATH, ENG)"
                            class="w-full">
                        </ui-input>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <ui-dropdown 
                            name="category" 
                            placeholder="Select category"
                            class="w-full">
                            <ui-option value="core">Core</ui-option>
                            <ui-option value="elective">Elective</ui-option>
                            <ui-option value="optional">Optional</ui-option>
                        </ui-dropdown>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <ui-input 
                            data-field="description"
                            type="textarea" 
                            placeholder="Enter subject description"
                            rows="3"
                            class="w-full">
                        </ui-input>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <ui-switch 
                            name="status"
                            class="w-full">
                            <span slot="label">Active</span>
                        </ui-switch>
                    </div>
                </form>
            </ui-modal>
        `;
    }
}

customElements.define('subject-update-modal', SubjectUpdateModal);
export default SubjectUpdateModal; 