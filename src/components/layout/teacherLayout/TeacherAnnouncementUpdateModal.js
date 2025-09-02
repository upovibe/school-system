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
 * Teacher Announcement Update Modal Component
 * 
 * A modal component for updating existing announcements as a teacher
 * Teachers can only update announcements they created
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - announcement-updated: Fired when an announcement is successfully updated
 * - modal-closed: Fired when modal is closed
 */
class TeacherAnnouncementUpdateModal extends HTMLElement {
    constructor() {
        super();
        this.announcementData = null;
        this.teacherClass = null;
        this.teacherAssignments = null;
        this.isClassTeacher = false;
        this.availableClasses = [];
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
        this.addFormEventListeners();
        // Remove redundant call - will be handled in setAnnouncementData
    }

    setupEventListeners() {
        // Listen for cancel button click
        this.addEventListener('cancel', () => {
            this.close();
        });
    }

    // Wire events for live validation and update
    addFormEventListeners() {
        const titleInput = this.querySelector('ui-input[data-field="title"]');
        const contentInput = this.querySelector('ui-textarea[data-field="content"]');
        const targetAudienceDropdown = this.querySelector('ui-search-dropdown[data-field="target_audience"]');
        const targetClassField = this.querySelector('#target-class-field');
        const updateBtn = this.querySelector('#update-announcement-btn');

        if (titleInput) {
            titleInput.addEventListener('input', () => {});
            titleInput.addEventListener('change', () => {});
        }
        if (contentInput) {
            contentInput.addEventListener('input', () => {});
            contentInput.addEventListener('change', () => {});
        }
        if (targetAudienceDropdown) {
            targetAudienceDropdown.addEventListener('change', (e) => {
                this.handleTargetAudienceChange(e);
            });
        }

        // Add event listener for target class dropdown when it becomes available
        this.addEventListener('change', (e) => {
            if (e.target.matches('ui-search-dropdown[data-field="target_class_id"]')) {
                // No validation needed for update modal
            }
        });

        // Add event listeners for search dropdowns
        this.addEventListener('change', (e) => {
            if (e.target.matches('ui-search-dropdown[data-field="announcement_type"]')) {
                // No validation needed for update modal
            }
        });
        if (updateBtn) {
            updateBtn.addEventListener('click', () => this.updateAnnouncement());
        }

        // Enable update button immediately for update modal
        this.validateForm();
    }

    open() {
        this.setAttribute('open', '');
    }

    close() {
        this.removeAttribute('open');
    }

    // Set announcement data for editing
    async setAnnouncementData(announcement) {
        this.announcementData = announcement;
        
        // First ensure teacher assignments are loaded
        await this.loadTeacherAssignments();
        
        // Then populate the form
        await this.populateForm();
    }

