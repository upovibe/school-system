import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Badge.js';
import '@/components/ui/Button.js';
import '@/components/ui/Input.js';
import '@/components/ui/Select.js';
import '@/components/ui/Textarea.js';
import '@/components/ui/DatePicker.js';
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
        this.formData = {
            title: '',
            description: '',
            due_date: '',
            total_points: '',
            assignment_type: 'homework',
            status: 'published',
            attachment_file: null
        };
        this.loading = false;
        this.error = null;
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

        // Listen for form input changes
        this.addEventListener('input', this.handleInputChange.bind(this));
        this.addEventListener('change', this.handleInputChange.bind(this));
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
        this.formData = {
            title: '',
            description: '',
            due_date: '',
            total_points: '',
            assignment_type: 'homework',
            status: 'published',
            attachment_file: null
        };
        this.loading = false;
        this.error = null;
        this.render();
    }

    // Handle form input changes
    handleInputChange(event) {
        const { name, value, files } = event.target;
        
        if (name === 'attachment_file' && files && files[0]) {
            this.formData[name] = files[0];
        } else if (name) {
            this.formData[name] = value;
        }
        
        this.validateForm();
    }

    // Validate form
    validateForm() {
        const { title, description, due_date, total_points } = this.formData;
        const isValid = title.trim() && description.trim() && due_date && total_points;
        
        const confirmButton = this.shadowRoot?.querySelector('ui-modal')?.shadowRoot?.querySelector('.confirm-btn');
        if (confirmButton) {
            confirmButton.disabled = !isValid;
        }
    }

    // Create assignment
    async createAssignment() {
        try {
            this.set('loading', true);
            this.set('error', null);

            // Validate required fields
            const { title, description, due_date, total_points } = this.formData;
            if (!title.trim() || !description.trim() || !due_date || !total_points) {
                this.set('error', 'Please fill in all required fields.');
                return;
            }

            // Get token from localStorage
            const token = localStorage.getItem('token');
            if (!token) {
                this.set('error', 'Authentication required. Please log in again.');
                return;
            }

            // Prepare form data
            const formData = new FormData();
            formData.append('title', title.trim());
            formData.append('description', description.trim());
            formData.append('due_date', due_date);
            formData.append('total_points', total_points);
            formData.append('assignment_type', this.formData.assignment_type);
            formData.append('status', this.formData.status);
            formData.append('class_id', this.classId);
            formData.append('subject_id', this.subjectId);

            // Add file if uploaded
            if (this.formData.attachment_file) {
                formData.append('attachment_file', this.formData.attachment_file);
            }

            const response = await api.withToken(token).post('/teachers/assignments', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data && response.data.success) {
                // Show success message
                this.showToast('Assignment created successfully!', 'success');
                
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
                this.set('error', 'Authentication failed. Please log in again.');
            } else {
                this.set('error', error.response?.data?.message || 'Failed to create assignment. Please try again.');
            }
        } finally {
            this.set('loading', false);
        }
    }

    // Show toast message
    showToast(message, type = 'info') {
        const toast = document.createElement('ui-toast');
        toast.setAttribute('message', message);
        toast.setAttribute('type', type);
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    // Set loading state
    set(property, value) {
        this[property] = value;
        this.render();
    }

    render() {
        const { loading, error, formData } = this;
        const { title, description, due_date, total_points, assignment_type, status } = formData;

        this.innerHTML = `
            <ui-modal 
                ${this.hasAttribute('open') ? 'open' : ''} 
                position="right" 
                size="lg"
                close-button="true">
                <div slot="title">
                    <div class="flex items-center space-x-3">
                        <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                            <i class="fas fa-plus text-white text-sm"></i>
                        </div>
                        <div>
                            <h2 class="text-lg font-semibold text-gray-900">Create New Assignment</h2>
                            <p class="text-sm text-gray-500">Add a new assignment for your students</p>
                        </div>
                    </div>
                </div>
                
                <div class="space-y-6">
                    ${error ? `
                        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div class="flex items-center">
                                <i class="fas fa-exclamation-circle text-red-500 mr-2"></i>
                                <span class="text-red-700 text-sm">${error}</span>
                            </div>
                        </div>
                    ` : ''}

                    <form class="space-y-6">
                        <!-- Assignment Title -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Assignment Title <span class="text-red-500">*</span>
                            </label>
                            <ui-input 
                                name="title"
                                value="${title}"
                                placeholder="Enter assignment title"
                                required>
                            </ui-input>
                        </div>

                        <!-- Assignment Description -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Description <span class="text-red-500">*</span>
                            </label>
                            <ui-textarea 
                                name="description"
                                value="${description}"
                                placeholder="Enter detailed assignment description"
                                rows="4"
                                required>
                            </ui-textarea>
                        </div>

                        <!-- Due Date and Total Points -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    Due Date <span class="text-red-500">*</span>
                                </label>
                                <ui-date-picker 
                                    name="due_date"
                                    value="${due_date}"
                                    placeholder="Select due date"
                                    required>
                                </ui-date-picker>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    Total Points <span class="text-red-500">*</span>
                                </label>
                                <ui-input 
                                    name="total_points"
                                    type="number"
                                    value="${total_points}"
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
                                <ui-select 
                                    name="assignment_type"
                                    value="${assignment_type}">
                                    <option value="homework">Homework</option>
                                    <option value="quiz">Quiz</option>
                                    <option value="project">Project</option>
                                    <option value="exam">Exam</option>
                                    <option value="other">Other</option>
                                </ui-select>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    Status
                                </label>
                                <ui-select 
                                    name="status"
                                    value="${status}">
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                </ui-select>
                            </div>
                        </div>

                        <!-- File Attachment -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Attachment (Optional)
                            </label>
                            <ui-file-upload 
                                name="attachment_file"
                                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                                max-size="5MB"
                                placeholder="Upload assignment file">
                            </ui-file-upload>
                            <p class="text-xs text-gray-500 mt-1">
                                Supported formats: PDF, DOC, DOCX, TXT, Images (max 5MB)
                            </p>
                        </div>
                    </form>
                </div>

                <div slot="footer" class="flex justify-end space-x-3">
                    <ui-button 
                        variant="secondary" 
                        size="md"
                        ${loading ? 'disabled' : ''}>
                        Cancel
                    </ui-button>
                    <ui-button 
                        variant="primary" 
                        size="md"
                        ${loading ? 'disabled' : ''}>
                        ${loading ? `
                            <i class="fas fa-spinner fa-spin mr-2"></i>
                            Creating...
                        ` : `
                            <i class="fas fa-plus mr-2"></i>
                            Create Assignment
                        `}
                    </ui-button>
                </div>
            </ui-modal>
        `;
    }
}

customElements.define('teacher-create-assignment-modal', TeacherCreateAssignmentModal);
export default TeacherCreateAssignmentModal; 