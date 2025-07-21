import App from '@/core/App.js';
import { unescapeJsonFromAttribute } from '@/utils/jsonUtils.js';
import '@/components/ui/Input.js';
import '@/components/ui/Dropdown.js';
import Toast from '@/components/ui/Toast.js';

/**
 * Application Form Section
 *
 * Renders the guest application form for the public apply page.
 * Accepts a 'settings' attribute (JSON string) for school_logo and school_name.
 */
class ApplicationFormSection extends App {
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
                this.set('schoolLogo', settings.school_logo);
                this.set('schoolName', settings.school_name);
            }
        }
        this.render();
    }

    setupEventListeners() {
        const form = this.querySelector('form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const data = this.getFormData();
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
                        form.reset();
                        // Reset ui-dropdown
                        const gradeDropdown = this.querySelector('ui-dropdown[name="grade"]');
                        if (gradeDropdown) gradeDropdown.value = '';
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

    render() {
        const schoolLogo = this.get('schoolLogo');
        const schoolName = this.get('schoolName');
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
            <section class="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 mt-8">
                <div class="text-center mb-6">
                    ${schoolLogo ? `<img src="${schoolLogo}" alt="School Logo" class="h-16 mx-auto mb-2" />` : ''}
                    ${schoolName ? `<h2 class="text-2xl font-bold mb-2">${schoolName}</h2>` : ''}
                </div>
                <h2 class="text-2xl font-bold mb-6 text-center">Application Form</h2>
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
                            <label for="grade" class="block text-sm font-medium text-gray-700 mb-1">Grade</label>
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
                        <button type="submit" class="px-6 py-2 bg-blue-600 text-white font-bold rounded-full shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300">Submit Application</button>
                    </div>
                </form>
            </section>
        `;
    }
}

customElements.define('application-form-section', ApplicationFormSection);
export default ApplicationFormSection; 