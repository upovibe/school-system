import App from '@/core/App.js';
import '@/components/ui/Button.js';
import '@/components/ui/Card.js';
import '@/components/ui/Skeleton.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

/**
 * View Student Page
 * 
 * Display student details in read-only format
 */
class ViewStudentPage extends App {
    constructor() {
        super();
        this.loading = false;
        this.student = null;
        this.studentId = null;
    }

    connectedCallback() {
        super.connectedCallback();
        document.title = 'View Student | School System';
        
        // Get student ID from URL
        this.studentId = this.getStudentIdFromUrl();
        if (this.studentId) {
            this.loadStudent();
        }
    }

    getStudentIdFromUrl() {
        const pathSegments = window.location.pathname.split('/');
        const idIndex = pathSegments.indexOf('students') + 1;
        return pathSegments[idIndex];
    }

    async loadStudent() {
        try {
            this.set('loading', true);
            
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Please log in to continue',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            const response = await api.withToken(token).get(`/students/${this.studentId}`);
            
            if (response.success) {
                this.set('student', response.data);
            } else {
                Toast.show({
                    title: 'Error',
                    message: response.message || 'Failed to load student',
                    variant: 'error',
                    duration: 3000
                });
            }
        } catch (error) {
            console.error('Error loading student:', error);
            Toast.show({
                title: 'Error',
                message: 'Failed to load student data',
                variant: 'error',
                duration: 3000
            });
        } finally {
            this.set('loading', false);
        }
    }

    handleEdit() {
        // Navigate to edit page
        const editUrl = `/dashboard/admin/students/${this.studentId}/edit`;
        if (window.router) {
            window.router.navigate(editUrl);
        } else {
            window.location.href = editUrl;
        }
    }

    handleBack() {
        // Navigate back to students list
        if (window.router) {
            window.router.navigate('/dashboard/admin/students');
        } else {
            window.location.href = '/dashboard/admin/students';
        }
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    }

    getStatusBadge(status) {
        const statusClasses = {
            'active': 'bg-green-100 text-green-800',
            'inactive': 'bg-red-100 text-red-800',
            'graduated': 'bg-blue-100 text-blue-800',
            'transferred': 'bg-yellow-100 text-yellow-800'
        };
        
        const statusText = {
            'active': 'Active',
            'inactive': 'Inactive',
            'graduated': 'Graduated',
            'transferred': 'Transferred'
        };
        
        const classes = statusClasses[status] || 'bg-gray-100 text-gray-800';
        const text = statusText[status] || status;
        
        return `<span class="px-2 py-1 text-xs font-medium rounded-full ${classes}">${text}</span>`;
    }

