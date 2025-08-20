import App from '@/core/App.js';
import '@/components/ui/Table.js';
import '@/components/ui/Modal.js';
import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Skeleton.js';
import '@/components/ui/Button.js';
import '@/components/ui/SearchDropdown.js';
import api from '@/services/api.js';

/**
 * Teacher Student Grade Report Page (Dashboard Layout)
 * - Uses teacher-specific routes and data
 * - Filters: Subject, Period, Student (within teacher's assigned class)
 * - Mirrors admin structure but scoped to teacher's class
 */
class TeacherStudentGradeReportPage extends App {
    constructor() {
        super();
        this.grades = null;
        this.loading = false;
        this.filters = { subject_id: '', grading_period_id: '', student_id: '' };
        // Initialize reactive state for filters to avoid undefined access during first render
        this.set('filters', { ...this.filters });
        this.teacherClass = null;
        this.subjects = []; // Will be replaced with class-specific subjects
        this.periods = [];
        this.students = [];
    }

    renderHeader() {
        const c = this.getGradeCounts();
        return `
            <div class="space-y-8 mb-4">
                <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-5 text-white">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
                        <div>
                            <div class="flex items-center gap-2">
                                <h1 class="text-2xl sm:text-3xl font-bold">My Class Grade Report</h1>
                                <button class="text-white/90 mt-2 hover:text-white transition-colors" data-action="show-teacher-grade-report-info" title="About My Class Grade Report">
                                    <i class="fas fa-question-circle text-lg"></i>
                                </button>
                            </div>
                            <p class="text-blue-100 text-base sm:text-lg">Summary of recorded grades for your class</p>
                        </div>
                        <div class="mt-4 sm:mt-0">
                            <div class="text-right">
                                <div class="text-xl sm:text-2xl font-bold">${c.total}</div>
                                <div class="text-blue-100 text-xs sm:text-sm">Total Grades</div>
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-6">
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-green-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-star text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.a_plus + c.a}</div>
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
                                    <div class="text-xl sm:text-2xl font-bold">${c.b_plus + c.b}</div>
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
                                    <div class="text-xl sm:text-2xl font-bold">${c.c_plus + c.c}</div>
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
                                    <div class="text-xl sm:text-2xl font-bold">${c.d + c.f}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">D/F Grades</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    handleHeaderActions(event) {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        const action = button.getAttribute('data-action');
        if (action === 'show-teacher-grade-report-info') {
            this.showTeacherGradeReportInfo();
        }
    }

    showTeacherGradeReportInfo() {
        const dialog = document.createElement('ui-dialog');
        dialog.setAttribute('open', '');
        dialog.innerHTML = `
            <div slot="header" class="flex items-center">
                <i class="fas fa-clipboard-check text-blue-500 mr-2"></i>
                <span class="font-semibold">About My Class Grade Report</span>
            </div>
            <div slot="content" class="space-y-4">
                <div>
                    <h4 class="font-semibold text-gray-900 mb-2">How grading works</h4>
                    <p class="text-gray-700">Grades are recorded per student, per subject, and per grading period for your assigned class. Use the filters to narrow down to specific subjects, periods, and students.</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Assignments Total</span>
                        <span class="text-sm text-gray-600">Sum of continuous assessments (bounded by policy)</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Exam Total</span>
                        <span class="text-sm text-gray-600">Exam score (bounded by policy)</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Final Percentage</span>
                        <span class="text-sm text-gray-600">Computed from assignment and exam totals</span>
                    </div>
                </div>
                <div class="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p class="text-sm text-blue-800">
                        <i class="fas fa-info-circle mr-1"></i>
                        This report shows grades for your assigned class only. Ensure the grading policy for the subject is set so maximum scores and validations apply correctly.
                    </p>
                </div>
            </div>
            <div slot="footer" class="flex justify-end">
                <ui-button color="primary" onclick="this.closest('ui-dialog').close()">Got it</ui-button>
            </div>
        `;
        document.body.appendChild(dialog);
    }

    formatNumber(value) {
        if (value === null || value === undefined || value === '') return '—';
        const num = Number(value);
        if (Number.isNaN(num)) return String(value);
        return num.toFixed(2);
    }

    // Compute grade counts for teacher header summary
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

        grades.forEach((g) => {
            const letter = (g.final_letter_grade || '').toUpperCase();
            if (letter === 'A+') counts.a_plus += 1;
            else if (letter === 'A') counts.a += 1;
            else if (letter === 'B+') counts.b_plus += 1;
            else if (letter === 'B') counts.b += 1;
            else if (letter === 'C+') counts.c_plus += 1;
            else if (letter === 'C') counts.c += 1;
            else if (letter === 'D') counts.d += 1;
            else if (letter === 'F') counts.f += 1;
        });

        return counts;
    }

    connectedCallback() {
        super.connectedCallback();
        document.title = 'My Class Grade Report | School System';
        this.bootstrap();

        // Header actions (question mark button)
        this.addEventListener('click', this.handleHeaderActions.bind(this));

        // Filter interactions
        this.addEventListener('change', (e) => {
            const dd = e.target.closest('ui-search-dropdown');
            if (!dd) return;

            const name = dd.getAttribute('name');
            if (!name) return;
            const next = { ...this.get('filters'), [name]: dd.value };
            this.set('filters', next);
            
            // Auto load when any filter changes if both subject and period are selected
            const primarySet = (next.subject_id && String(next.subject_id).length > 0) && (next.grading_period_id && String(next.grading_period_id).length > 0);
            if (primarySet) {
                this.loadGrades();
            }
        });

        this.addEventListener('click', (e) => {
            const applyBtn = e.target.closest('[data-action="apply-filters"]');
            if (applyBtn) { e.preventDefault(); this.loadGrades(); return; }
            const clearBtn = e.target.closest('[data-action="clear-filters"]');
            if (clearBtn) {
                e.preventDefault();
                const defaults = { subject_id: '', grading_period_id: '', student_id: '' };
                this.set('filters', defaults);
                this.set('grades', []);
                this.updateTableData();
                // Re-render to reset dropdowns
                this.render();
            }
        });
    }

    async bootstrap() {
        try {
            this.set('loading', true);
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({ title: 'Authentication Error', message: 'Please log in to view data', variant: 'error', duration: 3000 });
                return;
            }

            // Get teacher class + students (same as teacher student grades page)
            const myClassResp = await api.withToken(token).get('/teachers/my-class');
            if (!myClassResp.data?.success || !myClassResp.data?.data) {
                this.teacherClass = null;
                this.students = [];
                return;
            }
            this.teacherClass = myClassResp.data.data; // contains class_id, students, etc.
            this.students = this.teacherClass.students || [];

            // Subjects for this class (from teacher scoped endpoint)
            const subjectsFromMyClass = Array.isArray(this.teacherClass.subjects) ? this.teacherClass.subjects : [];
            this.subjects = subjectsFromMyClass;

            // Grading periods (teacher-friendly endpoint)
            try {
                const periodsResp = await api.withToken(token).get('/teachers/grading-periods');
                this.periods = periodsResp.data?.data || [];
            } catch (e) { 
                this.periods = []; 
            }

            // Default subject: pick the first subject assigned to the class if none selected
            const existingFilters = this.get('filters') || { subject_id: '', grading_period_id: '', student_id: '' };
            if (!existingFilters.subject_id && this.subjects && this.subjects.length > 0) {
                this.set('filters', { ...existingFilters, subject_id: String(this.subjects[0].id) });
            }

            // Initial load if we have class and subject
            if (this.teacherClass?.class_id && this.subjects && this.subjects.length > 0) {
                await this.loadGrades();
            }
        } catch (e) {
            Toast.show({ title: 'Error', message: e.response?.data?.message || 'Failed to load data', variant: 'error', duration: 3000 });
        } finally {
            this.set('loading', false);
        }
    }

    async loadGrades() {
        try {
            this.set('loading', true);
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({ title: 'Authentication Error', message: 'Please log in to view data', variant: 'error', duration: 3000 });
                return;
            }

            const { subject_id, grading_period_id, student_id } = this.get('filters');
            
            // Require both subject and grading period selection for teacher view
            if (!subject_id || !grading_period_id) {
                this.set('grades', []);
                this.updateTableData();
                this.set('loading', false);
                Toast.show({ title: 'Filter Required', message: 'Select both subject and grading period to view grades', variant: 'info', duration: 2500 });
                return;
            }

            // Use teacher-specific endpoint for grades
            const params = { subject_id, grading_period_id };
            if (student_id) params.student_id = student_id;

            const response = await api.withToken(token).get('/teacher/student-grades', params);
            this.set('grades', response.data.data || []);
            this.updateTableData();
            this.set('loading', false);
        } catch (error) {
            this.set('loading', false);
            Toast.show({ title: 'Error', message: error.response?.data?.message || 'Failed to load grades', variant: 'error', duration: 3000 });
        }
    }

    updateTableData() {
        const grades = this.get('grades');
        if (!grades) return;

        const tableData = grades.map((g, index) => ({
            id: g.id,
            index: index + 1,
            student: [g.student_first_name, g.student_last_name].filter(Boolean).join(' ') || g.student_number || '',
            class: g.class_name ? `${g.class_name}${g.class_section ? ' ('+g.class_section+')' : ''}` : '',
            subject: g.subject_name || g.subject_code || '',
            period: g.grading_period_name || '',
            assign_total: this.formatNumber(g.assignment_total),
            exam_total: this.formatNumber(g.exam_total),
            final_pct: this.formatNumber(g.final_percentage),
            final_grade: g.final_letter_grade,
            updated: g.updated_at ? new Date(g.updated_at).toLocaleDateString() : ''
        }));

        const tableComponent = this.querySelector('ui-table');
        if (tableComponent) {
            tableComponent.setAttribute('data', JSON.stringify(tableData));
        }
    }

    renderFilters() {
        // Use class-specific subjects from teacher's assigned class
        const subjectOptions = (this.subjects && this.subjects.length > 0)
            ? this.subjects.map(s => `<ui-option value="${s.id}">${s.name}</ui-option>`).join('')
            : '<ui-option value="" disabled>No subjects assigned to your class</ui-option>';
        
        const periodOptions = (this.periods || []).map(p => `<ui-option value="${p.id}">${p.name}</ui-option>`).join('');
        const studentOptions = (this.students || []).map(s => `<ui-option value="${s.id}">${s.first_name} ${s.last_name} (${s.student_id})</ui-option>`).join('');

        const filters = this.get('filters') || { subject_id: '', grading_period_id: '', student_id: '' };
        const { subject_id, grading_period_id, student_id } = filters;
        
        return `
            <div class="bg-gray-100 rounded-md p-3 mb-4 border border-gray-300">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                        <label class="block text-xs text-gray-600 mb-1">Subject</label>
                        <ui-search-dropdown name="subject_id" placeholder="Select subject" class="w-full" value="${subject_id || ''}">
                            ${subjectOptions}
                        </ui-search-dropdown>
                    </div>
                    <div>
                        <label class="block text-xs text-gray-600 mb-1">Grading Period</label>
                        <ui-search-dropdown name="grading_period_id" placeholder="Select period" class="w-full" value="${grading_period_id || ''}">
                            ${periodOptions}
                        </ui-search-dropdown>
                    </div>
                    <div>
                        <label class="block text-xs text-gray-600 mb-1">Student</label>
                        <ui-search-dropdown name="student_id" placeholder="All students (optional)" class="w-full" value="${student_id || ''}">
                            ${studentOptions}
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

        const tableData = grades ? grades.map((g, index) => ({
            id: g.id,
            index: index + 1,
            student: ([g.student_first_name, g.student_last_name].filter(Boolean).join(' ') || g.student_number || ''),
            class: g.class_name ? `${g.class_name}${g.class_section ? ' ('+g.class_section+')' : ''}` : '',
            subject: g.subject_name || g.subject_code || '',
            period: g.grading_period_name || '',
            assign_total: this.formatNumber(g.assignment_total),
            exam_total: this.formatNumber(g.exam_total),
            final_pct: this.formatNumber(g.final_percentage),
            final_grade: g.final_letter_grade,
            updated: g.updated_at ? new Date(g.updated_at).toLocaleDateString() : ''
        })) : [];

        const tableColumns = [
            { key: 'index', label: 'No.' },
            { key: 'student', label: 'Student' },
            { key: 'class', label: 'Class' },
            { key: 'subject', label: 'Subject' },
            { key: 'period', label: 'Period' },
            { key: 'assign_total', label: 'Assign. Total' },
            { key: 'exam_total', label: 'Exam Total' },
            { key: 'final_pct', label: 'Final %' },
            { key: 'final_grade', label: 'Grade' },
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
                            title="My Class Student Grades"
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

customElements.define('app-teacher-student-grade-report-page', TeacherStudentGradeReportPage);
export default TeacherStudentGradeReportPage;