    // Populate form with existing announcement data
    async populateForm() {
        if (!this.announcementData) return;

        const titleInput = this.querySelector('ui-input[data-field="title"]');
        const contentInput = this.querySelector('ui-textarea[data-field="content"]');
        const targetAudienceDropdown = this.querySelector('ui-search-dropdown[data-field="target_audience"]');
        const announcementTypeDropdown = this.querySelector('ui-search-dropdown[data-field="announcement_type"]');
        const priorityDropdown = this.querySelector('ui-dropdown[data-field="priority"]');
        const isActiveSwitch = this.querySelector('ui-switch[name="is_active"]');
        const isPinnedSwitch = this.querySelector('ui-switch[name="is_pinned"]');

        if (titleInput) titleInput.value = this.announcementData.title || '';
        if (contentInput) contentInput.setValue(this.announcementData.content || '');
        // Don't set target audience value yet - we need to populate options first
        if (announcementTypeDropdown) announcementTypeDropdown.value = this.announcementData.announcement_type || 'general';
        if (priorityDropdown) priorityDropdown.value = this.announcementData.priority || 'normal';
        if (isActiveSwitch) {
            if (Number(this.announcementData.is_active) === 1) {
                isActiveSwitch.setAttribute('checked', '');
            } else {
                isActiveSwitch.removeAttribute('checked', '');
            }
        }
        if (isPinnedSwitch) {
            if (Number(this.announcementData.is_pinned) === 1) {
                isPinnedSwitch.setAttribute('checked', '');
            } else {
                isPinnedSwitch.removeAttribute('checked', '');
            }
        }

        // Now set the target audience options based on teacher type (after form elements are populated)
        this.setDefaultTargetAudience();
        
        // Now set the target audience value after options are populated
        if (targetAudienceDropdown) targetAudienceDropdown.value = this.announcementData.target_audience || 'all';
        
        // Handle target audience change to show/hide target class field
        this.handleTargetAudienceChange({ target: { value: this.announcementData.target_audience } });
        
        // If targeting specific class, populate the class dropdown and set the correct display value
        if (this.announcementData.target_audience === 'specific_class' && this.announcementData.target_class_id) {
            // Ensure the dropdown is fully rendered before setting value
            setTimeout(async () => {
                const targetClassDropdown = this.querySelector('ui-search-dropdown[data-field="target_class_id"]');
                if (targetClassDropdown) {
                    // Ensure we have the latest available classes
                    if (!this.availableClasses || this.availableClasses.length === 0) {
                        await this.loadAvailableClasses();
                    }
                    
                    // First, populate the dropdown with options
                    this.populateClassDropdown(this.availableClasses);
                    
                    // Then set the value - this should now display the formatted name
                    const targetOption = targetClassDropdown.querySelector(`ui-option[value="${this.announcementData.target_class_id}"]`);
                    if (targetOption) {
                        // Set the value - this should trigger the component's internal logic
                        targetClassDropdown.value = this.announcementData.target_class_id;
                        
                        // Force the component to re-render by dispatching a custom event
                        targetClassDropdown.dispatchEvent(new CustomEvent('value-changed', {
                            detail: { value: this.announcementData.target_class_id },
                            bubbles: true,
                            composed: true
                        }));
                        
                        // Also try to trigger the component's attribute change callback
                        targetClassDropdown.setAttribute('value', this.announcementData.target_class_id);
                    }
                }
            }, 150); // Increased delay for better rendering
        }
        
        // Content field is now updated using setValue() method
    }

