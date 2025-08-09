import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Switch.js';
import '@/components/ui/Dropdown.js';
import api from '@/services/api.js';

/**
 * Subject Add Modal Component
 * 
 * A modal component for adding new subjects in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - subject-saved: Fired when a subject is successfully saved
 * - modal-closed: Fired when modal is closed
 */
class SubjectAddModal extends HTMLElement {
    constructor() {
        super();
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for confirm button click (Save Subject)
        this.addEventListener('confirm', () => {
            this.saveSubject();
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

    // Save the new subject
    async saveSubject() {
        try {
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

            console.log('Subject data being sent:', subjectData); // Debug log

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
                    message: 'Please log in to create subjects',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Save subject
            const response = await api.withToken(token).post('/subjects', subjectData);
            
            // Check if subject was created successfully
            if (response.status === 201 || response.data.success) {
                Toast.show({
                    title: 'Success',
                    message: 'Subject created successfully',
                    variant: 'success',
                    duration: 3000
                });

                // Construct the new subject data from response
                const newSubject = {
                    id: response.data.data.id,
                    name: subjectData.name,
                    code: subjectData.code,
                    description: subjectData.description,
                    category: subjectData.category,
                    status: subjectData.status,
                    created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
                    updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
                };

                // Close modal and dispatch event
                this.close();
                this.dispatchEvent(new CustomEvent('subject-saved', {
                    detail: { subject: newSubject },
                    bubbles: true,
                    composed: true
                }));
            } else {
                throw new Error(response.data.message || 'Failed to create subject');
            }

        } catch (error) {
            console.error('❌ Error saving subject:', error);
            
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to create subject',
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
                <div slot="title">Add New Subject</div>
                <form id="subject-form" class="space-y-4">
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
                            value="core"
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
                            checked
                            class="w-full">
                            <span slot="label">Active</span>
                        </ui-switch>
                    </div>
                </form>

                <!-- How this works (bottom) -->
                <div class="mt-4 p-3 rounded-md bg-blue-50 border border-blue-100 text-blue-800 text-sm">
                    <div class="flex items-start space-x-2">
                        <i class="fas fa-info-circle mt-0.5"></i>
                        <div>
                            <p class="font-medium">How this works</p>
                            <ul class="list-disc pl-5 mt-1 space-y-1">
                                <li><strong>Subject Name</strong>: the display name (required).</li>
                                <li><strong>Subject Code</strong>: short unique code (e.g., ENG, MATH). Used when assigning to classes/teachers.</li>
                                <li><strong>Category</strong>: choose Core, Elective, or Optional.</li>
                                <li><strong>Status</strong>: Active subjects are available when assigning; Inactive won’t appear for new assignments.</li>
                                <li>After saving, the subject becomes available immediately in related dropdowns.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </ui-modal>
        `;
    }
}

customElements.define('subject-add-modal', SubjectAddModal);
export default SubjectAddModal; 