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
import '@/components/ui/Toast.js';

/**
 * Teacher House Page Component (/dashboard/teacher/house)
 * 
 * Displays the current teacher's assigned house information including students.
 */
class TeacherHousePage extends App {
    constructor() {
        super();
        this.houseData = null;
        this.loading = true;
        this.error = null;
        this.showStudentModal = false;
        this.selectedStudentData = null;
        this.selectedClassFilter = 'all';
        this.availableClasses = [];
    }

    async connectedCallback() {
        super.connectedCallback();
        document.title = 'My House | School System';
        
        await this.loadHouseData();
        
        // Add event listeners for table events
        this.addEventListener('table-row-click', this.onStudentClick.bind(this));
        this.addEventListener('click', this.handleHeaderActions.bind(this));
        this.addEventListener('change', this.handleClassFilterChange.bind(this));
    }

    handleHeaderActions(event) {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        const action = button.getAttribute('data-action');
        if (action === 'show-teacher-house-info') {
            this.showTeacherHouseInfo();
        }
    }

    handleClassFilterChange(event) {
        if (event.target.id === 'class-filter') {
            this.set('selectedClassFilter', event.target.value);
            this.render();
        }
    }

    showTeacherHouseInfo() {
        const dialog = document.createElement('ui-dialog');
        dialog.setAttribute('open', '');
        dialog.innerHTML = `
            <div slot="header" class="flex items-center">
                <i class="fas fa-home text-orange-500 mr-2"></i>
                <span class="font-semibold">About My House</span>
            </div>
            <div slot="content" class="space-y-4">
                <p class="text-gray-700">Your assigned house overview with student list and details.</p>
                <div class="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div class="flex justify-between"><span class="text-sm font-medium">House Name</span><span class="text-sm text-gray-600">House identification</span></div>
                    <div class="flex justify-between"><span class="text-sm font-medium">Description</span><span class="text-sm text-gray-600">House description</span></div>
                    <div class="flex justify-between"><span class="text-sm font-medium">Students</span><span class="text-sm text-gray-600">Click a student row to view personal info</span></div>
                </div>
            </div>
            <div slot="footer" class="flex justify-end">
                <ui-button color="primary" onclick="this.closest('ui-dialog').close()">Got it</ui-button>
            </div>
        `;
        document.body.appendChild(dialog);
    }

    async loadHouseData() {
        try {
            this.set('loading', true);
            this.set('error', null);

            // Get token from localStorage
            const token = localStorage.getItem('token');
            if (!token) {
                this.set('error', 'Authentication required. Please log in again.');
                return;
            }

            const response = await api.withToken(token).get('/teachers/my-house');
            
            if (response.data && response.data.success) {
                this.set('houseData', response.data.data);
                
                // Extract available classes from students
                const students = response.data.data?.students || [];
                const classes = [...new Set(students.map(student => ({
                    id: student.current_class_id,
                    name: student.class_name || `Class ${student.current_class_id}`,
                    section: student.class_section || ''
                })))];
                this.set('availableClasses', classes);
                
                // Store house data in localStorage for dialog access
                localStorage.setItem('teacherHouseData', JSON.stringify(response.data.data));
            } else {
                this.set('error', 'Failed to load house data');
            }
        } catch (error) {
            console.error('Error loading house data:', error);
            
            if (error.response && error.response.status === 401) {
                this.set('error', 'Authentication failed. Please log in again.');
            } else if (error.response && error.response.status === 404) {
                this.set('error', 'House assignment not found. Please contact administration.');
            } else if (error.response && error.response.status === 500) {
                this.set('error', 'Server error occurred. Please try again later.');
            } else {
                this.set('error', `Failed to load house information: ${error.message}`);
            }
        } finally {
            this.set('loading', false);
        }
    }

    // Refresh data method for the refresh button
    async refreshData() {
        try {
            await this.loadHouseData();
            Toast.show({
                title: 'Success',
                message: 'Data refreshed successfully',
                variant: 'success',
                duration: 2000
            });
        } catch (error) {
            console.error('Error refreshing data:', error);
            Toast.show({
                title: 'Error',
                message: 'Failed to refresh data',
                variant: 'error',
                duration: 3000
            });
        }
    }

