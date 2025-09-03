import App from '@/core/App.js';
import { unescapeJsonFromAttribute } from '@/utils/jsonUtils.js';
import '@/components/ui/Input.js';
import '@/components/ui/Dropdown.js';
import '@/components/ui/Toast.js';
import '@/components/common/PageLoader.js';

/**
 * Application Form Section
 *
 * Renders the guest application form for the public apply page.
 * Accepts a 'settings' attribute (JSON string) for school_logo and school_name.
 */
class ApplicationFormSection extends App {
    constructor() {
        super();
        this.formData = {
            student_first_name: '',
            student_last_name: '',
            parent_phone: '',
            student_phone: '',
            email: '',
            grade: '',
            father_name: '',
            mother_name: '',
            guardian_name: ''
        };
    }

    connectedCallback() {
        super.connectedCallback();
        this.loadDataFromProps();
        this.setupEventListeners();
    }

    loadDataFromProps() {
        const settingsAttr = this.getAttribute('settings');
        if (settingsAttr) {
            const settings = unescapeJsonFromAttribute(settingsAttr);
            if (settings) {
                this.set('applicationLogo', settings.application_logo);
                this.set('applicationName', settings.application_name);
            }
        }
        // Get banner image from attribute
        const bannerImageAttr = this.getAttribute('banner-image');
        if (bannerImageAttr) {
            this.set('contactBannerImage', bannerImageAttr);
        }
        // Get colors from attribute
        const colorsAttr = this.getAttribute('colors');
        if (colorsAttr) {
            try {
                const colors = JSON.parse(colorsAttr.replace(/&quot;/g, '"'));
                Object.entries(colors).forEach(([key, value]) => {
                    this.set(key, value);
                });
            } catch (e) {}
        }
        // Get page data from attribute
        const pageDataAttr = this.getAttribute('page-data');
        if (pageDataAttr) {
            const pageData = unescapeJsonFromAttribute(pageDataAttr);
            if (pageData) {
                this.set('pageData', pageData);
            }
        }
        this.render();
    }

