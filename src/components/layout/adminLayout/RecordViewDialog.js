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

    async printRecord() {
        if (!this.recordData || !this.recordData.id) {
            Toast.show({
                title: 'Error',
                message: 'No record data available for printing',
                variant: 'error',
                duration: 3000
            });
            return;
        }

        try {
            // Get the auth token
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Please log in to print records',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Show loading toast
            const loadingToast = Toast.show({
                title: 'Preparing Print',
                message: 'Generating printable version...',
                variant: 'info',
                duration: 0
            });

            // Build the print URL
            const printUrl = `/api/academic-year-records/${this.recordData.id}/print`;
            
            // Fetch the report HTML with authentication first
            const response = await fetch(printUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'text/html'
                }
            });
            
            if (response.ok) {
                const html = await response.text();
                
                // Open new window and write the HTML content
                const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
                if (printWindow) {
                    printWindow.document.write(html);
                    printWindow.document.close();
                    printWindow.focus();
                    
                    // Wait for content to load then print
                    setTimeout(() => {
                        printWindow.print();
                    }, 1000);
                }
            } else {
                throw new Error(`Print failed with status: ${response.status}`);
            }

            // Dismiss loading toast
            if (loadingToast) {
                loadingToast.dismiss();
            }

            // Close the dialog
            this.close();

        } catch (error) {
            console.error('❌ Error printing record:', error);
            
            Toast.show({
                title: 'Print Error',
                message: error.message || 'Failed to generate print report',
                variant: 'error',
                duration: 3000
            });
        }
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
                                <div class="text-2xl font-bold text-blue-600">${recordData.summary?.total_classes || 0}</div>
                                <div class="text-xs text-blue-600">Classes</div>
                            </div>
                            <div class="bg-green-50 p-3 rounded-lg text-center">
                                <div class="text-2xl font-bold text-green-600">${recordData.summary?.total_students || 0}</div>
                                <div class="text-xs text-green-600">Students</div>
                            </div>
                            <div class="bg-purple-50 p-3 rounded-lg text-center">
                                <div class="text-2xl font-bold text-purple-600">${recordData.summary?.total_teachers || 0}</div>
                                <div class="text-xs text-purple-600">Teachers</div>
                            </div>
                            <div class="bg-orange-50 p-3 rounded-lg text-center">
                                <div class="text-2xl font-bold text-orange-600">${recordData.summary?.total_subjects || 0}</div>
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
                        ${recordData.classes_summary && recordData.classes_summary.length > 0 ? `
                            <div class="mb-4">
                                <h5 class="text-sm font-medium text-gray-700 mb-2">Classes (${recordData.classes_summary.length})</h5>
                                <div class="space-y-2 max-h-32 overflow-y-auto">
                                    ${recordData.classes_summary.map(cls => `
                                        <div class="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                                            <span class="font-medium text-gray-900">${cls.class_name} ${cls.class_section ? `(${cls.class_section})` : ''}</span>
                                            <span class="text-gray-600">${cls.student_count || 0} students, ${cls.teacher_count || 0} teachers</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        <!-- Students Section -->
                        ${recordData.summary?.total_students > 0 ? `
                            <div class="mb-4">
                                <h5 class="text-sm font-medium text-gray-700 mb-2">Students (${recordData.summary.total_students})</h5>
                                <div class="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                    Student records archived for historical reference. Use the Print function to view detailed student information with grades.
                                </div>
                            </div>
                        ` : ''}

                        <!-- Teachers Section -->
                        ${recordData.teacher_assignments && recordData.teacher_assignments.length > 0 ? `
                            <div class="mb-4">
                                <h5 class="text-sm font-medium text-gray-700 mb-2">Teachers (${recordData.summary?.total_teachers || 0})</h5>
                                <div class="space-y-2 max-h-32 overflow-y-auto">
                                    ${recordData.teacher_assignments.slice(0, 10).map(teacher => `
                                        <div class="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                                            <span class="font-medium text-gray-900">${teacher.first_name} ${teacher.last_name}</span>
                                            <span class="text-gray-600">${teacher.class_name} - ${teacher.subject_name}</span>
                                        </div>
                                    `).join('')}
                                    ${recordData.teacher_assignments.length > 10 ? `
                                        <div class="text-xs text-gray-500 text-center p-2">
                                            ... and ${recordData.teacher_assignments.length - 10} more assignments
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        ` : ''}

                        <!-- Subjects Section -->
                        ${recordData.summary?.total_subjects > 0 ? `
                            <div class="mb-4">
                                <h5 class="text-sm font-medium text-gray-700 mb-2">Subjects (${recordData.summary.total_subjects})</h5>
                                <div class="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                    Subject records archived for historical reference. Use the Print function to view detailed subject information.
                                </div>
                            </div>
                        ` : ''}

                        <!-- Other Data Types -->
                        ${recordData.summary?.total_grades > 0 ? `
                            <div class="mb-4">
                                <h5 class="text-sm font-medium text-gray-700 mb-2">Grades (${recordData.summary.total_grades})</h5>
                                <div class="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                    Grade records archived for historical reference. Use the Print function to view detailed student grades by class and period.
                                </div>
                            </div>
                        ` : ''}

                        ${recordData.summary?.total_fees > 0 ? `
                            <div class="mb-4">
                                <h5 class="text-sm font-medium text-gray-700 mb-2">Fees (${recordData.summary.total_fees})</h5>
                                <div class="text-sm text-gray-600 bg-gray-50 p-2 rounded">Fee schedule records archived for historical reference</div>
                            </div>
                        ` : ''}

                        ${recordData.summary?.total_grading_periods > 0 ? `
                            <div class="mb-4">
                                <h5 class="text-sm font-medium text-gray-700 mb-2">Grading Periods (${recordData.summary.total_grading_periods})</h5>
                                <div class="space-y-2 max-h-32 overflow-y-auto">
                                    ${recordData.grading_periods ? recordData.grading_periods.map(period => `
                                        <div class="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                                            <span class="font-medium text-gray-900">${period.name}</span>
                                            <span class="text-gray-600">${period.start_date} - ${period.end_date}</span>
                                        </div>
                                    `).join('') : '<div class="text-sm text-gray-600 bg-gray-50 p-2 rounded">Grading period records archived for historical reference</div>'}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div slot="footer" class="flex justify-between">
                    <ui-button 
                        color="primary" 
                        onclick="this.closest('record-view-dialog').printRecord()"
                        class="flex items-center gap-2 mr-2">
                        <i class="fas fa-print"></i>
                        Print Record
                    </ui-button>
                    <ui-button variant="outline" color="secondary" dialog-action="cancel">Close</ui-button>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('record-view-dialog', RecordViewDialog);
export default RecordViewDialog;
