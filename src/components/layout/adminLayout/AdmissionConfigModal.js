import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Textarea.js';
import '@/components/ui/Dropdown.js';
import '@/components/ui/Switch.js';
import '@/components/ui/Button.js';
import api from '@/services/api.js';

/**
 * Admission Config Modal Component
 * 
 * A modal component for configuring admission settings in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - config-saved: Fired when configuration is successfully saved
 * - modal-closed: Fired when modal is closed
 */
class AdmissionConfigModal extends HTMLElement {
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
            required_documents: ['birth_certificate', 'passport_photo', 'report_card']
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
        // Listen for confirm button click (Save)
        this.addEventListener('confirm', () => {
            this.saveConfig();
        });
        
        // Listen for cancel button click
        this.addEventListener('cancel', () => {
            this.close();
        });

        // Listen for form changes
        this.addEventListener('change', (event) => {
            this.handleFormChange(event);
        });

        this.addEventListener('input', (event) => {
            this.handleFormChange(event);
        });

        // Listen for ui-checkbox change events
        this.addEventListener('change', (event) => {
            if (event.target.tagName === 'UI-CHECKBOX' && event.target.hasAttribute('data-field') && event.target.hasAttribute('data-field-name')) {
                console.log('🔧 UI-Checkbox change event detected:', event.target.getAttribute('data-field-name'));
                this.handleFormFieldToggle(event.target);
            }
        });

