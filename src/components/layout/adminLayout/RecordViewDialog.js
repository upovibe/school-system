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
                
                <div slot="content" class="space-y-6">
                    <!-- Basic Record Information -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                            <label class="text-sm font-medium text-gray-600">Year Code:</label>
                            <p class="text-lg font-semibold text-gray-900">${this.recordData.year_code}</p>
                        </div>
                        <div>
                            <label class="text-sm font-medium text-gray-600">Record Type:</label>
                            <p class="text-lg font-semibold text-gray-900">${this.recordData.record_type}</p>
                        </div>
                        <div>
                            <label class="text-sm font-medium text-gray-600">Total Records:</label>
                            <p class="text-lg font-semibold text-gray-900">${this.recordData.total_records}</p>
                        </div>
                        <div>
                            <label class="text-sm font-medium text-gray-600">Archive Date:</label>
                            <p class="text-lg font-semibold text-gray-900">${new Date(this.recordData.archive_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <label class="text-sm font-medium text-gray-600">Archived By:</label>
                            <p class="text-lg font-semibold text-gray-900">${this.recordData.archived_by_name || 'System'}</p>
                        </div>
                        <div>
                            <label class="text-sm font-medium text-gray-600">Notes:</label>
                            <p class="text-lg font-semibold text-gray-900">${this.recordData.notes || '—'}</p>
                        </div>
                    </div>

                    <!-- Data Summary -->
                    <div class="space-y-4">
                        <h3 class="text-lg font-semibold text-gray-900 border-b pb-2">Data Summary</h3>
                        
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div class="text-center p-3 bg-blue-50 rounded-lg">
                                <div class="text-2xl font-bold text-blue-600">${this.formatCount(recordData.classes)}</div>
                                <div class="text-sm text-gray-600">Classes</div>
                            </div>
                            <div class="text-center p-3 bg-green-50 rounded-lg">
                                <div class="text-2xl font-bold text-green-600">${this.formatCount(recordData.students)}</div>
                                <div class="text-sm text-gray-600">Students</div>
                            </div>
                            <div class="text-center p-3 bg-purple-50 rounded-lg">
                                <div class="text-2xl font-bold text-purple-600">${this.formatCount(recordData.teachers)}</div>
                                <div class="text-sm text-gray-600">Teachers</div>
                            </div>
                            <div class="text-center p-3 bg-orange-50 rounded-lg">
                                <div class="text-2xl font-bold text-orange-600">${this.formatCount(recordData.subjects)}</div>
                                <div class="text-sm text-gray-600">Subjects</div>
                            </div>
                        </div>
                    </div>

                    <!-- Detailed Data Sections -->
                    <div class="space-y-4">
                        <h3 class="text-lg font-semibold text-gray-900 border-b pb-2">Detailed Information</h3>
                        
                        <!-- Classes Section -->
                        ${recordData.classes && recordData.classes.length > 0 ? `
                            <div class="border rounded-lg p-4">
                                <h4 class="font-medium text-gray-900 mb-3">Classes (${recordData.classes.length})</h4>
                                <div class="space-y-2 max-h-40 overflow-y-auto">
                                    ${recordData.classes.map(cls => `
                                        <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
                                            <span class="font-medium">${cls.name} ${cls.section ? `(${cls.section})` : ''}</span>
                                            <span class="text-sm text-gray-600">${cls.student_count || 0} students</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        <!-- Students Section -->
                        ${recordData.students && recordData.students.length > 0 ? `
                            <div class="border rounded-lg p-4">
                                <h4 class="font-medium text-gray-900 mb-3">Students (${recordData.students.length})</h4>
                                <div class="space-y-2 max-h-40 overflow-y-auto">
                                    ${recordData.students.map(student => `
                                        <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
                                            <span class="font-medium">${student.student_id} - ${student.first_name} ${student.last_name}</span>
                                            <span class="text-sm text-gray-600">${student.class_name || 'Unknown Class'}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        <!-- Teachers Section -->
                        ${recordData.teachers && recordData.teachers.length > 0 ? `
                            <div class="border rounded-lg p-4">
                                <h4 class="font-medium text-gray-900 mb-3">Teachers (${recordData.teachers.length})</h4>
                                <div class="space-y-2 max-h-40 overflow-y-auto">
                                    ${recordData.teachers.map(teacher => `
                                        <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
                                            <span class="font-medium">${teacher.first_name} ${teacher.last_name}</span>
                                            <span class="text-sm text-gray-600">${teacher.email || 'No email'}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        <!-- Subjects Section -->
                        ${recordData.subjects && recordData.subjects.length > 0 ? `
                            <div class="border rounded-lg p-4">
                                <h4 class="font-medium text-gray-900 mb-3">Subjects (${recordData.subjects.length})</h4>
                                <div class="space-y-2 max-h-40 overflow-y-auto">
                                    ${recordData.subjects.map(subject => `
                                        <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
                                            <span class="font-medium">${subject.name}</span>
                                            <span class="text-sm text-gray-600">${subject.code || 'No code'}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        <!-- Grades Section -->
                        ${recordData.grades && recordData.grades.length > 0 ? `
                            <div class="border rounded-lg p-4">
                                <h4 class="font-medium text-gray-900 mb-3">Grades (${recordData.grades.length})</h4>
                                <div class="text-sm text-gray-600">Grade records archived for historical reference</div>
                            </div>
                        ` : ''}

                        <!-- Fees Section -->
                        ${recordData.fees && recordData.fees.length > 0 ? `
                            <div class="border rounded-lg p-4">
                                <h4 class="font-medium text-gray-900 mb-3">Fees (${recordData.fees.length})</h4>
                                <div class="text-sm text-gray-600">Fee schedule records archived for historical reference</div>
                            </div>
                        ` : ''}

                        <!-- Grading Periods Section -->
                        ${recordData.grading_periods && recordData.grading_periods.length > 0 ? `
                            <div class="border rounded-lg p-4">
                                <h4 class="font-medium text-gray-900 mb-3">Grading Periods (${recordData.grading_periods.length})</h4>
                                <div class="space-y-2 max-h-40 overflow-y-auto">
                                    ${recordData.grading_periods.map(period => `
                                        <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
                                            <span class="font-medium">${period.name}</span>
                                            <span class="text-sm text-gray-600">${period.start_date} - ${period.end_date}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div slot="footer" class="flex justify-end">
                    <ui-button color="primary" onclick="this.closest('ui-dialog').close()">Close</ui-button>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('record-view-dialog', RecordViewDialog);
export default RecordViewDialog;