    // Handle target audience change to show/hide target class field
    async handleTargetAudienceChange(event) {
        const targetAudience = event.target.value;
        const targetClassField = this.querySelector('#target-class-field');
        
        if (targetClassField) {
            if (targetAudience === 'specific_class') {
                targetClassField.classList.remove('hidden');
                // Load available classes when showing the field
                await this.loadAvailableClasses();
            } else {
                targetClassField.classList.add('hidden');
            }
        }
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
            } else {
                // Teacher is not a class teacher, check for subject assignments
                const assignmentsResponse = await api.withToken(token).get('/teachers/my-assignments');
                
                if (assignmentsResponse.data.success && assignmentsResponse.data.data && assignmentsResponse.data.data.assignments) {
                    this.teacherAssignments = assignmentsResponse.data.data.assignments;
                    this.isClassTeacher = false;
                } else {
                    // No assignments at all
                    this.isClassTeacher = false;
                    this.teacherAssignments = [];
                }
            }
        } catch (error) {
            // Silent error handling for better UX
        }
    }

    // Load available classes from API (for update modal)
    async loadAvailableClasses() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            // Use teacher's own assignments instead of all available classes
            if (this.isClassTeacher && this.teacherClass) {
                // Class teacher - use their assigned class
                this.availableClasses = [this.teacherClass];
                this.populateClassDropdown([this.teacherClass]);
            } else if (this.teacherAssignments && this.teacherAssignments.length > 0) {
                // Subject teacher - use classes where they teach
                this.availableClasses = this.teacherAssignments;
                this.populateClassDropdown(this.teacherAssignments);
            } else {
                // No assignments - show empty dropdown
                this.availableClasses = [];
                this.populateClassDropdown([]);
            }
        } catch (error) {
            Toast.show({
                title: 'Error',
                message: 'Failed to load available classes',
                variant: 'error',
                duration: 3000
            });
        }
    }

    // Populate the class dropdown with available classes
    populateClassDropdown(classes) {
        const classDropdown = this.querySelector('ui-search-dropdown[data-field="target_class_id"]');
        if (!classDropdown) return;

        // Clear existing options
        classDropdown.innerHTML = '';

        // Add default option
        const defaultOption = document.createElement('ui-option');
        defaultOption.setAttribute('value', '');
        defaultOption.textContent = 'Select a class...';
        classDropdown.appendChild(defaultOption);

        // Add class options with proper formatting based on teacher type
        if (this.isClassTeacher && this.teacherClass) {
            // For class teacher, show their assigned class
            const classItem = this.teacherClass;
            const option = document.createElement('ui-option');
            option.setAttribute('value', classItem.class_id);
            option.textContent = `${classItem.class_name} (${classItem.class_section})`;
            classDropdown.appendChild(option);
        } else if (this.teacherAssignments && this.teacherAssignments.length > 0) {
            // For subject teacher, show all classes where they teach subjects
            this.teacherAssignments.forEach(assignment => {
                const option = document.createElement('ui-option');
                option.setAttribute('value', assignment.class_id);
                option.textContent = `${assignment.class_name} (${assignment.class_section})`;
                classDropdown.appendChild(option);
            });
        }

        // Add change event listener (no validation needed for update modal)
        if (!classDropdown._changeHandlerAdded) {
            classDropdown.addEventListener('change', () => {
                // No validation needed for update modal
            });
            classDropdown._changeHandlerAdded = true;
        }
    }

    // Set default target audience based on teacher type
    setDefaultTargetAudience() {
        const targetAudienceDropdown = this.querySelector('ui-search-dropdown[data-field="target_audience"]');
        if (targetAudienceDropdown) {
            if (this.isClassTeacher) {
                // Class teacher can target both students and class members
                this.updateTargetAudienceOptions('class');
            } else if (this.teacherAssignments && this.teacherAssignments.length > 0) {
                // Subject teacher can target classes where they teach
                this.updateTargetAudienceOptions('subject');
            } else {
                // No assignments - show limited options only
                this.updateTargetAudienceOptions('none');
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
        } else {
            // No assignments - show general options only
            const allOption = document.createElement('ui-option');
            allOption.setAttribute('value', 'all');
            allOption.textContent = 'All Users';
            targetAudienceDropdown.appendChild(allOption);

            const teachersOption = document.createElement('ui-option');
            teachersOption.setAttribute('value', 'teachers');
            teachersOption.textContent = 'Teachers Only';
            targetAudienceDropdown.appendChild(teachersOption);
        }
    }

    // Update the announcement
    async updateAnnouncement() {
        try {
            if (!this.announcementData) {
                Toast.show({
                    title: 'Error',
                    message: 'No announcement data available for update',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

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
                target_audience: targetAudienceDropdown ? targetAudienceDropdown.value : 'all',
                announcement_type: announcementTypeDropdown ? announcementTypeDropdown.value : 'general',
                priority: priorityDropdown ? priorityDropdown.value : 'normal',
                is_active: isActiveSwitch ? (isActiveSwitch.checked ? 1 : 0) : 1,
                is_pinned: isPinnedSwitch ? (isPinnedSwitch.checked ? 1 : 0) : 0
            };

            // Add target_class_id if specific_class is selected
            if (announcementData.target_audience === 'specific_class') {
                announcementData.target_class_id = targetClassDropdown ? targetClassDropdown.value : '';
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

            // Validate target_class_id if specific_class is selected
            if (announcementData.target_audience === 'specific_class') {
                if (!announcementData.target_class_id) {
                    Toast.show({
                        title: 'Validation Error',
                        message: 'Please select a target class when targeting specific class',
                        variant: 'error',
                        duration: 3000
                    });
                    return;
                }
            }

            // Get auth token
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Please log in to update announcements',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Validate that the target class is accessible to the teacher
            if (announcementData.target_audience === 'specific_class' && announcementData.target_class_id) {
                let hasAccess = false;
                
                if (this.isClassTeacher && this.teacherClass) {
                    // Class teacher can only target their assigned class
                    hasAccess = this.teacherClass.class_id == announcementData.target_class_id;
                } else if (this.teacherAssignments && this.teacherAssignments.length > 0) {
                    // Subject teacher can target classes where they teach
                    hasAccess = this.teacherAssignments.some(assignment => {
                        const assignmentAccess = assignment.class_id == announcementData.target_class_id;
                        return assignmentAccess;
                    });
                }
                
                if (!hasAccess) {
                    Toast.show({
                        title: 'Access Denied',
                        message: 'You can only target classes you have access to',
                        variant: 'error',
                        duration: 3000
                    });
                    return;
                }
            }

            // Update announcement using teacher API endpoint
            const response = await api.withToken(token).put(`/teacher/announcements/${this.announcementData.id}`, announcementData);
            
            // Check if announcement was updated successfully
            if (response.status === 200 || response.data.success) {
                Toast.show({
                    title: 'Success',
                    message: 'Announcement updated successfully',
                    variant: 'success',
                    duration: 3000
                });

                // Construct the updated announcement data
                // Note: creator_name should remain the same - it's who created it, not who updated it
                const updatedAnnouncement = {
                    ...this.announcementData,
                    title: announcementData.title,
                    content: announcementData.content,
                    target_audience: announcementData.target_audience,
                    announcement_type: announcementData.announcement_type,
                    priority: announcementData.priority,
                    is_active: announcementData.is_active,
                    is_pinned: announcementData.is_pinned,
                    target_class_id: announcementData.target_class_id || null,
                    updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
                    // creator_name is preserved from this.announcementData
                };

                // Close modal and dispatch event
                this.close();
                this.dispatchEvent(new CustomEvent('announcement-updated', {
                    detail: { announcement: updatedAnnouncement },
                    bubbles: true,
                    composed: true
                }));
            } else {
                throw new Error(response.data.message || 'Failed to update announcement');
            }

        } catch (error) {
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to update announcement',
                variant: 'error',
                duration: 3000
            });
        }
    }

    // Validate form and toggle Update button
    validateForm() {
        // For update modal, always enable the button since fields are pre-populated
        const updateBtn = this.querySelector('#update-announcement-btn');
        if (updateBtn) {
            updateBtn.removeAttribute('disabled');
        }
    }

    render() {
        this.innerHTML = `
            <ui-modal 
                ${this.hasAttribute('open') ? 'open' : ''} 
                position="right" 
                close-button="true">
                <div slot="title">Update Announcement</div>
                <form id="announcement-update-form" class="space-y-4">
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
                        <ui-search-dropdown data-field="target_audience" value="all" placeholder="Select target audience...">
                            <!-- Options will be set dynamically based on teacher type -->
                        </ui-search-dropdown>
                    </div>
                    
                    <!-- Conditional Target Class Field -->
                    <div id="target-class-field" class="hidden">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Target Class <span class="text-red-500">*</span></label>
                        <ui-search-dropdown 
                            data-field="target_class_id" 
                            class="w-full"
                            placeholder="Select a class...">
                        </ui-search-dropdown>
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
                                <li><strong>Target Audience</strong>: Who should see this announcement.</li>
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
                    <ui-button id="update-announcement-btn" color="primary" disabled>Update</ui-button>
                </div>
            </ui-modal>
        `;
    }
}

customElements.define('teacher-announcement-update-modal', TeacherAnnouncementUpdateModal);
export default TeacherAnnouncementUpdateModal;
