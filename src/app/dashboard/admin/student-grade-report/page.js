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
        this.filters = { class_id: '', grading_period_id: '', student_id: '' };
        // Initialize reactive state for filters to avoid undefined access during first render
        this.set('filters', { ...this.filters });
        this.classes = [];
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
                            <p class="text-blue-100 text-base sm:text-lg">Complete academic performance report for individual students</p>
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
                <span class="font-semibold">About Student Grade Report</span>
            </div>
            <div slot="content" class="space-y-4">
                <div>
                    <h4 class="font-semibold text-gray-900 mb-2">How the grade report works</h4>
                    <p class="text-gray-700">This report shows all subjects for a selected student in a specific class. Select a class, then a student, and view their complete academic performance across all subjects.</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Class Selection</span>
                        <span class="text-sm text-gray-600">Choose the class to view students</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Student Selection</span>
                        <span class="text-sm text-gray-600">Select specific student to view their grades</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Grading Period</span>
                        <span class="text-sm text-gray-600">Automatically set to first available period</span>
                    </div>
                </div>
                <div class="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p class="text-sm text-blue-800">
                        <i class="fas fa-info-circle mr-1"></i>
                        All subjects assigned to the class will be displayed, whether graded or not. Ungraded subjects show "Not Graded" status.
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

    formatPercentage(value) {
        if (value === null || value === undefined || value === '') return '—';
        const num = Number(value);
        if (Number.isNaN(num)) return String(value);
        return `${num.toFixed(2)}%`;
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
            }
            
            // Auto load when both class and student are selected
            const bothSelected = (next.class_id && String(next.class_id).length > 0) && (next.student_id && String(next.student_id).length > 0);
            if (bothSelected) {
                this.loadGrades();
            }
        });

        this.addEventListener('click', (e) => {
            const applyBtn = e.target.closest('[data-action="apply-filters"]');
            if (applyBtn) { e.preventDefault(); this.loadGrades(); return; }
            const clearBtn = e.target.closest('[data-action="clear-filters"]');
            if (clearBtn) {
                e.preventDefault();
                const defaults = { class_id: '', grading_period_id: '', student_id: '' };
                this.set('filters', defaults);
                this.students = [];
                this.set('grades', []);
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
            this.periods = periodsResp.data.data || [];

            // Default: preselect the last existing class id
            const currentFilters = this.get('filters') || { class_id: '', grading_period_id: '', student_id: '' };
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
                }
            }

            // Default: preselect the first existing grading period
            if (!currentFilters.grading_period_id && (this.periods || []).length > 0) {
                const firstPeriodId = String(this.periods[0].id);
                const next = { ...this.get('filters'), grading_period_id: firstPeriodId };
                this.set('filters', next);
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
            if (!token || !classId) { 
                this.students = []; 
                return; 
            }
            
            const resp = await api.withToken(token).get('/students/by-class', { class_id: classId });
            this.students = resp.data.data || [];
            
            // If student filter was set but not in new list, clear it
            const flt = this.get('filters');
            if (flt.student_id && !(this.students || []).some(s => String(s.id) === String(flt.student_id))) {
                this.set('filters', { ...flt, student_id: '' });
            }

            // Update the student dropdown options directly
            this.updateStudentDropdown();
        } catch (error) {
            console.error('❌ Error loading students:', error);
            this.students = [];
        }
    }

    updateStudentDropdown() {
        // Find the student dropdown and update its options
        const studentDropdown = this.querySelector('ui-search-dropdown[name="student_id"]');
        if (studentDropdown) {
            // Clear existing options
            studentDropdown.innerHTML = '';
            
            // Add options for students in this class
            this.students.forEach(student => {
                const option = document.createElement('ui-option');
                option.setAttribute('value', student.id);
                option.textContent = `${student.first_name} ${student.last_name} (${student.student_id})`;
                studentDropdown.appendChild(option);
            });
            
            // Set the selected value based on current filters
            const currentFilters = this.get('filters') || {};
            if (currentFilters.student_id) {
                studentDropdown.setAttribute('value', currentFilters.student_id);
            }
            
            // Try to trigger any internal refresh methods the component might have
            if (studentDropdown.refresh) {
                studentDropdown.refresh();
            } else if (studentDropdown.updateOptions) {
                studentDropdown.updateOptions();
            }
        } else {
            // Fallback: force a re-render if dropdown not found
            setTimeout(() => this.render(), 100);
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

            const { class_id, grading_period_id, student_id } = this.get('filters');
            
            // Require BOTH class and student to be selected before loading
            if (!class_id || !student_id) {
                this.set('grades', []);
                this.render();
                this.set('loading', false);
                return;
            }

            // Get the selected student and class info
            const selectedStudent = this.students.find(s => String(s.id) === String(student_id));
            const selectedClass = this.classes.find(c => String(c.id) === String(class_id));
            const selectedPeriod = this.periods.find(p => String(p.id) === String(grading_period_id));

            // Get existing grades for this student in this class
            const params = { class_id, student_id };
            if (grading_period_id) params.grading_period_id = grading_period_id;
            
            const response = await api.withToken(token).get('/student-grades', params);
            const existingGrades = response?.data?.data || [];

            // Get all subjects assigned to this class
            const classSubjectsResp = await api.withToken(token).get('/class-subjects', { class_id });
            const classSubjects = classSubjectsResp?.data?.data || [];

            // Create a comprehensive grade report showing all subjects for this student
            const gradeReport = classSubjects.map(cs => {
                // Try to find existing grade for this subject
                const existingGrade = existingGrades.find(g => 
                    String(g.subject_id) === String(cs.subject_id)
                );

                if (existingGrade) {
                    return {
                        ...existingGrade,
                        is_new: false
                    };
                }

                // Create a placeholder row for subjects without grades
                return {
                    id: null,
                    student_id: student_id,
                    student_first_name: selectedStudent?.first_name || '',
                    student_last_name: selectedStudent?.last_name || '',
                    student_number: selectedStudent?.student_id || '',
                    class_id: class_id,
                    class_name: selectedClass?.name || '',
                    class_section: selectedClass?.section || '',
                    subject_id: cs.subject_id,
                    subject_name: cs.subject_name || cs.subject_code || '',
                    subject_code: cs.subject_code || '',
                    grading_period_id: grading_period_id || '',
                    grading_period_name: selectedPeriod?.name || '',
                    assignment_total: null,
                    exam_total: null,
                    final_percentage: null,
                    final_letter_grade: null,
                    created_at: null,
                    updated_at: null,
                    is_new: true
                };
            });

            this.set('grades', gradeReport);
            this.render();
            this.set('loading', false);
        } catch (error) {
            console.error('Error in loadGrades:', error);
            this.set('loading', false);
            Toast.show({ title: 'Error', message: error.response?.data?.message || 'Failed to load grades', variant: 'error', duration: 3000 });
        }
    }





    renderFilters() {
        const classOptions = (this.classes || []).map(c => `<ui-option value="${c.id}">${c.name}${c.section ? ' - '+c.section : ''}</ui-option>`).join('');
        
        const periodOptions = (this.periods || []).map(p => `<ui-option value="${p.id}">${p.name}</ui-option>`).join('');
        const studentOptions = (this.students || []).map(s => `<ui-option value="${s.id}">${s.first_name} ${s.last_name} (${s.student_id})</ui-option>`).join('');

        const filters = this.get('filters') || { class_id: '', grading_period_id: '', student_id: '' };
        const { class_id, grading_period_id, student_id } = filters;
        
        return `
            <div class="bg-gray-100 rounded-md p-3 mb-4 border border-gray-300">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                        <label class="block text-xs text-gray-600 mb-1">Class</label>
                        <ui-search-dropdown name="class_id" placeholder="Select class" class="w-full" value="${class_id || ''}">
                            ${classOptions}
                        </ui-search-dropdown>
                    </div>
                    <div>
                        <label class="block text-xs text-gray-600 mb-1">Student</label>
                        <ui-search-dropdown name="student_id" placeholder="Select student" class="w-full" value="${student_id || ''}">
                            ${studentOptions}
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


        const tableData = grades ? grades.map((g, index) => ({
            id: g.id || `new_${g.student_id}_${index}`,
            index: index + 1,
            student: ([g.student_first_name, g.student_last_name].filter(Boolean).join(' ') || g.student_number || ''),
            class: g.class_name ? `${g.class_name}${g.class_section ? ' ('+g.class_section+')' : ''}` : '',
            subject: g.subject_name || g.subject_code || '',
            period: g.grading_period_name || '',
            assign_total: this.formatNumber(g.assignment_total),
            exam_total: this.formatNumber(g.exam_total),
            final_pct: this.formatPercentage(g.final_percentage),
            final_grade: g.final_letter_grade || (g.is_new ? 'Not Graded' : ''),
            updated: g.updated_at ? new Date(g.updated_at).toLocaleDateString() : (g.is_new ? 'Pending' : '')
        })) : [];

        const tableColumns = [
            { key: 'index', label: 'No.' },
            { key: 'subject', label: 'Subject' },
            { key: 'period', label: 'Period' },
            { key: 'assign_total', label: 'Assignment Score Total' },
            { key: 'exam_total', label: 'Exam Score Total' },
            { key: 'final_pct', label: 'Final Total Score %' },
            { key: 'final_grade', label: 'Letter Grade' },
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
                            title="Student Academic Performance Report"
                            data='${JSON.stringify(tableData)}'
                            columns='${JSON.stringify(tableColumns)}'
                            sortable
                            searchable
                            search-placeholder="Search subjects..."
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
