import App from '@/core/App.js';
import '@/components/ui/Button.js';
import '@/components/ui/Input.js';
import '@/components/ui/Select.js';
import '@/components/ui/Textarea.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Card.js';
import api from '@/services/api.js';

/**
 * Add Student Page
 * 
 * Form to create new students
 */
class AddStudentPage extends App {
    constructor() {
        super();
        this.loading = false;
        this.submitting = false;
        this.classes = [];
        this.formData = {
            student_id: '',
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            address: '',
            date_of_birth: '',
            gender: '',
            admission_date: '',
            current_class_id: '',
            parent_name: '',
            parent_phone: '',
            parent_email: '',
            emergency_contact: '',
            emergency_phone: '',
            blood_group: '',
            medical_conditions: '',
            password: '',
            status: 'active'
        };
    }

    connectedCallback() {
        super.connectedCallback();
        document.title = 'Add Student | School System';
        this.loadClasses();
    }

    async loadClasses() {
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

            const response = await api.withToken(token).get('/classes/active');
            
            if (response.success) {
                this.set('classes', response.data);
            } else {
                Toast.show({
                    title: 'Error',
                    message: 'Failed to load classes',
                    variant: 'error',
                    duration: 3000
                });
            }
        } catch (error) {
            console.error('Error loading classes:', error);
            Toast.show({
                title: 'Error',
                message: 'Failed to load classes data',
                variant: 'error',
                duration: 3000
            });
        } finally {
            this.set('loading', false);
        }
    }

    handleInputChange(field, value) {
        this.formData[field] = value;
        this.set('formData', { ...this.formData });
    }

    async handleSubmit() {
        try {
            this.set('submitting', true);

            // Validate required fields
            const requiredFields = ['student_id', 'first_name', 'last_name', 'email', 'password'];
            const missingFields = requiredFields.filter(field => !this.formData[field]);
            
            if (missingFields.length > 0) {
                Toast.show({
                    title: 'Validation Error',
                    message: `Please fill in all required fields: ${missingFields.join(', ')}`,
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(this.formData.email)) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please enter a valid email address',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Validate password length
            if (this.formData.password.length < 6) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Password must be at least 6 characters long',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

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

            const response = await api.withToken(token).post('/students', this.formData);
            
            if (response.success) {
                Toast.show({
                    title: 'Success',
                    message: 'Student created successfully',
                    variant: 'success',
                    duration: 3000
                });

                // Navigate back to students list
                setTimeout(() => {
                    if (window.router) {
                        window.router.navigate('/dashboard/admin/students');
                    } else {
                        window.location.href = '/dashboard/admin/students';
                    }
                }, 1000);
            } else {
                Toast.show({
                    title: 'Error',
                    message: response.message || 'Failed to create student',
                    variant: 'error',
                    duration: 3000
                });
            }
        } catch (error) {
            console.error('Error creating student:', error);
            Toast.show({
                title: 'Error',
                message: 'Failed to create student',
                variant: 'error',
                duration: 3000
            });
        } finally {
            this.set('submitting', false);
        }
    }

    handleCancel() {
        // Navigate back to students list
        if (window.router) {
            window.router.navigate('/dashboard/admin/students');
        } else {
            window.location.href = '/dashboard/admin/students';
        }
    }

    render() {
        const loading = this.get('loading');
        const submitting = this.get('submitting');
        const classes = this.get('classes');
        const formData = this.get('formData');

        return `
            <div class="min-h-screen bg-gray-50 py-8">
                <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <!-- Header -->
                    <div class="mb-8">
                        <div class="flex items-center justify-between">
                            <div>
                                <h1 class="text-3xl font-bold text-gray-900">Add New Student</h1>
                                <p class="mt-2 text-gray-600">Create a new student account with all necessary information</p>
                            </div>
                            <ui-button 
                                color="secondary" 
                                onclick="this.closest('app-add-student-page').handleCancel()">
                                <i class="fas fa-arrow-left mr-2"></i>
                                Back to Students
                            </ui-button>
                        </div>
                    </div>

                    ${loading ? `
                        <!-- Loading State -->
                        <div class="space-y-4">
                            <ui-skeleton class="h-8 w-1/3"></ui-skeleton>
                            <ui-skeleton class="h-64 w-full"></ui-skeleton>
                        </div>
                    ` : `
                        <!-- Form -->
                        <ui-card class="p-6">
                            <form onsubmit="event.preventDefault(); this.closest('app-add-student-page').handleSubmit();">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <!-- Student ID -->
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">
                                            Student ID *
                                        </label>
                                        <ui-input 
                                            type="text" 
                                            placeholder="Enter student ID"
                                            value="${formData.student_id}"
                                            oninput="this.closest('app-add-student-page').handleInputChange('student_id', this.value)"
                                            required>
                                        </ui-input>
                                    </div>

                                    <!-- First Name -->
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">
                                            First Name *
                                        </label>
                                        <ui-input 
                                            type="text" 
                                            placeholder="Enter first name"
                                            value="${formData.first_name}"
                                            oninput="this.closest('app-add-student-page').handleInputChange('first_name', this.value)"
                                            required>
                                        </ui-input>
                                    </div>

                                    <!-- Last Name -->
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">
                                            Last Name *
                                        </label>
                                        <ui-input 
                                            type="text" 
                                            placeholder="Enter last name"
                                            value="${formData.last_name}"
                                            oninput="this.closest('app-add-student-page').handleInputChange('last_name', this.value)"
                                            required>
                                        </ui-input>
                                    </div>

                                    <!-- Email -->
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">
                                            Email *
                                        </label>
                                        <ui-input 
                                            type="email" 
                                            placeholder="Enter email address"
                                            value="${formData.email}"
                                            oninput="this.closest('app-add-student-page').handleInputChange('email', this.value)"
                                            required>
                                        </ui-input>
                                    </div>

                                    <!-- Phone -->
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">
                                            Phone
                                        </label>
                                        <ui-input 
                                            type="tel" 
                                            placeholder="Enter phone number"
                                            value="${formData.phone}"
                                            oninput="this.closest('app-add-student-page').handleInputChange('phone', this.value)">
                                        </ui-input>
                                    </div>

                                    <!-- Date of Birth -->
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">
                                            Date of Birth
                                        </label>
                                        <ui-input 
                                            type="date" 
                                            value="${formData.date_of_birth}"
                                            oninput="this.closest('app-add-student-page').handleInputChange('date_of_birth', this.value)">
                                        </ui-input>
                                    </div>

                                    <!-- Gender -->
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">
                                            Gender
                                        </label>
                                        <ui-select 
                                            value="${formData.gender}"
                                            onchange="this.closest('app-add-student-page').handleInputChange('gender', this.value)">
                                            <option value="">Select gender</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </ui-select>
                                    </div>

                                    <!-- Admission Date -->
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">
                                            Admission Date
                                        </label>
                                        <ui-input 
                                            type="date" 
                                            value="${formData.admission_date}"
                                            oninput="this.closest('app-add-student-page').handleInputChange('admission_date', this.value)">
                                        </ui-input>
                                    </div>

                                    <!-- Class -->
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">
                                            Class
                                        </label>
                                        <ui-select 
                                            value="${formData.current_class_id}"
                                            onchange="this.closest('app-add-student-page').handleInputChange('current_class_id', this.value)">
                                            <option value="">Select class</option>
                                            ${classes.map(cls => `
                                                <option value="${cls.id}">${cls.name} - ${cls.section}</option>
                                            `).join('')}
                                        </ui-select>
                                    </div>

                                    <!-- Password -->
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">
                                            Password *
                                        </label>
                                        <ui-input 
                                            type="password" 
                                            placeholder="Enter password"
                                            value="${formData.password}"
                                            oninput="this.closest('app-add-student-page').handleInputChange('password', this.value)"
                                            required>
                                        </ui-input>
                                    </div>

                                    <!-- Status -->
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">
                                            Status
                                        </label>
                                        <ui-select 
                                            value="${formData.status}"
                                            onchange="this.closest('app-add-student-page').handleInputChange('status', this.value)">
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </ui-select>
                                    </div>
                                </div>

                                <!-- Parent Information -->
                                <div class="mt-8">
                                    <h3 class="text-lg font-medium text-gray-900 mb-4">Parent Information</h3>
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                                Parent Name
                                            </label>
                                            <ui-input 
                                                type="text" 
                                                placeholder="Enter parent name"
                                                value="${formData.parent_name}"
                                                oninput="this.closest('app-add-student-page').handleInputChange('parent_name', this.value)">
                                            </ui-input>
                                        </div>

                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                                Parent Phone
                                            </label>
                                            <ui-input 
                                                type="tel" 
                                                placeholder="Enter parent phone"
                                                value="${formData.parent_phone}"
                                                oninput="this.closest('app-add-student-page').handleInputChange('parent_phone', this.value)">
                                            </ui-input>
                                        </div>

                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                                Parent Email
                                            </label>
                                            <ui-input 
                                                type="email" 
                                                placeholder="Enter parent email"
                                                value="${formData.parent_email}"
                                                oninput="this.closest('app-add-student-page').handleInputChange('parent_email', this.value)">
                                            </ui-input>
                                        </div>
                                    </div>
                                </div>

                                <!-- Emergency Contact -->
                                <div class="mt-8">
                                    <h3 class="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h3>
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                                Emergency Contact Name
                                            </label>
                                            <ui-input 
                                                type="text" 
                                                placeholder="Enter emergency contact name"
                                                value="${formData.emergency_contact}"
                                                oninput="this.closest('app-add-student-page').handleInputChange('emergency_contact', this.value)">
                                            </ui-input>
                                        </div>

                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                                Emergency Phone
                                            </label>
                                            <ui-input 
                                                type="tel" 
                                                placeholder="Enter emergency phone"
                                                value="${formData.emergency_phone}"
                                                oninput="this.closest('app-add-student-page').handleInputChange('emergency_phone', this.value)">
                                            </ui-input>
                                        </div>
                                    </div>
                                </div>

                                <!-- Medical Information -->
                                <div class="mt-8">
                                    <h3 class="text-lg font-medium text-gray-900 mb-4">Medical Information</h3>
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                                Blood Group
                                            </label>
                                            <ui-select 
                                                value="${formData.blood_group}"
                                                onchange="this.closest('app-add-student-page').handleInputChange('blood_group', this.value)">
                                                <option value="">Select blood group</option>
                                                <option value="A+">A+</option>
                                                <option value="A-">A-</option>
                                                <option value="B+">B+</option>
                                                <option value="B-">B-</option>
                                                <option value="AB+">AB+</option>
                                                <option value="AB-">AB-</option>
                                                <option value="O+">O+</option>
                                                <option value="O-">O-</option>
                                            </ui-select>
                                        </div>

                                        <div class="md:col-span-2">
                                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                                Medical Conditions
                                            </label>
                                            <ui-textarea 
                                                placeholder="Enter any medical conditions or allergies"
                                                value="${formData.medical_conditions}"
                                                oninput="this.closest('app-add-student-page').handleInputChange('medical_conditions', this.value)">
                                            </ui-textarea>
                                        </div>
                                    </div>
                                </div>

                                <!-- Address -->
                                <div class="mt-8">
                                    <label class="block text-sm font-medium text-gray-700 mb-2">
                                        Address
                                    </label>
                                    <ui-textarea 
                                        placeholder="Enter student address"
                                        value="${formData.address}"
                                        oninput="this.closest('app-add-student-page').handleInputChange('address', this.value)">
                                    </ui-textarea>
                                </div>

                                <!-- Form Actions -->
                                <div class="mt-8 flex justify-end space-x-4">
                                    <ui-button 
                                        type="button"
                                        color="secondary" 
                                        onclick="this.closest('app-add-student-page').handleCancel()">
                                        Cancel
                                    </ui-button>
                                    <ui-button 
                                        type="submit"
                                        color="primary"
                                        loading="${submitting}"
                                        disabled="${submitting}">
                                        <i class="fas fa-save mr-2"></i>
                                        Create Student
                                    </ui-button>
                                </div>
                            </form>
                        </ui-card>
                    `}
                </div>
            </div>
        `;
    }
}

customElements.define('app-add-student-page', AddStudentPage);
export default AddStudentPage; 