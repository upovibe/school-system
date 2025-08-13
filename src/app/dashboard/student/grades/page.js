import App from '@/core/App.js';
import '@/components/ui/Table.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Skeleton.js';
import '@/components/ui/Dialog.js';
import '@/components/ui/SearchDropdown.js';
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
        this.filters = { subject_id: '', grading_period_id: '' };
        this.subjects = [];
        this.periods = [];
    }

    formatNumber(value) {
        if (value === null || value === undefined || value === '') return '—';
        const num = Number(value);
        if (Number.isNaN(num)) return String(value);
        return num.toFixed(2);
    }

    connectedCallback() {
        super.connectedCallback();
        document.title = 'My Grades | School System';
        this.bootstrap();
        this.addEventListener('click', this.handleHeaderActions.bind(this));

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

        // Apply/Clear filter buttons
        this.addEventListener('click', (e) => {
            const action = e.target.closest('[data-action]')?.getAttribute('data-action');
            if (action === 'apply-filters') {
                this.loadGrades();
            } else if (action === 'clear-filters') {
                this.set('filters', { subject_id: '', grading_period_id: '' });
                this.loadGrades();
            }
        });
    }

    handleHeaderActions(event) {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        const action = button.getAttribute('data-action');
        if (action === 'show-student-grades-info') {
            this.showStudentGradesInfo();
        }
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
                <p class="text-gray-700">View your subject grades by period. Use filters to narrow by subject and grading period.</p>
                <div class="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div class="flex justify-between"><span class="text-sm font-medium">Subject</span><span class="text-sm text-gray-600">Choose a subject</span></div>
                    <div class="flex justify-between"><span class="text-sm font-medium">Grading Period</span><span class="text-sm text-gray-600">Term/semester</span></div>
                </div>
            </div>
            <div slot="footer" class="flex justify-end">
                <ui-button color="primary" onclick="this.closest('ui-dialog').close()">Got it</ui-button>
            </div>
        `;
        document.body.appendChild(dialog);
    }

    async bootstrap() {
        try {
            this.set('loading', true);
            await this.loadSubjects();
            await this.loadGradingPeriods();
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
            if (filters.subject_id) params.subject_id = filters.subject_id;
            if (filters.grading_period_id) params.grading_period_id = filters.grading_period_id;

            const response = await api.withToken(token).get('/student/my-grades', params);
            this.set('grades', response.data?.data || []);
            this.updateTableData();
        } catch (error) {
            this.set('loading', false);
            Toast.show({ 
                title: 'Error', 
                message: error.response?.data?.message || 'Failed to load grades', 
                variant: 'error', 
                duration: 3000 
            });
        } finally {
            this.set('loading', false);
        }
    }

    updateTableData() {
        const grades = this.get('grades');
        if (!grades) return;

        const tableData = grades.map((g, index) => ({
            id: g.id,
            index: index + 1,
            subject: g.subject_name || g.subject_code || '',
            period: g.grading_period_name || '',
            class: g.class_name ? `${g.class_name}${g.class_section ? ' ('+g.class_section+')' : ''}` : '',
            assign_total: this.formatNumber(g.assignment_total),
            exam_total: this.formatNumber(g.exam_total),
            final_pct: this.formatNumber(g.final_percentage),
            final_grade: g.final_letter_grade,
            remarks: g.remarks || '',
            updated: g.updated_at ? new Date(g.updated_at).toLocaleDateString() : ''
        }));

        const tableComponent = this.querySelector('ui-table');
        if (tableComponent) {
            tableComponent.setAttribute('data', JSON.stringify(tableData));
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
                            </div>
                            <p class="text-blue-100 text-base sm:text-lg">Track your academic performance and achievements</p>
                        </div>
                        <div class="mt-4 sm:mt-0">
                            <div class="text-right">
                                <div class="text-xl sm:text-2xl font-bold">${counts.total}</div>
                                <div class="text-blue-100 text-xs sm:text-sm">Total Grades</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Enhanced Summary Cards -->
                    <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-6">
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
        const subjectOptions = (this.subjects || []).map(s => `<ui-option value="${s.subject_id}">${s.subject_name}</ui-option>`).join('');
        const periodOptions = (this.periods || []).map(p => `<ui-option value="${p.id}">${p.name} (${p.academic_year})</ui-option>`).join('');

        const filters = this.get('filters') || { subject_id: '', grading_period_id: '' };
        const { subject_id, grading_period_id } = filters;
        
        return `
            <div class="bg-gray-100 rounded-md p-3 mb-4 border border-gray-300 my-10">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs text-gray-600 mb-1">Subject</label>
                        <ui-search-dropdown name="subject_id" placeholder="All subjects" class="w-full" value="${subject_id || ''}">
                            ${subjectOptions}
                        </ui-search-dropdown>
                    </div>
                    <div>
                        <label class="block text-xs text-gray-600 mb-1">Grading Period</label>
                        <ui-search-dropdown name="grading_period_id" placeholder="All periods" class="w-full" value="${grading_period_id || ''}">
                            ${periodOptions}
                        </ui-search-dropdown>
                    </div>
                </div>
                <div class="flex justify-end gap-2 mt-3">
                    <ui-button type="button" data-action="apply-filters" variant="primary" size="sm">
                        <i class="fas fa-filter mr-1"></i> Apply Filters
                    </ui-button>
                    <ui-button type="button" data-action="clear-filters" variant="secondary" size="sm">
                        <i class="fas fa-times mr-1"></i> Clear Filters
                    </ui-button>
                </div>
            </div>
        `;
    }

    render() {
        const grades = this.get('grades');
        const loading = this.get('loading');

        const tableData = (grades || []).map((g, index) => ({
            id: g.id,
            index: index + 1,
            subject: g.subject_name || g.subject_code || '',
            period: g.grading_period_name || '',
            class: g.class_name ? `${g.class_name}${g.class_section ? ' ('+g.class_section+')' : ''}` : '',
            assign_total: this.formatNumber(g.assignment_total),
            exam_total: this.formatNumber(g.exam_total),
            final_pct: this.formatNumber(g.final_percentage),
            final_grade: g.final_letter_grade,
            remarks: g.remarks || '',
            updated: g.updated_at ? new Date(g.updated_at).toLocaleDateString() : ''
        }));

        const tableColumns = [
            { key: 'index', label: 'No.' },
            { key: 'subject', label: 'Subject' },
            { key: 'period', label: 'Period' },
            { key: 'class', label: 'Class' },
            { key: 'assign_total', label: 'Assign. Total' },
            { key: 'exam_total', label: 'Exam Total' },
            { key: 'final_pct', label: 'Final %' },
            { key: 'final_grade', label: 'Letter' },
            { key: 'remarks', label: 'Remarks' },
            { key: 'updated', label: 'Updated' }
        ];

        return `
            ${this.renderHeader()}
            ${this.renderFilters()}
            <div class="bg-white rounded-lg shadow-lg p-4">
                ${loading ? `
                    <div class="space-y-4">
                        <ui-skeleton class="h-24 w-full"></ui-skeleton>
                        <ui-skeleton class="h-24 w-full"></ui-skeleton>
                        <ui-skeleton class="h-24 w-full"></ui-skeleton>
                    </div>
                ` : `
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
                            print
                            bordered
                            striped
                            class="w-full">
                        </ui-table>
                    </div>
                `}
            </div>
        `;
    }
}

customElements.define('app-student-grades-page', StudentGradesPage);
export default StudentGradesPage;
