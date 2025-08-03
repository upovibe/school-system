import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Badge.js';
import '@/components/ui/Button.js';
import '@/components/ui/Input.js';
import '@/components/ui/Wysiwyg.js';
import '@/components/ui/Dropdown.js';
import '@/components/ui/FileUpload.js';
import api from '@/services/api.js';

/**
 * Teacher Create Assignment Modal Component
 * 
 * A modal component for creating new assignments in the teacher panel
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * - class-id: string - the class ID for the assignment
 * - subject-id: string - the subject ID for the assignment
 * 
 * Events:
 * - modal-closed: Fired when modal is closed
 * - assignment-created: Fired when assignment is successfully created
 */
class TeacherCreateAssignmentModal extends HTMLElement {
    constructor() {
        super();
        this.loading = false;
        this.classId = null;
        this.subjectId = null;
    }

    static get observedAttributes() {
        return ['open', 'class-id', 'subject-id'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for confirm button click (Create Assignment)
        this.addEventListener('confirm', () => {
            this.createAssignment();
        });
        
        // Listen for cancel button click
        this.addEventListener('cancel', () => {
            this.close();
        });
    }

    open(classId = null, subjectId = null) {
        this.classId = classId;
        this.subjectId = subjectId;
        this.setAttribute('open', '');
        this.resetForm();
    }

    close() {
        this.removeAttribute('open');
        this.resetForm();
    }

    // Reset form to initial state
    resetForm() {
        this.loading = false;
        this.render();
    }

    // Handle form input changes (removed - not needed)
    // We get form data directly when submitting, like other modals

    // Get form data directly from DOM elements
    getFormData() {
        // Wait a bit for components to be fully initialized
        const titleInput = this.querySelector('ui-input[data-field="title"]');
        const descriptionWysiwyg = this.querySelector('ui-wysiwyg[data-field="description"]');
        const dueDateInput = this.querySelector('ui-input[data-field="due_date"]');
        const totalPointsInput = this.querySelector('ui-input[data-field="total_points"]');
        const assignmentTypeDropdown = this.querySelector('ui-dropdown[data-field="assignment_type"]');
        const statusDropdown = this.querySelector('ui-dropdown[data-field="status"]');
        const attachmentFileUpload = this.querySelector('ui-file-upload[data-field="attachment_file"]');

        // Debug: Log what we found
        console.log('Form elements found:', {
            titleInput: !!titleInput,
            descriptionWysiwyg: !!descriptionWysiwyg,
            dueDateInput: !!dueDateInput,
            totalPointsInput: !!totalPointsInput,
            assignmentTypeDropdown: !!assignmentTypeDropdown,
            statusDropdown: !!statusDropdown,
            attachmentFileUpload: !!attachmentFileUpload
        });

        // Get values with proper fallbacks
        const formData = {
            title: titleInput ? (titleInput.value || titleInput.getAttribute('value') || '') : '',
            description: descriptionWysiwyg ? (descriptionWysiwyg.value || descriptionWysiwyg.getAttribute('value') || '') : '',
            due_date: dueDateInput ? (dueDateInput.value || dueDateInput.getAttribute('value') || '') : '',
            total_points: totalPointsInput ? (totalPointsInput.value || totalPointsInput.getAttribute('value') || '') : '',
            assignment_type: assignmentTypeDropdown ? (assignmentTypeDropdown.value || assignmentTypeDropdown.getAttribute('value') || 'homework') : 'homework',
            status: statusDropdown ? (statusDropdown.value || statusDropdown.getAttribute('value') || 'published') : 'published',
            attachmentFileUpload: attachmentFileUpload
        };

        // Debug: Log the values
        console.log('Form values:', {
            title: formData.title,
            description: formData.description,
            due_date: formData.due_date,
            total_points: formData.total_points,
            assignment_type: formData.assignment_type,
            status: formData.status
        });

        return formData;
    }



    // Validate form (simplified - no real-time validation)
    validateForm() {
        // We'll validate when submitting instead
    }

    // Create assignment
    async createAssignment() {
        try {
            this.set('loading', true);

            // Show loading toast
            Toast.show({ 
                title: 'Creating Assignment', 
                message: 'Please wait...', 
                variant: 'info', 
                duration: 2000 
            });

            // Get form data using the helper method
            const assignmentData = this.getFormData();
            const { title, description, due_date, total_points, assignment_type, status, attachmentFileUpload } = assignmentData;

            // Debug: Log the form data
            console.log('Form data:', assignmentData);

            // Validate required fields
            if (!title.trim()) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please fill in the assignment title',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            if (!description.trim()) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please fill in the assignment description',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            if (!due_date) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please select a due date',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            if (!total_points) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please enter total points',
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
                    message: 'Please log in to create assignments',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Prepare form data
            const formData = new FormData();
            formData.append('title', title.trim());
            formData.append('description', description.trim());
            formData.append('due_date', due_date);
            formData.append('total_points', total_points);
            formData.append('assignment_type', assignment_type);
            formData.append('status', status);
            formData.append('class_id', this.classId);
            formData.append('subject_id', this.subjectId);

            // Add file if uploaded
            if (attachmentFileUpload && attachmentFileUpload.getFiles().length > 0) {
                const files = attachmentFileUpload.getFiles();
                const newFiles = files.filter(file => file instanceof File);
                newFiles.forEach(file => {
                    formData.append('attachment_file', file, file.name);
                });
            }

            const response = await api.withToken(token).post('/teachers/assignments', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data && response.data.success) {
                // Show success message
                Toast.show({ 
                    title: 'Assignment Created!', 
                    message: `"${title}" has been successfully added to the assignments.`, 
                    variant: 'success', 
                    duration: 5000 
                });
                
                // Close modal
                this.close();
                
                // Dispatch event for parent to refresh data
                this.dispatchEvent(new CustomEvent('assignment-created', {
                    detail: response.data.data
                }));
            } else {
                this.set('error', response.data?.message || 'Failed to create assignment.');
            }
        } catch (error) {
            console.error('Error creating assignment:', error);
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
                    message: error.response?.data?.message || 'Failed to create assignment. Please try again.',
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
        this.render();
    }

    render() {
        const { loading } = this;

        this.innerHTML = `
            <ui-modal 
                ${this.hasAttribute('open') ? 'open' : ''} 
                position="right" 
                size="lg"
                close-button="true">
                <div slot="title">Create New Assignment</div>
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
                                  <ui-dropdown data-field="assignment_type">
                                      <ui-option value="homework">Homework</ui-option>
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
                                  <ui-dropdown data-field="status">
                                      <ui-option value="draft">Draft</ui-option>
                                      <ui-option value="published">Published</ui-option>
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

customElements.define('teacher-create-assignment-modal', TeacherCreateAssignmentModal);
export default TeacherCreateAssignmentModal; 