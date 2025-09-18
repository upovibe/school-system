import App from '@/core/App.js';
import { unescapeJsonFromAttribute } from '@/utils/jsonUtils.js';
import '@/components/ui/Input.js';
import '@/components/ui/Dropdown.js';
import '@/components/ui/SearchDropdown.js';
import '@/components/ui/Textarea.js';
import '@/components/ui/Toast.js';
import '@/components/common/PageLoader.js';
import api from '@/services/api.js';

/**
 * Dynamic Application Form
 * 
 * Renders the application form dynamically based on admission configuration.
 * Shows a progress bar with enabled sections and generates form fields accordingly.
 */
class DynamicApplicationForm extends App {
    constructor() {
        super();
        this.formData = {};
        this.admissionConfig = null;
        this.currentSection = 0;
        this.enabledSections = [];
    }

    static get observedAttributes() {
        return ['settings', 'banner-image', 'colors', 'page-data'];
    }

    async connectedCallback() {
        super.connectedCallback();
        await this.loadAdmissionConfig();
        this.loadDataFromProps();
        this.setupEventListeners();
    }

    async loadAdmissionConfig() {
        try {
            const response = await api.get('/admission/config');
            if (response.data.success && response.data.data) {
                this.admissionConfig = response.data.data;
                this.determineEnabledSections();
                this.initializeFormData();
                this.render();
            } else {
                console.error('Failed to load admission configuration');
                this.showError('Admission configuration not available');
            }
        } catch (error) {
            console.error('Error loading admission configuration:', error);
            this.showError('Failed to load admission form');
        }
    }

    determineEnabledSections() {
        this.enabledSections = [];
        
        // Always add School Setup as the first section
        this.enabledSections.push({
            id: 'school-setup',
            title: 'School Setup',
            icon: 'fas fa-school',
            color: 'indigo'
        });
        
        // Check each section based on enabled fields
        if (this.hasEnabledFields('student_info_fields')) {
            this.enabledSections.push({
                id: 'student-info',
                title: 'Student Information',
                icon: 'fas fa-user',
                color: 'blue'
            });
        }
        
        if (this.hasEnabledFields('parent_guardian_fields')) {
            this.enabledSections.push({
                id: 'parent-guardian',
                title: 'Parent/Guardian Information',
                icon: 'fas fa-users',
                color: 'green'
            });
        }
        
        if (this.hasEnabledFields('academic_background_fields')) {
            this.enabledSections.push({
                id: 'academic-background',
                title: 'Academic Background',
                icon: 'fas fa-graduation-cap',
                color: 'yellow'
            });
        }
        
        if (this.hasEnabledFields('health_info_fields')) {
            this.enabledSections.push({
                id: 'health-info',
                title: 'Health Information',
                icon: 'fas fa-heartbeat',
                color: 'red'
            });
        }
        
        if (this.hasEnabledFields('document_upload_fields')) {
            this.enabledSections.push({
                id: 'document-upload',
                title: 'Document Upload',
                icon: 'fas fa-file-upload',
                color: 'purple'
            });
        }
    }

    hasEnabledFields(sectionName) {
        const fields = this.admissionConfig[sectionName];
        return fields && Array.isArray(fields) && fields.some(field => field.enabled);
    }

    initializeFormData() {
        // Initialize form data based on enabled fields
        this.enabledSections.forEach(section => {
            const sectionFields = this.getSectionFields(section.id);
            sectionFields.forEach(field => {
                this.formData[field.name] = '';
            });
        });
    }

    initializeFormDataForCurrentSection() {
        // Initialize form data for the current section only
        const currentSectionId = this.enabledSections[this.currentSection].id;
        const sectionFields = this.getSectionFields(currentSectionId);
        sectionFields.forEach(field => {
            if (!(field.name in this.formData)) {
                this.formData[field.name] = '';
            }
        });
    }

