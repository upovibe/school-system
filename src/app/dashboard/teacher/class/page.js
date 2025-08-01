import App from '@/core/App.js';
import api from '@/services/api.js';
import '@/components/ui/Card.js';
import '@/components/ui/Badge.js';
import '@/components/ui/Avatar.js';
import '@/components/ui/Alert.js';

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
                    <ui-alert variant="info" title="No Class Assigned" message="You are not currently assigned to any class as a class teacher.">
                    </ui-alert>
                </div>
            `;
        }

        const { class_name, class_section, academic_year, capacity, status, students, student_count } = classData;

        return `
            <div class="space-y-6">
                <!-- Class Information -->
                <div class="bg-white shadow rounded-lg p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h1 class="text-2xl font-bold text-gray-900">My Class</h1>
                        <ui-badge variant="primary">${academic_year || 'Current Year'}</ui-badge>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div class="bg-blue-50 p-4 rounded-lg">
                            <h3 class="text-sm font-medium text-blue-600 mb-1">Class Name</h3>
                            <p class="text-lg font-semibold text-blue-900">${class_name}</p>
                        </div>
                        
                        <div class="bg-green-50 p-4 rounded-lg">
                            <h3 class="text-sm font-medium text-green-600 mb-1">Section</h3>
                            <p class="text-lg font-semibold text-green-900">${class_section}</p>
                        </div>
                        
                        <div class="bg-purple-50 p-4 rounded-lg">
                            <h3 class="text-sm font-medium text-purple-600 mb-1">Academic Year</h3>
                            <p class="text-lg font-semibold text-purple-900">${academic_year}</p>
                        </div>
                        
                        <div class="bg-orange-50 p-4 rounded-lg">
                            <h3 class="text-sm font-medium text-orange-600 mb-1">Students</h3>
                            <p class="text-lg font-semibold text-orange-900">${student_count} / ${capacity}</p>
                        </div>
                    </div>
                </div>

                <!-- Students List -->
                ${students && students.length > 0 ? `
                    <div class="bg-white shadow rounded-lg p-6">
                        <div class="flex items-center justify-between mb-4">
                            <h2 class="text-xl font-semibold text-gray-900">My Students (${student_count})</h2>
                            <ui-badge variant="success">Active Students</ui-badge>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="min-w-full divide-y divide-gray-200">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white divide-y divide-gray-200">
                                    ${students.map(student => `
                                        <tr class="hover:bg-gray-50">
                                            <td class="px-6 py-4 whitespace-nowrap">
                                                <div class="flex items-center">
                                                    <div class="flex-shrink-0 h-10 w-10">
                                                        <ui-avatar 
                                                            name="${student.first_name} ${student.last_name}"
                                                            size="sm"
                                                            class="h-10 w-10">
                                                        </ui-avatar>
                                                    </div>
                                                    <div class="ml-4">
                                                        <div class="text-sm font-medium text-gray-900">
                                                            ${student.first_name} ${student.last_name}
                                                        </div>
                                                        <div class="text-sm text-gray-500">
                                                            ${student.gender === 'male' ? 'Male' : 'Female'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap">
                                                <div class="text-sm text-gray-900">${student.student_id}</div>
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap">
                                                <div class="text-sm text-gray-900">${student.email}</div>
                                                <div class="text-sm text-gray-500">${student.phone || 'No phone'}</div>
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap">
                                                <div class="text-sm text-gray-900">${student.parent_name || 'Not provided'}</div>
                                                <div class="text-sm text-gray-500">${student.parent_phone || 'No phone'}</div>
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap">
                                                <ui-badge variant="${student.status === 'active' ? 'success' : 'warning'}">
                                                    ${student.status}
                                                </ui-badge>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ` : `
                    <div class="bg-white shadow rounded-lg p-6">
                        <h2 class="text-xl font-semibold text-gray-900 mb-4">My Students</h2>
                        <ui-alert variant="info" title="No Students" message="No students are currently assigned to your class.">
                        </ui-alert>
                    </div>
                `}
            </div>
        `;
    }
}

customElements.define('app-teacher-class-page', TeacherClassPage);
export default TeacherClassPage; 