import App from '@/core/App.js';
import api from '@/services/api.js';
import '@/components/ui/Card.js';
import '@/components/ui/Badge.js';
import '@/components/ui/Avatar.js';
import '@/components/ui/Alert.js';
import '@/components/ui/Table.js';
import '@/components/ui/Accordion.js';
import '@/components/ui/Dialog.js';
import '@/components/layout/teacherLayout/TeacherStudentPersonalInformation.js';
import '@/components/layout/teacherLayout/DataSkeleton.js';
import '@/components/layout/teacherLayout/PromoteStudentDialog.js';
import '@/components/ui/Toast.js';

/**
 * Teacher Class Page Component (/dashboard/teacher/class)
 * 
 * Displays the current teacher's assigned class information including students.
 */
class TeacherClassPage extends App {
    constructor() {
        super();
        this.classData = null;
        this.timetableResources = [];
        this.loading = true;
        this.error = null;
        this.showStudentModal = false;
        this.showPromoteDialog = false;
        this.selectedStudentData = null;
        this.promoteStudentData = null;
    }

    async connectedCallback() {
        super.connectedCallback();
        document.title = 'My Class | School System';
        
        await this.loadClassData();
        
        // Add event listeners for table events
        this.addEventListener('table-row-click', this.onStudentClick.bind(this));
        this.addEventListener('table-custom-action', this.onCustomAction.bind(this));
        this.addEventListener('click', this.handleHeaderActions.bind(this));
        
        // Listen for student-promoted event to refresh data
        this.addEventListener('student-promoted', (event) => {
            // Close the promote dialog
            this.set('showPromoteDialog', false);
            this.set('promoteStudentData', null);
            
            // Refresh the class data to show updated student information
            this.loadClassData();
            
            Toast.show({
                title: 'Success',
                message: event.detail.message || 'Student promotion completed',
                variant: 'success',
                duration: 5000
            });
        });
    }

    handleHeaderActions(event) {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        const action = button.getAttribute('data-action');
        if (action === 'show-teacher-class-info') {
            this.showTeacherClassInfo();
        } else if (action === 'download-timetable') {
            this.downloadTimetable();
        }
    }

    showTeacherClassInfo() {
        const dialog = document.createElement('ui-dialog');
        dialog.setAttribute('open', '');
        dialog.innerHTML = `
            <div slot="header" class="flex items-center">
                <i class="fas fa-chalkboard text-blue-500 mr-2"></i>
                <span class="font-semibold">About My Class</span>
            </div>
            <div slot="content" class="space-y-4">
                <p class="text-gray-700">Your assigned homeroom class overview with student list and details.</p>
                <div class="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div class="flex justify-between"><span class="text-sm font-medium">Class Name & Section</span><span class="text-sm text-gray-600">Homeroom identification</span></div>
                    <div class="flex justify-between"><span class="text-sm font-medium">Academic Year</span><span class="text-sm text-gray-600">Current academic year</span></div>
                    <div class="flex justify-between"><span class="text-sm font-medium">Students</span><span class="text-sm text-gray-600">Click a student row to view personal info</span></div>
                    <div class="flex justify-between"><span class="text-sm font-medium">Timetable</span><span class="text-sm text-gray-600">Download your class timetable</span></div>
                </div>
            </div>
            <div slot="footer" class="flex justify-end">
                <ui-button color="primary" onclick="this.closest('ui-dialog').close()">Got it</ui-button>
            </div>
        `;
        document.body.appendChild(dialog);
    }

    async loadClassData() {
        try {
            this.set('loading', true);
            this.set('error', null);

            // Get token from localStorage
            const token = localStorage.getItem('token');
            if (!token) {
                this.set('error', 'Authentication required. Please log in again.');
                return;
            }

            const response = await api.withToken(token).get('/teachers/my-class');
            
            if (response.data && response.data.success) {
                this.set('classData', response.data.data);
                
                // Store class data in localStorage for dialog access
                localStorage.setItem('teacherClassData', JSON.stringify(response.data.data));
                
                // Load timetable resources for the teacher's assigned class
                if (response.data.data && response.data.data.class_id) {
                    await this.loadTimetableResources(response.data.data.class_id);
                }
            } else {
                this.set('error', 'Failed to load class data');
            }
        } catch (error) {
            console.error('Error loading class data:', error);
            
            if (error.response && error.response.status === 401) {
                this.set('error', 'Authentication failed. Please log in again.');
            } else if (error.response && error.response.status === 404) {
                this.set('error', 'Class assignment not found. Please contact administration.');
            } else if (error.response && error.response.status === 500) {
                this.set('error', 'Server error occurred. Please try again later.');
            } else {
                this.set('error', `Failed to load class information: ${error.message}`);
            }
        } finally {
            this.set('loading', false);
        }
    }

