import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Switch.js';
import '@/components/ui/Button.js';
import '@/components/ui/Dropdown.js';
import '@/components/ui/Textarea.js';
import '@/components/ui/SearchDropdown.js';
import api from '@/services/api.js';

/**
 * Teacher Announcement Add Modal Component
 * 
 * A modal component for adding new announcements as a teacher
 * Teachers can only target their assigned classes or general audiences
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - announcement-saved: Fired when an announcement is successfully created
 * - modal-closed: Fired when modal is closed
 */
class TeacherAnnouncementAddModal extends HTMLElement {
    constructor() {
        super();
        this.teacherClass = null;
        this.teacherAssignments = null;
        this.isClassTeacher = false;
    }

    static get observedAttributes() {
        return ['open'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'open' && newValue !== null) {
            // Modal is now open, ensure dropdown displays correctly
            if (this.isClassTeacher && this.teacherClass) {
                setTimeout(() => {
                    this.updateDropdownDisplay();
                }, 50);
            }
        }
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
        // Load teacher's assignments when modal is connected
        this.loadTeacherAssignments();
    }

    setupEventListeners() {
        // Listen for cancel button click
        this.addEventListener('cancel', () => {
            this.close();
        });
    }

    open() {
        this.setAttribute('open', '');
        // Ensure dropdown displays the correct text when modal opens
        if (this.isClassTeacher && this.teacherClass) {
            setTimeout(() => {
                this.updateDropdownDisplay();
            }, 50);
        }
    }

    close() {
        this.removeAttribute('open');
    }

    // Validate form and toggle Save button
    validateForm() {
        try {
            const titleInput = this.querySelector('ui-input[data-field="title"]');
            const contentInput = this.querySelector('ui-textarea[data-field="content"]');
            const targetAudienceDropdown = this.querySelector('ui-search-dropdown[data-field="target_audience"]');
            const targetClassDropdown = this.querySelector('ui-search-dropdown[data-field="target_class_id"]');
            const saveBtn = this.querySelector('#save-announcement-btn');
            
            const title = titleInput ? String(titleInput.value || '').trim() : '';
            const content = contentInput ? String(contentInput.value || '').trim() : '';
            const targetAudience = targetAudienceDropdown ? targetAudienceDropdown.value : '';
            const targetClass = targetClassDropdown ? targetClassDropdown.value : '';
            
            let isValid = !!title && !!content && !!targetAudience;
            
            // Check if teacher has assignments
            if (!this.teacherClass && !this.teacherAssignments) {
                isValid = false; // No assignments, cannot create announcements
            } else if (targetAudience === 'specific_class') {
                isValid = isValid && !!targetClass;
            } else if (targetAudience === 'students' && !this.isClassTeacher) {
                // Only class teachers can target students only
                isValid = false;
            }
            
            if (saveBtn) {
                if (isValid) {
                    saveBtn.removeAttribute('disabled');
                } else {
                    saveBtn.setAttribute('disabled', '');
                }
            }
        } catch (_) { /* noop */ }
    }

