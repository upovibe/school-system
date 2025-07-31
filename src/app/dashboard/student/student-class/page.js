import App from '@/core/App.js';
import '@/components/ui/Skeleton.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

/**
 * Student Class Page Component
 * 
 * Displays student's current class and subjects
 */
class StudentClassPage extends App {
    constructor() {
        super();
        this.studentData = null;
        this.classData = null;
        this.subjects = [];
        this.loading = true;
    }

    connectedCallback() {
        super.connectedCallback();
        document.title = 'My Class | School System';
        this.loadStudentClassData();
    }

    async loadStudentClassData() {
        try {
            this.set('loading', true);
            
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Please log in to view your class information',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            const response = await api.withToken(token).get('/students/my-class');
            
            if (response.status === 200 && response.data.success) {
                const data = response.data.data;
                
                this.set('studentData', data.student);
                this.set('classData', data.class);
                this.set('subjects', data.subjects || []);
            } else {
                throw new Error(response.data.message || 'Failed to load class information');
            }
        } catch (error) {
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to load class information',
                variant: 'error',
                duration: 3000
            });
        } finally {
            this.set('loading', false);
        }
    }

    render() {
        const studentData = this.get('studentData');
        const classData = this.get('classData');
        const subjects = this.get('subjects');
        const loading = this.get('loading');

        if (loading) {
            return `
                <div class="space-y-6">
                    <div class="bg-white shadow rounded-lg p-6">
                        <ui-skeleton class="h-8 w-64 mb-4"></ui-skeleton>
                        <ui-skeleton class="h-4 w-full mb-2"></ui-skeleton>
                        <ui-skeleton class="h-4 w-3/4"></ui-skeleton>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="bg-white shadow rounded-lg p-6">
                            <ui-skeleton class="h-6 w-32 mb-4"></ui-skeleton>
                            <ui-skeleton class="h-4 w-full mb-2"></ui-skeleton>
                            <ui-skeleton class="h-4 w-2/3"></ui-skeleton>
                        </div>
                        
                        <div class="bg-white shadow rounded-lg p-6">
                            <ui-skeleton class="h-6 w-32 mb-4"></ui-skeleton>
                            <ui-skeleton class="h-4 w-full mb-2"></ui-skeleton>
                            <ui-skeleton class="h-4 w-2/3"></ui-skeleton>
                        </div>
                    </div>
                </div>
            `;
        }

        return `
            <div class="space-y-6">
                <!-- Student Information -->
                <div class="bg-white shadow rounded-lg p-6">
                    <h1 class="text-2xl font-bold text-gray-900 mb-4">
                        My Class Information
                    </h1>
                    
                    ${studentData ? `
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                                <h3 class="text-lg font-semibold text-gray-900 mb-2">Student Information</h3>
                                <div class="space-y-2">
                                    <p><span class="font-medium">Name:</span> ${studentData.first_name} ${studentData.last_name}</p>
                                    <p><span class="font-medium">Student ID:</span> ${studentData.student_id}</p>
                                    <p><span class="font-medium">Email:</span> ${studentData.email}</p>
                                    <p><span class="font-medium">Admission Date:</span> ${studentData.admission_date || 'N/A'}</p>
                                </div>
                            </div>
                            
                            ${classData ? `
                                <div>
                                    <h3 class="text-lg font-semibold text-gray-900 mb-2">Current Class</h3>
                                    <div class="space-y-2">
                                        <p><span class="font-medium">Class:</span> ${classData.name}-${classData.section}</p>
                                        <p><span class="font-medium">Description:</span> ${classData.description || 'N/A'}</p>
                                    </div>
                                </div>
                            ` : `
                                <div>
                                    <h3 class="text-lg font-semibold text-gray-900 mb-2">Current Class</h3>
                                    <p class="text-gray-500">No class assigned yet</p>
                                </div>
                            `}
                        </div>
                    ` : `
                        <p class="text-gray-500">Student information not available</p>
                    `}
                </div>

                <!-- Subjects Section -->
                ${classData ? `
                    <div class="bg-white shadow rounded-lg p-6">
                        <h2 class="text-xl font-bold text-gray-900 mb-4">Class Subjects</h2>
                        
                        ${subjects.length > 0 ? `
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                ${subjects.map(subject => `
                                    <div class="border border-gray-200 rounded-lg p-4">
                                        <h3 class="font-semibold text-gray-900 mb-2">${subject.subject_name}</h3>
                                        <p class="text-sm text-gray-600 mb-2">Code: ${subject.subject_code}</p>
                                        <div class="flex justify-between items-center">
                                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                Active
                                            </span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <p class="text-gray-500">No subjects assigned to this class yet</p>
                        `}
                    </div>
                ` : ''}
            </div>
        `;
    }
}

customElements.define('app-student-class-page', StudentClassPage);
export default StudentClassPage; 