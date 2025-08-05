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
        
        // Reset form after a small delay to ensure components are initialized
        setTimeout(() => {
            this.resetForm();
        }, 100);
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

        // Get form data directly from DOM elements (following admin modal pattern)
    getFormData() {
        // Get form elements using the same approach as working admin modals
        const titleInput = this.querySelector('ui-input[data-field="title"]');
        const descriptionWysiwyg = this.querySelector('ui-wysiwyg[data-field="description"]');
        const dueDateInput = this.querySelector('ui-input[data-field="due_date"]');
        const totalPointsInput = this.querySelector('ui-input[data-field="total_points"]');
        const assignmentTypeDropdown = this.querySelector('ui-dropdown[data-field="assignment_type"]');
        const statusDropdown = this.querySelector('ui-dropdown[data-field="status"]');
        const attachmentFileUpload = this.querySelector('ui-file-upload[data-field="attachment"]');

        // Use the same approach as working admin modals - direct .value access
        const formData = {
            title: titleInput ? titleInput.value : '',
            description: descriptionWysiwyg ? descriptionWysiwyg.value : '',
            due_date: dueDateInput ? dueDateInput.value : '',
            total_points: totalPointsInput ? totalPointsInput.value : '',
            assignment_type: assignmentTypeDropdown ? assignmentTypeDropdown.value : 'homework',
            status: statusDropdown ? statusDropdown.value : 'published',
            attachmentFileUpload: attachmentFileUpload
        };

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

            // Prepare assignment data
            const formDataObj = {
                title: title.trim(),
                description: description.trim(),
                due_date: due_date,
                total_points: total_points,
                assignment_type: assignment_type,
                status: status,
                class_id: this.classId,
                subject_id: this.subjectId
            };

            // Prepare form data for multipart request (ALWAYS use FormData like events)
            const formData = new FormData();
            
            // Add all form fields
            Object.keys(formDataObj).forEach(key => {
                formData.append(key, formDataObj[key]);
            });
            
            // Add attachment files if selected
            if (attachmentFileUpload && attachmentFileUpload.getFiles().length > 0) {
                const files = attachmentFileUpload.getFiles();
                // Filter out existing files (which are strings/paths) and only include new File objects
                const newFiles = files.filter(file => file instanceof File);
                newFiles.forEach(file => {
                    formData.append('attachment', file, file.name);
                });
            }

            console.log('FormData entries:'); // Debug log
            for (let [key, value] of formData.entries()) {
                console.log(key, value);
            }

            // Create the assignment with multipart data (ALWAYS use FormData like events)
            const response = await api.withToken(token).post('/teachers/assignments', formData);

            if (response.data && response.data.success) {
                // Show success message
                Toast.show({ 
                    title: 'Success!', 
                    message: 'Assignment successfully sent to class.', 
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
            console.error('Error response data:', error.response?.data);
            console.error('Error response status:', error.response?.status);
            
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
                                 data-field="attachment"
                                 accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
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