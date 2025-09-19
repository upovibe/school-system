import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Textarea.js';
import '@/components/ui/Dropdown.js';
import '@/components/ui/Switch.js';
import '@/components/ui/Button.js';
import '@/components/ui/Checkbox.js';
import api from '@/services/api.js';

/**
 * Application Config Dialog Component
 * 
 * A dialog component for configuring admission settings in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls dialog visibility
 * 
 * Events:
 * - config-saved: Fired when configuration is successfully saved
 * - dialog-closed: Fired when dialog is closed
 */
class ApplicationConfigDialog extends HTMLElement {
    constructor() {
        super();
        this.configData = {
            academic_year_id: null,
            academic_year_name: '',
            admission_status: 'open',
            max_applications_per_ip_per_day: 3,
            enabled_levels: ['creche', 'nursery', 'kindergarten', 'primary', 'jhs', 'shs'],
            level_classes: {
                creche: ['Creche'],
                nursery: ['N1', 'N2'],
                kindergarten: ['KG1', 'KG2'],
                primary: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'],
                jhs: ['JHS1', 'JHS2', 'JHS3'],
                shs: ['SHS1', 'SHS2', 'SHS3']
            },
            shs_programmes: ['Science', 'Business', 'Arts', 'General Arts'],
            school_types: ['Day', 'Boarding', 'Day/Boarding'],
        };
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
        this.loadCurrentConfig();
    }

    setupEventListeners() {
        // Handle form changes
        this.addEventListener('change', (event) => {
            this.handleFormChange(event);
        });

        this.addEventListener('input', (event) => {
            this.handleFormChange(event);
        });

        // Handle switch changes
        this.addEventListener('switch-change', (event) => {
            if (event.target.tagName === 'UI-SWITCH') {
                const name = event.target.getAttribute('name');
                const isChecked = event.detail.checked;
                
                if (name === 'admission_status') {
                    this.configData.admission_status = isChecked ? 'open' : 'closed';
                }
            }
        });

        // Handle checkbox changes
        this.addEventListener('change', (event) => {
            if (event.target.tagName === 'UI-CHECKBOX' && event.target.hasAttribute('data-field') && event.target.hasAttribute('data-value')) {
                this.handleFieldToggle(event.target);
                this.render();
            }
            if (event.target.tagName === 'UI-CHECKBOX' && event.target.hasAttribute('data-field-name')) {
                this.handleFormFieldToggle(event.target);
                this.render();
            }
        });

        // Handle button clicks
        this.addEventListener('click', (event) => {
            if (event.target.closest('[data-action="add-class"]')) {
                event.preventDefault();
                const level = event.target.closest('[data-action="add-class"]').dataset.level;
                this.addClass(level);
                this.render();
            }
            if (event.target.closest('[data-action="remove-class"]')) {
                event.preventDefault();
                const level = event.target.closest('[data-action="remove-class"]').dataset.level;
                const index = parseInt(event.target.closest('[data-action="remove-class"]').dataset.index, 10);
                this.removeClass(level, index);
                this.render();
            }
            if (event.target.closest('[data-action="add-programme"]')) {
                event.preventDefault();
                this.addProgramme();
                this.render();
            }
            if (event.target.closest('[data-action="remove-programme"]')) {
                event.preventDefault();
                const index = parseInt(event.target.closest('[data-action="remove-programme"]').dataset.index, 10);
                this.removeProgramme(index);
                this.render();
            }
            if (event.target.closest('[data-action="save-config"]')) {
                event.preventDefault();
                this.saveConfig();
            }
            if (event.target.closest('[data-action="close-dialog"]')) {
                event.preventDefault();
                this.close();
            }
        });
    }

    open() {
        this.setAttribute('open', '');
        this.loadCurrentConfig();
    }

    close() {
        this.removeAttribute('open');
        this.dispatchEvent(new CustomEvent('dialog-closed', {
            bubbles: true,
            composed: true
        }));
    }

    async loadCurrentConfig() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            // Load current academic year first
            await this.loadCurrentAcademicYear();