    async loadTimetableResources(classId) {
        try {
            const response = await api.get(`/timetable-resources/class/${classId}`);
            if (response.data && response.data.success) {
                this.set('timetableResources', response.data.data || []);
            }
        } catch (error) {
            console.error('Error loading timetable resources:', error);
            // Don't set error for timetable resources, just log it
        }
    }

    downloadTimetable() {
        const resources = this.get('timetableResources');
        if (!resources || resources.length === 0) {
            // Show alert that no timetable is available
            const alert = document.createElement('ui-alert');
            alert.setAttribute('variant', 'info');
            alert.setAttribute('title', 'No Timetable Available');
            alert.setAttribute('message', 'No timetable resources are currently available for your class.');
            document.body.appendChild(alert);
            setTimeout(() => alert.remove(), 3000);
            return;
        }

        // Get the most recent timetable resource
        const latestResource = resources[0]; // Already sorted by created_at DESC
        
        if (latestResource.attachment_file) {
            // Download the file using the same method as admin
            const token = localStorage.getItem('token');
            const fileUrl = `/api/uploads/timetable-resources/${latestResource.attachment_file.split('/').pop()}?token=${token}`;
            window.open(fileUrl, '_blank');
        }
    }

    // Handle student row click
    onStudentClick(event) {
        const { detail } = event;
        const studentId = detail.row.id;
        
        // Find the student data from the class data
        const students = this.get('classData')?.students || [];
        const student = students.find(s => s.id == studentId);
        
        if (student) {
            this.set('selectedStudentData', student);
            this.set('showStudentModal', true);
            
            // Set the student data in the modal
            setTimeout(() => {
                const modal = this.querySelector('teacher-student-personal-information');
                if (modal) {
                    modal.setStudentData(student);
                }
            }, 0);
        }
    }

    // Get custom actions for the table
    getCustomActions() {
        return [
            {
                name: 'promote-student',
                label: 'Promote',
                icon: 'fas fa-arrow-up',
                variant: 'primary',
                size: 'sm',
                showField: 'can_promote'
            }
        ];
    }

    // Handle custom action clicks
    onCustomAction(event) {
        const { detail } = event;
        const { actionName, row } = detail;
        
        if (actionName === 'promote-student') {
            this.showPromoteStudentDialog(row);
        }
    }

    // Show promote student dialog
    showPromoteStudentDialog(studentData) {
        // Find the full student data from class data
        const students = this.get('classData')?.students || [];
        const fullStudentData = students.find(s => s.id == studentData.id);
        
        if (fullStudentData) {
            // Close any open modals first
            this.closeAllModals();
            
            // Set the student data and show the dialog
            this.set('promoteStudentData', fullStudentData);
            this.set('showPromoteDialog', true);
            
            // Ensure the dialog is properly initialized
            setTimeout(() => {
                const promoteDialog = this.querySelector('promote-student-dialog');
                if (promoteDialog) {
                    promoteDialog.setStudentData(fullStudentData);
                }
            }, 0);
        }
    }

    closeAllModals() {
        this.set('showStudentModal', false);
        this.set('showPromoteDialog', false);
        this.set('selectedStudentData', null);
        this.set('promoteStudentData', null);
    }

