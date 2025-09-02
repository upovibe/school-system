import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';

/**
 * Teacher Assignment View Dialog Component
 * 
 * Dialog for viewing teacher assignment details
 */
class TeacherAssignmentViewDialog extends HTMLElement {
    constructor() {
        super();
        this.teacherAssignmentData = null;
    }

    static get observedAttributes() {
        return ['open'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'open' && newValue !== null && this.teacherAssignmentData) {
            this.render();
        }
    }

    connectedCallback() {
        if (this.teacherAssignmentData) {
            this.render();
        }
    }

    setTeacherAssignmentData(teacherAssignment) {
        this.teacherAssignmentData = teacherAssignment;
        this.render();
    }

    setTeacherAssignments(teacherAssignments) {
        this.teacherAssignmentData = teacherAssignments;
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Remove existing listeners to avoid duplicates
        this.removeEventListener('click', this.handleClick);
        
        // Add click listener
        this.addEventListener('click', this.handleClick.bind(this));
    }

    handleClick(event) {
        const target = event.target;
        
        // Handle class delete
        if (target.closest('.delete-class-btn')) {
            const button = target.closest('.delete-class-btn');
            const classKey = button.dataset.classKey;
            const employeeId = button.dataset.employeeId;
            console.log('Delete class clicked:', { employeeId, classKey });
            this.onDeleteClass(employeeId, classKey);
        }
        
        // Handle subject delete
        if (target.closest('.delete-subject-btn')) {
            const button = target.closest('.delete-subject-btn');
            const subjectData = button.dataset;
            console.log('Delete subject clicked:', subjectData);
            this.onDeleteSubject(
                subjectData.employeeId,
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

    render() {
        const teacherAssignment = this.teacherAssignmentData;
        
        if (!teacherAssignment) {
            // Don't render anything if no data is available
            this.innerHTML = '';
            return;
        }

        // Check if this is a single assignment or multiple assignments
        const isMultipleAssignments = Array.isArray(teacherAssignment);
        
        if (isMultipleAssignments) {
            // Group assignments by class
            const groupedAssignments = this.groupAssignmentsByClass(teacherAssignment);
            const firstAssignment = teacherAssignment[0];
            
            this.innerHTML = `
                <ui-dialog 
                    ${this.hasAttribute('open') ? 'open' : ''} 
                    title="View Teacher Assignments">
                    <div slot="content">
                        <div class="space-y-6">
                            <!-- Teacher Information -->
                            <div class="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4">
                                <div class="flex items-center space-x-3">
                                    <div class="flex-shrink-0">
                                        <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                            <i class="fas fa-user-tie text-purple-600 text-lg"></i>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 class="text-lg font-semibold text-gray-900">
                                            ${firstAssignment.teacher_first_name || 'N/A'} ${firstAssignment.teacher_last_name || 'N/A'}
                                        </h3>
                                        <p class="text-sm text-gray-600">Employee ID: ${firstAssignment.employee_id || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Class Assignments -->
                            <div class="space-y-4">
                                <h4 class="text-lg font-semibold text-gray-900">Class Assignments</h4>
                                ${groupedAssignments.map(classGroup => `
                                    <div class="bg-white border border-gray-200 rounded-lg p-4">
                                        <div class="flex items-center justify-between mb-3">
                                            <div class="flex items-center space-x-3">
                                                <div class="flex-shrink-0">
                                                    <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                                        <i class="fas fa-chalkboard text-blue-600 text-sm"></i>
                                                    </div>
                                                </div>
                                                <div>
                                                    <h5 class="text-md font-semibold text-gray-900">
                                                        ${classGroup.className} - ${classGroup.classSection}
                                                    </h5>
                                                    <p class="text-sm text-gray-600">${classGroup.subjects.length} subject${classGroup.subjects.length !== 1 ? 's' : ''}</p>
                                                </div>
                                            </div>
                                            <button 
                                                class="delete-class-btn inline-flex items-center p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                                data-teacher-id="${classGroup.teacherId}"
                                                data-employee-id="${classGroup.employeeId}"
                                                data-class-key="${classGroup.className}-${classGroup.classSection}"
                                                title="Delete all subjects for this class">
                                                <i class="fas fa-trash text-sm"></i>
                                            </button>
                                        </div>
                                        
                                        <!-- Subjects List -->
                                        <div class="ml-11">
                                            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                ${classGroup.subjects.map(subject => `
                                                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                                                        <div class="flex items-center space-x-2">
                                                            <div class="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
                                                                <i class="fas fa-book text-green-600 text-xs"></i>
                                                            </div>
                                                            <div>
                                                                <p class="text-sm font-medium text-gray-900">${subject.subjectName}</p>
                                                                <p class="text-xs text-gray-600">${subject.subjectCode}</p>
                                                            </div>
                                                        </div>
                                                        <button 
                                                            class="delete-subject-btn inline-flex items-center p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                                            data-teacher-id="${classGroup.teacherId}"
                                                            data-employee-id="${classGroup.employeeId}"
                                                            data-class-name="${classGroup.className}"
                                                            data-class-section="${classGroup.classSection}"
                                                            data-subject-name="${subject.subjectName}"
                                                            data-subject-code="${subject.subjectCode}"
                                                            title="Delete this subject">
                                                            <i class="fas fa-times text-xs"></i>
                                                        </button>
                                                    </div>
                                                `).join('')}
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>

                            <!-- Summary -->
                            <div class="bg-gray-50 rounded-lg p-4">
                                <h4 class="text-sm font-medium text-gray-900 mb-3">Summary</h4>
                                <div class="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span class="text-gray-500">Total Classes:</span>
                                        <p class="font-medium text-gray-900">${groupedAssignments.length}</p>
                                    </div>
                                    <div>
                                        <span class="text-gray-500">Total Subjects:</span>
                                        <p class="font-medium text-gray-900">${teacherAssignment.length}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div slot="footer" class="flex justify-end">
                        <ui-button variant="outline" color="secondary" dialog-action="cancel">Close</ui-button>
                    </div>
                </ui-dialog>
            `;
        } else {
            // Single assignment view (fallback)
            this.innerHTML = `
                <ui-dialog 
                    ${this.hasAttribute('open') ? 'open' : ''} 
                    title="View Teacher Assignment">
                    <div slot="content">
                        <div class="space-y-6">
                            <!-- Teacher Information -->
                            <div class="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4">
                                <div class="flex items-center space-x-3">
                                    <div class="flex-shrink-0">
                                        <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                            <i class="fas fa-user-tie text-purple-600 text-lg"></i>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 class="text-lg font-semibold text-gray-900">
                                            ${teacherAssignment.teacher_first_name || 'N/A'} ${teacherAssignment.teacher_last_name || 'N/A'}
                                        </h3>
                                        <p class="text-sm text-gray-600">Employee ID: ${teacherAssignment.employee_id || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

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
                                            ${teacherAssignment.class_name || 'N/A'} - ${teacherAssignment.class_section || 'N/A'}
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
                                            ${teacherAssignment.subject_name || 'N/A'}
                                        </h3>
                                        <p class="text-sm text-gray-600">Subject Code: ${teacherAssignment.subject_code || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Assignment Details -->
                            <div class="bg-gray-50 rounded-lg p-4">
                                <h4 class="text-sm font-medium text-gray-900 mb-3">Assignment Details</h4>
                                <div class="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span class="text-gray-500">Assignment ID:</span>
                                        <p class="font-medium text-gray-900">${teacherAssignment.id || 'N/A'}</p>
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
                                        <p class="font-medium text-gray-900">${teacherAssignment.created_at ? new Date(teacherAssignment.created_at).toLocaleDateString() : 'N/A'}</p>
                                    </div>
                                    <div>
                                        <span class="text-gray-500">Updated:</span>
                                        <p class="font-medium text-gray-900">${teacherAssignment.updated_at ? new Date(teacherAssignment.updated_at).toLocaleDateString() : 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div slot="footer" class="flex justify-end">
                        <ui-button variant="outline" color="secondary" dialog-action="cancel">Close</ui-button>
                    </div>
                </ui-dialog>
            `;
        }
    }

    groupAssignmentsByClass(assignments) {
        const grouped = {};
        
        assignments.forEach(assignment => {
            const classKey = `${assignment.class_name}-${assignment.class_section}`;
            
            if (!grouped[classKey]) {
                grouped[classKey] = {
                    className: assignment.class_name,
                    classSection: assignment.class_section,
                    teacherId: assignment.teacher_id,
                    employeeId: assignment.employee_id,
                    subjects: []
                };
            }
            
            grouped[classKey].subjects.push({
                subjectName: assignment.subject_name,
                subjectCode: assignment.subject_code,
                subjectId: assignment.subject_id
            });
        });
        
        return Object.values(grouped).sort((a, b) => {
            if (a.className !== b.className) {
                return a.className.localeCompare(b.className);
            }
            return a.classSection.localeCompare(b.classSection);
        });
    }

    onDeleteClass(employeeId, classKey) {
        const [className, classSection] = classKey.split('-');
        
        console.log('Dispatching delete-class event:', { employeeId, className, classSection });
        
        // Dispatch event to parent component
        this.dispatchEvent(new CustomEvent('delete-class', {
            detail: {
                employeeId: employeeId,
                className: className,
                classSection: classSection
            },
            bubbles: true,
            composed: true
        }));
        
        // Close the dialog
        this.close();
    }

    onDeleteSubject(employeeId, className, classSection, subjectName, subjectCode) {
        console.log('Dispatching delete-subject event:', { employeeId, className, classSection, subjectName, subjectCode });
        
        // Dispatch event to parent component
        this.dispatchEvent(new CustomEvent('delete-subject', {
            detail: {
                employeeId: employeeId,
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

customElements.define('teacher-assignment-view-dialog', TeacherAssignmentViewDialog);
export default TeacherAssignmentViewDialog; 