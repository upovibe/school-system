import App from '@/core/App.js';
import api from '@/services/api.js';
import '@/components/ui/Card.js';
import '@/components/ui/Badge.js';
import '@/components/ui/Avatar.js';
import '@/components/ui/Alert.js';
import '@/components/ui/Table.js';
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
            
            // Set the subject data in the modal
            setTimeout(() => {
                const modal = this.querySelector('student-subject-detail-modal');
                if (modal) {
                    modal.setSubjectData(subject);
                }
            }, 0);
        }
    }

    render() {
        const loading = this.get('loading');
        const error = this.get('error');
        const classData = this.get('classData');
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
            { key: 'teacher', label: 'Teacher' },
            { key: 'status', label: 'Status' }
        ];

        return `
            <div class="space-y-6">
                <!-- Class Information -->
                <div class="bg-white shadow rounded-lg p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h1 class="text-2xl font-bold text-gray-900">My Class</h1>
                        <ui-badge variant="primary">${classInfo?.academic_year || 'Current Year'}</ui-badge>
                    </div>
                    
                    ${classInfo ? `
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                            <div class="bg-blue-50 p-4 rounded-lg">
                                <h3 class="text-sm font-medium text-blue-600 mb-1">Class Name</h3>
                                <p class="text-lg font-semibold text-blue-900">${classInfo.name}</p>
                            </div>
                            
                            <div class="bg-green-50 p-4 rounded-lg">
                                <h3 class="text-sm font-medium text-green-600 mb-1">Section</h3>
                                <p class="text-lg font-semibold text-green-900">${classInfo.section}</p>
                            </div>
                            
                            <div class="bg-purple-50 p-4 rounded-lg">
                                <h3 class="text-sm font-medium text-purple-600 mb-1">Academic Year</h3>
                                <p class="text-lg font-semibold text-purple-900">${classInfo.academic_year}</p>
                            </div>
                        </div>
                    ` : `
                        <ui-alert variant="warning" title="No Class Assigned" message="You are not currently assigned to any class. Please contact your administrator.">
                        </ui-alert>
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