    render() {
        const loading = this.get('loading');
        const student = this.get('student');

        if (loading) {
            return `
                <div class="min-h-screen bg-gray-50 py-8">
                    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div class="space-y-4">
                            <ui-skeleton class="h-8 w-1/3"></ui-skeleton>
                            <ui-skeleton class="h-64 w-full"></ui-skeleton>
                        </div>
                    </div>
                </div>
            `;
        }

        if (!student) {
            return `
                <div class="min-h-screen bg-gray-50 py-8">
                    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div class="text-center">
                            <h1 class="text-2xl font-bold text-gray-900 mb-4">Student Not Found</h1>
                            <p class="text-gray-600 mb-6">The student you're looking for doesn't exist.</p>
                            <ui-button 
                                color="primary" 
                                onclick="this.closest('app-view-student-page').handleBack()">
                                Back to Students
                            </ui-button>
                        </div>
                    </div>
                </div>
            `;
        }

        return `
            <div class="min-h-screen bg-gray-50 py-8">
                <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <!-- Header -->
                    <div class="mb-8">
                        <div class="flex items-center justify-between">
                            <div>
                                <h1 class="text-3xl font-bold text-gray-900">Student Details</h1>
                                <p class="mt-2 text-gray-600">View complete student information</p>
                            </div>
                            <div class="flex space-x-4">
                                <ui-button 
                                    color="secondary" 
                                    onclick="this.closest('app-view-student-page').handleBack()">
                                    <i class="fas fa-arrow-left mr-2"></i>
                                    Back to Students
                                </ui-button>
                                <ui-button 
                                    color="primary" 
                                    onclick="this.closest('app-view-student-page').handleEdit()">
                                    <i class="fas fa-edit mr-2"></i>
                                    Edit Student
                                </ui-button>
                            </div>
                        </div>
                    </div>

                    <!-- Student Information -->
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <!-- Main Information -->
                        <div class="lg:col-span-2 space-y-6">
                            <!-- Basic Information -->
                            <ui-card class="p-6">
                                <h2 class="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-500">Student ID</label>
                                        <p class="mt-1 text-sm text-gray-900 font-medium">${student.student_id || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-500">Full Name</label>
                                        <p class="mt-1 text-sm text-gray-900 font-medium">${student.first_name || ''} ${student.last_name || ''}</p>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-500">Email</label>
                                        <p class="mt-1 text-sm text-gray-900">${student.email || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-500">Phone</label>
                                        <p class="mt-1 text-sm text-gray-900">${student.phone || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-500">Gender</label>
                                        <p class="mt-1 text-sm text-gray-900 capitalize">${student.gender || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-500">Status</label>
                                        <div class="mt-1">${this.getStatusBadge(student.status)}</div>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-500">Date of Birth</label>
                                        <p class="mt-1 text-sm text-gray-900">${this.formatDate(student.date_of_birth)}</p>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-500">Admission Date</label>
                                        <p class="mt-1 text-sm text-gray-900">${this.formatDate(student.admission_date)}</p>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-500">Class</label>
                                        <p class="mt-1 text-sm text-gray-900">${student.class_name || 'N/A'}</p>
                                    </div>
                                </div>
                            </ui-card>

                            <!-- Parent Information -->
                            <ui-card class="p-6">
                                <h2 class="text-xl font-semibold text-gray-900 mb-4">Parent Information</h2>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-500">Parent Name</label>
                                        <p class="mt-1 text-sm text-gray-900">${student.parent_name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-500">Parent Phone</label>
                                        <p class="mt-1 text-sm text-gray-900">${student.parent_phone || 'N/A'}</p>
                                    </div>
                                    <div class="md:col-span-2">
                                        <label class="block text-sm font-medium text-gray-500">Parent Email</label>
                                        <p class="mt-1 text-sm text-gray-900">${student.parent_email || 'N/A'}</p>
                                    </div>
                                </div>
                            </ui-card>

                            <!-- Emergency Contact -->
                            <ui-card class="p-6">
                                <h2 class="text-xl font-semibold text-gray-900 mb-4">Emergency Contact</h2>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-500">Emergency Contact Name</label>
                                        <p class="mt-1 text-sm text-gray-900">${student.emergency_contact || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-500">Emergency Phone</label>
                                        <p class="mt-1 text-sm text-gray-900">${student.emergency_phone || 'N/A'}</p>
                                    </div>
                                </div>
                            </ui-card>

                            <!-- Medical Information -->
                            <ui-card class="p-6">
                                <h2 class="text-xl font-semibold text-gray-900 mb-4">Medical Information</h2>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-500">Blood Group</label>
                                        <p class="mt-1 text-sm text-gray-900">${student.blood_group || 'N/A'}</p>
                                    </div>
                                    <div class="md:col-span-2">
                                        <label class="block text-sm font-medium text-gray-500">Medical Conditions</label>
                                        <p class="mt-1 text-sm text-gray-900">${student.medical_conditions || 'N/A'}</p>
                                    </div>
                                </div>
                            </ui-card>

                            <!-- Address -->
                            <ui-card class="p-6">
                                <h2 class="text-xl font-semibold text-gray-900 mb-4">Address</h2>
                                <p class="text-sm text-gray-900">${student.address || 'N/A'}</p>
                            </ui-card>
                        </div>

                        <!-- Sidebar -->
                        <div class="space-y-6">
                            <!-- Quick Info -->
                            <ui-card class="p-6">
                                <h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Info</h3>
                                <div class="space-y-3">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-500">Student ID</label>
                                        <p class="mt-1 text-sm text-gray-900 font-medium">${student.student_id || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-500">Status</label>
                                        <div class="mt-1">${this.getStatusBadge(student.status)}</div>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-500">Class</label>
                                        <p class="mt-1 text-sm text-gray-900">${student.class_name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-500">Admission Date</label>
                                        <p class="mt-1 text-sm text-gray-900">${this.formatDate(student.admission_date)}</p>
                                    </div>
                                </div>
                            </ui-card>

                            <!-- System Info -->
                            <ui-card class="p-6">
                                <h3 class="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
                                <div class="space-y-3">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-500">Created</label>
                                        <p class="mt-1 text-sm text-gray-900">${this.formatDate(student.created_at)}</p>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-500">Last Updated</label>
                                        <p class="mt-1 text-sm text-gray-900">${this.formatDate(student.updated_at)}</p>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-500">User ID</label>
                                        <p class="mt-1 text-sm text-gray-900">${student.user_id || 'N/A'}</p>
                                    </div>
                                </div>
                            </ui-card>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('app-view-student-page', ViewStudentPage);
export default ViewStudentPage; 