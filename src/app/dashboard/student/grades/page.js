import App from '@/core/App.js';
import '@/components/ui/Table.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Skeleton.js';
import '@/components/ui/Dialog.js';
import '@/components/ui/SearchDropdown.js';
import '@/components/layout/teacherLayout/DataSkeleton.js';
import api from '@/services/api.js';

/**
 * Student Grades Page Component (/dashboard/student/grades)
 * 
 * Displays student grades in a table format similar to admin/teacher pages
 * but read-only and filtered to show only the student's own grades.
 */
class StudentGradesPage extends App {
    constructor() {
        super();
        this.grades = [];
        this.loading = false;
        this.filters = { grading_period_id: '' };
        this.subjects = [];
        this.periods = [];
    }

    formatNumber(value) {
        if (value === null || value === undefined || value === '') return '—';
        const num = Number(value);
        if (Number.isNaN(num)) return String(value);
        return num.toFixed(2);
    }

    formatPercentage(value) {
        if (value === null || value === undefined || value === '') return '—';
        const num = Number(value);
        if (Number.isNaN(num)) return String(value);
        return `${num.toFixed(2)}%`;
    }

    connectedCallback() {
        super.connectedCallback();
        document.title = 'My Grades | School System';
        this.bootstrap();
        
        // Single event listener for all button clicks
        this.addEventListener('click', (e) => {
            const button = e.target.closest('[data-action]');
            if (!button) return;
            
            const action = button.getAttribute('data-action');
            
            if (action === 'show-student-grades-info') {
                this.showStudentGradesInfo();
            } else if (action === 'print-report') {
                this.printTerminalReport();
            } else if (action === 'apply-filters') {
                this.loadGrades();
            } else if (action === 'clear-filters') {
                this.set('filters', { grading_period_id: '' });
                this.loadGrades();
            }
        });

        // Filter interactions
        this.addEventListener('change', (e) => {
            const dd = e.target.closest('ui-search-dropdown');
            if (dd) {
                const name = dd.getAttribute('name');
                const value = dd.value;
                const filters = this.get('filters') || {};
                filters[name] = value;
                this.set('filters', filters);
                this.loadGrades();
            }
        });
    }



    showStudentGradesInfo() {
        const dialog = document.createElement('ui-dialog');
        dialog.setAttribute('open', '');
        dialog.innerHTML = `
            <div slot="header" class="flex items-center">
                <i class="fas fa-chart-line text-blue-500 mr-2"></i>
                <span class="font-semibold">About My Grades</span>
            </div>
            <div slot="content" class="space-y-4">
                <p class="text-gray-700">View your grades across all subjects by period. Select a grading period to view your academic performance.</p>
                <div class="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div class="flex justify-between"><span class="text-sm font-medium">Grading Period</span><span class="text-sm text-gray-600">Choose the term/semester</span></div>
                </div>
            </div>
            <div slot="footer" class="flex justify-end">
                <ui-button color="primary" onclick="this.closest('ui-dialog').close()">Got it</ui-button>
            </div>
        `;
        document.body.appendChild(dialog);
    }

