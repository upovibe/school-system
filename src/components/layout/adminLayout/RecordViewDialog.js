import '@/components/ui/Dialog.js';
import '@/components/ui/Button.js';
import '@/components/ui/Toast.js';

/**
 * Record View Dialog Component
 * 
 * Displays detailed information about an archived academic year record
 */
class RecordViewDialog extends HTMLElement {
    constructor() {
        super();
        this.recordData = null;
        this.loading = false;
    }

    connectedCallback() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for close events from the dialog
        this.addEventListener('close', () => {
            this.close();
        });
        
        this.addEventListener('cancel', () => {
            this.close();
        });
    }

    setRecordData(recordData) {
        this.recordData = recordData;
        this.render();
    }

    open() {
        this.setAttribute('open', '');
    }

    close() {
        this.removeAttribute('open');
    }

    formatRecordData(data) {
        if (!data) return {};
        
        try {
            // If record_data is a string, parse it
            if (typeof data === 'string') {
                return JSON.parse(data);
            }
            // If it's already an object, return as is
            return data;
        } catch (e) {
            console.error('Error parsing record data:', e);
            return {};
        }
    }

    formatCount(data) {
        if (!data) return 0;
        if (Array.isArray(data)) return data.length;
        return 0;
    }

    formatRecordType(recordType) {
        if (!recordType) return '—';
        
        // Convert snake_case to Title Case
        return recordType
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    render() {
        if (!this.recordData) {
            this.innerHTML = '';
            return;
        }

        const recordData = this.formatRecordData(this.recordData.record_data);
        
        this.innerHTML = `
            <ui-dialog ${this.hasAttribute('open') ? 'open' : ''} variant="info" size="large">
                <div slot="header" class="flex items-center">
                    <i class="fas fa-archive text-blue-500 mr-2"></i>
                    <span class="font-semibold">Academic Year Record Details</span>
                </div>
                
                <div slot="content" class="space-y-5 p-2">
                    <!-- Record Information -->
                    <div class="border-b pb-4">
                        <div class="flex items-center gap-2 mb-2">
                            <i class="fas fa-calendar-alt text-blue-500"></i>
                            <h4 class="text-md font-semibold text-gray-800">Record Information</h4>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div class="bg-gray-50 p-3 rounded-lg">
                                <label class="block text-xs font-medium text-gray-600 mb-1">Year Code</label>
                                <p class="text-gray-900 text-sm font-medium">${this.recordData.year_code}</p>
                            </div>
                            <div class="bg-gray-50 p-3 rounded-lg">
                                <label class="block text-xs font-medium text-gray-600 mb-1">Record Type</label>
                                <p class="text-gray-900 text-sm font-medium">${this.formatRecordType(this.recordData.record_type)}</p>
                            </div>
                            <div class="bg-gray-50 p-3 rounded-lg">
                                <label class="block text-xs font-medium text-gray-600 mb-1">Total Records</label>
                                <p class="text-gray-900 text-sm font-medium">${this.recordData.total_records}</p>
                            </div>
                            <div class="bg-gray-50 p-3 rounded-lg">
                                <label class="block text-xs font-medium text-gray-600 mb-1">Archive Date</label>
                                <p class="text-gray-900 text-sm font-medium">${new Date(this.recordData.archive_date).toLocaleDateString()}</p>
                            </div>
                            <div class="bg-gray-50 p-3 rounded-lg">
                                <label class="block text-xs font-medium text-gray-600 mb-1">Archived By</label>
                                <p class="text-gray-900 text-sm font-medium">${this.recordData.archived_by_name || 'System'}</p>
                            </div>
                            <div class="bg-gray-50 p-3 rounded-lg">
                                <label class="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                                <p class="text-gray-900 text-sm font-medium">${this.recordData.notes || '—'}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Data Summary -->
                    <div class="border-b pb-4">
                        <div class="flex items-center gap-2 mb-2">
                            <i class="fas fa-chart-pie text-green-500"></i>
                            <h4 class="text-md font-semibold text-gray-800">Data Summary</h4>
                        </div>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div class="bg-blue-50 p-3 rounded-lg text-center">
                                <div class="text-2xl font-bold text-blue-600">${this.formatCount(recordData.classes)}</div>
                                <div class="text-xs text-blue-600">Classes</div>
                            </div>
                            <div class="bg-green-50 p-3 rounded-lg text-center">
                                <div class="text-2xl font-bold text-green-600">${this.formatCount(recordData.students)}</div>
                                <div class="text-xs text-green-600">Students</div>
                            </div>
                            <div class="bg-purple-50 p-3 rounded-lg text-center">
                                <div class="text-2xl font-bold text-purple-600">${this.formatCount(recordData.teachers)}</div>
                                <div class="text-xs text-purple-600">Teachers</div>
                            </div>
                            <div class="bg-orange-50 p-3 rounded-lg text-center">
                                <div class="text-2xl font-bold text-orange-600">${this.formatCount(recordData.subjects)}</div>
                                <div class="text-xs text-orange-600">Subjects</div>
                            </div>
                        </div>
                    </div>

                    <!-- Detailed Information -->
                    <div class="border-b pb-4">
                        <div class="flex items-center gap-2 mb-2">
                            <i class="fas fa-list-alt text-purple-500"></i>
                            <h4 class="text-md font-semibold text-gray-800">Detailed Information</h4>
                        </div>
                        
                        <!-- Classes Section -->
                        ${recordData.classes && recordData.classes.length > 0 ? `
                            <div class="mb-4">
                                <h5 class="text-sm font-medium text-gray-700 mb-2">Classes (${recordData.classes.length})</h5>
                                <div class="space-y-2 max-h-32 overflow-y-auto">
                                    ${recordData.classes.map(cls => `
                                        <div class="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                                            <span class="font-medium text-gray-900">${cls.name} ${cls.section ? `(${cls.section})` : ''}</span>
                                            <span class="text-gray-600">${cls.student_count || 0} students</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        <!-- Students Section -->
                        ${recordData.students && recordData.students.length > 0 ? `
                            <div class="mb-4">
                                <h5 class="text-sm font-medium text-gray-700 mb-2">Students (${recordData.students.length})</h5>
                                <div class="space-y-2 max-h-32 overflow-y-auto">
                                    ${recordData.students.map(student => `
                                        <div class="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                                            <span class="font-medium text-gray-900">${student.student_id} - ${student.first_name} ${student.last_name}</span>
                                            <span class="text-gray-600">${student.class_name || 'Unknown Class'}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        <!-- Teachers Section -->
                        ${recordData.teachers && recordData.teachers.length > 0 ? `
                            <div class="mb-4">
                                <h5 class="text-sm font-medium text-gray-700 mb-2">Teachers (${recordData.teachers.length})</h5>
                                <div class="space-y-2 max-h-32 overflow-y-auto">
                                    ${recordData.teachers.map(teacher => `
                                        <div class="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                                            <span class="font-medium text-gray-900">${teacher.first_name} ${teacher.last_name}</span>
                                            <span class="text-gray-600">${teacher.email || 'No email'}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        <!-- Subjects Section -->
                        ${recordData.subjects && recordData.subjects.length > 0 ? `
                            <div class="mb-4">
                                <h5 class="text-sm font-medium text-gray-700 mb-2">Subjects (${recordData.subjects.length})</h5>
                                <div class="space-y-2 max-h-32 overflow-y-auto">
                                    ${recordData.subjects.map(subject => `
                                        <div class="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                                            <span class="font-medium text-gray-900">${subject.name}</span>
                                            <span class="text-gray-600">${subject.code || 'No code'}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        <!-- Other Data Types -->
                        ${recordData.grades && recordData.grades.length > 0 ? `
                            <div class="mb-4">
                                <h5 class="text-sm font-medium text-gray-700 mb-2">Grades (${recordData.grades.length})</h5>
                                <div class="text-sm text-gray-600 bg-gray-50 p-2 rounded">Grade records archived for historical reference</div>
                            </div>
                        ` : ''}

                        ${recordData.fees && recordData.fees.length > 0 ? `
                            <div class="mb-4">
                                <h5 class="text-sm font-medium text-gray-700 mb-2">Fees (${recordData.fees.length})</h5>
                                <div class="text-sm text-gray-600 bg-gray-50 p-2 rounded">Fee schedule records archived for historical reference</div>
                            </div>
                        ` : ''}

                        ${recordData.grading_periods && recordData.grading_periods.length > 0 ? `
                            <div class="mb-4">
                                <h5 class="text-sm font-medium text-gray-700 mb-2">Grading Periods (${recordData.grading_periods.length})</h5>
                                <div class="space-y-2 max-h-32 overflow-y-auto">
                                    ${recordData.grading_periods.map(period => `
                                        <div class="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                                            <span class="font-medium text-gray-900">${period.name}</span>
                                            <span class="text-gray-600">${period.start_date} - ${period.end_date}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div slot="footer" class="flex justify-end">
                    <ui-button variant="outline" color="secondary" modal-action="cancel">Close</ui-button>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('record-view-dialog', RecordViewDialog);
export default RecordViewDialog;
