import App from '@/core/App.js';
import api from '@/services/api.js';
import '@/components/ui/Card.js';
import '@/components/ui/Badge.js';
import '@/components/ui/Avatar.js';
import '@/components/ui/Alert.js';
import '@/components/ui/Table.js';
import '@/components/ui/Accordion.js';
import '@/components/ui/Button.js';
import '@/components/layout/teacherLayout/TeacherStudentPersonalInformation.js';
import '@/components/layout/teacherLayout/TeacherCreateAssignmentModal.js';

/**
 * Teacher Classes-Subjects Page Component (/dashboard/teacher/schedule)
 * 
 * Displays the current teacher's assigned classes and subjects with students.
 */
class TeacherClassesSubjectsPage extends App {
    constructor() {
        super();
        this.scheduleData = null;
        this.loading = true;
        this.error = null;
        this.showStudentModal = false;
        this.selectedStudentData = null;
        this.showAssignmentModal = false;
        this.selectedClassId = null;
        this.selectedSubjectId = null;
    }

    async connectedCallback() {
        super.connectedCallback();
        document.title = 'Classes-Subjects | School System';
        await this.loadScheduleData();
        
        // Add event listeners for table events
        this.addEventListener('table-row-click', this.onStudentClick.bind(this));
        
        // Add event listeners for assignment modal
        this.addEventListener('assignment-created', this.onAssignmentCreated.bind(this));
        
        // Add event listeners for assignment buttons
        this.addEventListener('click', this.onAssignmentButtonClick.bind(this));
    }

    async loadScheduleData() {
        try {
            this.set('loading', true);
            this.set('error', null);

            // Get token from localStorage
            const token = localStorage.getItem('token');
            if (!token) {
                this.set('error', 'Authentication required. Please log in again.');
                return;
            }

            const response = await api.withToken(token).get('/teachers/my-assignments');
            
            if (response.data && response.data.success) {
                this.set('scheduleData', response.data.data);
            } else {
                this.set('error', 'Failed to load schedule data');
            }
        } catch (error) {
            console.error('Error loading schedule data:', error);
            if (error.response && error.response.status === 401) {
                this.set('error', 'Authentication failed. Please log in again.');
            } else {
                this.set('error', 'Failed to load classes and subjects information. Please try again.');
            }
        } finally {
            this.set('loading', false);
        }
    }

    // Handle student row click
    onStudentClick(event) {
        const { detail } = event;
        const studentId = detail.row.student_id;
        
        // Find the student data from the schedule data
        const assignments = this.get('scheduleData')?.assignments || [];
        let foundStudent = null;
        
        for (const assignment of assignments) {
            const students = assignment.students || [];
            foundStudent = students.find(s => s.student_id === studentId);
            if (foundStudent) break;
        }
        
        if (foundStudent) {
            this.set('selectedStudentData', foundStudent);
            this.set('showStudentModal', true);
            
            // Set the student data in the modal
            setTimeout(() => {
                const modal = this.querySelector('teacher-student-personal-information');
                if (modal) {
                    modal.setStudentData(foundStudent);
                }
            }, 0);
        }
    }

    // Handle assignment creation
    onAssignmentCreated(event) {
        // Refresh the schedule data after assignment creation
        this.loadScheduleData();
    }

    // Handle assignment button clicks
    onAssignmentButtonClick(event) {
        // Check if the clicked element is an assignment button
        const button = event.target.closest('.add-assignment-btn');
        if (button) {
            const classId = button.getAttribute('data-class-id');
            const subjectId = button.getAttribute('data-subject-id');
            

            
            this.openAssignmentModal(classId, subjectId);
        }
    }

    // Open assignment creation modal
    openAssignmentModal(classId, subjectId) {
        this.set('selectedClassId', classId);
        this.set('selectedSubjectId', subjectId);
        this.set('showAssignmentModal', true);
        

        
        // Open the modal
        setTimeout(() => {
            const modal = this.querySelector('teacher-create-assignment-modal');
            if (modal) {
                modal.open(classId, subjectId);
            }
        }, 0);
    }

