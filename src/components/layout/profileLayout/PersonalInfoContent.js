import App from '@/core/App.js';
import api from '@/services/api.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Badge.js';
import '@/components/ui/Avatar.js';
import '@/components/layout/skeletonLoaders/ProfileContentSkeleton.js';

/**
 * Student Personal Info Content Component
 * 
 * This component displays student personal information including contact details,
 * parent information, and medical conditions. Only visible to students.
 */
class PersonalInfoContent extends App {
    constructor() {
        super();
        this.personalData = null;
        this.isLoading = true;
        this.error = null;
    }

    connectedCallback() {
        super.connectedCallback();
        this.loadPersonalInfo();
    }

    async loadPersonalInfo() {
        try {
            this.set('isLoading', true);
            this.set('error', null);

            const token = localStorage.getItem('token');
            if (!token) {
                this.set('error', 'Authentication required. Please log in again.');
                return;
            }

            const response = await api.withToken(token).get('/students/personal-info');
            
            if (response.data && response.data.success) {
                this.set('personalData', response.data.data);
            } else {
                this.set('error', 'Failed to load personal information');
            }
        } catch (error) {
            console.error('Error loading personal info:', error);
            if (error.response && error.response.status === 401) {
                this.set('error', 'Authentication failed. Please log in again.');
            } else {
                this.set('error', 'Failed to load personal information. Please try again.');
            }
        } finally {
            this.set('isLoading', false);
        }
    }

    render() {
        const loading = this.get('isLoading');
        const error = this.get('error');
        const personalData = this.get('personalData');

        if (loading) {
            return `
                <div class="space-y-6">
                    <profile-content-skeleton></profile-content-skeleton>
                </div>
            `;
        }

        if (error) {
            return `
                <div class="space-y-6">
                    <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div class="flex">
                            <div class="flex-shrink-0">
                                <i class="fas fa-exclamation-triangle text-red-400"></i>
                            </div>
                            <div class="ml-3">
                                <h3 class="text-sm font-medium text-red-800">Error</h3>
                                <div class="mt-2 text-sm text-red-700">
                                    <p>${error}</p>
                                </div>
                                <div class="mt-4">
                                    <button onclick="window.location.reload()" class="text-sm font-medium text-red-800 hover:text-red-900">
                                        Try Again
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        if (!personalData) {
            return `
                <div class="space-y-6">
                    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div class="flex">
                            <div class="flex-shrink-0">
                                <i class="fas fa-exclamation-triangle text-yellow-400"></i>
                            </div>
                            <div class="ml-3">
                                <h3 class="text-sm font-medium text-yellow-800">No Personal Information</h3>
                                <div class="mt-2 text-sm text-yellow-700">
                                    <p>No personal information found for your account.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        return `
            <div class="space-y-6">
                <!-- Personal Information Header -->
                <div class="bg-white shadow rounded-lg p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-xl font-semibold text-gray-900">Personal Information</h2>
                        <ui-badge variant="${personalData.status === 'active' ? 'success' : 'warning'}">${personalData.status}</ui-badge>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Personal Details -->
                        <div>
                            <h3 class="text-lg font-medium text-gray-900 mb-3">Personal Details</h3>
                            <div class="space-y-3">
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Student ID:</span>
                                    <span class="font-medium">${personalData.student_id}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Full Name:</span>
                                    <span class="font-medium">${personalData.first_name} ${personalData.last_name}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Email:</span>
                                    <span class="font-medium">${personalData.email || 'N/A'}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Phone:</span>
                                    <span class="font-medium">${personalData.phone || 'N/A'}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Gender:</span>
                                    <span class="font-medium capitalize">${personalData.gender || 'N/A'}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Date of Birth:</span>
                                    <span class="font-medium">${personalData.date_of_birth ? new Date(personalData.date_of_birth).toLocaleDateString() : 'N/A'}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Admission Date:</span>
                                    <span class="font-medium">${personalData.admission_date ? new Date(personalData.admission_date).toLocaleDateString() : 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Contact Information -->
                        <div>
                            <h3 class="text-lg font-medium text-gray-900 mb-3">Contact Information</h3>
                            <div class="space-y-3">
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Address:</span>
                                    <span class="font-medium text-right max-w-xs">${personalData.address || 'N/A'}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Parent Name:</span>
                                    <span class="font-medium">${personalData.parent_name || 'N/A'}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Parent Phone:</span>
                                    <span class="font-medium">${personalData.parent_phone || 'N/A'}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Parent Email:</span>
                                    <span class="font-medium">${personalData.parent_email || 'N/A'}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Emergency Contact:</span>
                                    <span class="font-medium">${personalData.emergency_contact || 'N/A'}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Emergency Phone:</span>
                                    <span class="font-medium">${personalData.emergency_phone || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Medical Information -->
                    ${personalData.blood_group || personalData.medical_conditions ? `
                        <div class="mt-6 p-4 bg-blue-50 rounded-lg">
                            <h4 class="text-sm font-medium text-blue-800 mb-3">Medical Information</h4>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                ${personalData.blood_group ? `
                                    <div class="flex justify-between">
                                        <span class="text-blue-700">Blood Group:</span>
                                        <span class="font-medium text-blue-900">${personalData.blood_group}</span>
                                    </div>
                                ` : ''}
                                ${personalData.medical_conditions ? `
                                    <div class="flex justify-between">
                                        <span class="text-blue-700">Medical Conditions:</span>
                                        <span class="font-medium text-blue-900 text-right max-w-xs">${personalData.medical_conditions}</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
}

customElements.define('personal-info-content', PersonalInfoContent);
export default PersonalInfoContent; 