    getSectionFields(sectionId) {
        if (sectionId === 'school-setup') {
            // Generate school setup fields based on admission config
            return this.generateSchoolSetupFields();
        }
        
        const sectionMap = {
            'student-info': this.admissionConfig.student_info_fields || [],
            'parent-guardian': this.admissionConfig.parent_guardian_fields || [],
            'academic-background': this.admissionConfig.academic_background_fields || [],
            'health-info': this.admissionConfig.health_info_fields || [],
            'document-upload': this.admissionConfig.document_upload_fields || []
        };
        
        const allFields = sectionMap[sectionId] || [];
        const enabledFields = allFields.filter(field => field.enabled);
        
        return enabledFields;
    }

    generateSchoolSetupFields() {
        const fields = [];
        
        // Level Applying For - Moved to first position
        if (this.admissionConfig.enabled_levels && this.admissionConfig.enabled_levels.length > 0) {
            fields.push({
                name: 'level_applying',
                label: 'Level Applying For',
                type: 'select',
                required: true,
                enabled: true,
                options: this.admissionConfig.enabled_levels.map(level => 
                    level.charAt(0).toUpperCase() + level.slice(1)
                )
            });
        }
        
        // School Type selection - Moved to second position
        if (this.admissionConfig.school_types && this.admissionConfig.school_types.length > 0) {
            fields.push({
                name: 'school_type',
                label: 'School Type',
                type: 'select',
                required: true,
                enabled: true,
                options: this.admissionConfig.school_types.map(type => 
                    type.charAt(0).toUpperCase() + type.slice(1)
                )
            });
        }
        
        // Class Applying For (populated based on current level selection)
        const currentLevel = this.formData.level_applying;
        let classOptions = ['Select level first...'];
        
        if (currentLevel) {
            const levelKey = currentLevel.toLowerCase();
            const levelClasses = this.admissionConfig.level_classes[levelKey];
            if (levelClasses && levelClasses.length > 0) {
                classOptions = levelClasses;
            }
        }
        
        fields.push({
            name: 'class_applying',
            label: 'Class Applying For',
            type: 'select',
            required: true,
            enabled: true,
            options: classOptions
        });
        
        // Academic Program (for SHS only)
        if (this.admissionConfig.shs_programmes && this.admissionConfig.shs_programmes.length > 0) {
            fields.push({
                name: 'academic_program',
                label: 'Academic Program',
                type: 'select',
                required: false,
                enabled: true,
                options: this.admissionConfig.shs_programmes
            });
        }
        
        return fields;
    }

    handleLevelChange(selectedLevel) {
        if (!selectedLevel) return;
        
        // Update form data with selected level
        this.formData.level_applying = selectedLevel;
        
        // Clear class selection since level changed
        this.formData.class_applying = '';
        
        // Re-render to update class options based on new level
        const html = this.render();
        this.innerHTML = html;
        
        // Restore form values after re-render
        setTimeout(() => {
            this.restoreFormValues();
            
            // Show/hide academic program based on level
            const levelKey = selectedLevel.toLowerCase();
            const academicProgramField = this.querySelector('ui-search-dropdown[name="academic_program"]');
            if (academicProgramField) {
                const parentDiv = academicProgramField.closest('.col-span-1');
                if (parentDiv) {
                    if (levelKey === 'shs') {
                        parentDiv.style.display = 'block';
                    } else {
                        parentDiv.style.display = 'none';
                        this.formData.academic_program = '';
                    }
                }
            }
        }, 100);
    }
    
    restoreFormValues() {
        // Restore all form values from formData
        Object.keys(this.formData).forEach(fieldName => {
            const value = this.formData[fieldName];
            if (!value) return;
            
            const element = this.querySelector(`[name="${fieldName}"]`);
            if (element) {
                element.value = value;
            }
        });
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
        
        const bannerImageAttr = this.getAttribute('banner-image');
        if (bannerImageAttr) {
            this.set('contactBannerImage', bannerImageAttr);
        }
        
        const colorsAttr = this.getAttribute('colors');
        if (colorsAttr) {
            try {
                const colors = JSON.parse(colorsAttr.replace(/&quot;/g, '"'));
                Object.entries(colors).forEach(([key, value]) => {
                    this.set(key, value);
                });
            } catch (e) {}
        }
        
        const pageDataAttr = this.getAttribute('page-data');
        if (pageDataAttr) {
            const pageData = unescapeJsonFromAttribute(pageDataAttr);
            if (pageData) {
                this.set('pageData', pageData);
            }
        }
    }