            // Then try to load admission config
            const response = await api.withToken(token).get('/admission/config');
            if (response.data.success && response.data.data) {
                const data = response.data.data;
                
                // Update config data (API now returns parsed JSON)
                this.configData = {
                    ...this.configData,
                    ...data
                };
            }
            
            this.render();
        } catch (error) {
            console.error('❌ Error loading admission config:', error);
        }
    }

    async loadCurrentAcademicYear() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                this.configData.academic_year_name = 'No Authentication';
                return;
            }

            const response = await api.withToken(token).get('/academic-years/current');
            if (response.data && response.data.success) {
                const yearData = response.data.data;
                this.configData.academic_year_name = `${yearData.year_code || 'Unknown'} ${yearData.display_name ? `(${yearData.display_name})` : ''}`;
                this.configData.academic_year_id = yearData.id;
            } else {
                this.configData.academic_year_name = 'No Current Year';
            }
        } catch (error) {
            console.error('❌ Error loading current academic year:', error);
            this.configData.academic_year_name = 'Error Loading Year';
        }
    }

    handleFormChange(event) {
        const { name, value, type } = event.target;
        
        if (name && name in this.configData) {
            if (type === 'number') {
                this.configData[name] = parseInt(value) || 0;
            } else {
                this.configData[name] = value;
            }
        } else if (event.target.hasAttribute('data-level') && event.target.hasAttribute('data-class-index')) {
            this.syncClassesFromDOM();
        } else if (event.target.hasAttribute('data-programme-index')) {
            this.syncProgrammesFromDOM();
        }
    }

    handleFieldToggle(checkbox) {
        const field = checkbox.getAttribute('data-field');
        const checkboxValue = checkbox.getAttribute('data-value');
        const isChecked = checkbox.hasAttribute('checked');
        
        if (field === 'enabled_levels') {
            if (!this.configData.enabled_levels) this.configData.enabled_levels = [];
            if (isChecked && !this.configData.enabled_levels.includes(checkboxValue)) {
                this.configData.enabled_levels.push(checkboxValue);
            } else if (!isChecked && this.configData.enabled_levels.includes(checkboxValue)) {
                this.configData.enabled_levels = this.configData.enabled_levels.filter(level => level !== checkboxValue);
            }
        } else if (field === 'school_types') {
            if (!this.configData.school_types) this.configData.school_types = [];
            if (isChecked && !this.configData.school_types.includes(checkboxValue)) {
                this.configData.school_types.push(checkboxValue);
            } else if (!isChecked && this.configData.school_types.includes(checkboxValue)) {
                this.configData.school_types = this.configData.school_types.filter(type => type !== checkboxValue);
            }
        }
    }

    handleFormFieldToggle(checkbox) {
        const section = checkbox.getAttribute('data-field');
        const fieldName = checkbox.getAttribute('data-field-name');
        const isCurrentlyChecked = checkbox.hasAttribute('checked');
        
        if (!this.configData[section]) {
            this.configData[section] = [];
        }
        
        // Find the field in the section
        let field = this.configData[section].find(f => f.name === fieldName);
        
        if (!field) {
            // Create a new field configuration
            field = {
                name: fieldName,
                label: this.getFieldLabel(fieldName),
                required: false,
                enabled: false,
                type: this.getFieldType(fieldName)
            };
            this.configData[section].push(field);
        }
        
        // Toggle the enabled state (opposite of current state)
        field.enabled = !isCurrentlyChecked;
        
        // Update the checkbox visual state
        if (field.enabled) {
            checkbox.setAttribute('checked', '');
        } else {
            checkbox.removeAttribute('checked');
        }
    }

    isFieldEnabled(section, fieldName) {
        const fields = this.configData[section];
        if (!fields || !Array.isArray(fields)) return false;
        
        const field = fields.find(f => f.name === fieldName);
        return field && field.enabled === true;
    }

    getFieldLabel(fieldName) {
        const labels = {
            'first_name': 'First Name',
            'middle_name': 'Middle Name',
            'last_name': 'Last Name',
            'gender': 'Gender',
            'date_of_birth': 'Date of Birth',
            'place_of_birth': 'Place of Birth',
            'nationality': 'Nationality',
            'religion': 'Religion/Denomination',
            'student_phone': 'Student Phone',
            'student_email': 'Student Email',
            'parent_full_name': 'Parent/Guardian Full Name',
            'relationship': 'Relationship to Student',
            'phone_number': 'Phone Number',
            'email': 'Email Address',
            'occupation': 'Occupation',
            'residential_address': 'Residential Address',
            'emergency_contact': 'Emergency Contact',
            'previous_school': 'Previous School Attended',
            'last_class_completed': 'Last Class Completed',
            'level_applying': 'Level Applying For',
            'class_applying': 'Class Applying For',
            'academic_programme': 'Academic Programme',
            'school_type': 'School Type',
            'blood_group': 'Blood Group',
            'allergies': 'Allergies',
            'medical_conditions': 'Medical Conditions',
        };
        return labels[fieldName] || fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    getFieldType(fieldName) {
        const types = {
            'first_name': 'text',
            'middle_name': 'text',
            'last_name': 'text',
            'gender': 'select',
            'date_of_birth': 'date',
            'place_of_birth': 'text',
            'nationality': 'text',
            'religion': 'text',
            'student_phone': 'tel',
            'student_email': 'email',
            'parent_full_name': 'text',
            'relationship': 'select',
            'phone_number': 'tel',
            'email': 'email',
            'occupation': 'text',
            'residential_address': 'textarea',
            'emergency_contact': 'tel',
            'previous_school': 'text',
            'last_class_completed': 'text',
            'level_applying': 'select',
            'class_applying': 'select',
            'academic_programme': 'select',
            'school_type': 'select',
            'blood_group': 'select',
            'allergies': 'select_multiple',
            'medical_conditions': 'select_multiple',
        };
        return types[fieldName] || 'text';
    }

    addClass(level) {
        if (!this.configData.level_classes) {
            this.configData.level_classes = {};
        }
        if (!this.configData.level_classes[level]) {
            this.configData.level_classes[level] = [''];
        }
        this.configData.level_classes[level].push('');
    }

    removeClass(level, index) {
        if (this.configData.level_classes && this.configData.level_classes[level] && this.configData.level_classes[level].length > 1) {
            this.configData.level_classes[level].splice(index, 1);
        }
    }

    addProgramme() {
        if (!this.configData.shs_programmes) {
            this.configData.shs_programmes = [''];
        }
        this.configData.shs_programmes.push('');
    }

    removeProgramme(index) {
        if (this.configData.shs_programmes && this.configData.shs_programmes.length > 1) {
            this.configData.shs_programmes.splice(index, 1);
        }
    }

    syncClassesFromDOM() {
        if (!this.configData.level_classes) {
            this.configData.level_classes = {};
        }

        const enabledLevels = this.configData.enabled_levels || [];
        enabledLevels.forEach(level => {
            const classInputs = this.querySelectorAll(`input[data-level="${level}"]`);
            this.configData.level_classes[level] = Array.from(classInputs).map(input => input.value || '');
        });
    }

    syncProgrammesFromDOM() {
        const programmeInputs = this.querySelectorAll('input[data-programme-index]');
        this.configData.shs_programmes = Array.from(programmeInputs).map(input => input.value || '');
    }

    renderLevelClasses() {
        const enabledLevels = this.configData.enabled_levels || [];
        const levelClasses = this.configData.level_classes || {};
        
        if (!enabledLevels || enabledLevels.length === 0) {
            return '<p class="text-sm text-gray-500">No levels enabled</p>';
        }
        
        const levelInfo = {
            'creche': 'Creche Classes',
            'nursery': 'Nursery Classes',
            'kindergarten': 'Kindergarten Classes',
            'primary': 'Primary Classes',
            'jhs': 'JHS Classes', 
            'shs': 'SHS Classes'
        };
        
        let html = '';
        
        enabledLevels.forEach(level => {
            const levelName = levelInfo[level] || `${level.toUpperCase()} Classes`;
            let classes = levelClasses[level] || [];
            
            if (!classes || classes.length === 0) {
                classes = [''];
            }
            
            html += `
                <div id="${level}-classes" class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        <i class="fas fa-graduation-cap mr-1"></i>${levelName}
                    </label>
                    <div class="space-y-2" id="${level}-classes-container">
                        ${classes.map((className, index) => `
                            <div class="flex gap-2 items-center">
                                <div class="flex-1">
                                    <ui-input
                                        type="text"
                                        placeholder="Enter class name (e.g., P1, JHS1, SHS1)"
                                        value="${className}"
                                        data-level="${level}"
                                        data-class-index="${index}"
                                        class="w-full">
                                    </ui-input>
                                </div>
                                ${classes.length > 1 ? `
                                    <ui-button
                                        type="button"
                                        variant="danger-outline"
                                        size="sm"
                                        data-action="remove-class"
                                        data-level="${level}"
                                        data-index="${index}"
                                        class="px-3">
                                        <i class="fas fa-trash"></i>
                                    </ui-button>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                    <div class="flex justify-end mt-2">
                        <ui-button
                            type="button"
                            variant="outline"
                            size="sm"
                            data-action="add-class"
                            data-level="${level}"
                            class="px-3">
                            <i class="fas fa-plus mr-1"></i>
                            Add Class
                        </ui-button>
                    </div>
                </div>
            `;
        });
        
        return html;
    }

    renderSHSProgrammes() {
        const programmes = this.configData.shs_programmes || [''];
        const programmesToShow = programmes.length > 0 ? programmes : [''];
        
        return programmesToShow.map((programme, index) => `
            <div class="flex gap-2 items-center">
                <div class="flex-1">
                    <ui-input
                        type="text"
                        placeholder="Enter programme name (e.g., General Science, Business, Arts)"
                        value="${programme}"
                        data-programme-index="${index}"
                        class="w-full">
                    </ui-input>
                </div>
                ${programmesToShow.length > 1 ? `
                    <ui-button
                        type="button"
                        variant="danger-outline"
                        size="sm"
                        data-action="remove-programme"
                        data-index="${index}"
                        class="px-3">
                        <i class="fas fa-trash"></i>
                    </ui-button>
                ` : ''}
            </div>
        `).join('');
    }

    async saveConfig() {
        try {
            // Sync classes and programmes from DOM before saving
            this.syncClassesFromDOM();
            this.syncProgrammesFromDOM();
            
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Please log in to save configuration',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Prepare data for saving
            const saveData = {
                academic_year_id: this.configData.academic_year_id,
                admission_status: this.configData.admission_status,
                max_applications_per_ip_per_day: this.configData.max_applications_per_ip_per_day,
                enabled_levels: this.configData.enabled_levels,
                level_classes: this.configData.level_classes,
                shs_programmes: this.configData.shs_programmes,
                school_types: this.configData.school_types,
                student_info_fields: this.configData.student_info_fields,
                parent_guardian_fields: this.configData.parent_guardian_fields,
                academic_background_fields: this.configData.academic_background_fields,
                health_info_fields: this.configData.health_info_fields
            };

            // Get current config ID or create new one
            const currentConfig = await api.withToken(token).get('/admission/config');
            let response;

            if (currentConfig.data.success && currentConfig.data.data) {
                // Update existing config
                response = await api.withToken(token).put(`/admission-configs/${currentConfig.data.data.id}`, saveData);
            } else {
                // Create new config
                response = await api.withToken(token).post('/admission-configs', saveData);
            }
            
            Toast.show({
                title: 'Success',
                message: 'Admission configuration saved successfully',
                variant: 'success',
                duration: 3000
            });

            // Close dialog and dispatch event
            this.close();
            this.dispatchEvent(new CustomEvent('config-saved', {
                detail: { config: response.data.data },
                bubbles: true,
                composed: true
            }));

        } catch (error) {
            console.error('❌ Error saving admission config:', error);
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to save configuration',
                variant: 'error',
                duration: 3000
            });
        }
    }

    render() {
        this.innerHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                close-button="true">
                <div slot="title">Application Config Dialog</div>                
                <div slot="content" class="">
                    <form id="admission-config-form" class="space-y-6">
                        <!-- Basic Configuration -->
                        <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm border border-blue-200 p-4">
                            <div class="flex items-center mb-3">
                                <i class="fas fa-cog text-blue-600 mr-2"></i>
                                <h3 class="text-lg font-semibold text-gray-900">Basic Configuration</h3>
                            </div>
                            <div class="space-y-3">
                                <!-- Academic Year (Read-only) -->
                                <div class="bg-white rounded-lg p-3 border border-gray-200">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-calendar-alt mr-1"></i>Academic Year
                                    </label>
                                    <ui-input 
                                        type="text" 
                                        value="${this.configData.academic_year_name || 'Loading...'}"
                                        readonly
                                        class="w-full bg-gray-50">
                                    </ui-input>
                                    <p class="text-xs text-gray-500 mt-1">Current active academic year</p>
                                </div>
                                
                                <!-- Admission Status -->
                                <div class="bg-white rounded-lg p-3 border border-gray-200">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-toggle-on mr-1"></i>Admission Status
                                    </label>
                                    <div class="flex items-center space-x-3">
                                        <ui-switch 
                                            name="admission_status"
                                            ${this.configData.admission_status === 'open' ? 'checked' : ''}
                                            class="w-full">
                                            <span slot="label">${this.configData.admission_status === 'open' ? 'Open' : 'Closed'}</span>
                                        </ui-switch>
                                    </div>
                                    <p class="text-xs text-gray-500 mt-1">Control new applications</p>
                                </div>
                                
                                <!-- Max Applications per IP -->
                                <div class="bg-white rounded-lg p-3 border border-gray-200">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-shield-alt mr-1"></i>Max Applications per IP
                                    </label>
                                    <ui-input 
                                        name="max_applications_per_ip_per_day"
                                        type="number" 
                                        placeholder="Enter number"
                                        value="${this.configData.max_applications_per_ip_per_day}"
                                        class="w-full">
                                    </ui-input>
                                    <p class="text-xs text-gray-500 mt-1">Per day limit</p>
                                </div>
                            </div>
                        </div>

                        <!-- Form Field Configuration - Student Information -->
                        <div class="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg shadow-sm border border-indigo-200 p-4">
                            <div class="flex items-center mb-3">
                                <i class="fas fa-cogs text-indigo-600 mr-2"></i>
                                <h3 class="text-lg font-semibold text-gray-900">Form Field Configuration</h3>
                            </div>
                            <p class="text-sm text-gray-600 mb-4">Configure which fields appear on the admission form for applicants</p>
                            
                            <!-- Section A: Student Information -->
                            <div class="mb-4">
                                <h4 class="text-md font-semibold text-gray-800 mb-3 flex items-center">
                                    <i class="fas fa-user mr-2 text-blue-600"></i>Section A: Student Information
                                </h4>
                                <div class="grid grid-cols-2 gap-3">
                                    <ui-checkbox 
                                        label="First Name" 
                                        ${this.configData.student_info_fields && this.isFieldEnabled('student_info_fields', 'first_name') ? 'checked' : ''}
                                        data-field="student_info_fields"
                                        data-field-name="first_name">
                                    </ui-checkbox>
                                    <ui-checkbox 
                                        label="Middle Name" 
                                        ${this.configData.student_info_fields && this.isFieldEnabled('student_info_fields', 'middle_name') ? 'checked' : ''}
                                        data-field="student_info_fields"
                                        data-field-name="middle_name">
                                    </ui-checkbox>
                                    <ui-checkbox 
                                        label="Last Name" 
                                        ${this.configData.student_info_fields && this.isFieldEnabled('student_info_fields', 'last_name') ? 'checked' : ''}
                                        data-field="student_info_fields"
                                        data-field-name="last_name">
                                    </ui-checkbox>
                                    <ui-checkbox 
                                        label="Gender" 
                                        ${this.configData.student_info_fields && this.isFieldEnabled('student_info_fields', 'gender') ? 'checked' : ''}
                                        data-field="student_info_fields"
                                        data-field-name="gender">
                                    </ui-checkbox>
                                    <ui-checkbox 
                                        label="Date of Birth" 
                                        ${this.configData.student_info_fields && this.isFieldEnabled('student_info_fields', 'date_of_birth') ? 'checked' : ''}
                                        data-field="student_info_fields"
                                        data-field-name="date_of_birth">
                                    </ui-checkbox>
                                    <ui-checkbox 
                                        label="Place of Birth" 
                                        ${this.configData.student_info_fields && this.isFieldEnabled('student_info_fields', 'place_of_birth') ? 'checked' : ''}
                                        data-field="student_info_fields"
                                        data-field-name="place_of_birth">
                                    </ui-checkbox>
                                    <ui-checkbox 
                                        label="Nationality" 
                                        ${this.configData.student_info_fields && this.isFieldEnabled('student_info_fields', 'nationality') ? 'checked' : ''}
                                        data-field="student_info_fields"
                                        data-field-name="nationality">
                                    </ui-checkbox>
                                    <ui-checkbox 
                                        label="Religion" 
                                        ${this.configData.student_info_fields && this.isFieldEnabled('student_info_fields', 'religion') ? 'checked' : ''}
                                        data-field="student_info_fields"
                                        data-field-name="religion">
                                    </ui-checkbox>
                                    <ui-checkbox 
                                        label="Student Phone" 
                                        ${this.configData.student_info_fields && this.isFieldEnabled('student_info_fields', 'student_phone') ? 'checked' : ''}
                                        data-field="student_info_fields"
                                        data-field-name="student_phone">
                                    </ui-checkbox>
                                    <ui-checkbox 
                                        label="Student Email" 
                                        ${this.configData.student_info_fields && this.isFieldEnabled('student_info_fields', 'student_email') ? 'checked' : ''}
                                        data-field="student_info_fields"
                                        data-field-name="student_email">
                                    </ui-checkbox>
                                </div>
                            </div>

                            <!-- Section B: Parent/Guardian Information -->
                            <div class="mb-4">
                                <h4 class="text-md font-semibold text-gray-800 mb-3 flex items-center">
                                    <i class="fas fa-users mr-2 text-green-600"></i>Section B: Parent/Guardian Information
                                </h4>
                                <div class="grid grid-cols-2 gap-3">
                                    <ui-checkbox 
                                        label="Parent/Guardian Name" 
                                        ${this.configData.parent_guardian_fields && this.isFieldEnabled('parent_guardian_fields', 'parent_full_name') ? 'checked' : ''}
                                        data-field="parent_guardian_fields"
                                        data-field-name="parent_full_name">
                                    </ui-checkbox>
                                    <ui-checkbox 
                                        label="Relationship" 
                                        ${this.configData.parent_guardian_fields && this.isFieldEnabled('parent_guardian_fields', 'relationship') ? 'checked' : ''}
                                        data-field="parent_guardian_fields"
                                        data-field-name="relationship">
                                    </ui-checkbox>
                                    <ui-checkbox 
                                        label="Phone Number" 
                                        ${this.configData.parent_guardian_fields && this.isFieldEnabled('parent_guardian_fields', 'phone_number') ? 'checked' : ''}
                                        data-field="parent_guardian_fields"
                                        data-field-name="phone_number">
                                    </ui-checkbox>
                                    <ui-checkbox 
                                        label="Email Address" 
                                        ${this.configData.parent_guardian_fields && this.isFieldEnabled('parent_guardian_fields', 'email') ? 'checked' : ''}
                                        data-field="parent_guardian_fields"
                                        data-field-name="email">
                                    </ui-checkbox>
                                    <ui-checkbox 
                                        label="Occupation" 
                                        ${this.configData.parent_guardian_fields && this.isFieldEnabled('parent_guardian_fields', 'occupation') ? 'checked' : ''}
                                        data-field="parent_guardian_fields"
                                        data-field-name="occupation">
                                    </ui-checkbox>
                                    <ui-checkbox 
                                        label="Emergency Contact" 
                                        ${this.configData.parent_guardian_fields && this.isFieldEnabled('parent_guardian_fields', 'emergency_contact') ? 'checked' : ''}
                                        data-field="parent_guardian_fields"
                                        data-field-name="emergency_contact">
                                    </ui-checkbox>
                                    <ui-checkbox 
                                        label="Residential Address" 
                                        ${this.configData.parent_guardian_fields && this.isFieldEnabled('parent_guardian_fields', 'residential_address') ? 'checked' : ''}
                                        data-field="parent_guardian_fields"
                                        data-field-name="residential_address">
                                    </ui-checkbox>
                                </div>
                            </div>

                            <!-- Section C: Academic Background -->
                            <div class="mb-4">
                                <h4 class="text-md font-semibold text-gray-800 mb-3 flex items-center">
                                    <i class="fas fa-graduation-cap mr-2 text-yellow-600"></i>Section C: Academic Background
                                </h4>
                                <div class="grid grid-cols-2 gap-3">
                                    <ui-checkbox 
                                        label="Previous School" 
                                        ${this.configData.academic_background_fields && this.isFieldEnabled('academic_background_fields', 'previous_school') ? 'checked' : ''}
                                        data-field="academic_background_fields"
                                        data-field-name="previous_school">
                                    </ui-checkbox>
                                    <ui-checkbox 
                                        label="Last Class Completed" 
                                        ${this.configData.academic_background_fields && this.isFieldEnabled('academic_background_fields', 'last_class_completed') ? 'checked' : ''}
                                        data-field="academic_background_fields"
                                        data-field-name="last_class_completed">
                                    </ui-checkbox>
                                </div>
                            </div>

                            <!-- Section D: Health Information -->
                            <div class="mb-4">
                                <h4 class="text-md font-semibold text-gray-800 mb-3 flex items-center">
                                    <i class="fas fa-heartbeat mr-2 text-red-600"></i>Section D: Health Information
                                </h4>
                                <div class="grid grid-cols-2 gap-3">
                                    <ui-checkbox 
                                        label="Blood Group" 
                                        ${this.configData.health_info_fields && this.isFieldEnabled('health_info_fields', 'blood_group') ? 'checked' : ''}
                                        data-field="health_info_fields"
                                        data-field-name="blood_group">
                                    </ui-checkbox>
                                    <ui-checkbox 
                                        label="Allergies" 
                                        ${this.configData.health_info_fields && this.isFieldEnabled('health_info_fields', 'allergies') ? 'checked' : ''}
                                        data-field="health_info_fields"
                                        data-field-name="allergies">
                                    </ui-checkbox>
                                    <ui-checkbox 
                                        label="Medical Conditions" 
                                        ${this.configData.health_info_fields && this.isFieldEnabled('health_info_fields', 'medical_conditions') ? 'checked' : ''}
                                        data-field="health_info_fields"
                                        data-field-name="medical_conditions">
                                    </ui-checkbox>
                                </div>
                            </div>
                        </div>

                        <!-- School Setup Configuration -->
                        <div class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg shadow-sm border border-green-200 p-4">
                            <div class="flex items-center mb-3">
                                <i class="fas fa-school text-green-600 mr-2"></i>
                                <h3 class="text-lg font-semibold text-gray-900">School Setup</h3>
                            </div>
                            
                            <!-- School Types -->
                            <div class="mb-4">
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    <i class="fas fa-building mr-1"></i>School Types
                                </label>
                                <div class="space-y-2">
                                    <ui-checkbox 
                                        label="Day School" 
                                        ${this.configData.school_types && this.configData.school_types.includes('day') ? 'checked' : ''}
                                        data-field="school_types"
                                        data-value="day">
                                    </ui-checkbox>
                                    <ui-checkbox 
                                        label="Boarding School" 
                                        ${this.configData.school_types && this.configData.school_types.includes('boarding') ? 'checked' : ''}
                                        data-field="school_types"
                                        data-value="boarding">
                                    </ui-checkbox>
                                </div>
                            </div>
                            
                            <!-- Enabled Levels -->
                            <div class="mb-4">
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    <i class="fas fa-graduation-cap mr-1"></i>Enabled Levels
                                </label>
                                <div class="grid grid-cols-2 gap-2">
                                    <ui-checkbox 
                                        label="Creche" 
                                        ${this.configData.enabled_levels && this.configData.enabled_levels.includes('creche') ? 'checked' : ''}
                                        data-field="enabled_levels"
                                        data-value="creche">
                                    </ui-checkbox>
                                    <ui-checkbox 
                                        label="Nursery" 
                                        ${this.configData.enabled_levels && this.configData.enabled_levels.includes('nursery') ? 'checked' : ''}
                                        data-field="enabled_levels"
                                        data-value="nursery">
                                    </ui-checkbox>
                                    <ui-checkbox 
                                        label="Kindergarten" 
                                        ${this.configData.enabled_levels && this.configData.enabled_levels.includes('kindergarten') ? 'checked' : ''}
                                        data-field="enabled_levels"
                                        data-value="kindergarten">
                                    </ui-checkbox>
                                    <ui-checkbox 
                                        label="Primary" 
                                        ${this.configData.enabled_levels && this.configData.enabled_levels.includes('primary') ? 'checked' : ''}
                                        data-field="enabled_levels"
                                        data-value="primary">
                                    </ui-checkbox>
                                    <ui-checkbox 
                                        label="Junior High School (JHS)" 
                                        ${this.configData.enabled_levels && this.configData.enabled_levels.includes('jhs') ? 'checked' : ''}
                                        data-field="enabled_levels"
                                        data-value="jhs">
                                    </ui-checkbox>
                                    <ui-checkbox 
                                        label="Senior High School (SHS)" 
                                        ${this.configData.enabled_levels && this.configData.enabled_levels.includes('shs') ? 'checked' : ''}
                                        data-field="enabled_levels"
                                        data-value="shs">
                                    </ui-checkbox>
                                </div>
                            </div>
                        </div>

                        <!-- Level Classes Configuration -->
                        <div class="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg shadow-sm border border-purple-200 p-4">
                            <div class="flex items-center mb-3">
                                <i class="fas fa-layer-group text-purple-600 mr-2"></i>
                                <h3 class="text-lg font-semibold text-gray-900">Level Classes Configuration</h3>
                            </div>
                            
                            <div class="space-y-4" id="level-classes-container">
                                ${this.renderLevelClasses()}
                            </div>
                        </div>

                        <!-- SHS Programmes Configuration -->
                        <div id="shs-programmes-section" class="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg shadow-sm border border-orange-200 p-4 ${this.configData.enabled_levels && this.configData.enabled_levels.includes('shs') ? '' : 'hidden'}">
                            <div class="flex items-center mb-3">
                                <i class="fas fa-book-open text-orange-600 mr-2"></i>
                                <h3 class="text-lg font-semibold text-gray-900">SHS Programmes Configuration</h3>
                            </div>
                            
                            <div class="space-y-2" id="shs-programmes-container">
                                ${this.renderSHSProgrammes()}
                            </div>
                            <div class="flex justify-end mt-2">
                                <ui-button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    data-action="add-programme"
                                    class="px-3">
                                    <i class="fas fa-plus mr-1"></i>
                                    Add Programme
                                </ui-button>
                            </div>
                        </div>
                    </form>
                </div>
                
                <div slot="footer" class="flex justify-end space-x-3">
                    <ui-button variant="outline" data-action="close-dialog">Cancel</ui-button>
                    <ui-button color="primary" data-action="save-config">Save Configuration</ui-button>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('application-config-dialog', ApplicationConfigDialog);
export default ApplicationConfigDialog;