    setupEventListeners() {
        const form = this.querySelector('form');
        if (form) {
            // Add real-time validation for name fields
            const firstNameInput = this.querySelector('ui-input[name="student_first_name"]');
            const lastNameInput = this.querySelector('ui-input[name="student_last_name"]');
            
            if (firstNameInput) {
                firstNameInput.addEventListener('input', (e) => {
                    const value = e.target.value;
                    // Remove any non-letter characters (except spaces)
                    const cleanValue = value.replace(/[^a-zA-Z\s]/g, '');
                    if (value !== cleanValue) {
                        e.target.value = cleanValue;
                    }
                });
            }
            
            if (lastNameInput) {
                lastNameInput.addEventListener('input', (e) => {
                    const value = e.target.value;
                    // Remove any non-letter characters (except spaces)
                    const cleanValue = value.replace(/[^a-zA-Z\s]/g, '');
                    if (value !== cleanValue) {
                        e.target.value = cleanValue;
                    }
                });
            }
            
            // Add real-time validation for phone fields
            const parentPhoneInput = this.querySelector('ui-input[name="parent_phone"]');
            const studentPhoneInput = this.querySelector('ui-input[name="student_phone"]');
            
            if (parentPhoneInput) {
                parentPhoneInput.addEventListener('input', (e) => {
                    const value = e.target.value;
                    // Remove any non-digit characters
                    const cleanValue = value.replace(/[^0-9]/g, '');
                    if (value !== cleanValue) {
                        e.target.value = cleanValue;
                    }
                });
            }
            
            if (studentPhoneInput) {
                studentPhoneInput.addEventListener('input', (e) => {
                    const value = e.target.value;
                    // Remove any non-digit characters
                    const cleanValue = value.replace(/[^0-9]/g, '');
                    if (value !== cleanValue) {
                        e.target.value = cleanValue;
                    }
                });
            }
            
            // Add real-time validation for parent/guardian name fields
            const fatherNameInput = this.querySelector('ui-input[name="father_name"]');
            const motherNameInput = this.querySelector('ui-input[name="mother_name"]');
            const guardianNameInput = this.querySelector('ui-input[name="guardian_name"]');
            
            if (fatherNameInput) {
                fatherNameInput.addEventListener('input', (e) => {
                    const value = e.target.value;
                    // Remove any non-letter characters (except spaces)
                    const cleanValue = value.replace(/[^a-zA-Z\s]/g, '');
                    if (value !== cleanValue) {
                        e.target.value = cleanValue;
                    }
                });
            }
            
            if (motherNameInput) {
                motherNameInput.addEventListener('input', (e) => {
                    const value = e.target.value;
                    // Remove any non-letter characters (except spaces)
                    const cleanValue = value.replace(/[^a-zA-Z\s]/g, '');
                    if (value !== cleanValue) {
                        e.target.value = cleanValue;
                    }
                });
            }
            
            if (guardianNameInput) {
                guardianNameInput.addEventListener('input', (e) => {
                    const value = e.target.value;
                    // Remove any non-letter characters (except spaces)
                    const cleanValue = value.replace(/[^a-zA-Z\s]/g, '');
                    if (value !== cleanValue) {
                        e.target.value = cleanValue;
                    }
                });
            }
            
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const data = this.getFormData();
                
                // Validate first name
                if (!data.student_first_name || data.student_first_name.length < 2) {
                    Toast.show({ title: 'Error', message: 'First name must be at least 2 characters long.', variant: 'error' });
                    return;
                }
                if (!/^[a-zA-Z\s]+$/.test(data.student_first_name)) {
                    Toast.show({ title: 'Error', message: 'First name can only contain letters and spaces.', variant: 'error' });
                    return;
                }
                
                // Validate last name
                if (!data.student_last_name || data.student_last_name.length < 2) {
                    Toast.show({ title: 'Error', message: 'Last name must be at least 2 characters long.', variant: 'error' });
                    return;
                }
                if (!/^[a-zA-Z\s]+$/.test(data.student_last_name)) {
                    Toast.show({ title: 'Error', message: 'Last name can only contain letters and spaces.', variant: 'error' });
                    return;
                }
                
                // Validate parent phone
                if (!data.parent_phone || data.parent_phone.length < 10) {
                    Toast.show({ title: 'Error', message: 'Parent phone must be at least 10 digits long.', variant: 'error' });
                    return;
                }
                if (!/^[0-9]+$/.test(data.parent_phone)) {
                    Toast.show({ title: 'Error', message: 'Parent phone can only contain numbers.', variant: 'error' });
                    return;
                }
                
                // Validate student phone (if provided)
                if (data.student_phone && data.student_phone.length > 0) {
                    if (data.student_phone.length < 10) {
                        Toast.show({ title: 'Error', message: 'Student phone must be at least 10 digits long.', variant: 'error' });
                        return;
                    }
                    if (!/^[0-9]+$/.test(data.student_phone)) {
                        Toast.show({ title: 'Error', message: 'Student phone can only contain numbers.', variant: 'error' });
                        return;
                    }
                }
                
                // Validate father's name (if provided)
                if (data.father_name && data.father_name.length > 0) {
                    if (!/^[a-zA-Z\s]+$/.test(data.father_name)) {
                        Toast.show({ title: 'Error', message: 'Father\'s name can only contain letters and spaces.', variant: 'error' });
                        return;
                    }
                }
                
                // Validate mother's name (if provided)
                if (data.mother_name && data.mother_name.length > 0) {
                    if (!/^[a-zA-Z\s]+$/.test(data.mother_name)) {
                        Toast.show({ title: 'Error', message: 'Mother\'s name can only contain letters and spaces.', variant: 'error' });
                        return;
                    }
                }
                
                // Validate guardian's name (if provided)
                if (data.guardian_name && data.guardian_name.length > 0) {
                    if (!/^[a-zA-Z\s]+$/.test(data.guardian_name)) {
                        Toast.show({ title: 'Error', message: 'Guardian\'s name can only contain letters and spaces.', variant: 'error' });
                        return;
                    }
                }
                
                // Validate grade
                if (!data.grade) {
                    Toast.show({ title: 'Error', message: 'Please select a grade.', variant: 'error' });
                    return;
                }
                
                try {
                    const res = await fetch('/api/applications', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                    const result = await res.json();
                    if (result.success) {
                        Toast.show({ title: 'Success', message: 'Application submitted successfully!', variant: 'success', duration: 4000 });
                        
                        // Clear all form fields
                        this.clearForm();
                    } else {
                        Toast.show({ title: 'Error', message: result.error || 'Failed to submit application.', variant: 'error', duration: 4000 });
                    }
                } catch (err) {
                    Toast.show({ title: 'Error', message: 'Failed to submit application.', variant: 'error', duration: 4000 });
                }
            });
        }
    }

    getFormData() {
        const form = this.querySelector('form');
        const data = {};
        if (!form) return data;
        Array.from(form.elements).forEach(el => {
            if (el.name && el.tagName !== 'UI-DROPDOWN') data[el.name] = el.value;
        });
        // Explicitly get grade from ui-dropdown
        const gradeDropdown = this.querySelector('ui-dropdown[name="grade"]');
        if (gradeDropdown) data.grade = gradeDropdown.value;
        return data;
    }

    clearForm() {
        const form = this.querySelector('form');
        if (!form) return;
        
        // Reset all regular input fields
        Array.from(form.elements).forEach(el => {
            if (el.name && el.tagName !== 'UI-DROPDOWN') {
                el.value = '';
            }
        });
        
        // Reset ui-dropdown
        const gradeDropdown = this.querySelector('ui-dropdown[name="grade"]');
        if (gradeDropdown) {
            gradeDropdown.value = '';
        }
        
        // Reset all ui-input fields explicitly
        const uiInputs = this.querySelectorAll('ui-input');
        uiInputs.forEach(input => {
            input.value = '';
        });
        
        // Reset form data object
        this.formData = {
            student_first_name: '',
            student_last_name: '',
            parent_phone: '',
            student_phone: '',
            email: '',
            grade: '',
            father_name: '',
            mother_name: '',
            guardian_name: ''
        };
    }

    render() {
        const applicationLogo = this.get('applicationLogo');
        const applicationName = this.get('applicationName');
        const contactBannerImage = this.get('contactBannerImage');
        const pageData = this.get('pageData');
        // Get colors from state (with fallback)
        const primaryColor = this.get('primary_color');
        const accentColor = this.get('accent_color');
        const textColor = this.get('text_color');
        // Grade options: K1, K2, K3, Primary 1-6, JHS 1-3
        const gradeOptions = [
            { value: '', label: 'Select Grade' },
            // Kindergarten (KG)
            { value: 'KG 1', label: 'KG 1 (Nursery)' },
            { value: 'KG 2', label: 'KG 2 (Kindergarten)' },
            // Primary School
            { value: 'Primary 1', label: 'Primary 1 (Class 1)' },
            { value: 'Primary 2', label: 'Primary 2 (Class 2)' },
            { value: 'Primary 3', label: 'Primary 3 (Class 3)' },
            { value: 'Primary 4', label: 'Primary 4 (Class 4)' },
            { value: 'Primary 5', label: 'Primary 5 (Class 5)' },
            { value: 'Primary 6', label: 'Primary 6 (Class 6)' },
            // Junior High School
            { value: 'JHS 1', label: 'JHS 1 (Form 1)' },
            { value: 'JHS 2', label: 'JHS 2 (Form 2)' },
            { value: 'JHS 3', label: 'JHS 3 (Form 3)' }
        ];
        this.innerHTML = `
            ${contactBannerImage ? `
            <section class="mx-auto py-8 px-4">
                <div class="relative group rounded-3xl overflow-hidden shadow-2xl mb-8">
                    <div class="relative h-80 lg:h-96 overflow-hidden">
                        <img src="${contactBannerImage}" 
                             alt="Contact Banner" 
                             class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <div class="absolute inset-0 hidden items-center justify-center bg-gray-100">
                            <div class="text-center">
                                <i class="fas fa-envelope text-gray-400 text-4xl mb-2"></i>
                                <p class="text-gray-500 font-medium">Contact banner</p>
                            </div>
                        </div>
                        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                        <!-- Overlay content: title and subtitle -->
                        <div class="absolute inset-0 flex items-center justify-center p-6">
                            <div class="text-center text-white relative z-10">
                                <h2 class="text-3xl lg:text-5xl font-bold mb-4 drop-shadow-lg">
                                    ${pageData?.title || ''}
                                </h2>
                                <!-- <p class="text-lg lg:text-xl mb-8 max-w-2xl mx-auto opacity-90 drop-shadow-md">
                                    ${pageData?.subtitle || ''}
                                </p> -->
                                <!-- Call to Action Button -->
                                <div class="flex justify-center">
                                    <a href="/public/contact" 
                                       class="inline-flex items-center px-4 py-2 bg-[${primaryColor}]/20 backdrop-blur-md text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 group border border-white/30 hover:bg-[${accentColor}]/30">
                                        <span>Contact Us</span>
                                        <i class="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform duration-300"></i>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            ` : ''}
            <section class="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 mt-8">
                <div class="text-center mb-6">
                    ${applicationLogo ? `<img src="${applicationLogo}" alt="Application Logo" class="h-24 mx-auto mb-2" />` : ''}
                    <!--${applicationName ? `<h2 class="text-2xl font-bold mb-2">${applicationName}</h2>` : ''}-->
                </div>
                <!-- <h2 class="text-2xl font-bold mb-6 text-center">Application Form</h2> -->
                <form class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label for="student_first_name" class="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                            <ui-input id="student_first_name" type="text" name="student_first_name" required placeholder="First Name" class="w-full" />
                        </div>
                        <div>
                            <label for="student_last_name" class="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                            <ui-input id="student_last_name" type="text" name="student_last_name" required placeholder="Last Name" class="w-full" />
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label for="parent_phone" class="block text-sm font-medium text-gray-700 mb-1">Parent Phone</label>
                            <ui-input id="parent_phone" type="tel" name="parent_phone" required placeholder="Parent Phone" class="w-full" />
                        </div>
                        <div>
                            <label for="student_phone" class="block text-sm font-medium text-gray-700 mb-1">Student Phone</label>
                            <ui-input id="student_phone" type="tel" name="student_phone" placeholder="Student Phone" class="w-full" />
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <ui-input id="email" type="email" name="email" placeholder="Email" class="w-full" />
                        </div>
                        <div>
                            <label for="grade" class="block text-sm font-medium text-gray-700 mb-1">Applying Grade</label>
                            <ui-dropdown id="grade" name="grade" class="w-full" placeholder="Select Grade">
                                ${gradeOptions.map(opt => `<ui-option value="${opt.value}">${opt.label}</ui-option>`).join('')}
                            </ui-dropdown>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label for="father_name" class="block text-sm font-medium text-gray-700 mb-1">Father's Name</label>
                            <ui-input id="father_name" type="text" name="father_name" placeholder="Father's Name" class="w-full" />
                        </div>
                        <div>
                            <label for="mother_name" class="block text-sm font-medium text-gray-700 mb-1">Mother's Name</label>
                            <ui-input id="mother_name" type="text" name="mother_name" placeholder="Mother's Name" class="w-full" />
                        </div>
                        <div>
                            <label for="guardian_name" class="block text-sm font-medium text-gray-700 mb-1">Guardian Name</label>
                            <ui-input id="guardian_name" type="text" name="guardian_name" placeholder="Guardian Name" class="w-full" />
                        </div>
                    </div>
                    <div class="pt-4 text-center">
                        <button type="submit" class="px-6 py-2 bg-[${primaryColor}] text-[${textColor}] font-bold rounded-full shadow hover:bg-[${accentColor}] focus:outline-none focus:ring-2 focus:ring-[${accentColor}] focus:ring-offset-2 transition-all duration-300">Submit Application</button>
                    </div>
                </form>
            </section>
        `;
    }
}

customElements.define('application-form-section', ApplicationFormSection);
export default ApplicationFormSection; 