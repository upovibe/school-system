import App from '@/core/App.js';
import api from '@/services/api.js';
import '@/components/ui/Modal.js';
import '@/components/ui/Input.js';
import '@/components/ui/Wysiwyg.js';
import '@/components/ui/FileUpload.js';
import '@/components/ui/Toast.js';

/**
 * Student Assignment Submission Modal Component
 * 
 * Allows students to submit assignments with files and comments
 */
class StudentAssignmentSubmissionModal extends HTMLElement {
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
        console.log('StudentAssignmentSubmissionModal connected to DOM');
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for confirm button click (Submit Assignment)
        this.addEventListener('confirm', () => {
            this.submitAssignment();
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
        console.log('Submission modal open() called with assignmentId:', assignmentId);
        this.assignmentId = assignmentId;
        
        if (assignmentId) {
            console.log('Loading assignment data...');
            await this.loadAssignmentData(assignmentId);
            console.log('Assignment data loaded, now opening modal');
        }
        
        // Render with the loaded data, then set the open attribute
        this.render();
        this.setAttribute('open', '');
        console.log('Set open attribute on submission modal');
    }

    close() {
        this.removeAttribute('open');
        this.resetForm();
        this.dispatchEvent(new CustomEvent('modal-closed', { 
            bubbles: true, 
            detail: { type: 'submit-assignment' } 
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

            console.log('Making API request to:', `/students/assignments/${assignmentId}`);
            const response = await api.withToken(token).get(`/students/assignments/${assignmentId}`);
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

    // Get form data for submission
    getFormData() {
        const commentsElement = this.querySelector('[data-field="comments"]');
        const fileUploadElement = this.querySelector('[data-field="submission_file"]');

        return {
            comments: commentsElement?.value || '',
            submission_file: fileUploadElement?.files?.[0] || null
        };
    }

    // Submit assignment
    async submitAssignment() {
        try {
            this.set('loading', true);

            // Get form data
            const formData = this.getFormData();

            // Validate that at least one file is uploaded
            if (!formData.submission_file) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please upload your assignment file',
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

            // Use FormData for file upload
            const submitFormData = new FormData();
            submitFormData.append('comments', formData.comments);
            submitFormData.append('submission_file', formData.submission_file);

            const response = await api.withToken(token).post(`/students/assignments/${this.assignmentId}/submit`, submitFormData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data && response.data.success) {
                Toast.show({
                    title: 'Success',
                    message: 'Assignment submitted successfully!',
                    variant: 'success',
                    duration: 3000
                });

                // Close modal first
                this.close();

                // Then dispatch custom event to notify parent component
                this.dispatchEvent(new CustomEvent('assignment-submitted', { 
                    bubbles: true, 
                    detail: { assignmentId: this.assignmentId, data: response.data.data } 
                }));
            } else {
                throw new Error(response.data?.message || 'Failed to submit assignment');
            }

        } catch (error) {
            console.error('Error submitting assignment:', error);
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
                    message: error.response?.data?.message || 'Failed to submit assignment. Please try again.',
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

    formatDate(dateString) {
        if (!dateString) return 'No date set';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    render() {
        const { loading, assignmentData } = this;

        this.innerHTML = `
            <ui-modal 
                ${this.hasAttribute('open') ? 'open' : ''} 
                position="right" 
                size="lg"
                close-button="true">
                <div slot="title">Submit Assignment</div>
                
                ${assignmentData ? `
                    <!-- Assignment Info Header -->
                    <div class="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div class="flex items-center gap-3 mb-3">
                            <div class="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                                <i class="fas fa-file-alt text-white text-sm"></i>
                            </div>
                            <div>
                                <h3 class="text-lg font-semibold text-gray-900">${assignmentData.title}</h3>
                                <p class="text-sm text-gray-600">Due: ${this.formatDate(assignmentData.due_date)}</p>
                            </div>
                        </div>
                        <div class="text-sm text-gray-700">
                            <p><strong>Subject:</strong> ${assignmentData.subject?.name || 'N/A'}</p>
                            <p><strong>Teacher:</strong> ${assignmentData.teacher?.full_name || 'N/A'}</p>
                            <p><strong>Points:</strong> ${assignmentData.total_points} pts</p>
                        </div>
                    </div>
                ` : ''}
                
                <form class="space-y-6">
                    <!-- File Upload -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Assignment File <span class="text-red-500">*</span>
                        </label>
                        <ui-file-upload 
                            data-field="submission_file"
                            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.zip,.rar"
                            placeholder="Upload your assignment file"
                            required>
                        </ui-file-upload>
                        <p class="text-xs text-gray-500 mt-1">
                            Accepted formats: PDF, DOC, DOCX, TXT, Images, ZIP, RAR
                        </p>
                    </div>

                    <!-- Comments -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Comments (Optional)
                        </label>
                        <ui-wysiwyg 
                            data-field="comments"
                            placeholder="Add any comments or notes about your submission..."
                            class="w-full">
                        </ui-wysiwyg>
                    </div>
                    
                    <!-- Submission Guidelines -->
                    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div class="flex items-start gap-2">
                            <i class="fas fa-info-circle text-yellow-600 mt-0.5"></i>
                            <div class="text-sm text-yellow-800">
                                <p class="font-medium mb-1">Submission Guidelines:</p>
                                <ul class="list-disc list-inside space-y-1 text-xs">
                                    <li>Ensure your file is properly formatted and readable</li>
                                    <li>Double-check your work before submitting</li>
                                    <li>You can only submit once per assignment</li>
                                    <li>Late submissions may affect your grade</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </form>
            </ui-modal>
        `;
    }
}

customElements.define('student-assignment-submission-modal', StudentAssignmentSubmissionModal);
export default StudentAssignmentSubmissionModal; 