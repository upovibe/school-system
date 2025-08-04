import App from '@/core/App.js';
import api from '@/services/api.js';
import '@/components/ui/Modal.js';
import '@/components/ui/Input.js';
import '@/components/ui/Wysiwyg.js';
import '@/components/ui/Dropdown.js';
import '@/components/ui/FileUpload.js';
import '@/components/ui/Toast.js';

/**
 * Teacher Edit Assignment Modal Component
 * 
 * Allows teachers to edit existing assignments
 */
class TeacherEditAssignmentModal extends HTMLElement {
    constructor() {
        super();
        this.assignmentId = null;
        this.assignmentData = null;
        this.loading = false;
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        console.log('TeacherEditAssignmentModal connected to DOM');
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for confirm button click (Update Assignment)
        this.addEventListener('confirm', () => {
            this.updateAssignment();
        });
        
        // Listen for cancel button click
        this.addEventListener('cancel', () => {
            this.close();
        });

        // Listen for modal close event
        this.addEventListener('modal-close', () => {
            this.close();
        });
    }

    async open(assignmentId = null) {
        console.log('Edit modal open() called with assignmentId:', assignmentId);
        this.assignmentId = assignmentId;
        
        if (assignmentId) {
            console.log('Loading assignment data...');
            await this.loadAssignmentData(assignmentId);
            console.log('Assignment data loaded, now opening modal');
        }
        
        // Render with the loaded data, then set the open attribute
        this.render();
        this.setAttribute('open', '');
        console.log('Set open attribute on edit modal');
        
        // Populate form after a small delay to ensure components are initialized
        setTimeout(() => {
            console.log('Populating form...');
            this.populateForm();
        }, 100);
    }

    close() {
        this.removeAttribute('open');
        this.resetForm();
        this.dispatchEvent(new CustomEvent('modal-closed', { 
            bubbles: true, 
            detail: { type: 'edit-assignment' } 
        }));
    }

    // Reset form to initial state
    resetForm() {
        this.loading = false;
        this.assignmentData = null;
        this.assignmentId = null;
        this.render();
    }

