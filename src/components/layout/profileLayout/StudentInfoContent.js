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
class StudentInfoContent extends App {
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
                <!-- Student Profile Header -->
                <div class="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl p-6 text-white shadow-lg">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-4">
                            <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                                <i class="fas fa-user-graduate text-2xl"></i>
                            </div>
                            <div>
                                <h2 class="text-2xl font-bold">Student Profile</h2>
                                <p class="text-blue-100">Your personal information and details</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <ui-badge variant="${personalData.status === 'active' ? 'success' : 'warning'}" class="text-sm">
                                <i class="fas fa-circle mr-1"></i>${personalData.status}
                            </ui-badge>
                            <p class="text-blue-100 text-sm mt-1">Student ID: ${personalData.student_id}</p>
                        </div>
                    </div>
                </div>

                <!-- Personal Details Card -->
                <div class="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                    <div class="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4">
                        <div class="flex items-center space-x-3">
                            <i class="fas fa-user-circle text-white text-xl"></i>
                            <h3 class="text-lg font-semibold text-white">Personal Details</h3>
                        </div>
                    </div>
                    <div class="p-6">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="space-y-4">
                                <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                    <i class="fas fa-id-card text-blue-500"></i>
                                    <div class="flex-1">
                                        <p class="text-xs text-gray-500 uppercase tracking-wide">Full Name</p>
                                        <p class="font-semibold text-gray-900">${personalData.first_name} ${personalData.last_name}</p>
                                    </div>
                                </div>
                                
                                <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                    <i class="fas fa-envelope text-green-500"></i>
                                    <div class="flex-1">
                                        <p class="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                                        <p class="font-semibold text-gray-900">${personalData.email || 'N/A'}</p>
                                    </div>
                                </div>
                                
                                <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                    <i class="fas fa-phone text-purple-500"></i>
                                    <div class="flex-1">
                                        <p class="text-xs text-gray-500 uppercase tracking-wide">Phone</p>
                                        <p class="font-semibold text-gray-900">${personalData.phone || 'N/A'}</p>
                                    </div>
                                </div>
                                