        // Add click handlers for class management
        this.addEventListener('click', (event) => {
            if (event.target.closest('[data-action="add-class"]')) {
                event.preventDefault();
                const level = event.target.closest('[data-action="add-class"]').dataset.level;
                this.addClass(level);
            }
            if (event.target.closest('[data-action="remove-class"]')) {
                event.preventDefault();
                const level = event.target.closest('[data-action="remove-class"]').dataset.level;
                const index = parseInt(event.target.closest('[data-action="remove-class"]').dataset.index, 10);
                this.removeClass(level, index);
            }
            if (event.target.closest('[data-action="add-programme"]')) {
                event.preventDefault();
                this.addProgramme();
            }
            if (event.target.closest('[data-action="remove-programme"]')) {
                event.preventDefault();
                const index = parseInt(event.target.closest('[data-action="remove-programme"]').dataset.index, 10);
                this.removeProgramme(index);
            }
            // Handle form field checkboxes - check for ui-checkbox with data-field and data-field-name
            const formFieldCheckbox = event.target.closest('ui-checkbox[data-field][data-field-name]');
            if (formFieldCheckbox) {
                event.preventDefault();
                this.handleFormFieldToggle(formFieldCheckbox);
            }
        });
    }

    open() {
        this.setAttribute('open', '');
    }

    close() {
        this.removeAttribute('open');
    }

    // Load current admission configuration
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
                
                // Parse JSON fields that come as strings from the API
                this.configData = {
                    ...this.configData,
                    ...data,
                    enabled_levels: data.enabled_levels ? (typeof data.enabled_levels === 'string' ? JSON.parse(data.enabled_levels) : data.enabled_levels) : [],
                    level_classes: data.level_classes ? (typeof data.level_classes === 'string' ? JSON.parse(data.level_classes) : data.level_classes) : {},
                    shs_programmes: data.shs_programmes ? (typeof data.shs_programmes === 'string' ? JSON.parse(data.shs_programmes) : data.shs_programmes) : [],
                    school_types: data.school_types ? (typeof data.school_types === 'string' ? JSON.parse(data.school_types) : data.school_types) : [],
                    required_documents: data.required_documents ? (typeof data.required_documents === 'string' ? JSON.parse(data.required_documents) : data.required_documents) : [],
                    // Parse form field configurations
                    student_info_fields: data.student_info_fields ? (typeof data.student_info_fields === 'string' ? JSON.parse(data.student_info_fields) : data.student_info_fields) : [],
                    parent_guardian_fields: data.parent_guardian_fields ? (typeof data.parent_guardian_fields === 'string' ? JSON.parse(data.parent_guardian_fields) : data.parent_guardian_fields) : [],
                    academic_background_fields: data.academic_background_fields ? (typeof data.academic_background_fields === 'string' ? JSON.parse(data.academic_background_fields) : data.academic_background_fields) : [],
                    health_info_fields: data.health_info_fields ? (typeof data.health_info_fields === 'string' ? JSON.parse(data.health_info_fields) : data.health_info_fields) : [],
                    document_upload_fields: data.document_upload_fields ? (typeof data.document_upload_fields === 'string' ? JSON.parse(data.document_upload_fields) : data.document_upload_fields) : []
                };
            }
            
            this.render();
            
            // Update visibility after rendering
            setTimeout(() => {
                this.updateLevelSectionsVisibility();
                this.updateConditionalVisibility();
            }, 100);
        } catch (error) {
            console.error('❌ Error loading admission config:', error);
        }
    }

    // Load current academic year
    async loadCurrentAcademicYear() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                this.configData.academic_year_name = 'No Authentication';
                this.render();
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
        this.render();
    }

    // Handle form changes
    handleFormChange(event) {
        const { name, value, type, checked } = event.target;
        
        // Handle ui-checkbox components
        if (event.target.tagName === 'UI-CHECKBOX') {
            const field = event.target.getAttribute('data-field');
            const checkboxValue = event.target.getAttribute('data-value');
            const isChecked = event.target.hasAttribute('checked');
            
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
            } else if (field === 'required_documents') {
                if (!this.configData.required_documents) this.configData.required_documents = [];
                if (isChecked && !this.configData.required_documents.includes(checkboxValue)) {
                    this.configData.required_documents.push(checkboxValue);
                } else if (!isChecked && this.configData.required_documents.includes(checkboxValue)) {
                    this.configData.required_documents = this.configData.required_documents.filter(doc => doc !== checkboxValue);
                }
            }
            
            // Update visibility of class sections and SHS programmes
            this.updateLevelSectionsVisibility();
            
            // Update conditional visibility based on level changes
            this.updateConditionalVisibility();
        } else if (name === 'enabled_levels') {
            // Handle level checkboxes
            const levels = Array.from(this.querySelectorAll('input[name="enabled_levels"]:checked'))
                .map(input => input.value);
            this.configData.enabled_levels = levels;
            
            // Update conditional visibility based on level changes
            this.updateConditionalVisibility();
        } else if (name === 'required_documents') {
            // Handle document checkboxes
            const documents = Array.from(this.querySelectorAll('input[name="required_documents"]:checked'))
                .map(input => input.value);
            this.configData.required_documents = documents;
        } else if (event.target.hasAttribute('data-level') && event.target.hasAttribute('data-class-index')) {
            // Handle individual class input changes
            this.syncClassesFromDOM();
        } else if (event.target.hasAttribute('data-programme-index')) {
            // Handle individual programme input changes
            this.syncProgrammesFromDOM();
        } else if (name && name in this.configData) {
            if (type === 'checkbox') {
                this.configData[name] = checked;
            } else if (type === 'number') {
                this.configData[name] = parseInt(value) || 0;
            } else {
                this.configData[name] = value;
            }
        }
    }

    // Update visibility of level sections based on enabled levels
    updateLevelSectionsVisibility() {
        const enabledLevels = this.configData.enabled_levels || [];
        
        // Generate level classes dynamically
        this.generateLevelClasses();
        
        // Show/hide SHS programmes section
        const shsProgrammesSection = this.querySelector('#shs-programmes-section');
        if (shsProgrammesSection) {
            shsProgrammesSection.classList.toggle('hidden', !enabledLevels.includes('shs'));
            if (enabledLevels.includes('shs')) {
                this.generateSHSProgrammes();
            }
        }
        
        // Show/hide BECE Results checkbox based on SHS selection
        const beceResultsCheckbox = this.querySelector('[data-field-name="bece_results"]');
        if (beceResultsCheckbox) {
            if (enabledLevels.includes('shs')) {
                beceResultsCheckbox.style.display = '';
            } else {
                beceResultsCheckbox.style.display = 'none';
                // Uncheck BECE Results if SHS is not enabled
                if (beceResultsCheckbox.hasAttribute('checked')) {
                    beceResultsCheckbox.removeAttribute('checked');
                    this.handleFormFieldToggle(beceResultsCheckbox);
                }
            }
        }
        
        // Show/hide Academic Programme checkbox based on SHS selection
        const academicProgrammeCheckbox = this.querySelector('[data-field-name="academic_programme"]');
        if (academicProgrammeCheckbox) {
            if (enabledLevels.includes('shs')) {
                academicProgrammeCheckbox.style.display = '';
            } else {
                academicProgrammeCheckbox.style.display = 'none';
                // Uncheck Academic Programme if SHS is not enabled
                if (academicProgrammeCheckbox.hasAttribute('checked')) {
                    academicProgrammeCheckbox.removeAttribute('checked');
                    this.handleFormFieldToggle(academicProgrammeCheckbox);
                }
            }
        }

        // Update individual level class sections visibility
        this.updateIndividualLevelClassSections();
        
        // Update conditional visibility based on Section D settings
        this.updateConditionalVisibility();
    }

    // Update individual level class sections visibility
    updateIndividualLevelClassSections() {
        const enabledLevels = this.configData.enabled_levels || [];
        
        // List of all possible levels
        const allLevels = ['creche', 'nursery', 'kindergarten', 'primary', 'jhs', 'shs'];
        
        allLevels.forEach(level => {
            // Find the level class section for this level (using the ID pattern)
            const levelSection = this.querySelector(`#${level}-classes`);
            if (levelSection) {
                const isLevelEnabled = enabledLevels.includes(level);
                levelSection.style.display = isLevelEnabled ? '' : 'none';
                
                // Clear classes for disabled levels
                if (!isLevelEnabled) {
                    if (!this.configData.level_classes) {
                        this.configData.level_classes = {};
                    }
                    this.configData.level_classes[level] = [];
                    
                    // Also clear SHS programmes if SHS is disabled
                    if (level === 'shs') {
                        this.configData.shs_programmes = [];
                    }
                }
            }
        });
    }

    // Update conditional visibility of sections based on enabled levels
    updateConditionalVisibility() {
        // Update Level Classes Configuration section visibility (School Setup)
        // Only show if there are enabled levels selected
        const levelClassesSection = this.querySelector('.bg-gradient-to-r.from-purple-50.to-violet-50');
        if (levelClassesSection) {
            const hasEnabledLevels = this.configData.enabled_levels && this.configData.enabled_levels.length > 0;
            levelClassesSection.style.display = hasEnabledLevels ? '' : 'none';
        }
    }

    // Generate level classes dynamically based on enabled levels
    generateLevelClasses() {
        const enabledLevels = this.configData.enabled_levels || [];
        const levelClasses = this.configData.level_classes || {};
        const container = this.querySelector('#level-classes-container');
        
        console.log('🔍 Debug - Enabled levels:', enabledLevels);
        console.log('🔍 Debug - Level classes:', levelClasses);
        console.log('🔍 Debug - Container:', container);
        
        if (!container) {
            console.log('❌ No container found');
            return;
        }
        
        if (!enabledLevels || enabledLevels.length === 0) {
            console.log('❌ No enabled levels, clearing container');
            container.innerHTML = '';
            return;
        }
        
        // Level display names
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
            
            // Ensure we have at least one empty class input
            if (!classes || classes.length === 0) {
                classes = [''];
            }
            
            html += `
                <div id="${level}-classes" class="mb-6">
                    <label class="block text-sm font-medium text-gray-700 mb-3">
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
        
        container.innerHTML = html;
        
        // Update conditional visibility after generating classes
        this.updateConditionalVisibility();
    }

    // Add a new class to a level
    addClass(level) {
        if (!this.configData.level_classes) {
            this.configData.level_classes = {};
        }
        if (!this.configData.level_classes[level]) {
            this.configData.level_classes[level] = [''];
        }
        this.configData.level_classes[level].push('');
        this.generateLevelClasses();
    }

    // Remove a class from a level
    removeClass(level, index) {
        if (this.configData.level_classes && this.configData.level_classes[level] && this.configData.level_classes[level].length > 1) {
            this.configData.level_classes[level].splice(index, 1);
            this.generateLevelClasses();
        }
    }

    // Sync class data from DOM inputs
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

    // Generate SHS programmes dynamically
    generateSHSProgrammes() {
        const enabledLevels = this.configData.enabled_levels || [];
        const programmes = this.configData.shs_programmes || [''];
        const container = this.querySelector('#shs-programmes-container');
        
        if (!container) return;
        
        // Only generate SHS programmes if SHS is enabled
        if (!enabledLevels.includes('shs')) {
            container.innerHTML = '';
            return;
        }
        
        // Ensure we have at least one empty programme input
        const programmesToShow = programmes.length > 0 ? programmes : [''];
        
        const html = programmesToShow.map((programme, index) => `
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
        
        container.innerHTML = html;
    }

    // Add a new programme
    addProgramme() {
        if (!this.configData.shs_programmes) {
            this.configData.shs_programmes = [''];
        }
        this.configData.shs_programmes.push('');
        this.generateSHSProgrammes();
    }

    // Remove a programme
    removeProgramme(index) {
        if (this.configData.shs_programmes && this.configData.shs_programmes.length > 1) {
            this.configData.shs_programmes.splice(index, 1);
            this.generateSHSProgrammes();
        }
    }

    // Sync programmes from DOM inputs
    syncProgrammesFromDOM() {
        const programmeInputs = this.querySelectorAll('input[data-programme-index]');
        this.configData.shs_programmes = Array.from(programmeInputs).map(input => input.value || '');
    }

    // Check if a field is enabled in the form field configuration
    isFieldEnabled(section, fieldName) {
        const fields = this.configData[section];
        if (!fields || !Array.isArray(fields)) return false;
        
        const field = fields.find(f => f.name === fieldName);
        return field && field.enabled === true;
    }

    // Check if there are enabled levels with classes configured
    hasEnabledLevelsWithClasses() {
        const enabledLevels = this.configData.enabled_levels || [];
        const levelClasses = this.configData.level_classes || {};
        
        return enabledLevels.some(level => {
            const classes = levelClasses[level] || [];
            return classes.length > 0 && classes.some(cls => cls.trim() !== '');
        });
    }


    // Uncheck Class Applying For field
    uncheckClassApplying() {
        // Find and uncheck the Class Applying For checkbox
        const classApplyingCheckbox = this.querySelector('[data-field-name="class_applying"]');
        if (classApplyingCheckbox) {
            // Remove checked attribute
            classApplyingCheckbox.removeAttribute('checked');
            
            // Update the field configuration
            if (!this.configData.admission_details_fields) {
                this.configData.admission_details_fields = [];
            }
            
            let classField = this.configData.admission_details_fields.find(f => f.name === 'class_applying');
            if (classField) {
                classField.enabled = false;
            } else {
                // Create the field if it doesn't exist
                classField = {
                    name: 'class_applying',
                    label: 'Class Applying For',
                    required: false,
                    enabled: false,
                    type: 'select'
                };
                this.configData.admission_details_fields.push(classField);
            }
            
            console.log('🔧 Class Applying For has been unchecked because Level Applying For was disabled');
        }
    }

    // Check Class Applying For field
    checkClassApplying() {
        // Find and check the Class Applying For checkbox
        const classApplyingCheckbox = this.querySelector('[data-field-name="class_applying"]');
        if (classApplyingCheckbox) {
            // Add checked attribute
            classApplyingCheckbox.setAttribute('checked', '');
            
            // Update the field configuration
            if (!this.configData.admission_details_fields) {
                this.configData.admission_details_fields = [];
            }
            
            let classField = this.configData.admission_details_fields.find(f => f.name === 'class_applying');
            if (classField) {
                classField.enabled = true;
            } else {
                // Create the field if it doesn't exist
                classField = {
                    name: 'class_applying',
                    label: 'Class Applying For',
                    required: false,
                    enabled: true,
                    type: 'select'
                };
                this.configData.admission_details_fields.push(classField);
            }
            
            console.log('🔧 Class Applying For has been checked because Level Applying For was enabled');
        }
    }

    // Check Academic Program field
    checkAcademicProgram() {
        // Find and check the Academic Program checkbox
        const academicProgramCheckbox = this.querySelector('[data-field-name="academic_program"]');
        if (academicProgramCheckbox) {
            // Add checked attribute
            academicProgramCheckbox.setAttribute('checked', '');
            
            // Update the field configuration
            if (!this.configData.admission_details_fields) {
                this.configData.admission_details_fields = [];
            }
            
            let academicField = this.configData.admission_details_fields.find(f => f.name === 'academic_program');
            if (academicField) {
                academicField.enabled = true;
            } else {
                // Create the field if it doesn't exist
                academicField = {
                    name: 'academic_program',
                    label: 'Academic Program',
                    required: false,
                    enabled: true,
                    type: 'select'
                };
                this.configData.admission_details_fields.push(academicField);
            }
            
            console.log('🔧 Academic Program has been checked because Level Applying For was enabled');
        }
    }

    // Uncheck Academic Program field
    uncheckAcademicProgram() {
        // Find and uncheck the Academic Program checkbox
        const academicProgramCheckbox = this.querySelector('[data-field-name="academic_program"]');
        if (academicProgramCheckbox) {
            // Remove checked attribute
            academicProgramCheckbox.removeAttribute('checked');
            
            // Update the field configuration
            if (!this.configData.admission_details_fields) {
                this.configData.admission_details_fields = [];
            }
            
            let academicField = this.configData.admission_details_fields.find(f => f.name === 'academic_program');
            if (academicField) {
                academicField.enabled = false;
            } else {
                // Create the field if it doesn't exist
                academicField = {
                    name: 'academic_program',
                    label: 'Academic Program',
                    required: false,
                    enabled: false,
                    type: 'select'
                };
                this.configData.admission_details_fields.push(academicField);
            }
            
            console.log('🔧 Academic Program has been unchecked because Level Applying For was disabled');
        }
    }

    // Handle form field toggle (enable/disable)
    handleFormFieldToggle(checkbox) {
        const section = checkbox.getAttribute('data-field');
        const fieldName = checkbox.getAttribute('data-field-name');
        const isCurrentlyChecked = checkbox.hasAttribute('checked');
        
        console.log(`🔧 Toggling field: ${fieldName} in ${section}, currently checked: ${isCurrentlyChecked}`);
        
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
            console.log(`🔧 Created new field config for ${fieldName}`);
        }
        
        // Toggle the enabled state (opposite of current state)
        field.enabled = !isCurrentlyChecked;
        
        // Update the checkbox visual state
        if (field.enabled) {
            checkbox.setAttribute('checked', '');
        } else {
            checkbox.removeAttribute('checked');
        }
        
        console.log(`🔧 Field ${fieldName} in ${section} is now ${field.enabled ? 'enabled' : 'disabled'}`);
        
        // Update conditional visibility after toggling form fields
        this.updateConditionalVisibility();
    }

    // Get field label for a field name
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
            'parent_full_name': 'Parent/Guardian Full Name',
            'relationship': 'Relationship to Student',
            'phone_number': 'Phone Number',
            'email': 'Email Address',
            'occupation': 'Occupation',
            'residential_address': 'Residential Address',
            'emergency_contact': 'Emergency Contact',
            'previous_school': 'Previous School Attended',
            'last_class_completed': 'Last Class Completed',
            'report_card': 'Report Card Upload',
            'bece_results': 'BECE Results',
            'transfer_letter': 'Transfer Letter',
            'level_applying': 'Level Applying For',
            'class_applying': 'Class Applying For',
            'academic_programme': 'Academic Programme',
            'school_type': 'School Type',
            'blood_group': 'Blood Group',
            'allergies': 'Allergies',
            'medical_conditions': 'Medical Conditions',
            'immunization_card': 'Immunization Card Upload',
            'birth_certificate': 'Birth Certificate',
            'passport_photo_doc': 'Passport Photo',
            'report_card_doc': 'Report Card',
            'transfer_letter_doc': 'Transfer Letter',
            'bece_results_doc': 'BECE Results Slip',
            'immunization_card_doc': 'Immunization Card'
        };
        return labels[fieldName] || fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    // Get field type for a field name
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
            'parent_full_name': 'text',
            'relationship': 'select',
            'phone_number': 'tel',
            'email': 'email',
            'occupation': 'text',
            'residential_address': 'textarea',
            'emergency_contact': 'text',
            'previous_school': 'text',
            'last_class_completed': 'text',
            'report_card': 'file',
            'bece_results': 'file',
            'transfer_letter': 'file',
            'level_applying': 'select',
            'class_applying': 'select',
            'academic_programme': 'select',
            'school_type': 'select',
            'blood_group': 'select',
            'allergies': 'select_multiple',
            'medical_conditions': 'select_multiple',
            'immunization_card': 'file',
            'birth_certificate': 'file',
            'passport_photo_doc': 'file',
            'report_card_doc': 'file',
            'transfer_letter_doc': 'file',
            'bece_results_doc': 'file',
            'immunization_card_doc': 'file'
        };
        return types[fieldName] || 'text';
    }

    // Save the configuration
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

            // Get current config ID or create new one
            const currentConfig = await api.withToken(token).get('/admission/config');
            let response;

            if (currentConfig.data.success && currentConfig.data.data) {
                // Update existing config
                response = await api.withToken(token).put(`/admission-configs/${currentConfig.data.data.id}`, this.configData);
            } else {
                // Create new config
                response = await api.withToken(token).post('/admission-configs', this.configData);
            }
            
            Toast.show({
                title: 'Success',
                message: 'Admission configuration saved successfully',
                variant: 'success',
                duration: 3000
            });

            // Close modal and dispatch event
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
            <ui-modal 
                ${this.hasAttribute('open') ? 'open' : ''} 
                position="right" 
                size="lg"
                close-button="true">
                <div slot="title">Admission Configuration</div>
                
                <form id="admission-config-form" class="space-y-6">
                    <!-- Basic Configuration -->
                    <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm border border-blue-200 p-6">
                        <div class="flex items-center mb-4">
                            <i class="fas fa-cog text-blue-600 mr-2"></i>
                            <h3 class="text-lg font-semibold text-gray-900">Basic Configuration</h3>
                        </div>
                        <div class="flex flex-col gap-3">
                            <!-- Academic Year (Read-only) -->
                            <div class="bg-white rounded-lg p-4 border border-gray-200">
                                <label class="block text-sm font-medium text-gray-700 mb-2">
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
                            <div class="bg-white rounded-lg p-4 border border-gray-200">
                                <label class="block text-sm font-medium text-gray-700 mb-2">
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
                            <div class="bg-white rounded-lg p-4 border border-gray-200">
                                <label class="block text-sm font-medium text-gray-700 mb-2">
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
                    <div class="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg shadow-sm border border-indigo-200 p-6">
                        <div class="flex items-center mb-4">
                            <i class="fas fa-cogs text-indigo-600 mr-2"></i>
                            <h3 class="text-lg font-semibold text-gray-900">Form Field Configuration</h3>
                        </div>
                        <p class="text-sm text-gray-600 mb-6">Configure which fields appear on the admission form for applicants</p>
                        
                        <!-- Section A: Student Information -->
                        <div class="mb-6">
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
                            </div>
                        </div>

                        <!-- Section B: Parent/Guardian Information -->
                        <div class="mb-6">
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
                                    label="Residential Address" 
                                    ${this.configData.parent_guardian_fields && this.isFieldEnabled('parent_guardian_fields', 'residential_address') ? 'checked' : ''}
                                    data-field="parent_guardian_fields"
                                    data-field-name="residential_address">
                                </ui-checkbox>
                                <ui-checkbox 
                                    label="Emergency Contact" 
                                    ${this.configData.parent_guardian_fields && this.isFieldEnabled('parent_guardian_fields', 'emergency_contact') ? 'checked' : ''}
                                    data-field="parent_guardian_fields"
                                    data-field-name="emergency_contact">
                                </ui-checkbox>
                            </div>
                        </div>

                        <!-- Section C: Academic Background -->
                        <div class="mb-6">
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
                                <ui-checkbox 
                                    label="Report Card Upload" 
                                    ${this.configData.academic_background_fields && this.isFieldEnabled('academic_background_fields', 'report_card') ? 'checked' : ''}
                                    data-field="academic_background_fields"
                                    data-field-name="report_card">
                                </ui-checkbox>
                                <ui-checkbox 
                                    label="BECE Results" 
                                    ${this.configData.academic_background_fields && this.isFieldEnabled('academic_background_fields', 'bece_results') ? 'checked' : ''}
                                    data-field="academic_background_fields"
                                    data-field-name="bece_results"
                                    ${this.configData.enabled_levels && this.configData.enabled_levels.includes('shs') ? '' : 'style="display: none;"'}>
                                </ui-checkbox>
                                <ui-checkbox 
                                    label="Transfer Letter" 
                                    ${this.configData.academic_background_fields && this.isFieldEnabled('academic_background_fields', 'transfer_letter') ? 'checked' : ''}
                                    data-field="academic_background_fields"
                                    data-field-name="transfer_letter">
                                </ui-checkbox>
                            </div>
                        </div>

                        <!-- Section F: Health Information -->
                        <div class="mb-6">
                            <h4 class="text-md font-semibold text-gray-800 mb-3 flex items-center">
                                <i class="fas fa-heartbeat mr-2 text-red-600"></i>Section F: Health Information
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
                                <ui-checkbox 
                                    label="Immunization Card Upload" 
                                    ${this.configData.health_info_fields && this.isFieldEnabled('health_info_fields', 'immunization_card') ? 'checked' : ''}
                                    data-field="health_info_fields"
                                    data-field-name="immunization_card">
                                </ui-checkbox>
                            </div>
                        </div>

                        <!-- Section G: Document Upload -->
                        <div class="mb-6">
                            <h4 class="text-md font-semibold text-gray-800 mb-3 flex items-center">
                                <i class="fas fa-file-upload mr-2 text-purple-600"></i>Section G: Document Upload
                            </h4>
                            <div class="grid grid-cols-2 gap-3">
                                <ui-checkbox 
                                    label="Birth Certificate" 
                                    ${this.configData.document_upload_fields && this.isFieldEnabled('document_upload_fields', 'birth_certificate') ? 'checked' : ''}
                                    data-field="document_upload_fields"
                                    data-field-name="birth_certificate">
                                </ui-checkbox>
                                <ui-checkbox 
                                    label="Passport Photo" 
                                    ${this.configData.document_upload_fields && this.isFieldEnabled('document_upload_fields', 'passport_photo_doc') ? 'checked' : ''}
                                    data-field="document_upload_fields"
                                    data-field-name="passport_photo_doc">
                                </ui-checkbox>
                                <ui-checkbox 
                                    label="Report Card" 
                                    ${this.configData.document_upload_fields && this.isFieldEnabled('document_upload_fields', 'report_card_doc') ? 'checked' : ''}
                                    data-field="document_upload_fields"
                                    data-field-name="report_card_doc">
                                </ui-checkbox>
                                <ui-checkbox 
                                    label="Transfer Letter" 
                                    ${this.configData.document_upload_fields && this.isFieldEnabled('document_upload_fields', 'transfer_letter_doc') ? 'checked' : ''}
                                    data-field="document_upload_fields"
                                    data-field-name="transfer_letter_doc">
                                </ui-checkbox>
                                <ui-checkbox 
                                    label="BECE Results Slip" 
                                    ${this.configData.document_upload_fields && this.isFieldEnabled('document_upload_fields', 'bece_results_doc') ? 'checked' : ''}
                                    data-field="document_upload_fields"
                                    data-field-name="bece_results_doc"
                                    ${this.configData.enabled_levels && this.configData.enabled_levels.includes('shs') ? '' : 'style="display: none;"'}>
                                </ui-checkbox>
                                <ui-checkbox 
                                    label="Immunization Card" 
                                    ${this.configData.document_upload_fields && this.isFieldEnabled('document_upload_fields', 'immunization_card_doc') ? 'checked' : ''}
                                    data-field="document_upload_fields"
                                    data-field-name="immunization_card_doc">
                                </ui-checkbox>
                            </div>
                        </div>

                    </div>

                    <!-- School Setup Configuration -->
                    <div class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg shadow-sm border border-green-200 p-6">
                        <div class="flex items-center mb-4">
                            <i class="fas fa-school text-green-600 mr-2"></i>
                            <h3 class="text-lg font-semibold text-gray-900">School Setup</h3>
                        </div>
                        
                        <!-- School Types -->
                        <div class="mb-6">
                            <label class="block text-sm font-medium text-gray-700 mb-3">
                                <i class="fas fa-building mr-1"></i>School Types (Applicant Selection Options)
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
                            <p class="text-xs text-gray-500 mt-2">Select which school type options applicants can choose from</p>
                        </div>
                        
                        <!-- Enabled Levels -->
                        <div class="mb-6">
                            <label class="block text-sm font-medium text-gray-700 mb-3">
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
                            <p class="text-xs text-gray-500 mt-2">Select which educational levels your school offers</p>
                        </div>
                    </div>

                    <!-- Level Classes Configuration -->
                    <div class="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg shadow-sm border border-purple-200 p-6">
                        <div class="flex items-center mb-4">
                            <i class="fas fa-layer-group text-purple-600 mr-2"></i>
                            <h3 class="text-lg font-semibold text-gray-900">Level Classes Configuration</h3>
                        </div>
                        
                        <div class="space-y-4" id="level-classes-container">
                            <!-- Classes will be dynamically generated here -->
                        </div>
                        <p class="text-xs text-gray-500 mt-2">Configure classes for each enabled level</p>
                    </div>

                    <!-- SHS Programmes Configuration -->
                    <div id="shs-programmes-section" class="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg shadow-sm border border-orange-200 p-6 hidden">
                        <div class="flex items-center mb-4">
                            <i class="fas fa-book-open text-orange-600 mr-2"></i>
                            <h3 class="text-lg font-semibold text-gray-900">SHS Programmes Configuration</h3>
                        </div>
                        
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-3">
                                <i class="fas fa-list mr-1"></i>Available Programmes
                            </label>
                            <div class="space-y-2" id="shs-programmes-container">
                                <!-- Programmes will be dynamically generated here -->
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
                            <p class="text-xs text-gray-500 mt-1">These programmes will appear as options for SHS applicants</p>
                        </div>
                    </div>

                </form>
                
                <div slot="footer" class="flex justify-end space-x-3">
                    <ui-button variant="outline" color="secondary" modal-action="cancel">Cancel</ui-button>
                    <ui-button color="primary" modal-action="confirm">Save Configuration</ui-button>
                </div>
            </ui-modal>
        `;
    }
}

customElements.define('admission-config-modal', AdmissionConfigModal);
export default AdmissionConfigModal;