    setupEventListeners() {
        // Form submission
        this.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });


        // Navigation buttons
        this.addEventListener('click', (e) => {
            if (e.target.matches('[data-nav="previous"]')) {
                e.preventDefault();
                if (this.currentSection > 0) {
                    this.handlePreviousSection();
                }
            } else if (e.target.matches('[data-nav="next"]')) {
                e.preventDefault();
                if (this.currentSection < this.enabledSections.length - 1) {
                    this.handleNextSection();
                }
            }
        });

        // Form input changes
        this.addEventListener('input', (e) => {
            if (e.target.matches('ui-input, ui-dropdown, ui-search-dropdown, ui-textarea')) {
                // Special handling for phone numbers
                if (e.target.type === 'tel' || e.target.name.includes('phone')) {
                    this.formData[e.target.name] = this.formatPhoneNumber(e.target.value);
                    e.target.value = this.formData[e.target.name];
                } else {
                    this.formData[e.target.name] = e.target.value;
                }
                this.updateProgress();
            }
        });

        // Handle custom component events
        this.addEventListener('change', (e) => {
            if (e.target.matches('ui-input, ui-dropdown, ui-search-dropdown, ui-textarea')) {
                this.formData[e.target.name] = e.target.value;
                this.updateProgress();
            }
        });


        // Handle level selection change for dynamic class options
        this.addEventListener('change', (e) => {
            if (e.target.matches('ui-search-dropdown[name="level_applying"]')) {
                this.handleLevelChange(e.target.value);
            }
        });
    }

    handleNextSection() {
        // Collect current form data before validation
        this.collectCurrentFormData();
        
        // Small delay to ensure data collection completes
        setTimeout(() => {
            // Validate current section before proceeding
            const validationResult = this.validateCurrentSectionWithDetails();
            if (!validationResult.isValid) {
                Toast.show({
                    title: 'Validation Error',
                    message: validationResult.message,
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Show success message and proceed to next section
            Toast.show({
                title: 'Section Complete',
                message: 'Great! Moving to the next section',
                variant: 'success',
                duration: 2000
            });

            // Small delay to show the toast before navigation
            setTimeout(() => {
                this.navigateToSection(this.currentSection + 1);
            }, 500);
        }, 100);
    }

    handlePreviousSection() {
        // Show info message and go to previous section
        Toast.show({
            title: 'Going Back',
            message: 'Returning to previous section',
            variant: 'info',
            duration: 1500
        });

        // Small delay to show the toast before navigation
        setTimeout(() => {
            this.navigateToSection(this.currentSection - 1);
        }, 300);
    }

    navigateToSection(sectionIndex) {
        if (sectionIndex >= 0 && sectionIndex < this.enabledSections.length) {
            this.currentSection = sectionIndex;
            
            // Reinitialize form data for the new section
            this.initializeFormDataForCurrentSection();
            
            const html = this.render();
            this.innerHTML = html;
            
            // Small delay to ensure DOM is updated
            setTimeout(() => {
                this.scrollToCurrentSection();
            }, 100);
        }
    }

    scrollToCurrentSection() {
        const sectionElement = this.querySelector(`[data-section="${this.enabledSections[this.currentSection].id}"]`);
        if (sectionElement) {
            sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    updateProgress() {
        const progressBar = this.querySelector('.progress-bar-fill');
        if (progressBar) {
            // Calculate progress based on current section completion
            const currentSectionId = this.enabledSections[this.currentSection].id;
            const sectionFields = this.getSectionFields(currentSectionId);
            
            // Filter to only count visible/relevant fields
            const relevantFields = sectionFields.filter(field => {
                const input = this.querySelector(`[name="${field.name}"]`);
                if (!input) return false;
                
                // Check if field is visible (not hidden)
                const fieldContainer = input.closest('.col-span-1, .col-span-2');
                if (fieldContainer && fieldContainer.style.display === 'none') {
                    return false; // Don't count hidden fields
                }
                
                // For school setup section, handle special cases
                if (currentSectionId === 'school-setup') {
                    // Don't count academic_program if not SHS level
                    if (field.name === 'academic_program') {
                        const selectedLevel = this.formData.level_applying;
                        if (!selectedLevel || selectedLevel.toLowerCase() !== 'shs') {
                            return false;
                        }
                    }
                    
                    // Don't count class_applying if no level selected
                    if (field.name === 'class_applying') {
                        const selectedLevel = this.formData.level_applying;
                        if (!selectedLevel) {
                            return false;
                        }
                    }
                }
                
                return true;
            });
            
            const totalFields = relevantFields.length;
            
            // Count filled fields from relevant fields only
            const filledFields = relevantFields.filter(field => {
                const input = this.querySelector(`[name="${field.name}"]`);
                if (!input) return false;
                
                if (field.type === 'file') {
                    return true; // File fields are not required anymore
                } else {
                    const value = input.value;
                    return value && value.toString().trim() !== '';
                }
            }).length;
            
            const progress = totalFields > 0 ? (filledFields / totalFields) * 100 : 0;
            progressBar.style.width = `${progress}%`;
        }
    }

    async handleSubmit() {
        try {
            // Collect all form data from all sections before validation
            this.collectAllFormData();
            
            // Validate current section before submission
            const validationResult = this.validateCurrentSectionWithDetails();
            if (!validationResult.isValid) {
                Toast.show({
                    title: 'Validation Error',
                    message: validationResult.message,
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Map frontend field names to database column names
            const mappedData = this.mapFormDataToDatabase(this.formData);

            // Debug: Log the data being sent
            console.log('Form data before mapping:', this.formData);
            console.log('Mapped data being sent:', mappedData);

            // Submit form data
            const response = await api.post('/applications', mappedData);
            
            if (response.data.success) {
                Toast.show({
                    title: 'Success',
                    message: 'Application submitted successfully',
                    variant: 'success',
                    duration: 5000
                });
                
                // Reset form
                this.formData = {};
                this.initializeFormData();
                this.currentSection = 0;
                this.render();
            } else {
                throw new Error(response.data.message || 'Submission failed');
            }
        } catch (error) {
            console.error('Error submitting application:', error);
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to submit application',
                variant: 'error',
                duration: 5000
            });
        }
    }

    mapFormDataToDatabase(formData) {
        const mappedData = { ...formData };
        
        // Map frontend field names to database column names
        const fieldMapping = {
            // School Setup fields - now match exactly
            'academic_program': 'academic_programme',
            // level_applying, class_applying, school_type stay the same
            
            // Student Information fields - now match exactly
            // first_name, middle_name, last_name, gender, date_of_birth, place_of_birth, nationality, religion, student_phone, email stay the same
            
            // Parent/Guardian fields - now match exactly
            'guardian_name': 'parent_full_name',
            'guardian_phone': 'phone_number',
            'guardian_email': 'email',
            'guardian_occupation': 'occupation',
            'address': 'residential_address',
            // emergency_contact stays the same
            
            // Academic Background fields - now match exactly
            'previous_school_name': 'previous_school',
            'last_grade_completed': 'last_class_completed'
        };
        
        // Apply field mapping
        Object.keys(fieldMapping).forEach(frontendField => {
            if (frontendField in mappedData) {
                const dbField = fieldMapping[frontendField];
                mappedData[dbField] = mappedData[frontendField];
                delete mappedData[frontendField];
            }
        });
        
        // Remove fields that don't exist in database or need special handling
        const fieldsToRemove = [
            'passport_photo', // This field doesn't exist in database
            'uploaded_documents', // This field doesn't exist in database
            'additional_data', // This field doesn't exist in database
            // Add other fields that should be handled separately
        ];
        
        fieldsToRemove.forEach(field => {
            if (field in mappedData) {
                delete mappedData[field];
            }
        });
        
        // Handle health info as JSON
        if (mappedData.health_info && typeof mappedData.health_info === 'object') {
            mappedData.health_info = JSON.stringify(mappedData.health_info);
        }
        
        // Remove empty values to avoid database errors
        Object.keys(mappedData).forEach(key => {
            if (mappedData[key] === '' || mappedData[key] === null || mappedData[key] === undefined) {
                delete mappedData[key];
            }
        });
        
        return mappedData;
    }

    collectCurrentFormData() {
        // Manually collect data from all form inputs in current section
        const currentSectionId = this.enabledSections[this.currentSection].id;
        const sectionFields = this.getSectionFields(currentSectionId);
        
        sectionFields.forEach(field => {
            const input = this.querySelector(`[name="${field.name}"]`);
            if (input) {
                if (field.type === 'file') {
                    // File fields are not needed anymore
                    this.formData[field.name] = null;
                } else {
                    this.formData[field.name] = input.value || '';
                }
            }
        });
    }

    collectAllFormData() {
        // Collect data from all enabled sections
        this.enabledSections.forEach(section => {
            const sectionFields = this.getSectionFields(section.id);
            
            sectionFields.forEach(field => {
                const input = this.querySelector(`[name="${field.name}"]`);
                if (input) {
                    if (field.type === 'file') {
                        // File fields are not needed anymore
                        this.formData[field.name] = null;
                    } else {
                        this.formData[field.name] = input.value || '';
                    }
                } else {
                    // If input doesn't exist, ensure field is initialized
                    if (!(field.name in this.formData)) {
                        this.formData[field.name] = '';
                    }
                }
            });
        });
    }

    validateCurrentSection() {
        const currentSectionId = this.enabledSections[this.currentSection].id;
        const sectionFields = this.getSectionFields(currentSectionId);
        
        return sectionFields.every(field => {
            if (field.required) {
                const value = this.formData[field.name];
                if (!value || value.toString().trim() === '') {
                    return false;
                }
                
                // Special validation for phone numbers
                if (field.type === 'tel' || field.name.includes('phone') || field.name === 'emergency_contact') {
                    return this.validatePhoneNumber(value);
                }
                
                return true;
            }
            return true;
        });
    }

    validateCurrentSectionWithDetails() {
        const currentSectionId = this.enabledSections[this.currentSection].id;
        const sectionFields = this.getSectionFields(currentSectionId);
        
        for (const field of sectionFields) {
            if (field.required) {
                const value = this.formData[field.name];
                if (!value || value.toString().trim() === '') {
                    return {
                        isValid: false,
                        message: `${field.label} is required`
                    };
                }
                
                // Special validation for phone numbers
                if (field.type === 'tel' || field.name.includes('phone') || field.name === 'emergency_contact') {
                    if (!this.validatePhoneNumber(value)) {
                        return {
                            isValid: false,
                            message: `${field.label} must be at least 10 digits long`
                        };
                    }
                }
            }
        }
        
        return { isValid: true };
    }

    validatePhoneNumber(phone) {
        // Remove all non-digit characters
        const digitsOnly = phone.replace(/\D/g, '');
        
        // Check if it has at least 10 digits
        if (digitsOnly.length < 10) {
            return false;
        }
        
        // Check if it's not too long (max 15 digits for international numbers)
        if (digitsOnly.length > 15) {
            return false;
        }
        
        return true;
    }

    formatPhoneNumber(phone) {
        // Remove all non-digit characters
        const digitsOnly = phone.replace(/\D/g, '');
        
        // Limit to 15 digits maximum
        const limitedDigits = digitsOnly.substring(0, 15);
        
        // Format based on length
        if (limitedDigits.length === 0) {
            return '';
        } else if (limitedDigits.length <= 3) {
            return limitedDigits;
        } else if (limitedDigits.length <= 6) {
            return `(${limitedDigits.substring(0, 3)}) ${limitedDigits.substring(3)}`;
        } else if (limitedDigits.length <= 10) {
            return `(${limitedDigits.substring(0, 3)}) ${limitedDigits.substring(3, 6)}-${limitedDigits.substring(6)}`;
        } else {
            // International format
            return `+${limitedDigits.substring(0, limitedDigits.length - 10)} (${limitedDigits.substring(limitedDigits.length - 10, limitedDigits.length - 7)}) ${limitedDigits.substring(limitedDigits.length - 7, limitedDigits.length - 4)}-${limitedDigits.substring(limitedDigits.length - 4)}`;
        }
    }

    showError(message) {
        this.innerHTML = `
            <div class="container mx-auto flex items-center justify-center p-8">
                <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    ${message}
                </div>
            </div>
        `;
    }

    renderProgressBar() {
        if (!this.enabledSections.length) return '';

        const currentSection = this.enabledSections[this.currentSection];
        const progress = ((this.currentSection + 1) / this.enabledSections.length) * 100;

        return `
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center">
                        <div class="w-10 h-10 bg-${currentSection.color}-100 rounded-lg flex items-center justify-center mr-4">
                            <i class="${currentSection.icon} text-${currentSection.color}-600"></i>
                        </div>
                        <div>
                            <h3 class="text-lg font-semibold text-gray-900">${currentSection.title}</h3>
                            <p class="text-sm text-gray-500">Step ${this.currentSection + 1} of ${this.enabledSections.length}</p>
                        </div>
                    </div>
                </div>
                
                <!-- Progress Bar -->
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="progress-bar-fill bg-${currentSection.color}-600 h-2 rounded-full transition-all duration-300" style="width: ${progress}%"></div>
                </div>
            </div>
        `;
    }

    renderSection(section) {
        const sectionFields = this.getSectionFields(section.id);
        
        if (!sectionFields.length) {
            return '';
        }

        return `
            <div data-section="${section.id}" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div class="flex items-center mb-6">
                    <div class="w-10 h-10 bg-${section.color}-100 rounded-lg flex items-center justify-center mr-4">
                        <i class="${section.icon} text-${section.color}-600"></i>
                    </div>
                    <div>
                        <h3 class="text-xl font-semibold text-gray-900">${section.title}</h3>
                        <p class="text-sm text-gray-600">Please provide the following information</p>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${sectionFields.map(field => this.renderField(field)).join('')}
                </div>
            </div>
        `;
    }

    renderField(field) {
        const fieldId = `field_${field.name}`;
        const isRequired = field.required ? 'required' : '';
        const value = this.formData[field.name] || '';

        switch (field.type) {
            case 'text':
            case 'email':
            case 'tel':
            case 'date':
                return `
                    <div class="col-span-1">
                        <label for="${fieldId}" class="block text-sm font-medium text-gray-700 mb-1">
                            ${field.label} ${field.required ? '<span class="text-red-500">*</span>' : ''}
                        </label>
                        <ui-input 
                            id="${fieldId}"
                            type="${field.type}"
                            name="${field.name}"
                            value="${value}"
                            placeholder="Enter ${field.label.toLowerCase()}"
                            ${isRequired}
                            class="w-full">
                        </ui-input>
                    </div>
                `;
            
            case 'textarea':
                return `
                    <div class="col-span-2">
                        <label for="${fieldId}" class="block text-sm font-medium text-gray-700 mb-1">
                            ${field.label} ${field.required ? '<span class="text-red-500">*</span>' : ''}
                        </label>
                        <ui-textarea 
                            id="${fieldId}"
                            name="${field.name}"
                            value="${value}"
                            placeholder="Enter ${field.label.toLowerCase()}"
                            ${isRequired}
                            class="w-full">
                        </ui-textarea>
                    </div>
                `;
            
            case 'select':
                const options = field.options || [];
                return `
                    <div class="col-span-1">
                        <label for="${fieldId}" class="block text-sm font-medium text-gray-700 mb-1">
                            ${field.label} ${field.required ? '<span class="text-red-500">*</span>' : ''}
                        </label>
                        <ui-search-dropdown 
                            id="${fieldId}"
                            name="${field.name}"
                            placeholder="Select ${field.label}..."
                            ${isRequired}
                            class="w-full">
                            ${options.map(option => `
                                <ui-option value="${option}" ${value === option ? 'selected' : ''}>${option}</ui-option>
                            `).join('')}
                        </ui-search-dropdown>
                    </div>
                `;
            
            case 'file':
                return `
                    <div class="col-span-1">
                        <label for="${fieldId}" class="block text-sm font-medium text-gray-700 mb-1">
                            ${field.label} ${field.required ? '<span class="text-red-500">*</span>' : ''}
                        </label>
                        <ui-input 
                            id="${fieldId}"
                            type="file"
                            name="${field.name}"
                            ${isRequired}
                            class="w-full">
                        </ui-input>
                    </div>
                `;
            
            default:
                return `
                    <div class="col-span-1">
                        <label for="${fieldId}" class="block text-sm font-medium text-gray-700 mb-1">
                            ${field.label} ${field.required ? '<span class="text-red-500">*</span>' : ''}
                        </label>
                        <ui-input 
                            id="${fieldId}"
                            type="text"
                            name="${field.name}"
                            value="${value}"
                            placeholder="Enter ${field.label.toLowerCase()}"
                            ${isRequired}
                            class="w-full">
                        </ui-input>
                    </div>
                `;
        }
    }

    render() {
        if (!this.admissionConfig) {
            return `
                <div class="container flex items-center justify-center mx-auto p-8">
                    <page-loader></page-loader>
                </div>
            `;
        }

        if (!this.enabledSections.length) {
            return `
                <div class="container mx-auto flex items-center justify-center p-8">
                    <div class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                        No form sections are currently enabled. Please contact the administrator.
                    </div>
                </div>
            `;
        }

        const applicationLogo = this.get('applicationLogo');
        const applicationName = this.get('applicationName');
        const bannerImage = this.get('contactBannerImage');

        return `
            <section class="min-h-screen bg-gray-50">
                <!-- Header with Banner -->
                <div class="mx-auto py-8 px-4">
                    <div class="relative group rounded-3xl overflow-hidden shadow-2xl mb-8">
                        <div class="relative h-80 lg:h-96 overflow-hidden">
                            ${bannerImage ? `
                                <img src="${bannerImage}" 
                                     alt="Application Banner" 
                                     class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                            ` : ''}
                            <div class="absolute inset-0 ${bannerImage ? 'hidden' : 'flex'} items-center justify-center bg-gray-100">
                                <div class="text-center">
                                    <i class="fas fa-file-alt text-gray-400 text-4xl mb-2"></i>
                                    <p class="text-gray-500 font-medium">Application banner</p>
                                </div>
                            </div>
                            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                            <!-- Overlay content: title and subtitle -->
                            <div class="absolute inset-0 flex items-center justify-center p-6">
                                <div class="text-center text-white relative z-10">
                                    ${applicationLogo ? `
                                        <img src="${applicationLogo}" alt="School Logo" class="h-16 mx-auto mb-4">
                                    ` : ''}
                                    <h2 class="text-3xl lg:text-5xl font-bold mb-4 drop-shadow-lg">
                                        ${applicationName || 'Application Form'}
                                    </h2>
                                    <p class="text-lg lg:text-xl mb-8 max-w-2xl mx-auto opacity-90 drop-shadow-md">
                                        Complete your application in a few simple steps
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Form Content -->
                <div class="max-w-4xl mx-auto px-6 py-8">
                    <form id="dynamic-application-form">
                        <!-- Progress Bar -->
                        ${this.renderProgressBar()}
                        
                        <!-- Current Section -->
                        ${this.enabledSections[this.currentSection] ? this.renderSection(this.enabledSections[this.currentSection]) : ''}
                        
                        <!-- Navigation Buttons -->
                        <div class="flex justify-between items-center mt-8">
                            <button 
                                type="button" 
                                class="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors ${this.currentSection === 0 ? 'opacity-50 cursor-not-allowed' : ''}"
                                ${this.currentSection === 0 ? 'disabled' : ''}
                                data-nav="previous">
                                Previous
                            </button>
                            
                            ${this.currentSection === this.enabledSections.length - 1 ? `
                                <button 
                                    type="submit" 
                                    class="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                    Submit Application
                                </button>
                            ` : `
                                <button 
                                    type="button" 
                                    class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    data-nav="next">
                                    Next
                                </button>
                            `}
                        </div>
                    </form>
                </div>
            </section>
        `;
    }
}

customElements.define('dynamic-application-form', DynamicApplicationForm);
export default DynamicApplicationForm;