                                <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                    <i class="fas fa-${personalData.gender === 'female' ? 'venus' : 'mars'} text-${personalData.gender === 'female' ? 'pink' : 'blue'}-500"></i>
                                    <div class="flex-1">
                                        <p class="text-xs text-gray-500 uppercase tracking-wide">Gender</p>
                                        <p class="font-semibold text-gray-900 capitalize">${personalData.gender || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="space-y-4">
                                <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                    <i class="fas fa-birthday-cake text-orange-500"></i>
                                    <div class="flex-1">
                                        <p class="text-xs text-gray-500 uppercase tracking-wide">Date of Birth</p>
                                        <p class="font-semibold text-gray-900">${personalData.date_of_birth ? new Date(personalData.date_of_birth).toLocaleDateString() : 'N/A'}</p>
                                    </div>
                                </div>
                                
                                <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                    <i class="fas fa-calendar-check text-indigo-500"></i>
                                    <div class="flex-1">
                                        <p class="text-xs text-gray-500 uppercase tracking-wide">Admission Date</p>
                                        <p class="font-semibold text-gray-900">${personalData.admission_date ? new Date(personalData.admission_date).toLocaleDateString() : 'N/A'}</p>
                                    </div>
                                </div>
                                
                                <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                    <i class="fas fa-map-marker-alt text-red-500"></i>
                                    <div class="flex-1">
                                        <p class="text-xs text-gray-500 uppercase tracking-wide">Address</p>
                                        <p class="font-semibold text-gray-900 text-sm">${personalData.address || 'N/A'}</p>
                                    </div>
                                </div>
                                
                                <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                    <i class="fas fa-clock text-teal-500"></i>
                                    <div class="flex-1">
                                        <p class="text-xs text-gray-500 uppercase tracking-wide">Student Since</p>
                                        <p class="font-semibold text-gray-900">${personalData.admission_date ? Math.floor((new Date() - new Date(personalData.admission_date)) / (1000 * 60 * 60 * 24 * 365)) + ' years' : 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Contact Information Card -->
                <div class="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                    <div class="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4">
                        <div class="flex items-center space-x-3">
                            <i class="fas fa-address-book text-white text-xl"></i>
                            <h3 class="text-lg font-semibold text-white">Contact Information</h3>
                        </div>
                    </div>
                    <div class="p-6">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="space-y-4">
                                <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                    <i class="fas fa-users text-blue-500"></i>
                                    <div class="flex-1">
                                        <p class="text-xs text-gray-500 uppercase tracking-wide">Parent Name</p>
                                        <p class="font-semibold text-gray-900">${personalData.parent_name || 'N/A'}</p>
                                    </div>
                                </div>
                                
                                <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                    <i class="fas fa-phone-alt text-green-500"></i>
                                    <div class="flex-1">
                                        <p class="text-xs text-gray-500 uppercase tracking-wide">Parent Phone</p>
                                        <p class="font-semibold text-gray-900">${personalData.parent_phone || 'N/A'}</p>
                                    </div>
                                </div>
                                
                                <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                    <i class="fas fa-envelope-open text-purple-500"></i>
                                    <div class="flex-1">
                                        <p class="text-xs text-gray-500 uppercase tracking-wide">Parent Email</p>
                                        <p class="font-semibold text-gray-900">${personalData.parent_email || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="space-y-4">
                                <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                    <i class="fas fa-exclamation-triangle text-orange-500"></i>
                                    <div class="flex-1">
                                        <p class="text-xs text-gray-500 uppercase tracking-wide">Emergency Contact</p>
                                        <p class="font-semibold text-gray-900">${personalData.emergency_contact || 'N/A'}</p>
                                    </div>
                                </div>
                                
                                <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                    <i class="fas fa-phone-square text-red-500"></i>
                                    <div class="flex-1">
                                        <p class="text-xs text-gray-500 uppercase tracking-wide">Emergency Phone</p>
                                        <p class="font-semibold text-gray-900">${personalData.emergency_phone || 'N/A'}</p>
                                    </div>
                                </div>
                                
                                <div class="flex items-center space-x-3 p-3 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg border border-yellow-200">
                                    <i class="fas fa-shield-alt text-yellow-600"></i>
                                    <div class="flex-1">
                                        <p class="text-xs text-yellow-700 uppercase tracking-wide">Contact Status</p>
                                        <p class="font-semibold text-yellow-800">${personalData.emergency_contact ? 'Emergency Contact Set' : 'No Emergency Contact'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Medical Information Card -->
                ${personalData.blood_group || personalData.medical_conditions ? `
                    <div class="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                        <div class="bg-gradient-to-r from-red-500 to-pink-500 px-6 py-4">
                            <div class="flex items-center space-x-3">
                                <i class="fas fa-heartbeat text-white text-xl"></i>
                                <h3 class="text-lg font-semibold text-white">Medical Information</h3>
                            </div>
                        </div>
                        <div class="p-6">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                ${personalData.blood_group ? `
                                    <div class="flex items-center space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
                                        <i class="fas fa-tint text-red-500"></i>
                                        <div class="flex-1">
                                            <p class="text-xs text-red-600 uppercase tracking-wide">Blood Group</p>
                                            <p class="font-semibold text-red-800">${personalData.blood_group}</p>
                                        </div>
                                    </div>
                                ` : ''}
                                ${personalData.medical_conditions ? `
                                    <div class="flex items-center space-x-3 p-3 bg-pink-50 rounded-lg border border-pink-200">
                                        <i class="fas fa-notes-medical text-pink-500"></i>
                                        <div class="flex-1">
                                            <p class="text-xs text-pink-600 uppercase tracking-wide">Medical Conditions</p>
                                            <p class="font-semibold text-pink-800 text-sm">${personalData.medical_conditions}</p>
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                ` : ''}

                <!-- Quick Stats -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white text-center">
                        <i class="fas fa-calendar-day text-2xl mb-2"></i>
                        <p class="text-sm opacity-90">Days Enrolled</p>
                        <p class="text-xl font-bold">${personalData.admission_date ? Math.floor((new Date() - new Date(personalData.admission_date)) / (1000 * 60 * 60 * 24)) : 'N/A'}</p>
                    </div>
                    
                    <div class="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white text-center">
                        <i class="fas fa-user-check text-2xl mb-2"></i>
                        <p class="text-sm opacity-90">Status</p>
                        <p class="text-xl font-bold capitalize">${personalData.status}</p>
                    </div>
                    
                    <div class="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white text-center">
                        <i class="fas fa-${personalData.gender === 'female' ? 'venus' : 'mars'} text-2xl mb-2"></i>
                        <p class="text-sm opacity-90">Gender</p>
                        <p class="text-xl font-bold capitalize">${personalData.gender || 'N/A'}</p>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('student-info-content', StudentInfoContent);
export default StudentInfoContent; 