import App from '@/core/App.js';
import api from '@/services/api.js';
import '@/components/ui/Card.js';
import '@/components/ui/Badge.js';
import '@/components/ui/Avatar.js';
import '@/components/ui/Alert.js';
import '@/components/ui/Table.js';
import '@/components/ui/Accordion.js';
import '@/components/layout/teacherLayout/TeacherStudentPersonalInformation.js';

/**
 * Teacher Class Page Component (/dashboard/teacher/class)
 * 
 * Displays the current teacher's assigned class information including students.
 */
class TeacherClassPage extends App {
    constructor() {
        super();
        this.classData = null;
        this.loading = true;
        this.error = null;
        this.showStudentModal = false;
        this.selectedStudentData = null;
    }

    async connectedCallback() {
        super.connectedCallback();
        document.title = 'My Class | School System';
        await this.loadClassData();
        
        // Add event listeners for table events
        this.addEventListener('table-row-click', this.onStudentClick.bind(this));
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
            } else {
                this.set('error', 'Failed to load class data');
            }
        } catch (error) {
            console.error('Error loading class data:', error);
            if (error.response && error.response.status === 401) {
                this.set('error', 'Authentication failed. Please log in again.');
            } else {
                this.set('error', 'Failed to load class information. Please try again.');
            }
        } finally {
            this.set('loading', false);
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

    render() {
        const loading = this.get('loading');
        const error = this.get('error');
        const classData = this.get('classData');
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

        if (!classData) {
            return `
                <div class="space-y-6">
                    <ui-alert variant="info" title="No Class Assigned" message="You are not currently assigned to any class as a class teacher.">
                    </ui-alert>
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
            status: student.status === 'active' ? 'Active' : 'Inactive'
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
                            <h1 class="text-2xl sm:text-3xl font-bold">My Class</h1>
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
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
                        <div class="flex items-start sm:items-center space-x-3 sm:space-x-4">
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
                                        sortable
                                        clickable
                                        refresh
                                        row-clickable="true">
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
        `;
    }
}

customElements.define('app-teacher-class-page', TeacherClassPage);
export default TeacherClassPage; 