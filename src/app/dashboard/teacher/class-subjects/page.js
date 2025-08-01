import App from '@/core/App.js';
import api from '@/services/api.js';
import '@/components/ui/Card.js';
import '@/components/ui/Badge.js';
import '@/components/ui/Avatar.js';
import '@/components/ui/Alert.js';
import '@/components/ui/Table.js';
import '@/components/layout/teacherLayout/TeacherStudentPersonalInformation.js';

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
    }

    async connectedCallback() {
        super.connectedCallback();
        document.title = 'Classes-Subjects | School System';
        await this.loadScheduleData();
        
        // Add event listeners for table events
        this.addEventListener('table-row-click', this.onStudentClick.bind(this));
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

    render() {
        const loading = this.get('loading');
        const error = this.get('error');
        const scheduleData = this.get('scheduleData');
        const showStudentModal = this.get('showStudentModal');

        if (loading) {
            return `
                <div class="space-y-6">
                    <div class="bg-white shadow rounded-lg p-6">
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
                    <ui-alert variant="info" title="No Classes Assigned" message="You are not currently assigned to any classes or subjects.">
                    </ui-alert>
                </div>
            `;
        }

        const { teacher_name, assignments, summary } = scheduleData;

        return `
            <div class="space-y-6">
                <!-- Header Information -->
                <div class="bg-white shadow rounded-lg p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h1 class="text-2xl font-bold text-gray-900">Classes-Subjects</h1>
                        <ui-badge variant="primary">${summary.total_classes} Classes</ui-badge>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div class="bg-blue-50 p-4 rounded-lg">
                            <h3 class="text-sm font-medium text-blue-600 mb-1">Total Class${summary.total_classes > 1 ? 'es' : ''}</h3>
                            <p class="text-lg font-semibold text-blue-900">${summary.total_classes}</p>
                        </div>
                        
                        <div class="bg-green-50 p-4 rounded-lg">
                            <h3 class="text-sm font-medium text-green-600 mb-1">Total Subject${summary.total_subjects > 1 ? 's' : ''}</h3>
                            <p class="text-lg font-semibold text-green-900">${summary.total_subjects}</p>
                        </div>
                        
                        <div class="bg-purple-50 p-4 rounded-lg">
                            <h3 class="text-sm font-medium text-purple-600 mb-1">Total Assignment${summary.total_assignments > 1 ? 's' : ''}</h3>
                            <p class="text-lg font-semibold text-purple-900">${summary.total_assignments}</p>
                         </div>
                    </div>
                </div>

                <!-- Classes and Subjects -->
                ${assignments.map(assignment => `
                    <div class="bg-white shadow rounded-lg p-6">
                        <div class="flex items-center justify-between mb-4">
                            <div>
                                <h2 class="text-xl font-semibold text-gray-900">
                                    ${assignment.class_name} - Section ${assignment.class_section}
                                </h2>
                                <p class="text-gray-600">
                                    Academic Year: ${assignment.class_academic_year} | 
                                    Capacity: ${assignment.class_capacity} students
                                </p>
                            </div>
                            <ui-badge variant="${assignment.class_status === 'active' ? 'success' : 'warning'}">
                                ${assignment.class_status}
                            </ui-badge>
                        </div>

                        <!-- Subjects -->
                        <div class="mb-6">
                            <h3 class="text-lg font-medium text-gray-800 mb-3">
                                <i class="fas fa-book mr-2"></i>Subjects Taught
                            </h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                ${assignment.subjects.map(subject => `
                                    <div class="bg-gray-50 p-4 rounded-lg border">
                                        <div class="flex items-center justify-between mb-2">
                                            <h4 class="font-medium text-gray-900">${subject.subject_name}</h4>
                                            <ui-badge color="info" size="sm">${subject.subject_code}</ui-badge>
                                        </div>
                                        <p class="text-sm text-gray-600 mb-2">${subject.subject_category}</p>
                                        ${subject.subject_description ? `
                                            <p class="text-xs text-gray-500">${subject.subject_description}</p>
                                        ` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Students -->
                        <div>
                            <h3 class="text-lg font-medium text-gray-800 mb-3">
                                <i class="fas fa-users mr-2"></i>Students (${assignment.students.length})
                            </h3>
                            ${assignment.students.length > 0 ? `
                                <div class="overflow-x-auto">
                                    <ui-table 
                                        data='${JSON.stringify(this.prepareStudentTableData(assignment.students))}'
                                        columns='${JSON.stringify(this.getStudentTableColumns())}'
                                        title="Students in ${assignment.class_name}"
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
                                <div class="text-center py-8 bg-gray-50 rounded-lg">
                                    <i class="fas fa-user-graduate text-gray-400 text-3xl mb-2"></i>
                                    <p class="text-gray-500">No students enrolled in this class</p>
                                </div>
                            `}
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <!-- Student Information Modal -->
            <teacher-student-personal-information ${showStudentModal ? 'open' : ''}></teacher-student-personal-information>
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