    // Wire events for live validation and save
    addFormEventListeners() {
        const titleInput = this.querySelector('ui-input[data-field="title"]');
        const contentInput = this.querySelector('ui-textarea[data-field="content"]');
        const targetAudienceDropdown = this.querySelector('ui-search-dropdown[data-field="target_audience"]');
        const targetClassField = this.querySelector('#target-class-field');
        const saveBtn = this.querySelector('#save-announcement-btn');

        if (titleInput) {
            titleInput.addEventListener('input', () => this.validateForm());
            titleInput.addEventListener('change', () => this.validateForm());
        }
        if (contentInput) {
            contentInput.addEventListener('input', () => this.validateForm());
            contentInput.addEventListener('change', () => this.validateForm());
        }
        if (targetAudienceDropdown) {
            targetAudienceDropdown.addEventListener('change', (e) => {
                this.handleTargetAudienceChange(e);
                this.validateForm();
            });
        }

        // Add event listener for target class dropdown when it becomes available
        this.addEventListener('change', (e) => {
            if (e.target.matches('ui-search-dropdown[data-field="target_class_id"]')) {
                this.validateForm();
            }
        });

        // Add event listeners for search dropdowns
        this.addEventListener('change', (e) => {
            if (e.target.matches('ui-search-dropdown[data-field="announcement_type"]')) {
                this.validateForm();
            }
        });
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveAnnouncement());
        }

        // Initial validation state
        this.validateForm();
    }

    // Load teacher's assignments (both class and subject assignments)
    async loadTeacherAssignments() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            // First try to get if teacher is a class teacher
            const classResponse = await api.withToken(token).get('/teachers/my-class');
            
            if (classResponse.data.success && classResponse.data.data) {
                // Teacher is a class teacher
                this.teacherClass = classResponse.data.data;
                this.isClassTeacher = true;
                this.populateClassDropdown([this.teacherClass]);
                this.setDefaultTargetAudience();
            } else {
                // Teacher is not a class teacher, check for subject assignments
                const assignmentsResponse = await api.withToken(token).get('/teachers/my-assignments');
                
                if (assignmentsResponse.data.success && assignmentsResponse.data.data && assignmentsResponse.data.data.assignments) {
                    this.teacherAssignments = assignmentsResponse.data.data.assignments;
                    this.isClassTeacher = false;
                    this.populateClassDropdown(this.teacherAssignments);
                    this.setDefaultTargetAudience();
                } else {
                    // No assignments at all
                    this.showNoAssignmentsMessage();
                }
            }
        } catch (error) {
            console.error('Error loading teacher assignments:', error);
            Toast.show({
                title: 'Error',
                message: 'Failed to load your teaching assignments',
                variant: 'error',
                duration: 3000
            });
        }
    }

    // Show message when teacher has no assignments
    showNoAssignmentsMessage() {
        const targetClassField = this.querySelector('#target-class-field');
        if (targetClassField) {
            targetClassField.innerHTML = `
                <div class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div class="flex items-center">
                        <i class="fas fa-exclamation-triangle text-yellow-600 mr-2"></i>
                        <div>
                            <p class="text-sm font-medium text-yellow-800">No Teaching Assignments</p>
                            <p class="text-xs text-yellow-700 mt-1">You don't have any classes or subjects assigned to you yet.</p>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Disable the save button
        const saveBtn = this.querySelector('#save-announcement-btn');
        if (saveBtn) {
            saveBtn.setAttribute('disabled', '');
        }
    }

    // Set default target audience based on teacher type
    setDefaultTargetAudience() {
        const targetAudienceDropdown = this.querySelector('ui-search-dropdown[data-field="target_audience"]');
        if (targetAudienceDropdown) {
            if (this.isClassTeacher) {
                // Class teacher can target their assigned class
                targetAudienceDropdown.value = 'specific_class';
                this.showTargetClassField();
                this.updateHelpText('class');
                this.updateTargetAudienceOptions('class');
            } else if (this.teacherAssignments && this.teacherAssignments.length > 0) {
                // Subject teacher can target classes where they teach
                targetAudienceDropdown.value = 'specific_class';
                this.showTargetClassField();
                this.updateHelpText('subject');
                this.updateTargetAudienceOptions('subject');
            }
        }
    }

    // Update help text based on teacher type
    updateHelpText(teacherType) {
        const helpText = this.querySelector('#class-help-text');
        if (helpText) {
            if (teacherType === 'class') {
                helpText.textContent = 'This is automatically set to your assigned class';
            } else if (teacherType === 'subject') {
                helpText.textContent = 'Where you teach subjects to target announcements';
            }
        }
    }

    // Update target audience options based on teacher type
    updateTargetAudienceOptions(teacherType) {
        const targetAudienceDropdown = this.querySelector('ui-search-dropdown[data-field="target_audience"]');
        if (!targetAudienceDropdown) return;

        // Clear existing options
        targetAudienceDropdown.innerHTML = '';

        if (teacherType === 'class') {
            // Class teacher can target both students and class members
            const studentsOption = document.createElement('ui-option');
            studentsOption.setAttribute('value', 'students');
            studentsOption.textContent = 'Students Only';
            targetAudienceDropdown.appendChild(studentsOption);

            const classMembersOption = document.createElement('ui-option');
            classMembersOption.setAttribute('value', 'specific_class');
            classMembersOption.textContent = 'Class Members';
            targetAudienceDropdown.appendChild(classMembersOption);
        } else if (teacherType === 'subject') {
            // Subject teacher can only target class members (must select specific class)
            const classMembersOption = document.createElement('ui-option');
            classMembersOption.setAttribute('value', 'specific_class');
            classMembersOption.textContent = 'Class Members';
            targetAudienceDropdown.appendChild(classMembersOption);
        }

        // Set the default value
        targetAudienceDropdown.value = 'specific_class';
    }

    // Show target class field and populate with teacher's class
    showTargetClassField() {
        const targetClassField = this.querySelector('#target-class-field');
        if (targetClassField) {
            targetClassField.classList.remove('hidden');
        }
    }

    // Handle target audience change to show/hide target class field
    async handleTargetAudienceChange(event) {
        const targetAudience = event.target.value;
        const targetClassField = this.querySelector('#target-class-field');
        
        if (targetClassField) {
            if (targetAudience === 'specific_class') {
                targetClassField.classList.remove('hidden');
                // If we don't have assignments loaded yet, load them
                if (!this.teacherClass && !this.teacherAssignments) {
                    await this.loadTeacherAssignments();
                }
            } else {
                targetClassField.classList.add('hidden');
            }
        }
    }



    // Populate the class dropdown with available classes
    populateClassDropdown(classes) {
        const classDropdown = this.querySelector('ui-search-dropdown[data-field="target_class_id"]');
        if (!classDropdown) return;

        // Clear existing options
        classDropdown.innerHTML = '';

        if (this.isClassTeacher) {
            // For class teacher, show their assigned class
            const classItem = classes[0]; // Should only be one class
            const option = document.createElement('ui-option');
            option.setAttribute('value', classItem.class_id);
            option.textContent = `${classItem.class_name} (${classItem.class_section})`;
            classDropdown.appendChild(option);
            
            // Automatically select the class
            classDropdown.value = classItem.class_id;
            classDropdown.disabled = true; // Cannot change for class teacher
            
            // Force the dropdown to display the selected option's text
            this.updateDropdownDisplay();
        } else if (this.teacherAssignments) {
            // For subject teacher, show all classes where they teach subjects
            classes.forEach(assignment => {
                const option = document.createElement('ui-option');
                option.setAttribute('value', assignment.class_id);
                option.textContent = `${assignment.class_name} (${assignment.class_section})`;
                classDropdown.appendChild(option);
            });
            
            // Enable selection for subject teacher
            classDropdown.disabled = false;
            
            // Auto-select first class if available
            if (classes.length === 1) {
                classDropdown.value = classes[0].class_id;
                this.updateDropdownDisplay();
            }
        }

        // Trigger validation
        this.validateForm();
    }

    // Update dropdown display to show the correct text
    updateDropdownDisplay() {
        const classDropdown = this.querySelector('ui-search-dropdown[data-field="target_class_id"]');
        if (!classDropdown) return;

        if (this.isClassTeacher && this.teacherClass) {
            // For class teacher, ensure the display shows the class name, not the ID
            const expectedText = `${this.teacherClass.class_name} (${this.teacherClass.class_section})`;
            
            // Update the placeholder to show the selected text
            classDropdown.setAttribute('placeholder', expectedText);
        }
    }

    // Save the new announcement using teacher API
    async saveAnnouncement() {
        try {
            // Get form data using the data-field attributes for reliable selection
            const titleInput = this.querySelector('ui-input[data-field="title"]');
            const contentInput = this.querySelector('ui-textarea[data-field="content"]');
            const targetAudienceDropdown = this.querySelector('ui-search-dropdown[data-field="target_audience"]');
            const announcementTypeDropdown = this.querySelector('ui-search-dropdown[data-field="announcement_type"]');
            const priorityDropdown = this.querySelector('ui-dropdown[data-field="priority"]');
            const isActiveSwitch = this.querySelector('ui-switch[name="is_active"]');
            const isPinnedSwitch = this.querySelector('ui-switch[name="is_pinned"]');

            const targetClassDropdown = this.querySelector('ui-search-dropdown[data-field="target_class_id"]');
            
            const announcementData = {
                title: titleInput ? titleInput.value : '',
                content: contentInput ? contentInput.value : '',
                target_audience: targetAudienceDropdown ? targetAudienceDropdown.value : 'specific_class',
                announcement_type: announcementTypeDropdown ? announcementTypeDropdown.value : 'general',
                priority: priorityDropdown ? priorityDropdown.value : 'normal',
                is_active: isActiveSwitch ? (isActiveSwitch.checked ? 1 : 0) : 1,
                is_pinned: isPinnedSwitch ? (isPinnedSwitch.checked ? 1 : 0) : 0
            };

            // Set target_class_id based on teacher type and target audience
            const targetAudience = targetAudienceDropdown ? targetAudienceDropdown.value : 'specific_class';
            
            if (targetAudience === 'students') {
                // Students only - must be class teacher with assigned class
                if (this.isClassTeacher && this.teacherClass) {
                    announcementData.target_class_id = this.teacherClass.class_id;
                } else {
                    Toast.show({
                        title: 'Validation Error',
                        message: 'Only class teachers can target students only',
                        variant: 'error',
                        duration: 3000
                    });
                    return;
                }
            } else if (targetAudience === 'specific_class') {
                // Class members - can be either class teacher or subject teacher
                if (this.isClassTeacher && this.teacherClass) {
                    announcementData.target_class_id = this.teacherClass.class_id;
                } else if (this.teacherAssignments && targetClassDropdown) {
                    announcementData.target_class_id = targetClassDropdown.value;
                }
            }

            // Validate required fields
            if (!announcementData.title) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please fill in the announcement title',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            if (!announcementData.content) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please fill in the announcement content',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Validate target_class_id
            if (!announcementData.target_class_id) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please select a target class',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Get auth token
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Please log in to create announcements',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Create announcement using teacher API endpoint
            const response = await api.withToken(token).post('/teacher/announcements', announcementData);
            
            // Check if announcement was created successfully
            if (response.status === 201 || response.data.success) {
                Toast.show({
                    title: 'Success',
                    message: 'Announcement created successfully',
                    variant: 'success',
                    duration: 3000
                });

                // Get the newly created announcement with full details from the API
                try {
                    const announcementResponse = await api.withToken(token).get(`/teacher/announcements/${response.data.data.id}`);
                    if (announcementResponse.data.success) {
                        const newAnnouncement = announcementResponse.data.data;
                        
                        // Close modal and dispatch event
                        this.close();
                        this.dispatchEvent(new CustomEvent('announcement-saved', {
                            detail: { announcement: newAnnouncement },
                            bubbles: true,
                            composed: true
                        }));
                    } else {
                        throw new Error('Failed to fetch announcement details');
                    }
                } catch (fetchError) {
                    console.error('Error fetching announcement details:', fetchError);
                    
                    // Fallback: construct basic announcement data
                    const newAnnouncement = {
                        id: response.data.data.id,
                        title: announcementData.title,
                        content: announcementData.content,
                        target_audience: announcementData.target_audience,
                        announcement_type: announcementData.announcement_type,
                        priority: announcementData.priority,
                        is_active: announcementData.is_active,
                        is_pinned: announcementData.is_pinned,
                        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
                        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
                        creator_name: 'Unknown' // Will be updated when data is refreshed
                    };
                    
                    // Close modal and dispatch event
                    this.close();
                    this.dispatchEvent(new CustomEvent('announcement-saved', {
                        detail: { announcement: newAnnouncement },
                        bubbles: true,
                        composed: true
                    }));
                }
            } else {
                throw new Error(response.data.message || 'Failed to create announcement');
            }

        } catch (error) {
            console.error('❌ Error saving announcement:', error);
            
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to create announcement',
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
                close-button="true">
                <div slot="title">Add New Announcement</div>
                <form id="announcement-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Title <span class="text-red-500">*</span></label>
                        <ui-input 
                            data-field="title"
                            type="text" 
                            placeholder="Enter announcement title"
                            class="w-full">
                        </ui-input>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Content <span class="text-red-500">*</span></label>
                        <ui-textarea 
                            data-field="content"
                            placeholder="Enter announcement content"
                            rows="4"
                            class="w-full">
                        </ui-textarea>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Target Audience <span class="text-red-500">*</span></label>
                        <ui-search-dropdown data-field="target_audience" value="specific_class" placeholder="Loading target audience options...">
                            <ui-option value="">Loading...</ui-option>
                            <!-- Options will be set dynamically based on teacher type -->
                        </ui-search-dropdown>
                    </div>
                    
                    <!-- Target Class Field -->
                    <div id="target-class-field">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Target Class <span class="text-red-500">*</span></label>
                        <ui-search-dropdown data-field="target_class_id" value="" placeholder="Select class">
                            <ui-option value="">Loading...</ui-option>
                            <!-- Classes will be loaded dynamically -->
                        </ui-search-dropdown>
                        <p class="text-sm text-gray-500 mt-1" id="class-help-text">Loading...</p>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Announcement Type <span class="text-red-500">*</span></label>
                        <ui-search-dropdown data-field="announcement_type" value="general" placeholder="Search announcement type...">
                            <ui-option value="general">General</ui-option>
                            <ui-option value="academic">Academic</ui-option>
                            <ui-option value="event">Event</ui-option>
                            <ui-option value="reminder">Reminder</ui-option>
                            <ui-option value="emergency">Emergency</ui-option>
                            <ui-option value="financial">Financial</ui-option>
                            <ui-option value="payment">Payment</ui-option>
                            <ui-option value="fee">Fee</ui-option>
                            <ui-option value="billing">Billing</ui-option>
                        </ui-search-dropdown>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Priority <span class="text-red-500">*</span></label>
                        <ui-dropdown data-field="priority" value="normal">
                            <ui-option value="low">Low</ui-option>
                            <ui-option value="normal">Normal</ui-option>
                            <ui-option value="high">High</ui-option>
                            <ui-option value="urgent">Urgent</ui-option>
                        </ui-dropdown>
                    </div>
                    
                    <div class="flex items-center justify-between">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Active Status</label>
                            <ui-switch 
                                name="is_active"
                                checked
                                class="w-full">
                                <span slot="label">Active</span>
                            </ui-switch>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Pin Announcement</label>
                            <ui-switch 
                                name="is_pinned"
                                class="w-full">
                                <span slot="label">Pinned</span>
                            </ui-switch>
                        </div>
                    </div>
                </form>

                <!-- How this works (bottom) -->
                <div class="mt-4 p-3 rounded-md bg-blue-50 border border-blue-100 text-blue-800 text-sm">
                    <div class="flex items-start space-x-2">
                        <i class="fas fa-info-circle mt-0.5"></i>
                        <div>
                            <p class="font-medium">How this works</p>
                            <ul class="list-disc pl-5 mt-1 space-y-1">
                                <li><strong>Title</strong>: Clear, concise title for the announcement.</li>
                                <li><strong>Content</strong>: Detailed information about the announcement.</li>
                                <li><strong>Target Audience</strong>: Who should see this announcement (varies by teacher type).</li>
                                <li><strong>Target Class</strong>: Select from your teaching assignments (e.g., JHS (A), JHS (B)).</li>
                                <li><strong>Type</strong>: Categorizes the announcement for better organization.</li>
                                <li><strong>Priority</strong>: Sets importance level (urgent announcements are highlighted).</li>
                                <li><strong>Active</strong>: Only active announcements are visible to users.</li>
                                <li><strong>Pinned</strong>: Pinned announcements appear at the top of lists.</li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div slot="footer" class="flex items-center justify-end gap-2">
                    <ui-button variant="outline" color="secondary" modal-action="cancel">Cancel</ui-button>
                    <ui-button id="save-announcement-btn" color="primary" disabled>Save</ui-button>
                </div>
            </ui-modal>
        `;

        // Attach form events and initialize validation
        this.addFormEventListeners();
    }
}

customElements.define('teacher-announcement-add-modal', TeacherAnnouncementAddModal);
export default TeacherAnnouncementAddModal;
