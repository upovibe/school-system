import '@/components/ui/Dialog.js';
import '@/components/ui/Badge.js';
import '@/components/ui/Toast.js';

/**
 * Class Subject View Dialog Component
 * 
 * A dialog component for viewing class subject assignment details in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls dialog visibility
 * 
 * Events:
 * - dialog-closed: Fired when dialog is closed
 * - delete-subject: Fired when a subject is deleted
 */
class ClassSubjectViewDialog extends HTMLElement {
    constructor() {
        super();
        this.classSubjectData = null;
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for cancel button click (Close dialog)
        this.addEventListener('cancel', () => {
            this.close();
        });

        // Remove existing listeners to avoid duplicates
        this.removeEventListener('click', this.handleClick);
        
        // Add click listener
        this.addEventListener('click', this.handleClick.bind(this));
    }

    handleClick(event) {
        const target = event.target;
        
        // Handle subject delete
        if (target.closest('.delete-subject-btn')) {
            const button = target.closest('.delete-subject-btn');
            const subjectData = button.dataset;
            console.log('Delete subject clicked:', subjectData);
            this.onDeleteSubject(
                subjectData.className,
                subjectData.classSection,
                subjectData.subjectName,
                subjectData.subjectCode
            );
        }
    }

    open() {
        this.setAttribute('open', '');
    }

    close() {
        this.removeAttribute('open');
    }

    // Set class subject data for viewing (single assignment)
    setClassSubjectData(classSubject) {
        this.classSubjectData = classSubject;
        this.render();
    }

    // Set class subjects data for viewing (multiple subjects for a class)
    setClassSubjectsData(classSubjects) {
        this.classSubjectData = classSubjects;
        this.render();
        this.setupEventListeners();
    }

    // Format date for display
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return dateString;
        }
    }

    render() {
        const classSubject = this.classSubjectData;
        
        if (!classSubject) {
            this.innerHTML = `
                <ui-dialog 
                    ${this.hasAttribute('open') ? 'open' : ''} 
                    title="View Class Subject Assignment">
                    <div slot="content">
                        <div class="text-center py-8">
                            <p class="text-gray-500">No data to display</p>
                        </div>
                    </div>
                </ui-dialog>
            `;
            return;
        }

        // Check if this is a single assignment or multiple assignments
        const isMultipleSubjects = Array.isArray(classSubject);
        
        if (isMultipleSubjects) {
            // Group subjects for display
            const firstSubject = classSubject[0];
            
            this.innerHTML = `
                <ui-dialog 
                    ${this.hasAttribute('open') ? 'open' : ''} 
                    title="View Class Subjects">
                    <div slot="content">
                        <div class="space-y-6">
                            <!-- Class Information -->
                            <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                                <div class="flex items-center space-x-3">
                                    <div class="flex-shrink-0">
                                        <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <i class="fas fa-chalkboard text-blue-600 text-lg"></i>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 class="text-lg font-semibold text-gray-900">
                                            ${firstSubject.class_name || 'N/A'} - ${firstSubject.class_section || 'N/A'}
                                        </h3>
                                        <p class="text-sm text-gray-600">Class Assignment</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Subjects List -->
                            <div class="space-y-4">
                                <h4 class="text-lg font-semibold text-gray-900">Assigned Subjects</h4>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    ${classSubject.map(subject => `
                                        <div class="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                                            <div class="flex items-center space-x-2">
                                                <div class="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
                                                    <i class="fas fa-book text-green-600 text-xs"></i>
                                                </div>
                                                <div>
                                                    <p class="text-sm font-medium text-gray-900">${subject.subject_name || 'N/A'}</p>
                                                    <p class="text-xs text-gray-600">${subject.subject_code || 'N/A'}</p>
                                                </div>
                                            </div>
                                            <button 
                                                class="delete-subject-btn inline-flex items-center p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                                data-class-name="${subject.class_name}"
                                                data-class-section="${subject.class_section}"
                                                data-subject-name="${subject.subject_name}"
                                                data-subject-code="${subject.subject_code}"
                                                title="Delete this subject">
                                                <i class="fas fa-times text-xs"></i>
                                            </button>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>

                            <!-- Summary -->
                            <div class="bg-gray-50 rounded-lg p-4">
                                <h4 class="text-sm font-medium text-gray-900 mb-3">Summary</h4>
                                <div class="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span class="text-gray-500">Total Subjects:</span>
                                        <p class="font-medium text-gray-900">${classSubject.length}</p>
                                    </div>
                                    <div>
                                        <span class="text-gray-500">Class:</span>
                                        <p class="font-medium text-gray-900">${firstSubject.class_name} - ${firstSubject.class_section}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </ui-dialog>
            `;
        } else {
            // Single assignment view (fallback)
            this.innerHTML = `
                <ui-dialog 
                    ${this.hasAttribute('open') ? 'open' : ''} 
                    title="View Class Subject Assignment">
                    <div slot="content">
                        <div class="space-y-6">
                            <!-- Class Information -->
                            <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                                <div class="flex items-center space-x-3">
                                    <div class="flex-shrink-0">
                                        <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <i class="fas fa-chalkboard text-blue-600 text-lg"></i>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 class="text-lg font-semibold text-gray-900">
                                            ${classSubject.class_name || 'N/A'} - ${classSubject.class_section || 'N/A'}
                                        </h3>
                                        <p class="text-sm text-gray-600">Class Assignment</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Subject Information -->
                            <div class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
                                <div class="flex items-center space-x-3">
                                    <div class="flex-shrink-0">
                                        <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                            <i class="fas fa-book text-green-600 text-lg"></i>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 class="text-lg font-semibold text-gray-900">
                                            ${classSubject.subject_name || 'N/A'}
                                        </h3>
                                        <p class="text-sm text-gray-600">Subject Code: ${classSubject.subject_code || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Assignment Details -->
                            <div class="bg-gray-50 rounded-lg p-4">
                                <h4 class="text-sm font-medium text-gray-900 mb-3">Assignment Details</h4>
                                <div class="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span class="text-gray-500">Assignment ID:</span>
                                        <p class="font-medium text-gray-900">${classSubject.id || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <span class="text-gray-500">Status:</span>
                                        <p class="font-medium text-gray-900">
                                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Active
                                            </span>
                                        </p>
                                    </div>
                                    <div>
                                        <span class="text-gray-500">Created:</span>
                                        <p class="font-medium text-gray-900">${this.formatDate(classSubject.created_at)}</p>
                                    </div>
                                    <div>
                                        <span class="text-gray-500">Updated:</span>
                                        <p class="font-medium text-gray-900">${this.formatDate(classSubject.updated_at)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </ui-dialog>
            `;
        }
    }

    onDeleteSubject(className, classSection, subjectName, subjectCode) {
        console.log('Dispatching delete-subject event:', { className, classSection, subjectName, subjectCode });
        
        // Dispatch event to parent component
        this.dispatchEvent(new CustomEvent('delete-subject', {
            detail: {
                className: className,
                classSection: classSection,
                subjectName: subjectName,
                subjectCode: subjectCode
            },
            bubbles: true,
            composed: true
        }));
        
        // Close the dialog
        this.close();
    }
}

customElements.define('class-subject-view-dialog', ClassSubjectViewDialog);
export default ClassSubjectViewDialog; 