    // Load assignment data from API
    async loadAssignmentData(assignmentId) {
        try {
            console.log('Loading assignment data from API for ID:', assignmentId);
            
            // Get token from localStorage
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication required');
            }

            console.log('Making API request to:', `/teachers/assignments/${assignmentId}`);
            const response = await api.withToken(token).get(`/teachers/assignments/${assignmentId}`);
            console.log('API response:', response);
            
            if (response.data && response.data.success) {
                this.assignmentData = response.data.data;
                console.log('Assignment data loaded:', this.assignmentData);
            } else {
                throw new Error('Failed to load assignment data');
            }
        } catch (error) {
            console.error('Error loading assignment data:', error);
            Toast.show({
                title: 'Error',
                message: 'Failed to load assignment data. Please try again.',
                variant: 'error',
                duration: 3000
            });
        }
    }

    // Populate form with assignment data
    populateForm() {
        if (!this.assignmentData) {
            console.log('No assignment data to populate');
            return;
        }

        console.log('Populating form with data:', this.assignmentData);

        // Get form elements
        const titleInput = this.querySelector('[data-field="title"]');
        const descriptionWysiwyg = this.querySelector('[data-field="description"]');
        const dueDateInput = this.querySelector('[data-field="due_date"]');
        const totalPointsInput = this.querySelector('[data-field="total_points"]');
        const assignmentTypeDropdown = this.querySelector('[data-field="assignment_type"]');
        const statusDropdown = this.querySelector('[data-field="status"]');

        // Populate fields
        if (titleInput) {
            titleInput.value = this.assignmentData.title || '';
        }
        if (descriptionWysiwyg) {
            descriptionWysiwyg.value = this.assignmentData.description || '';
        }
        if (dueDateInput) {
            // Format date for input field (YYYY-MM-DD)
            const dueDate = this.assignmentData.due_date ? new Date(this.assignmentData.due_date).toISOString().split('T')[0] : '';
            dueDateInput.value = dueDate;
        }
        if (totalPointsInput) {
            totalPointsInput.value = this.assignmentData.total_points || '';
        }
        if (assignmentTypeDropdown) {
            assignmentTypeDropdown.value = this.assignmentData.assignment_type || 'homework';
        }
        if (statusDropdown) {
            statusDropdown.value = this.assignmentData.status || 'published';
        }
    }

    // Get form data for submission
    getFormData() {
        const titleElement = this.querySelector('[data-field="title"]');
        const descriptionElement = this.querySelector('[data-field="description"]');
        const dueDateElement = this.querySelector('[data-field="due_date"]');
        const totalPointsElement = this.querySelector('[data-field="total_points"]');
        const assignmentTypeElement = this.querySelector('[data-field="assignment_type"]');
        const statusElement = this.querySelector('[data-field="status"]');
        const fileUploadElement = this.querySelector('[data-field="attachment_file"]');

        return {
            title: titleElement?.value || '',
            description: descriptionElement?.value || '',
            due_date: dueDateElement?.value || '',
            total_points: totalPointsElement?.value || '',
            assignment_type: assignmentTypeElement?.value || 'homework',
            status: statusElement?.value || 'published',
            attachment_file: fileUploadElement?.files?.[0] || null
        };
    }

    // Update assignment
    async updateAssignment() {
        try {
            this.set('loading', true);

            // Get form data
            const formData = this.getFormData();

            // Validate required fields
            if (!formData.title.trim()) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please fill in the assignment title',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            if (!formData.due_date) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please select a due date',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Get token from localStorage
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Authentication required. Please log in again.',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            let response;

            // Check if there's a file attachment
            if (formData.attachment_file) {
                // Use FormData for file upload
                const submitFormData = new FormData();
                Object.entries(formData).forEach(([key, value]) => {
                    if (value !== null && value !== undefined) {
                        submitFormData.append(key, value);
                    }
                });

                response = await api.withToken(token).put(`/teachers/assignments/${this.assignmentId}`, submitFormData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
            } else {
                // Use JSON for text-only data
                const { attachment_file, ...jsonData } = formData;
                response = await api.withToken(token).put(`/teachers/assignments/${this.assignmentId}`, jsonData);
            }

            if (response.data && response.data.success) {
                Toast.show({
                    title: 'Success',
                    message: 'Assignment updated successfully!',
                    variant: 'success',
                    duration: 3000
                });

                // Close modal first
                this.close();

                // Then dispatch custom event to notify parent component
                this.dispatchEvent(new CustomEvent('assignment-updated', { 
                    bubbles: true, 
                    detail: { assignmentId: this.assignmentId, data: response.data.data } 
                }));
            } else {
                throw new Error(response.data?.message || 'Failed to update assignment');
            }

        } catch (error) {
            console.error('Error updating assignment:', error);
            if (error.response && error.response.status === 401) {
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Authentication failed. Please log in again.',
                    variant: 'error',
                    duration: 3000
                });
            } else {
                Toast.show({
                    title: 'Error',
                    message: error.response?.data?.message || 'Failed to update assignment. Please try again.',
                    variant: 'error',
                    duration: 3000
                });
            }
        } finally {
            this.set('loading', false);
        }
    }

    // Set loading state
    set(property, value) {
        this[property] = value;
        // Only re-render if we're not in the middle of form submission
        if (property !== 'loading') {
            this.render();
        }
    }

    render() {
        const { loading } = this;

        this.innerHTML = `
            <ui-modal 
                ${this.hasAttribute('open') ? 'open' : ''} 
                position="right" 
                size="lg"
                close-button="true">
                <div slot="title">Edit Assignment</div>
                    <form class="space-y-6">
                        <!-- Assignment Title -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Assignment Title <span class="text-red-500">*</span>
                            </label>
                             <ui-input 
                                 data-field="title"
                                 placeholder="Enter assignment title"
                                 required>
                             </ui-input>
                        </div>

                        <!-- Assignment Description -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Description <span class="text-red-500">*</span>
                            </label>
                            <ui-wysiwyg 
                                data-field="description"
                                placeholder="Enter detailed assignment description"
                                class="w-full">
                            </ui-wysiwyg>
                        </div>

                         <!-- Due Date and Total Points -->
                         <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                 <label class="block text-sm font-medium text-gray-700 mb-2">
                                     Due Date <span class="text-red-500">*</span>
                                 </label>
                                 <ui-input 
                                     type="date"
                                     data-field="due_date"
                                     min="${new Date().toISOString().split('T')[0]}"
                                     required>
                                 </ui-input>
                             </div>
                             
                             <div>
                                 <label class="block text-sm font-medium text-gray-700 mb-2">
                                     Total Points <span class="text-red-500">*</span>
                                 </label>
                                 <ui-input 
                                     data-field="total_points"
                                     type="number"
                                     placeholder="e.g., 100"
                                     min="1"
                                     required>
                                 </ui-input>
                             </div>
                         </div>

                         <!-- Assignment Type and Status -->
                         <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                  <label class="block text-sm font-medium text-gray-700 mb-2">
                                      Assignment Type
                                  </label>
                                  <ui-dropdown data-field="assignment_type" value="homework">
                                      <ui-option value="homework" selected>Homework</ui-option>
                                      <ui-option value="quiz">Quiz</ui-option>
                                      <ui-option value="project">Project</ui-option>
                                      <ui-option value="exam">Exam</ui-option>
                                      <ui-option value="other">Other</ui-option>
                                  </ui-dropdown>
                              </div>
                              
                              <div>
                                  <label class="block text-sm font-medium text-gray-700 mb-2">
                                      Status
                                  </label>
                                  <ui-dropdown data-field="status" value="published">
                                      <ui-option value="draft">Draft</ui-option>
                                      <ui-option value="published" selected>Published</ui-option>
                                  </ui-dropdown>
                              </div>
                          </div>

                        <!-- File Attachment -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Attachment (Optional)
                            </label>
                            <ui-file-upload 
                                data-field="attachment_file"
                                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                                max-size="5MB"
                                placeholder="Upload assignment file">
                            </ui-file-upload>
                        </div>
                        
                    </form>
            </ui-modal>
        `;
    }
}

customElements.define('teacher-edit-assignment-modal', TeacherEditAssignmentModal);
export default TeacherEditAssignmentModal;