    async printTerminalReport() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({ 
                    title: 'Authentication Error', 
                    message: 'Please log in to print your report', 
                    variant: 'error', 
                    duration: 3000 
                });
                return;
            }

            const filters = this.get('filters') || {};
            const periodId = filters.grading_period_id;
            
            // Build the print URL with the selected grading period
            let printUrl = '/api/student/print/terminal-report';
            if (periodId) {
                printUrl += `?grading_period_id=${periodId}`;
            }

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
                    
                    Toast.show({ 
                        title: 'Print Report', 
                        message: 'Terminal report opened in new window. Use browser print function to print.', 
                        variant: 'success', 
                        duration: 3000 
                    });
                    
                    // Wait for content to load then print
                    setTimeout(() => {
                        printWindow.print();
                    }, 1000);
                } else {
                    Toast.show({ 
                        title: 'Print Error', 
                        message: 'Please allow pop-ups to print your report', 
                        variant: 'warning', 
                        duration: 3000 
                    });
                }
            } else {
                const errorText = await response.text();
                throw new Error(`Print failed with status: ${response.status}. ${errorText}`);
            }
        } catch (error) {
            Toast.show({ 
                title: 'Print Error', 
                message: `Failed to generate print report: ${error.message}`, 
                variant: 'error', 
                duration: 5000 
            });
        }
    }

    async bootstrap() {
        try {
            this.set('loading', true);
            await this.loadSubjects();
            await this.loadGradingPeriods();
            
            // Default: preselect the active grading period (is_active=1)
            if (this.periods && this.periods.length > 0) {
                const activePeriod = this.periods.find(p => p.is_active === 1);
                const selectedPeriodId = activePeriod ? String(activePeriod.id) : String(this.periods[0].id);
                const next = { ...this.get('filters'), grading_period_id: selectedPeriodId };
                this.set('filters', next);
            }

            await this.loadGrades();
        } catch (error) {
            Toast.show({ 
                title: 'Error', 
                message: 'Failed to load grade data', 
                variant: 'error', 
                duration: 3000 
            });
        } finally {
            this.set('loading', false);
        }
    }

    async loadSubjects() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await api.withToken(token).get('/student/my-class-subjects');
            this.subjects = response.data?.data || [];
        } catch (error) {
            console.error('Error loading subjects:', error);
        }
    }

    async loadGradingPeriods() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await api.withToken(token).get('/student/grading-periods');
            this.periods = response.data?.data || [];
        } catch (error) {
            console.error('Error loading grading periods:', error);
        }
    }

    async loadGrades() {
        try {
            this.set('loading', true);
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({ 
                    title: 'Authentication Error', 
                    message: 'Please log in to view your grades', 
                    variant: 'error', 
                    duration: 3000 
                });
                return;
            }

            const filters = this.get('filters') || {};
            const params = {};
            if (filters.grading_period_id) params.grading_period_id = filters.grading_period_id;

            // Fetch existing grades
            const response = await api.withToken(token).get('/student/my-grades', params);
            const existingGrades = response.data?.data || [];

            // Get selected period info
            const selectedPeriod = (this.periods || []).find(p => String(p.id) === String(filters.grading_period_id));

            // Merge with all subjects to show placeholders for not-yet-graded
            const bySubject = new Map(existingGrades.map(g => [String(g.subject_id), { ...g, is_new: false }]));
            const merged = (this.subjects || []).map(subject => {
                const key = String(subject.subject_id);
                if (bySubject.has(key)) return bySubject.get(key);
                
                // Create placeholder for subject without grades
                return {
                    id: null,
                    subject_id: subject.subject_id,
                    subject_name: subject.subject_name || '',
                    subject_code: subject.subject_code || '',
                    grading_period_id: filters.grading_period_id || '',
                    grading_period_name: selectedPeriod?.name || '',
                    class_name: subject.class_name || '',
                    class_section: subject.class_section || '',
                    assignment_total: null,
                    exam_total: null,
                    final_percentage: null,
                    final_letter_grade: null,
                    remarks: null,
                    is_new: true,
                    created_at: null,
                    updated_at: null
                };
            });

            this.set('grades', merged);
            this.render();
            this.set('loading', false);
        } catch (error) {
            this.set('loading', false);
            Toast.show({ 
                title: 'Error', 
                message: error.response?.data?.message || 'Failed to load grades', 
                variant: 'error', 
                duration: 3000 
            });
        }
    }

    // Get basic grade counts
    getGradeCounts() {
        const grades = this.get('grades') || [];
        
        const counts = {
            total: grades.length,
            a_plus: 0,
            a: 0,
            b_plus: 0,
            b: 0,
            c_plus: 0,
            c: 0,
            d: 0,
            f: 0
        };

        grades.forEach(grade => {
            const letterGrade = grade.final_letter_grade?.toUpperCase();
            if (letterGrade === 'A+') counts.a_plus++;
            else if (letterGrade === 'A') counts.a++;
            else if (letterGrade === 'B+') counts.b_plus++;
            else if (letterGrade === 'B') counts.b++;
            else if (letterGrade === 'C+') counts.c_plus++;
            else if (letterGrade === 'C') counts.c++;
            else if (letterGrade === 'D') counts.d++;
            else if (letterGrade === 'F') counts.f++;
        });

        return counts;
    }

    renderHeader() {
        const counts = this.getGradeCounts();
        
        return `
            <div class="space-y-8">
                <!-- Enhanced Header -->
                <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-5 text-white">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
                        <div>
                            <div class="flex items-center gap-2">
                                <h1 class="text-2xl sm:text-3xl font-bold">My Grades</h1>
                                <button class="text-white/90 mt-2 hover:text-white transition-colors" data-action="show-student-grades-info" title="About My Grades">
                                    <i class="fas fa-question-circle text-lg"></i>
                                </button>
                                <button 
                                    onclick="this.closest('app-student-grades-page').loadGrades()"
                                    class="size-8 mt-2 flex items-center justify-center text-white/90 hover:text-white transition-colors duration-200 hover:bg-white/10 rounded-lg group"
                                    title="Refresh data">
                                    <i class="fas fa-sync-alt text-lg ${this.get('loading') ? 'animate-spin' : ''} group-hover:scale-110 transition-transform duration-200"></i>
                                </button>
                            </div>
                            <p class="text-blue-100 text-base sm:text-lg">Track your academic performance across all subjects</p>
                        </div>
                        <div class="mt-4 sm:mt-0">
                            <div class="text-right">
                                <div class="text-xl sm:text-2xl font-bold">${counts.total}</div>
                                <div class="text-blue-100 text-xs sm:text-sm">Total Grades</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Enhanced Summary Cards -->
                    <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-green-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-star text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${counts.a_plus + counts.a}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">A Grades</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-yellow-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-star-half-alt text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${counts.b_plus + counts.b}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">B Grades</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-orange-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-circle text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${counts.c_plus + counts.c}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">C Grades</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-red-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-exclamation-triangle text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${counts.d + counts.f}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">D/F Grades</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderFilters() {
        const periodOptions = (this.periods || []).map(p => {
            const activeLabel = p.is_active === 1 ? ' (Active)' : '';
            const yearDisplay = p.academic_year_display_name || p.academic_year || 'N/A';
            return `<ui-option value="${p.id}">${p.name} (${yearDisplay})${activeLabel}</ui-option>`;
        }).join('');

        const filters = this.get('filters') || { grading_period_id: '' };
        const { grading_period_id } = filters;
        
        // Find the selected period to show if it's active
        const selectedPeriod = this.periods.find(p => String(p.id) === String(grading_period_id));
        const isActivePeriod = selectedPeriod && selectedPeriod.is_active === 1;
        
        return `
            <div class="bg-gray-100 rounded-md p-3 mb-4 border border-gray-300 my-10">
                <div class="grid grid-cols-1 md:grid-cols-1 gap-3">
                    <div>
                        <label class="block text-xs text-gray-600 mb-1">
                            Grading Period
                            ${isActivePeriod ? '<span class="ml-1 text-green-600 font-medium">(Active Period)</span>' : ''}
                        </label>
                        <ui-search-dropdown name="grading_period_id" placeholder="All periods" class="w-full" value="${grading_period_id || ''}">
                            ${periodOptions}
                        </ui-search-dropdown>
                    </div>
                </div>
                <div class="flex justify-between gap-2 mt-3">
                    <div>
                        <ui-button type="button" data-action="apply-filters" variant="primary" size="sm">
                        <i class="fas fa-filter mr-1"></i> Apply Filters
                    </ui-button>
                    <ui-button type="button" data-action="clear-filters" variant="secondary" size="sm">
                        <i class="fas fa-times mr-1"></i> Clear Filters
                    </ui-button>
                    </div>
                    <ui-button type="button" data-action="print-report" variant="success" size="sm">
                        <i class="fas fa-print mr-1"></i> Print Terminal Report
                    </ui-button>
                </div>
            </div>
        `;
    }

    render() {
        const grades = this.get('grades');
        const loading = this.get('loading');

        // Show skeleton loading during initial page load (check this FIRST)
        if (loading) {
            return `<data-skeleton></data-skeleton>`;
        }

        const tableData = (grades || []).map((g, index) => ({
            id: g.id || `new_${g.subject_id}_${index}`,
            index: index + 1,
            subject: g.subject_name || g.subject_code || '',
            period: g.grading_period_name || '',
            class: g.class_name ? `${g.class_name}${g.class_section ? ' ('+g.class_section+')' : ''}` : '',
            assign_total: this.formatNumber(g.assignment_total),
            exam_total: this.formatNumber(g.exam_total),
            final_pct: this.formatPercentage(g.final_percentage),
            final_grade: g.final_letter_grade || (g.is_new ? 'Not Graded' : ''),
            remarks: g.remarks || '',
            updated: g.updated_at ? new Date(g.updated_at).toLocaleDateString() : (g.is_new ? 'Pending' : '')
        }));

        const tableColumns = [
            { key: 'index', label: 'No.' },
            { key: 'subject', label: 'Subject' },
            { key: 'period', label: 'Period' },
            { key: 'class', label: 'Class' },
            { key: 'assign_total', label: 'Assignment Score Total' },
            { key: 'exam_total', label: 'Exam Score Total' },
            { key: 'final_pct', label: 'Final Total Score %' },
            { key: 'final_grade', label: 'Grade' },
            { key: 'remarks', label: 'Remarks' },
            { key: 'updated', label: 'Updated' }
        ];

        return `
            ${this.renderHeader()}
            ${this.renderFilters()}
            <div class="bg-white rounded-lg shadow-lg p-4">
                <div class="mb-8">
                    <ui-table 
                        title="My Academic Grades"
                        data='${JSON.stringify(tableData)}'
                        columns='${JSON.stringify(tableColumns)}'
                        sortable
                        searchable
                        search-placeholder="Search grades..."
                        pagination
                        page-size="50"
                        refresh
                        bordered
                        striped
                        class="w-full">
                    </ui-table>
                </div>
            </div>
        `;
    }
}

customElements.define('app-student-grades-page', StudentGradesPage);
export default StudentGradesPage;
