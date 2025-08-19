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
 * Student Grade Report Page (Dashboard Layout)
 * - Uses filter toolbar (Class, Subject, Period, Student) to fetch grades
 * - Mirrors live update patterns used by grading periods/policies pages
 */
class StudentGradeReportPage extends App {
    constructor() {
        super();
        this.grades = null;
        this.loading = false;
        this.filters = { class_id: '', subject_id: '', grading_period_id: '', student_id: '' };
        // Initialize reactive state for filters to avoid undefined access during first render
        this.set('filters', { ...this.filters });
        this.classes = [];
        this.subjects = []; // Will be replaced with class-specific subjects
        this.classSubjects = []; // Store subjects specific to selected class
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
                                <h1 class="text-2xl sm:text-3xl font-bold">Student Grade Report</h1>
                                <button class="text-white/90 mt-2 hover:text-white transition-colors" data-action="show-student-grades-info" title="About Student Grades">
                                    <i class="fas fa-question-circle text-lg"></i>
                                </button>
                            </div>
                            <p class="text-blue-100 text-base sm:text-lg">Summary of recorded grades across filters</p>
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
        if (action === 'show-student-grades-info') {
            this.showStudentGradesInfo();
        }
    }

    showStudentGradesInfo() {
        const dialog = document.createElement('ui-dialog');
        dialog.setAttribute('open', '');
        dialog.innerHTML = `
            <div slot="header" class="flex items-center">
                <i class="fas fa-clipboard-check text-blue-500 mr-2"></i>
                <span class="font-semibold">About Student Grades</span>
            </div>
            <div slot="content" class="space-y-4">
                <div>
                    <h4 class="font-semibold text-gray-900 mb-2">How grading works</h4>
                    <p class="text-gray-700">Grades are recorded per student, per subject, and per grading period. Use the filters to narrow down to the exact class, subject, period, and student.</p>
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
                        Ensure the grading policy for the subject is set so maximum scores and validations apply correctly.
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

    // Compute grade counts for admin header summary
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
        document.title = 'Student Grade Report | School System';
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
            
            if (name === 'class_id') {
                this.loadStudentsByClass(dd.value);
                // When class changes, load subjects for that class
                this.loadClassSubjectsAndAutoSelect(dd.value);
            }
            
            // Auto load when any filter changes if a primary filter (class or student) is set
            const primarySet = (next.class_id && String(next.class_id).length > 0) || (next.student_id && String(next.student_id).length > 0);
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
                const defaults = { class_id: '', subject_id: '', grading_period_id: '', student_id: '' };
                this.set('filters', defaults);
                this.students = [];
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
            const [classesResp, periodsResp] = await Promise.all([
                api.withToken(token).get('/classes'),
                api.withToken(token).get('/grading-periods'),
            ]);
            this.classes = classesResp.data.data || [];
            this.subjects = []; // Don't load all subjects globally - only class-specific ones
            this.periods = periodsResp.data.data || [];

            // Default: preselect the last existing class id
            const currentFilters = this.get('filters') || { class_id: '', subject_id: '', grading_period_id: '', student_id: '' };
            if (!currentFilters.class_id && (this.classes || []).length > 0) {
                const lastId = String(
                    (this.classes || [])
                        .map(c => Number(c.id))
                        .filter(n => !Number.isNaN(n))
                        .sort((a, b) => a - b)
                        .slice(-1)[0]
                );
                if (lastId) {
                    const next = { ...currentFilters, class_id: lastId };
                    this.set('filters', next);
                    await this.loadStudentsByClass(lastId);
                    await this.loadClassSubjectsAndAutoSelect(lastId);
                    this.loadGrades();
                }
            }
        } catch (e) {
            Toast.show({ title: 'Error', message: e.response?.data?.message || 'Failed to load filters', variant: 'error', duration: 3000 });
        } finally {
            this.set('loading', false);
        }
    }

    async loadStudentsByClass(classId) {
        try {
            const token = localStorage.getItem('token');
            if (!token || !classId) { this.students = []; return; }
            const resp = await api.withToken(token).get('/students/by-class', { class_id: classId });
            this.students = resp.data.data || [];
            // If student filter was set but not in new list, clear it
            const flt = this.get('filters');
            if (flt.student_id && !(this.students || []).some(s => String(s.id) === String(flt.student_id))) {
                this.set('filters', { ...flt, student_id: '' });
            }
        } catch (_) {
            this.students = [];
        }
    }

    async loadClassSubjects(classId) {
        try {
            const token = localStorage.getItem('token');
            if (!token || !classId) return [];
            
            // Get subjects assigned to this specific class from class-subject system
            const resp = await api.withToken(token).get('/class-subjects', { class_id: classId });
            const classSubjects = resp.data.data || [];
            
            // Extract subject IDs and names
            const subjects = classSubjects.map(cs => ({
                id: cs.subject_id,
                name: cs.subject_name || cs.subject_code
            }));
            
            return subjects;
        } catch (error) {
            console.error('❌ Error loading class subjects:', error);
            return [];
        }
    }

    async loadClassSubjectsAndAutoSelect(classId) {
        try {
            const classSubjects = await this.loadClassSubjects(classId);
            
            // Update and render only class-specific subjects
            this.classSubjects = classSubjects;
            this.subjects = classSubjects; // Update this.subjects for backward compatibility
            
            // Auto-select the first subject for the selected class (like teacher page)
            if (classSubjects && classSubjects.length > 0) {
                const firstSubjectId = String(classSubjects[0].id);
                const currentFilters = this.get('filters');
                this.set('filters', { ...currentFilters, subject_id: firstSubjectId });
            } else {
                // Clear subject selection if no subjects available
                const currentFilters = this.get('filters');
                this.set('filters', { ...currentFilters, subject_id: '' });
            }
        } catch (error) {
            console.error('❌ Error in loadClassSubjectsAndAutoSelect:', error);
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

            const { class_id, subject_id, grading_period_id, student_id } = this.get('filters');
            if (!class_id && !student_id) {
                this.set('grades', []);
                this.updateTableData();
                this.set('loading', false);
                Toast.show({ title: 'Filter Required', message: 'Select a class or a student to view grades', variant: 'info', duration: 2500 });
                return;
            }

            const params = {};
            if (class_id) params.class_id = class_id;
            if (student_id) params.student_id = student_id;
            if (subject_id) params.subject_id = subject_id;
            if (grading_period_id) params.grading_period_id = grading_period_id;

            const response = await api.withToken(token).get('/student-grades', params);
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
        const classOptions = (this.classes || []).map(c => `<ui-option value="${c.id}">${c.name}${c.section ? ' - '+c.section : ''}</ui-option>`).join('');
        
        // Use class-specific subjects if available, otherwise show message
        const subjectOptions = (this.subjects && this.subjects.length > 0)
            ? this.subjects.map(s => `<ui-option value="${s.id}">${s.name}</ui-option>`).join('')
            : '<ui-option value="" disabled>No subjects assigned to this class</ui-option>';
        
        const periodOptions = (this.periods || []).map(p => `<ui-option value="${p.id}">${p.name}</ui-option>`).join('');
        const studentOptions = (this.students || []).map(s => `<ui-option value="${s.id}">${s.first_name} ${s.last_name} (${s.student_id})</ui-option>`).join('');

        const filters = this.get('filters') || { class_id: '', subject_id: '', grading_period_id: '', student_id: '' };
        const { class_id, subject_id, grading_period_id, student_id } = filters;
        
        return `
            <div class="bg-gray-100 rounded-md p-3 mb-4 border border-gray-300">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                        <label class="block text-xs text-gray-600 mb-1">Class</label>
                        <ui-search-dropdown name="class_id" placeholder="Select class" class="w-full" value="${class_id || ''}">
                            ${classOptions}
                        </ui-search-dropdown>
                    </div>
                    <div>
                        <label class="block text-xs text-gray-600 mb-1">Subject</label>
                        <ui-search-dropdown name="subject_id" placeholder="Select subject" class="w-full" value="${subject_id || ''}">
                            ${subjectOptions}
                        </ui-search-dropdown>
                    </div>
                    <div>
                        <label class="block text-xs text-gray-600 mb-1">Grading Period</label>
                        <ui-search-dropdown name="grading_period_id" placeholder="All periods" class="w-full" value="${grading_period_id || ''}">
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
            subject: g.subject_name || '',
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
                            title="Student Grades Database"
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

customElements.define('app-student-grade-report-page', StudentGradeReportPage);
export default StudentGradeReportPage;