    render() {
        const loading = this.get('loading');
        const error = this.get('error');
        const classData = this.get('classData');
        const showStudentModal = this.get('showStudentModal');
        const showPromoteDialog = this.get('showPromoteDialog');
        const timetableResources = this.get('timetableResources');

        if (loading) {
            return `<data-skeleton></data-skeleton>`;
        }

        if (error) {
            return `
                <div class="space-y-6">
                    <ui-alert variant="error" title="Error" message="${error}">
                        <button slot="action" onclick="window.location.reload()" class="text-sm font-medium text-red-800 hover:text-red-900">
                            Try Again
                        </button>
                    </ui-alert>
                </div>
            `;
        }

        if (!classData) {
            return `
                <div class="space-y-8">
                    <!-- Enhanced Header for No Class -->
                    <div class="bg-gradient-to-r from-gray-600 to-gray-700 rounded-xl shadow-lg p-8 text-white text-center">
                        <div class="w-20 h-20 bg-white bg-opacity-20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6">
                            <i class="fas fa-chalkboard-teacher text-white text-3xl"></i>
                        </div>
                        <h1 class="text-3xl font-bold mb-3">No Class Assignment</h1>
                        <p class="text-gray-200 text-lg mb-6">You are not currently assigned to any class as a class teacher.</p>
                                                 <div class="flex flex-col sm:flex-row gap-4 justify-center">
                             <ui-button 
                                 color="secondary" 
                                 onclick="window.location.reload()"
                                 class="bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm text-white border border-white border-opacity-20">
                                 <i class="fas fa-sync-alt mr-2"></i>
                                 Refresh
                             </ui-button>
                             <ui-button 
                                 color="primary" 
                                 onclick="window.location.href='/dashboard/teacher'">
                                 <i class="fas fa-home mr-2"></i>
                                 Go to Dashboard
                             </ui-button>
                         </div>
                    </div>

                    <!-- Information Cards -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <!-- What This Means -->
                        <div class="bg-white shadow-sm hover:shadow-xl transition-shadow duration-300 rounded-xl p-6 border border-gray-100">
                            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                                <i class="fas fa-info-circle text-blue-600 text-xl"></i>
                            </div>
                            <h3 class="text-lg font-semibold text-gray-900 mb-2">What This Means</h3>
                            <p class="text-gray-600 text-sm">You haven't been assigned as a class teacher to any specific class yet. This usually happens when:</p>
                            <ul class="text-gray-600 text-sm mt-3 space-y-1">
                                <li>• You're a new teacher</li>
                                <li>• Class assignments are pending</li>
                                <li>• You're between class assignments</li>
                            </ul>
                        </div>

                        <!-- What You Can Do -->
                        <div class="bg-white shadow-sm hover:shadow-xl transition-shadow duration-300 rounded-xl p-6 border border-gray-100">
                            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                                <i class="fas fa-lightbulb text-green-600 text-xl"></i>
                            </div>
                            <h3 class="text-lg font-semibold text-gray-900 mb-2">What You Can Do</h3>
                            <p class="text-gray-600 text-sm">While waiting for class assignment:</p>
                            <ul class="text-gray-600 text-sm mt-3 space-y-1">
                                <li>• Update your profile information</li>
                                <li>• Review teaching materials</li>
                                <li>• Contact administration</li>
                                <li>• Check other dashboard features</li>
                            </ul>
                        </div>

                        <!-- Next Steps -->
                        <div class="bg-white shadow-sm hover:shadow-xl transition-shadow duration-300 rounded-xl p-6 border border-gray-100">
                            <div class="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                                <i class="fas fa-arrow-right text-amber-600 text-xl"></i>
                            </div>
                            <h3 class="text-lg font-semibold text-gray-900 mb-2">Next Steps</h3>
                            <p class="text-gray-600 text-sm">To get assigned to a class:</p>
                            <ul class="text-gray-600 text-sm mt-3 space-y-1">
                                <li>• Contact your department head</li>
                                <li>• Check with administration</li>
                                <li>• Wait for semester planning</li>
                                <li>• Refresh this page regularly</li>
                            </ul>
                        </div>
                    </div>

                    
                </div>
            `;
        }

        const { class_name, class_section, academic_year, capacity, status, students, student_count } = classData;
        const current_students = (student_count != null ? student_count : (Array.isArray(students) ? students.length : 0));

        // Prepare table data with separate columns
        const tableData = students ? students.map(student => ({
            id: student.id, // Keep ID for click handling
            student_name: `${student.first_name} ${student.last_name}`,
            student_id: student.student_id,
            gender: student.gender === 'male' ? 'Male' : 'Female',
            email: student.email,
            phone: student.phone || 'No phone',
            parent_name: student.parent_name || 'Not provided',
            parent_phone: student.parent_phone || 'No phone',
            status: student.status === 'active' ? 'Active' : 'Inactive',
            // Add metadata for custom actions
            can_promote: student.status === 'active' // Only active students can be promoted
        })) : [];

        const tableColumns = [
            { key: 'student_name', label: 'Student Name' },
            { key: 'student_id', label: 'Student ID' },
            { key: 'gender', label: 'Gender' },
            { key: 'email', label: 'Email' },
            { key: 'phone', label: 'Phone' },
            { key: 'parent_name', label: 'Parent Name' },
            { key: 'parent_phone', label: 'Parent Phone' },
            { key: 'status', label: 'Status' }
        ];

        return `
            <div class="space-y-8">
                <!-- Enhanced Header -->
                <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-5 text-white">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
                        <div>
                            <div class="flex items-center gap-2">
                                <h1 class="text-2xl sm:text-3xl font-bold">My Class</h1>
                                <button class="text-white/90 mt-2 hover:text-white transition-colors" data-action="show-teacher-class-info" title="About My Class">
                                    <i class="fas fa-question-circle text-lg"></i>
                                </button>
                                <button 
                                    onclick="this.closest('app-teacher-class-page').loadClassData()"
                                    class="size-8 mt-2 flex items-center justify-center text-white/90 hover:text-white transition-colors duration-200 hover:bg-white/10 rounded-lg group"
                                    title="Refresh data">
                                    <i class="fas fa-sync-alt text-lg ${this.get('loading') ? 'animate-spin' : ''} group-hover:scale-110 transition-transform duration-200"></i>
                                </button>
                            </div>
                            <p class="text-blue-100 text-base sm:text-lg">Manage your assigned class and students</p>
                        </div>
                        <div class="mt-4 sm:mt-0">
                            <ui-badge variant="secondary" size="lg">
                                <i class="fas fa-calendar-alt mr-1"></i>
                                ${academic_year || 'Current Year'}
                            </ui-badge>
                        </div>
                    </div>
                    
                    <!-- Enhanced Summary Cards -->
                    <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-emerald-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-chalkboard text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${class_name}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Class Name</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-blue-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-layer-group text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${class_section}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Section</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-green-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-users text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${student_count || 0}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Enrolled Student${(student_count || 0) > 1 ? 's' : ''}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-amber-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-user-check text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${current_students}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Current Student${current_students === 1 ? '' : 's'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Class Details and Students -->
                <div class="bg-white shadow-sm hover:shadow-xl transition-shadow duration-300 rounded-xl overflow-hidden border border-gray-100">
                    <!-- Class Header -->
                    <div class="bg-gradient-to-r from-gray-50 to-gray-100 p-5 border-b border-gray-200">
                        <div class="flex flex-col md:flex-row items-center justify-between">
                            <div class="flex items-start sm:items-center space-x-3 sm:space-x-4 mr-auto">
                                <div class="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <i class="fas fa-graduation-cap text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <h2 class="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                                        ${class_name}-${class_section}
                                    </h2>
                                    <div class="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-gray-600 text-sm">
                                        <span class="flex items-center">
                                            <i class="fas fa-calendar mr-1"></i>
                                            ${academic_year}
                                        </span>                                    
                                        <span class="flex items-center">
                                            <i class="fas fa-check-circle mr-1 text-green-500"></i>
                                            ${status || 'Active'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Timetable Download Section -->
                            <div class="flex flex-col items-start ml-auto space-y-2">
                                <div class="text-sm font-medium text-gray-700">Class Timetable</div>
                                ${timetableResources && timetableResources.length > 0 ? `
                                    <button 
                                        data-action="download-timetable"
                                        class="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                                        title="Download Timetable"
                                    >
                                        <i class="fas fa-download mr-2"></i>
                                        Download
                                    </button>
                                ` : `
                                    <div class="inline-flex items-center px-3 py-1.5 bg-gray-300 text-gray-600 text-sm font-medium rounded-lg">
                                        <i class="fas fa-clock mr-2"></i>
                                        Not available
                                    </div>
                                `}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Students Section with Accordion -->
                    <div class="p-5">
                        <ui-accordion>
                            <ui-accordion-item title="Class Students (${student_count || 0} Student${(student_count || 0) > 1 ? 's' : ''})">
                                ${students && students.length > 0 ? `
                                                                         <ui-table 
                                         data='${JSON.stringify(tableData)}'
                                         columns='${JSON.stringify(tableColumns)}'
                                         title="Students in ${class_name}-${class_section}"
                                         searchable
                                         search-placeholder="Search students..."
                                         striped
                                         print
                                         actions="view"
                                         sortable
                                         clickable
                                         refresh
                                         row-clickable="true"
                                         action
                                         ${!loading ? `custom-actions='${JSON.stringify(this.getCustomActions())}'` : ''}>
                                     </ui-table>
                                ` : `
                                    <div class="bg-gray-50 rounded-xl p-6 sm:p-8 text-center">
                                        <div class="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                                            <i class="fas fa-user-graduate text-gray-400 text-xl sm:text-2xl"></i>
                                        </div>
                                        <h4 class="text-base sm:text-lg font-medium text-gray-900 mb-2">No Students Enrolled</h4>
                                        <p class="text-gray-500 text-sm sm:text-base">This class currently has no enrolled students.</p>
                                    </div>
                                `}
                            </ui-accordion-item>
                        </ui-accordion>
                    </div>
                </div>
            </div>
            
            <!-- Student Information Modal -->
            <teacher-student-personal-information ${showStudentModal ? 'open' : ''}></teacher-student-personal-information>
            
            <!-- Promote Student Dialog -->
            <promote-student-dialog ${showPromoteDialog ? 'open' : ''}></promote-student-dialog>
        `;
    }
}

customElements.define('app-teacher-class-page', TeacherClassPage);
export default TeacherClassPage; 