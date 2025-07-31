import App from '@/core/App.js';
import api from '@/services/api.js';
import '@/components/ui/Card.js';
import '@/components/ui/Badge.js';
import '@/components/ui/Avatar.js';
import '@/components/ui/Alert.js';

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
    }

    async connectedCallback() {
        super.connectedCallback();
        document.title = 'My Class | School System';
        await this.loadClassData();
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

    render() {
        const loading = this.get('loading');
        const error = this.get('error');
        const classData = this.get('classData');

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

        const { class: classInfo, student, subjects } = classData;

        return `
            <div class="space-y-6">
                <!-- Class Information -->
                <div class="bg-white shadow rounded-lg p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h1 class="text-2xl font-bold text-gray-900">My Class</h1>
                        <ui-badge variant="primary">${classInfo?.academic_year || 'Current Year'}</ui-badge>
                    </div>
                    
                    ${classInfo ? `
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                            
                            <div class="bg-orange-50 p-4 rounded-lg">
                                <h3 class="text-sm font-medium text-orange-600 mb-1">Student ID</h3>
                                <p class="text-lg font-semibold text-orange-900">${student?.student_id || 'N/A'}</p>
                            </div>
                        </div>
                    ` : `
                        <ui-alert variant="warning" title="No Class Assigned" message="You are not currently assigned to any class. Please contact your administrator.">
                        </ui-alert>
                    `}
                </div>

                <!-- Subjects -->
                ${subjects && subjects.length > 0 ? `
                    <div class="bg-white shadow rounded-lg p-6">
                        <h2 class="text-xl font-semibold text-gray-900 mb-4">My Subjects</h2>
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                                             ${subjects.map(subject => `
                        <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div class="flex items-center justify-between mb-2">
                                <h3 class="text-lg font-medium text-gray-900">${subject.subject_name}</h3>
                                <div class="flex items-center gap-2">
                                    <ui-badge variant="${subject.subject_category === 'core' ? 'primary' : subject.subject_category === 'elective' ? 'success' : 'warning'}">${subject.subject_category}</ui-badge>
                                    <ui-badge variant="secondary">${subject.term || 'Full Year'}</ui-badge>
                                </div>
                            </div>
                            ${subject.subject_description ? `<p class="text-sm text-gray-600 mb-3">${subject.subject_description}</p>` : ''}
                            <div class="flex items-center justify-between text-sm text-gray-500">
                                <span>Code: ${subject.subject_code}</span>
                            </div>
                                                         ${subject.teacher ? `
                        <div class="mt-3 pt-3 border-t border-gray-100">
                            <div class="flex items-center gap-2">
                                <i class="fas ${subject.teacher.gender === 'female' ? 'fa-user-circle' : 'fa-user-circle'} text-${subject.teacher.gender === 'female' ? 'pink' : 'blue'}-500"></i>
                                <span class="text-sm font-medium text-gray-700">Teacher:</span>
                                <span class="text-sm text-gray-600">${subject.teacher.gender === 'female' ? 'Madam' : 'Sir'} ${subject.teacher.name}</span>
                            </div>
                        </div>
                    ` : `
                        <div class="mt-3 pt-3 border-t border-gray-100">
                            <div class="flex items-center gap-2">
                                <i class="fas fa-exclamation-triangle text-yellow-500"></i>
                                <span class="text-sm text-gray-500">No teacher assigned</span>
                            </div>
                        </div>
                    `}
                                 </div>
                             `).join('')}
                        </div>
                    </div>
                ` : `
                    <div class="bg-white shadow rounded-lg p-6">
                        <h2 class="text-xl font-semibold text-gray-900 mb-4">My Subjects</h2>
                        <ui-alert variant="info" title="No Subjects" message="No subjects are currently assigned to your class.">
                        </ui-alert>
                    </div>
                `}

                <!-- Student Information -->
                <div class="bg-white shadow rounded-lg p-6">
                    <h2 class="text-xl font-semibold text-gray-900 mb-4">My Information</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 class="text-lg font-medium text-gray-900 mb-3">Personal Details</h3>
                            <div class="space-y-3">
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Name:</span>
                                    <span class="font-medium">${student?.first_name} ${student?.last_name}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Email:</span>
                                    <span class="font-medium">${student?.email || 'N/A'}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Phone:</span>
                                    <span class="font-medium">${student?.phone || 'N/A'}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Status:</span>
                                    <ui-badge variant="${student?.status === 'active' ? 'success' : 'warning'}">${student?.status || 'Unknown'}</ui-badge>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <h3 class="text-lg font-medium text-gray-900 mb-3">Contact Information</h3>
                            <div class="space-y-3">
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Parent Phone:</span>
                                    <span class="font-medium">${student?.parent_phone || 'N/A'}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Parent Email:</span>
                                    <span class="font-medium">${student?.parent_email || 'N/A'}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Emergency Contact:</span>
                                    <span class="font-medium">${student?.emergency_contact || 'N/A'}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Emergency Phone:</span>
                                    <span class="font-medium">${student?.emergency_phone || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    ${student?.medical_conditions ? `
                        <div class="mt-6 p-4 bg-yellow-50 rounded-lg">
                            <h4 class="text-sm font-medium text-yellow-800 mb-2">Medical Conditions</h4>
                            <p class="text-sm text-yellow-700">${student.medical_conditions}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
}

customElements.define('app-student-class-page', StudentClassPage);
export default StudentClassPage; 