    // Handle student row click
    onStudentClick(event) {
        const { detail } = event;
        const studentId = detail.row.id;
        
        // Find the student data from the house data
        const students = this.get('houseData')?.students || [];
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

    closeAllModals() {
        this.set('showStudentModal', false);
        this.set('selectedStudentData', null);
    }

    getFilteredStudents() {
        const houseData = this.get('houseData');
        const selectedClassFilter = this.get('selectedClassFilter') || 'all';
        
        if (!houseData?.students) return [];
        
        if (selectedClassFilter === 'all') {
            return houseData.students;
        }
        
        return houseData.students.filter(student => 
            student.current_class_id == selectedClassFilter
        );
    }

    setDropdownValue() {
        // Set the selected value of the dropdown after render
        setTimeout(() => {
            const dropdown = this.querySelector('#class-filter');
            if (dropdown) {
                dropdown.value = this.get('selectedClassFilter') || 'all';
            }
        }, 100);
    }

    clearFilter() {
        this.set('selectedClassFilter', 'all');
        this.render();
    }

    render() {
        const loading = this.get('loading');
        const error = this.get('error');
        const houseData = this.get('houseData');
        const showStudentModal = this.get('showStudentModal');

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

        if (!houseData) {
            return `
                <div class="space-y-8">
                    <!-- Enhanced Header for No House -->
                    <div class="bg-gradient-to-r from-gray-600 to-gray-700 rounded-xl shadow-lg p-8 text-white text-center">
                        <div class="w-20 h-20 bg-white bg-opacity-20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6">
                            <i class="fas fa-home text-white text-3xl"></i>
                        </div>
                        <h1 class="text-3xl font-bold mb-3">No House Assignment</h1>
                        <p class="text-gray-200 text-lg mb-6">You are not currently assigned to any house as a house master.</p>
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
                </div>
            `;
        }

        const { house_name, house_description } = houseData;
        const students = this.getFilteredStudents();
        const allStudents = houseData.students || [];
        const current_students = students.length;
        const total_students = allStudents.length;

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
                            <div class="flex items-center gap-2">
                                <h1 class="text-2xl sm:text-3xl font-bold">My House</h1>
                                <button class="text-white/90 mt-2 hover:text-white transition-colors" data-action="show-teacher-house-info" title="About My House">
                                    <i class="fas fa-question-circle text-lg"></i>
                                </button>
                                <button 
                                    onclick="this.closest('app-teacher-house-page').refreshData()"
                                    class="size-8 mt-2 flex items-center justify-center text-white/90 hover:text-white transition-colors duration-200 hover:bg-white/10 rounded-lg group"
                                    title="Refresh data">
                                    <i class="fas fa-sync-alt text-lg ${this.get('loading') ? 'animate-spin' : ''} group-hover:scale-110 transition-transform duration-200"></i>
                                </button>
                            </div>
                            <p class="text-blue-100 text-base sm:text-lg">Manage your assigned house and students</p>
                        </div>
                    </div>
                    
                    <!-- Enhanced Summary Cards -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-emerald-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-home text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${house_name}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">House Name</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-green-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-users text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${total_students}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Total Students</div>
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
                                    <div class="text-blue-100 text-xs sm:text-sm">Filtered Students</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- House Details and Students -->
                <div class="bg-white shadow-sm hover:shadow-xl transition-shadow duration-300 rounded-xl overflow-hidden border border-gray-100">
                    <!-- House Header -->
                    <div class="bg-gradient-to-r from-gray-50 to-gray-100 p-5 border-b border-gray-200">
                        <div class="flex flex-col md:flex-row items-center justify-between">
                            <div class="flex items-start sm:items-center space-x-3 sm:space-x-4 mr-auto">
                                <div class="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <i class="fas fa-home text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <h2 class="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                                        ${house_name}
                                    </h2>
                                    <div class="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-gray-600 text-sm">
                                        <span class="flex items-center">
                                            <i class="fas fa-info-circle mr-1"></i>
                                            ${house_description || 'No description available'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Students Section with Accordion -->
                    <div class="p-5">
                        <!-- Class Filter -->
                        <div class="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div class="flex items-center gap-4">
                                <label for="class-filter" class="text-sm font-medium text-gray-700 hidden lg:block">
                                    Filter by Class:
                                </label>
                                <select 
                                    id="class-filter" 
                                    class="px-3 py-0.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    value="${this.get('selectedClassFilter') || 'all'}"
                                >
                                    <option value="all">All Classes (${total_students})</option>
                                    ${this.get('availableClasses').map(cls => `
                                        <option value="${cls.id}">${cls.name} ${cls.section ? `- ${cls.section}` : ''}</option>
                                    `).join('')}
                                </select>
                                <button 
                                    onclick="this.closest('app-teacher-house-page').clearFilter()"
                                    class="px-3 py-0.5 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors duration-200"
                                    title="Clear filter and show all students"
                                >
                                    <i class="fas fa-times lg:mr-1"></i>
                                    <span class="hidden lg:inline">Clear</span>
                                </button>
                            </div>
                            <div class="text-sm text-gray-600">
                                Showing ${current_students} of ${total_students} students
                            </div>
                        </div>
                        
                        <ui-accordion>
                            <ui-accordion-item title="House Students (${current_students} Student${current_students > 1 ? 's' : ''})">
                                ${students && students.length > 0 ? `
                                    <ui-table 
                                        data='${JSON.stringify(tableData)}'
                                        columns='${JSON.stringify(tableColumns)}'
                                        title="Students in ${house_name}"
                                        searchable
                                        search-placeholder="Search students..."
                                        striped
                                        print
                                        actions="view"
                                        sortable
                                        clickable
                                        refresh
                                        row-clickable="true"
                                        action>
                                    </ui-table>
                                ` : `
                                    <div class="bg-gray-50 rounded-xl p-6 sm:p-8 text-center">
                                        <div class="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                                            <i class="fas fa-user-graduate text-gray-400 text-xl sm:text-2xl"></i>
                                        </div>
                                        <h4 class="text-base sm:text-lg font-medium text-gray-900 mb-2">No Students Enrolled</h4>
                                        <p class="text-gray-500 text-sm sm:text-base">This house currently has no enrolled students.</p>
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
        
        // Set dropdown value after rendering
        this.setDropdownValue();
    }
}

customElements.define('app-teacher-house-page', TeacherHousePage);
export default TeacherHousePage;
