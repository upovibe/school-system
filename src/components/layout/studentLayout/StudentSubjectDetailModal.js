import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Badge.js';
import '@/components/ui/Avatar.js';

/**
 * Student Subject Detail Modal Component
 * 
 * A modal component for viewing detailed subject and teacher information in the student panel
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - modal-closed: Fired when modal is closed
 */
class StudentSubjectDetailModal extends HTMLElement {
    constructor() {
        super();
        this.subjectData = null;
        this.classTeacher = null;
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for confirm button click (Close)
        this.addEventListener('confirm', () => {
            this.close();
        });
        
        // Listen for cancel button click
        this.addEventListener('cancel', () => {
            this.close();
        });
    }

    open() {
        this.setAttribute('open', '');
    }

    close() {
        this.removeAttribute('open');
        this.resetForm();
    }

    // Reset form to initial state
    resetForm() {
        this.subjectData = null;
        this.render();
    }

    // Set subject data for viewing (optionally pass classTeacher for fallback)
    setSubjectData(subjectData, classTeacher = null) {
        this.subjectData = { ...subjectData };
        this.classTeacher = classTeacher ? { ...classTeacher } : null;
        this.render();
    }

    // Get category badge
    getCategoryBadge(category) {
        const color = category === 'core' ? 'primary' : category === 'elective' ? 'success' : 'secondary';
        const text = category === 'core' ? 'Core' : category === 'elective' ? 'Elective' : 'Optional';
        return `<ui-badge color="${color}">${text}</ui-badge>`;
    }

    // Get teacher title
    getTeacherTitle(gender) {
        return gender === 'female' ? 'Madam' : 'Sir';
    }

    // Format date for display
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    }

    render() {
        this.innerHTML = `
            <ui-modal 
                ${this.hasAttribute('open') ? 'open' : ''} 
                position="right" 
                size="lg"
                close-button="true">
                <div slot="title">Subject Details</div>
                
                <div>
                    ${this.subjectData ? `
                        <!-- Subject Header -->
                        <div class="flex items-center gap-4 border-b pb-4">
                            <div class="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
                                <i class="fas fa-book text-blue-600 text-2xl"></i>
                            </div>
                            <div class="flex-1">
                                <h3 class="text-xl font-semibold text-gray-900">
                                    ${this.subjectData.subject_name || 'N/A'}
                                </h3>
                                <p class="text-gray-600">Code: ${this.subjectData.subject_code || 'N/A'}</p>
                                ${this.getCategoryBadge(this.subjectData.subject_category)}
                            </div>
                        </div>

                        <!-- Subject Information -->
                        <div class="border-b pb-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-info-circle text-blue-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Subject Information</h4>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-book mr-1"></i>Subject Name
                                    </label>
                                    <p class="text-gray-900 text-sm font-medium">${this.subjectData.subject_name || 'N/A'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-hashtag mr-1"></i>Subject Code
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.subjectData.subject_code || 'N/A'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-tag mr-1"></i>Category
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.subjectData.subject_category === 'core' ? 'Core Subject' : this.subjectData.subject_category === 'elective' ? 'Elective Subject' : 'Optional Subject'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-calendar mr-1"></i>Term
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.subjectData.term || 'Full Year'}</p>
                                </div>
                                ${this.subjectData.description ? `
                                    <div class="bg-gray-50 p-3 rounded-lg md:col-span-2">
                                        <label class="block text-sm font-medium text-gray-700 mb-1">
                                            <i class="fas fa-align-left mr-1"></i>Description
                                        </label>
                                        <p class="text-gray-900 text-sm leading-relaxed">${this.subjectData.description}</p>
                                    </div>
                                ` : ''}
                            </div>
                        </div>

                        <!-- Teacher Information -->
                         ${this.subjectData.teacher || this.classTeacher ? `
                             <div class="border-b pb-4">
                                 <div class="flex items-center gap-2 mb-3">
                                     <i class="fas fa-chalkboard-teacher text-green-500"></i>
                                     <h4 class="text-md font-semibold text-gray-800">Teacher Information</h4>
                                 </div>
                                 <div class="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
                                     <ui-avatar 
                                         size="lg" 
                                          src="${(this.subjectData.teacher && this.subjectData.teacher.profile_image) || ''}"
                                          alt="${(this.subjectData.teacher?.name) || (this.classTeacher?.name) || 'Teacher'}"
                                          name="${(this.subjectData.teacher?.name) || (this.classTeacher?.name) || 'Teacher'}">
                                     </ui-avatar>
                                     <div class="flex-1">
                                         <h5 class="text-lg font-semibold text-gray-900">
                                             ${this.getTeacherTitle((this.subjectData.teacher?.gender) || (this.classTeacher?.gender))} ${(this.subjectData.teacher?.name) || (this.classTeacher?.name)}
                                         </h5>
                                         ${this.subjectData.teacher?.specialization ? `<p class=\"text-gray-600 text-sm\">${this.subjectData.teacher.specialization}</p>` : (this.classTeacher?.email ? `<p class=\"text-gray-600 text-sm\">${this.classTeacher.email}</p>` : '')}
                                     </div>
                                 </div>
                             </div>
                        ` : `
                            <div class="border-b pb-4">
                                <div class="flex items-center gap-2 mb-3">
                                    <i class="fas fa-chalkboard-teacher text-gray-400"></i>
                                    <h4 class="text-md font-semibold text-gray-800">Teacher Information</h4>
                                </div>
                                <div class="bg-gray-50 p-4 rounded-lg text-center">
                                    <i class="fas fa-user-slash text-gray-400 text-3xl mb-2"></i>
                                    <p class="text-gray-600">No teacher assigned to this subject yet.</p>
                                </div>
                            </div>
                        `}

                        
                    ` : `
                        <div class="text-center py-8">
                            <p class="text-gray-500">No subject data available</p>
                        </div>
                    `}
                </div>
            </ui-modal>
        `;
    }
}

customElements.define('student-subject-detail-modal', StudentSubjectDetailModal);
export default StudentSubjectDetailModal; 