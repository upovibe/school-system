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
            enabled_levels: ['primary', 'jhs', 'shs'],
            level_classes: {
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
                    required_documents: data.required_documents ? (typeof data.required_documents === 'string' ? JSON.parse(data.required_documents) : data.required_documents) : []
                };
            }
            
            this.render();
            
            // Update visibility after rendering
            setTimeout(() => {
                this.updateLevelSectionsVisibility();
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
        } else if (name === 'enabled_levels') {
            // Handle level checkboxes
            const levels = Array.from(this.querySelectorAll('input[name="enabled_levels"]:checked'))
                .map(input => input.value);
            this.configData.enabled_levels = levels;
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
            console.log('❌ No enabled levels, using defaults for testing');
            // For testing, let's use some default levels
            this.configData.enabled_levels = ['primary', 'jhs', 'shs'];
            this.generateLevelClasses();
            return;
        }
        
        // Level display names
        const levelInfo = {
            'primary': 'Primary Classes',
            'jhs': 'JHS Classes', 
            'shs': 'SHS Classes',
            'creche': 'Creche Classes',
            'nursery': 'Nursery Classes',
            'kg': 'KG Classes'
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
        const programmes = this.configData.shs_programmes || [''];
        const container = this.querySelector('#shs-programmes-container');
        
        if (!container) return;
        
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
                                    label="Kindergarten (KG)" 
                                    ${this.configData.enabled_levels && this.configData.enabled_levels.includes('kg') ? 'checked' : ''}
                                    data-field="enabled_levels"
                                    data-value="kg">
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

                    <!-- Required Documents -->
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">Required Documents</h3>
                        <div class="grid grid-cols-2 gap-3">
                            <label class="flex items-center">
                                <input type="checkbox" name="required_documents" value="birth_certificate" 
                                    ${this.configData.required_documents.includes('birth_certificate') ? 'checked' : ''}
                                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                <span class="ml-2 text-sm text-gray-700">Birth Certificate</span>
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" name="required_documents" value="passport_photo" 
                                    ${this.configData.required_documents.includes('passport_photo') ? 'checked' : ''}
                                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                <span class="ml-2 text-sm text-gray-700">Passport Photo</span>
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" name="required_documents" value="report_card" 
                                    ${this.configData.required_documents.includes('report_card') ? 'checked' : ''}
                                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                <span class="ml-2 text-sm text-gray-700">Report Card</span>
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" name="required_documents" value="transfer_letter" 
                                    ${this.configData.required_documents.includes('transfer_letter') ? 'checked' : ''}
                                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                <span class="ml-2 text-sm text-gray-700">Transfer Letter</span>
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" name="required_documents" value="bece_results" 
                                    ${this.configData.required_documents.includes('bece_results') ? 'checked' : ''}
                                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                <span class="ml-2 text-sm text-gray-700">BECE Results</span>
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" name="required_documents" value="immunization_card" 
                                    ${this.configData.required_documents.includes('immunization_card') ? 'checked' : ''}
                                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                <span class="ml-2 text-sm text-gray-700">Immunization Card</span>
                            </label>
                        </div>
                    </div>

                    <!-- SHS Programmes -->
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">SHS Programmes</h3>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Available Programmes (one per line)</label>
                            <ui-textarea 
                                name="shs_programmes_text"
                                placeholder="Enter programmes, one per line"
                                rows="4"
                                value="${this.configData.shs_programmes.join('\n')}"
                                class="w-full">
                            </ui-textarea>
                        </div>
                    </div>

                    <!-- School Types -->
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">School Types</h3>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Available School Types (one per line)</label>
                            <ui-textarea 
                                name="school_types_text"
                                placeholder="Enter school types, one per line"
                                rows="3"
                                value="${this.configData.school_types.join('\n')}"
                                class="w-full">
                            </ui-textarea>
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
