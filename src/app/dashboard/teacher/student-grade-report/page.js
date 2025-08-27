import App from '@/core/App.js';
import '@/components/ui/Table.js';
import '@/components/ui/Modal.js';
import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Skeleton.js';
import '@/components/ui/Button.js';
import '@/components/ui/SearchDropdown.js';
import '@/components/layout/teacherLayout/DataSkeleton.js';
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
        this.filters = { class_id: '', grading_period_id: '', student_id: '' };
        // Initialize reactive state for filters to avoid undefined access during first render
        this.set('filters', { ...this.filters });
        this.teacherClass = null;
        this.classes = []; // Will be replaced with teacher's assigned class
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
                            <p class="text-blue-100 text-base sm:text-lg">Complete academic performance report for individual students in your class</p>
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
                    <h4 class="font-semibold text-gray-900 mb-2">How the grade report works</h4>
                    <p class="text-gray-700">This report shows all subjects for a selected student in your assigned class. Your class assignment is automatically set and cannot be changed.</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Assigned Class</span>
                        <span class="text-sm text-gray-600">Your teaching class (read-only)</span>
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
                        All subjects assigned to your class will be displayed, whether graded or not. Ungraded subjects show "Not Graded" status.
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
                const currentFilters = this.get('filters');
                const defaults = { 
                    class_id: currentFilters.class_id, // Keep the assigned class
                    grading_period_id: '', 
                    student_id: '' 
                };
                this.set('filters', defaults);
                this.set('grades', []);
                this.updateTableData();
                // Re-render to reset dropdowns
                this.render();
            }
            const printBtn = e.target.closest('[data-action="print-student-report"]');
            if (printBtn) {
                e.preventDefault();
                this.printStudentReport();
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
                this.classes = [];
                return;
            }
            
            this.teacherClass = myClassResp.data.data; // contains class_id, students, etc.
            this.students = this.teacherClass.students || [];

            // Classes for this teacher - use the same logic as student grades page
            if (this.teacherClass.class_id) {
                this.classes = [{
                    id: this.teacherClass.class_id,
                    name: this.teacherClass.class_name || 'Assigned Class',
                    section: this.teacherClass.class_section || ''
                }];
            } else {
                this.classes = [];
            }

            // Grading periods (teacher-friendly endpoint)
            try {
                const periodsResp = await api.withToken(token).get('/teachers/grading-periods');
                this.periods = periodsResp.data?.data || [];
            } catch (e) { 
                this.periods = []; 
            }

            // Default class: pick the first class assigned to the teacher if none selected
            const existingFilters = this.get('filters') || { class_id: '', grading_period_id: '', student_id: '' };
            if (!existingFilters.class_id && this.classes && this.classes.length > 0) {
                const firstClassId = String(this.classes[0].id);
                this.set('filters', { ...existingFilters, class_id: firstClassId });
            }

                  // Default: preselect the first active grading period if available, otherwise first period
      if (!existingFilters.grading_period_id && (this.periods || []).length > 0) {
        const firstActivePeriod = this.periods.find(p => p.is_active === 1);
        if (firstActivePeriod) {
          const firstActivePeriodId = String(firstActivePeriod.id);
          const next = { ...this.get('filters'), grading_period_id: firstActivePeriodId };
          this.set('filters', next);
        } else {
          const firstPeriodId = String(this.periods[0].id);
          const next = { ...this.get('filters'), grading_period_id: firstPeriodId };
          this.set('filters', next);
        }
      }

            // Default: preselect the first available student
            if (!existingFilters.student_id && this.students && this.students.length > 0) {
                const firstStudentId = String(this.students[0].id);
                const next = { ...this.get('filters'), student_id: firstStudentId };
                this.set('filters', next);
            }

            // If we have all required filters set, load grades automatically
            const finalFilters = this.get('filters');
            if (finalFilters.class_id && finalFilters.grading_period_id && finalFilters.student_id) {
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

            const { class_id, grading_period_id, student_id } = this.get('filters');
            
            // Require BOTH class and student to be selected before loading
            if (!class_id || !student_id) {
                this.set('grades', []);
                this.updateTableData();
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
            
            const response = await api.withToken(token).get('/teacher/student-grades', params);
            const existingGrades = response?.data?.data || [];

            // Get subjects from teacher's class data (same as working student grades page)
            const classSubjects = this.teacherClass.subjects || [];
            
            // Create a comprehensive grade report showing all subjects for this student
            const gradeReport = classSubjects.map(cs => {
                // Try to find existing grade for this subject
                const existingGrade = existingGrades.find(g => 
                    String(g.subject_id) === String(cs.id) // Changed from cs.subject_id to cs.id
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
                    subject_id: cs.id, // Changed from cs.subject_id to cs.id
                    subject_name: cs.name || '', // Changed from cs.subject_name to cs.name
                    subject_code: cs.code || '', // Changed from cs.subject_code to cs.code
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
            this.updateTableData();
            this.set('loading', false);
        } catch (error) {
            this.set('loading', false);
            Toast.show({ title: 'Error', message: error.response?.data?.message || 'Failed to load grades', variant: 'error', duration: 3000 });
        }
    }

    async loadStudentsByClass(classId) {
        try {
            this.set('loading', true);
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({ title: 'Authentication Error', message: 'Please log in to view data', variant: 'error', duration: 3000 });
                return;
            }

            // Use the correct API endpoint and params structure
            const response = await api.withToken(token).get('/teachers/students-by-class', { 
                class_id: classId 
            });
            
            if (response.data?.success) {
                this.set('students', response.data.data || []);
            } else {
                this.set('students', []);
            }
            
            this.updateTableData(); // Re-render to update student dropdown
        } catch (error) {
            Toast.show({ title: 'Error', message: error.response?.data?.message || 'Failed to load students', variant: 'error', duration: 3000 });
            this.set('students', []);
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
            student: [g.student_first_name, g.student_last_name].filter(Boolean).join(' ') || g.student_number || '',
            class: g.class_name ? `${g.class_name}${g.class_section ? ' ('+g.class_section+')' : ''}` : '',
            subject: g.subject_name || g.subject_code || '',
            period: g.grading_period_name || '',
            assign_total: this.formatNumber(g.assignment_total),
            exam_total: this.formatNumber(g.exam_total),
            final_pct: this.formatPercentage(g.final_percentage),
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
        const classOptions = (this.classes && this.classes.length > 0)
            ? this.classes.map(c => `<ui-option value="${c.id}">${c.name}</ui-option>`).join('')
            : '<ui-option value="" disabled>No classes assigned to you</ui-option>';
        
        const periodOptions = (this.periods || []).map(p => {
      const isActive = p.is_active === 1; // Check if is_active = 1
      return `<ui-option value="${p.id}" ${!isActive ? 'disabled' : ''}>${p.name}${!isActive ? ' (Inactive)' : ''}</ui-option>`;
    }).join('');
        const studentOptions = (this.students || []).map(s => `<ui-option value="${s.id}">${s.first_name} ${s.last_name} (${s.student_id})</ui-option>`).join('');

        const filters = this.get('filters') || { class_id: '', grading_period_id: '', student_id: '' };
        const { class_id, grading_period_id, student_id } = filters;
        
        // Get the selected class name for display
        const selectedClass = this.classes.find(c => String(c.id) === String(class_id));
        const classDisplayName = selectedClass ? `${selectedClass.name}${selectedClass.section ? ' - ' + selectedClass.section : ''}` : 'No class selected';
        
        return `
            <div class="bg-gray-100 rounded-md p-3 mb-4 border border-gray-300">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                        <label for="assigned-class" class="block text-xs text-gray-600 mb-1">Assigned Class</label>
                        <ui-input 
                            id="assigned-class"
                            name="assigned_class"
                            type="text" 
                            value="${classDisplayName}" 
                            readonly 
                            class="w-full"
                            placeholder="No class assigned">
                        </ui-input>
                    </div>
                    <div>
                        <label for="student-select" class="block text-xs text-gray-600 mb-1">Student</label>
                        <ui-search-dropdown 
                            id="student-select"
                            name="student_id" 
                            placeholder="Select student" 
                            class="w-full" 
                            value="${student_id || ''}">
                            ${studentOptions}
                        </ui-search-dropdown>
                    </div>
                    <div>
                        <label for="period-select" class="block text-xs text-gray-600 mb-1">Grading Period</label>
                        <ui-search-dropdown 
                            id="period-select"
                            name="grading_period_id" 
                            placeholder="All periods" 
                            class="w-full" 
                            value="${grading_period_id || ''}">
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
                    <ui-button type="button" data-action="print-student-report" variant="success" size="sm" ${(!class_id || !student_id) ? 'disabled' : ''}>
                        <i class="fas fa-print mr-1"></i> Print Student Report
                    </ui-button>
                </div>
            </div>
        `;
    }

    render() {
        const grades = this.get('grades');
        const loading = this.get('loading');
        const { class_id, student_id } = this.get('filters') || {};

        // Show skeleton loading during initial page load (check this FIRST)
        if (loading) {
            return `<data-skeleton></data-skeleton>`;
        }

        // Show complete "No Students to Report On" message if no class is assigned
        if (!this.classes || this.classes.length === 0) {
            return `
                <div class="space-y-6">
                    <div class="bg-white shadow rounded-lg p-8 text-center">
                        <div class="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <i class="fas fa-chalkboard-teacher text-3xl text-gray-400"></i>
                        </div>
                        <h3 class="text-lg font-medium text-gray-900 mb-2">No Students to Report On</h3>
                        <p class="text-gray-500 max-w-md mx-auto">
                            You don't have any students assigned to you for grade reporting. 
                            This usually means you need to be assigned to a class first.
                        </p>
                    </div>
                </div>
            `;
        }

        // Show message if no student is selected
        if (!student_id) {
            return `
                ${this.renderHeader()}
                ${this.renderFilters()}
                <div class="bg-white rounded-lg shadow-lg p-8 text-center">
                    <div class="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <i class="fas fa-user-graduate text-3xl text-gray-400"></i>
                    </div>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">Select a Student</h3>
                    <p class="text-gray-500 max-w-md mx-auto">
                        Choose a student from your assigned class to view their complete academic performance report.
                    </p>
                </div>
            `;
        }

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
            </div>
        `;
     }

    async printStudentReport() {
        try {
            const filters = this.get('filters') || {};
            const { class_id, student_id, grading_period_id } = filters;
            
            if (!class_id || !student_id) {
                Toast.show({ 
                    title: 'Print Error', 
                    message: 'Please select both class and student before printing', 
                    variant: 'error', 
                    duration: 3000 
                });
                return;
            }

            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({ 
                    title: 'Authentication Error', 
                    message: 'Please log in to print reports', 
                    variant: 'error', 
                    duration: 3000 
                });
                return;
            }

            // Build the print URL with current filters
            const params = new URLSearchParams({
                class_id: class_id,
                student_id: student_id,
                grading_period_id: grading_period_id || ''
            });

            const printUrl = `/api/teacher/print/student-report?${params.toString()}`;
            
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
        } catch (error) {
            console.error('Error printing student report:', error);
            Toast.show({ 
                title: 'Print Error', 
                message: 'Failed to generate print report', 
                variant: 'error', 
                duration: 3000 
            });
        }
    }
 }
 
 customElements.define('app-teacher-student-grade-report-page', TeacherStudentGradeReportPage);
 export default TeacherStudentGradeReportPage;