import App from '@/core/App.js';
import api from '@/services/api.js';
import '@/components/ui/Card.js';
import '@/components/ui/Badge.js';
import '@/components/ui/Avatar.js';
import '@/components/ui/Alert.js';
import '@/components/ui/Table.js';
import '@/components/ui/Dialog.js';
import '@/components/layout/studentLayout/StudentSubjectDetailModal.js';

/**
 * Student Class Page Component (/dashboard/student/class)
 * 
 * Displays the current student's class information including subjects and teachers.
 */
class StudentClassPage extends App {
    constructor() {
        super();
        this.classData = null;
        this.loading = true;
        this.error = null;
        this.showSubjectModal = false;
        this.selectedSubjectData = null;
    }

    async connectedCallback() {
        super.connectedCallback();
        document.title = 'My Class | School System';
        await this.loadClassData();
        
        // Add event listeners for table events
        this.addEventListener('table-row-click', this.onSubjectClick.bind(this));
        this.addEventListener('click', this.handleHeaderActions.bind(this));
    }

    handleHeaderActions(event) {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        const action = button.getAttribute('data-action');
        if (action === 'show-student-class-info') {
            this.showStudentClassInfo();
        }
    }

    showStudentClassInfo() {
        const dialog = document.createElement('ui-dialog');
        dialog.setAttribute('open', '');
        dialog.innerHTML = `
            <div slot="header" class="flex items-center">
                <i class="fas fa-chalkboard text-blue-500 mr-2"></i>
                <span class="font-semibold">About My Class</span>
            </div>
            <div slot="content" class="space-y-4">
                <p class="text-gray-700">See your class details and subjects with assigned teachers.</p>
                <div class="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div class="flex justify-between"><span class="text-sm font-medium">Class & Section</span><span class="text-sm text-gray-600">Class name and section</span></div>
                    <div class="flex justify-between"><span class="text-sm font-medium">Academic Year</span><span class="text-sm text-gray-600">Year for the class</span></div>
                    <div class="flex justify-between"><span class="text-sm font-medium">Subjects</span><span class="text-sm text-gray-600">Click a row to view subject details</span></div>
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

            const response = await api.withToken(token).get('/students/current-class');
            
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

    // Handle subject row click
    onSubjectClick(event) {
        const { detail } = event;
        const subjectCode = detail.row.subject_code;
        
        // Find the subject data from the class data
        const subjects = this.get('classData')?.subjects || [];
        const subject = subjects.find(s => s.subject_code === subjectCode);
        
        if (subject) {
            this.set('selectedSubjectData', subject);
            this.set('showSubjectModal', true);
            
            // Set the subject data in the modal with fallback class teacher
            setTimeout(() => {
                const modal = this.querySelector('student-subject-detail-modal');
                const classTeacher = (this.get('classData') && this.get('classData').class_teacher) ? this.get('classData').class_teacher : null;
                if (modal) {
                    modal.setSubjectData(subject, classTeacher);
                }
            }, 0);
        }
    }

    render() {
        const loading = this.get('loading');
        const error = this.get('error');
        const classData = this.get('classData');
        const classTeacher = classData?.class_teacher || null;
        const showSubjectModal = this.get('showSubjectModal');

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
                    <ui-alert variant="info" title="No Class Information" message="You are not currently assigned to any class.">
                    </ui-alert>
                </div>
            `;
        }

        const { class: classInfo, subjects } = classData;

        // Prepare table data for subjects
        const tableData = subjects ? subjects.map(subject => ({
            subject_code: subject.subject_code, // Keep for click handling
            subject_name: subject.subject_name,
            subject_code_display: subject.subject_code,
            subject_category: subject.subject_category,
            term: subject.term || 'Full Year',
            teacher: subject.teacher ? `${subject.teacher.gender === 'female' ? 'Madam' : 'Sir'} ${subject.teacher.name}` : 'No teacher assigned',
            status: subject.subject_category === 'core' ? 'Core' : subject.subject_category === 'elective' ? 'Elective' : 'Optional'
        })) : [];