    render() {
        const loading = this.get('loading');
        const error = this.get('error');
        const scheduleData = this.get('scheduleData');
        const showStudentModal = this.get('showStudentModal');
        const showAssignmentModal = this.get('showAssignmentModal');

        if (loading) {
            return `
                <div class="space-y-6">
                    <div class="bg-white shadow rounded-lg p-4">
                        <div class="animate-pulse">
                            <div class="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                            <div class="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                            <div class="h-4 bg-gray-200 rounded w-2/3"></div>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="bg-white shadow rounded-lg p-6">
                            <div class="animate-pulse">
                                <div class="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                                <div class="space-y-3">
                                    <div class="h-4 bg-gray-200 rounded"></div>
                                    <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                                    <div class="h-4 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-white shadow rounded-lg p-6">
                            <div class="animate-pulse">
                                <div class="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                                <div class="space-y-3">
                                    <div class="h-4 bg-gray-200 rounded"></div>
                                    <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                                    <div class="h-4 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
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

        if (!scheduleData || !scheduleData.assignments || scheduleData.assignments.length === 0) {
            return `
                <div class="space-y-6">
                    <div class="bg-white shadow rounded-lg p-8 text-center">
                        <div class="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <i class="fas fa-chalkboard-teacher text-3xl text-gray-400"></i>
                        </div>
                        <h3 class="text-lg font-medium text-gray-900 mb-2">No Teaching Assignments</h3>
                        <p class="text-gray-500 max-w-md mx-auto">
                            You are not currently assigned to any classes or subjects. 
                            Please contact the administration for teaching assignments.
                        </p>
                    </div>
                </div>
            `;
        }

        const { teacher_name, assignments, summary } = scheduleData;

        return `
            <div class="space-y-8">
                <!-- Enhanced Header with Teacher Info -->
                <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-5 text-white">
                    <div class="flex flex-col sm:justify-between mb-4 sm:mb-6">
                            <h1 class="text-2xl sm:text-3xl font-bold">My Classes & Subjects</h1>
                            <p class="text-blue-100 text-base sm:text-lg">Welcome back, ${teacher_name}</p>
                    </div>
                    
                    <!-- Enhanced Summary Cards -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-lime-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-graduation-cap text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${summary.total_classes}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Total Class${summary.total_classes > 1 ? 'es' : ''}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-green-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-book text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${summary.total_subjects}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Total Subject${summary.total_subjects > 1 ? 's' : ''} Across all classes</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20 sm:col-span-2 lg:col-span-1">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-purple-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-tasks text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${summary.total_assignments}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Total Assignment${summary.total_assignments > 1 ? 's' : ''}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Enhanced Classes and Subjects -->
                ${assignments.map((assignment, index) => `
                    <div class="bg-white shadow-sm hover:shadow-xl transition-shadow duration-300 rounded-xl overflow-hidden border border-gray-100 my-5">
                        <!-- Class Header with Enhanced Design -->
                        <div class="bg-gradient-to-r from-gray-50 to-gray-100 p-5 border-b border-gray-200">
                                <div class="flex items-start sm:items-center space-x-3 sm:space-x-4">
                                    <div class="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <i class="fas fa-chalkboard text-white text-lg sm:text-xl"></i>
                                    </div>
                                    <div class="min-w-0 flex-1">
                                        <h2 class="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                                            ${assignment.class_name}-${assignment.class_section}
                                </h2>
                                        <div class="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-gray-600 text-sm">
                                            <span class="flex items-center">
                                                <i class="fas fa-calendar mr-1"></i>
                                                ${assignment.class_academic_year}
                                            </span>
                                            <span class="flex items-center">
                                                <i class="fas fa-users mr-1"></i>
                                                ${assignment.class_capacity} students
                                            </span>
                                        </div>
                                    </div>
                            </div>
                        </div>

                        <div class="p-5">
                            <!-- Enhanced Subjects Section -->
                            <div class="mb-6 sm:mb-8">
                                <div class="flex flex-col sm:flex-row sm:items-center mb-4 sm:mb-6 space-y-2 sm:space-y-0">
                                    <div class="flex items-center">
                                        <div class="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                                            <i class="fas fa-book text-white text-xs sm:text-sm"></i>
                                        </div>
                                         <h3 class="text-lg sm:text-xl font-semibold text-gray-900">Subject${assignment.subjects.length > 1 ? 's' : ''} Taught</h3>
                                    </div>
                                    <div class="sm:ml-auto">
                                        <ui-badge color="success"><i class="fas fa-book mr-1"></i>${assignment.subjects.length} Subject${assignment.subjects.length > 1 ? 's' : ''}</ui-badge>
                                    </div>
                                </div>
                                
                                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                    ${assignment.subjects.map(subject => `
                                        <div class="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 sm:p-6 hover:shadow-md transition-shadow duration-200">
                                            <div class="flex items-start justify-between">
                                                <div class="flex-1 min-w-0">
                                                    <h4 class="font-semibold text-gray-900 text-base sm:text-lg mb-1 truncate">${subject.subject_name}</h4>
                                                    <div class="flex items-center gap-2">
                                                        <ui-badge color="info"><i class="fas fa-code mr-1"></i>${subject.subject_code}</ui-badge>
                                                        <ui-badge color="warning"><i class="fas fa-tag mr-1"></i>${subject.subject_category.toUpperCase()}</ui-badge>
                                                    </div>
                                                </div>
                                                <div class="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                                    <i class="fas fa-book-open text-white text-xs sm:text-sm"></i>
                                                </div>
                                            </div>
                                            <div class="space-y-2">
                                                ${subject.subject_description ? `
                                                    <div class="flex items-start gap-1 text-xs sm:text-sm text-gray-500 bg-white bg-opacity-50 rounded-lg py-2">
                                                        <i class="fas fa-info-circle mt-0.5 text-blue-500"></i>
                                                        <span class="line-clamp-2">${subject.subject_description}</span>
                                                    </div>
                                                ` : ''}
                                                
                                                <!-- Add Assignment Button -->
                                                <div class="pt-3 border-t border-green-200">
                                                    <button 
                                                        type="button"
                                                        data-class-id="${assignment.class_id}"
                                                        data-subject-id="${subject.subject_id}"
                                                        class="add-assignment-btn text-sm font-medium text-gray-800 transition-colors duration-200 flex items-center w-full">
                                                        <i class="fas fa-plus mr-1"></i>
                                                        Add Assignment
                                                    </button>
                                                </div>
                                            </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                                                         <!-- Enhanced Students Section with Accordion -->
                        <div>
                                 <ui-accordion>
                                     <ui-accordion-item title="Class Students (${assignment.students.length} Student${assignment.students.length > 1 ? 's' : ''})">
                            ${assignment.students.length > 0 ? `
                                    <ui-table 
                                        data='${JSON.stringify(this.prepareStudentTableData(assignment.students))}'
                                        columns='${JSON.stringify(this.getStudentTableColumns())}'
                                                         title="Students in ${assignment.class_name}-${assignment.class_section}"
                                        searchable
                                        search-placeholder="Search students..."
                                        striped
                                        print
                                        sortable
                                        clickable
                                        refresh
                                        row-clickable="true"
                                        >
                                    </ui-table>
                                </div>
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
                `).join('')}
            </div>
            
            <!-- Student Information Modal -->
            <teacher-student-personal-information ${showStudentModal ? 'open' : ''}></teacher-student-personal-information>
            
            <!-- Assignment Creation Modal -->
            <teacher-create-assignment-modal ${showAssignmentModal ? 'open' : ''}></teacher-create-assignment-modal>
        `;
    }

    prepareStudentTableData(students) {
        return students.map(student => ({
            student_id: student.student_id,
            name: `${student.first_name} ${student.last_name}`,
            gender: student.gender === 'male' ? 'Male' : 'Female',
            email: student.email || 'No email',
            phone: student.phone || 'No phone',
            status: student.status === 'active' ? 'Active' : 'Inactive'
        }));
    }

    getStudentTableColumns() {
        return [
            { key: 'name', label: 'Student Name' },
            { key: 'gender', label: 'Gender' },
            { key: 'email', label: 'Email' },
            { key: 'phone', label: 'Phone' },
            { key: 'status', label: 'Status' }
        ];
    }
}

customElements.define('app-teacher-classes-subjects-page', TeacherClassesSubjectsPage);
export default TeacherClassesSubjectsPage; 