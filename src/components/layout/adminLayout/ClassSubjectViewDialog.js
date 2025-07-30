import '@/components/ui/Dialog.js';
import '@/components/ui/Badge.js';

/**
 * Class Subject View Dialog Component
 * 
 * Dialog for viewing class subject assignment details
 */
class ClassSubjectViewDialog extends HTMLElement {
    constructor() {
        super();
        this.classSubjectData = null;
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // No additional event listeners needed for view dialog
    }

    setClassSubjectData(classSubject) {
        this.classSubjectData = classSubject;
        this.render();
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    }

    close() {
        this.removeAttribute('open');
    }

    render() {
        const classSubject = this.classSubjectData;
        
        if (!classSubject) {
            this.innerHTML = `
                <ui-dialog 
                    ${this.hasAttribute('open') ? 'open' : ''} 
                    title="Class Subject Assignment Details">
                    <div slot="content">
                        <p class="text-gray-500">No data to display</p>
                    </div>
                </ui-dialog>
            `;
            return;
        }

        this.innerHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                title="Class Subject Assignment Details">
                <div slot="content">
                    <div class="space-y-6">
                        <!-- Assignment Information -->
                        <div class="bg-gray-50 rounded-lg p-4">
                            <h3 class="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                <svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                                Assignment Information
                            </h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="text-sm font-medium text-gray-600">Assignment ID</label>
                                    <p class="text-gray-900">${classSubject.id}</p>
                                </div>
                                <div>
                                    <label class="text-sm font-medium text-gray-600">Academic Year</label>
                                    <p class="text-gray-900">${classSubject.academic_year || 'N/A'}</p>
                                </div>
                                <div>
                                    <label class="text-sm font-medium text-gray-600">Term</label>
                                    <p class="text-gray-900">${classSubject.term ? classSubject.term.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A'}</p>
                                </div>
                                <div>
                                    <label class="text-sm font-medium text-gray-600">Teaching Hours</label>
                                    <p class="text-gray-900">${classSubject.teaching_hours || 0} hours</p>
                                </div>
                            </div>
                        </div>

                        <!-- Class Information -->
                        <div class="bg-blue-50 rounded-lg p-4">
                            <h3 class="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                <svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                                </svg>
                                Class Information
                            </h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="text-sm font-medium text-gray-600">Class Name</label>
                                    <p class="text-gray-900">${classSubject.class_name || 'N/A'}</p>
                                </div>
                                <div>
                                    <label class="text-sm font-medium text-gray-600">Section</label>
                                    <p class="text-gray-900">${classSubject.class_section || 'N/A'}</p>
                                </div>
                                <div class="md:col-span-2">
                                    <label class="text-sm font-medium text-gray-600">Full Class</label>
                                    <p class="text-gray-900">${classSubject.class_name && classSubject.class_section ? `${classSubject.class_name} - ${classSubject.class_section}` : 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Subject Information -->
                        <div class="bg-green-50 rounded-lg p-4">
                            <h3 class="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                <svg class="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 5.477 5.754 5 7.5 5s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 5.477 19.246 5 17.5 5c-1.746 0-3.332.477-4.5 1.253"></path>
                                </svg>
                                Subject Information
                            </h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="text-sm font-medium text-gray-600">Subject Name</label>
                                    <p class="text-gray-900">${classSubject.subject_name || 'N/A'}</p>
                                </div>
                                <div>
                                    <label class="text-sm font-medium text-gray-600">Subject Code</label>
                                    <p class="text-gray-900">${classSubject.subject_code || 'N/A'}</p>
                                </div>
                                <div class="md:col-span-2">
                                    <label class="text-sm font-medium text-gray-600">Full Subject</label>
                                    <p class="text-gray-900">${classSubject.subject_name && classSubject.subject_code ? `${classSubject.subject_name} (${classSubject.subject_code})` : 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Timestamps -->
                        <div class="bg-gray-50 rounded-lg p-4">
                            <h3 class="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                <svg class="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                Timestamps
                            </h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="text-sm font-medium text-gray-600">Created At</label>
                                    <p class="text-gray-900">${this.formatDate(classSubject.created_at)}</p>
                                </div>
                                <div>
                                    <label class="text-sm font-medium text-gray-600">Updated At</label>
                                    <p class="text-gray-900">${this.formatDate(classSubject.updated_at)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('class-subject-view-dialog', ClassSubjectViewDialog);
export default ClassSubjectViewDialog; 