        const tableColumns = [
            { key: 'subject_name', label: 'Subject Name' },
            { key: 'subject_code_display', label: 'Subject Code' },
            { key: 'subject_category', label: 'Category' },
            { key: 'term', label: 'Term' },
            // { key: 'teacher', label: 'Teacher' },
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
                                <button class="text-white/90 mt-2 hover:text-white transition-colors" data-action="show-student-class-info" title="About My Class">
                                    <i class="fas fa-question-circle text-lg"></i>
                                </button>
                            </div>
                            <p class="text-blue-100 text-base sm:text-lg">View your class information and subjects</p>
                        </div>
                        <div class="mt-4 sm:mt-0">
                            <div class="text-right">
                                ${classTeacher ? `
                                <div class="text-sm sm:text-base font-semibold">${classTeacher?.gender === 'female' ? 'Class Teacher: Madam' : classTeacher?.gender === 'male' ? 'Class Teacher: Sir' : 'Class Teacher:'} ${classTeacher?.name || ''}</div>
                                <div class="text-blue-100 text-xs sm:text-sm">${classTeacher?.email || ''}</div>
                                ` : `
                                <div class="text-sm sm:text-base font-semibold">Class Teacher: Not assigned</div>
                                `}
                            </div>
                        </div>
                    </div>
                    
                    ${classInfo ? `
                        <!-- Enhanced Summary Cards -->
                        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                            <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                                <div class="flex items-center">
                                    <div class="size-10 flex items-center justify-center bg-blue-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                        <i class="fas fa-graduation-cap text-white text-lg sm:text-xl"></i>
                                    </div>
                                    <div class="min-w-0 flex-1">
                                        <div class="text-lg font-semibold">${classInfo.name}</div>
                                        <div class="text-blue-100 text-xs sm:text-sm">Class Name</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                                <div class="flex items-center">
                                    <div class="size-10 flex items-center justify-center bg-green-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                        <i class="fas fa-users text-white text-lg sm:text-xl"></i>
                                    </div>
                                    <div class="min-w-0 flex-1">
                                        <div class="text-lg font-semibold">${classInfo.section}</div>
                                        <div class="text-blue-100 text-xs sm:text-sm">Section</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                                <div class="flex items-center">
                                    <div class="size-10 flex items-center justify-center bg-purple-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                        <i class="fas fa-calendar-alt text-white text-lg sm:text-xl"></i>
                                    </div>
                                    <div class="min-w-0 flex-1">
                                        <div class="text-lg font-semibold">${classInfo.academic_year}</div>
                                        <div class="text-blue-100 text-xs sm:text-sm">Academic Year</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ` : `
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <i class="fas fa-exclamation-triangle text-yellow-300 mr-3"></i>
                                <div>
                                    <div class="text-lg font-semibold">No Class Assigned</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Please contact your administrator</div>
                                </div>
                            </div>
                        </div>
                    `}
                </div>

                <!-- Subjects Table -->
                ${subjects && subjects.length > 0 ? `
                    <div class="bg-white shadow rounded-lg p-6">
                        <ui-table 
                            data='${JSON.stringify(tableData)}'
                            columns='${JSON.stringify(tableColumns)}'
                            title="My Subjects"
                            searchable
                            search-placeholder="Search subjects..."
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
                    <div class="bg-white shadow rounded-lg p-6">
                        <h2 class="text-xl font-semibold text-gray-900 mb-4">My Subjects</h2>
                        <ui-alert variant="info" title="No Subjects" message="No subjects are currently assigned to your class.">
                        </ui-alert>
                    </div>
                `}
            </div>
            
            <!-- Subject Detail Modal -->
            <student-subject-detail-modal ${showSubjectModal ? 'open' : ''}></student-subject-detail-modal>
        `;
    }
}

customElements.define('app-student-class-page', StudentClassPage);
export default StudentClassPage; 