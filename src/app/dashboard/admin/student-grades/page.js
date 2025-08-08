import App from '@/core/App.js';
import '@/components/ui/Table.js';
import '@/components/ui/Modal.js';
import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Skeleton.js';
import '@/components/ui/Button.js';
import '@/components/ui/SearchDropdown.js';
import '@/components/layout/adminLayout/StudentGradeAddModal.js';
import '@/components/layout/adminLayout/StudentGradeUpdateModal.js';
import '@/components/layout/adminLayout/StudentGradeViewModal.js';
import '@/components/layout/adminLayout/StudentGradeDeleteDialog.js';
import api from '@/services/api.js';

/**
 * Student Grades Management Page (Admin/Teacher)
 * - Uses filter toolbar (Class, Subject, Period, Student) to fetch grades
 * - Mirrors live update patterns used by grading periods/policies pages
 */
class StudentGradesManagementPage extends App {
    constructor() {
        super();
        this.grades = null;
        this.loading = false;
        this.filters = { class_id: '', subject_id: '', grading_period_id: '', student_id: '' };
        // Initialize reactive state for filters to avoid undefined access during first render
        this.set('filters', { ...this.filters });
        this.classes = [];
        this.subjects = [];
        this.periods = [];
        this.students = [];

        this.showAddModal = false;
        this.showUpdateModal = false;
        this.showViewModal = false;
        this.showDeleteDialog = false;
        this.updateGradeData = null;
        this.viewGradeData = null;
        this.deleteGradeData = null;
    }

    connectedCallback() {
        super.connectedCallback();
        document.title = 'Student Grades | School System';
        this.bootstrap();

        // Table actions
        this.addEventListener('table-view', this.onView.bind(this));
        this.addEventListener('table-edit', this.onEdit.bind(this));
        this.addEventListener('table-delete', this.onDelete.bind(this));
        this.addEventListener('table-add', this.onAdd.bind(this));

        // Modal events (live updates)
        this.addEventListener('student-grade-deleted', (event) => {
            const deletedId = event.detail.gradeId;
            const current = this.get('grades') || [];
            this.set('grades', current.filter(g => g.id !== deletedId));
            this.updateTableData();
            this.set('showDeleteDialog', false);
        });

        this.addEventListener('student-grade-saved', (event) => {
            const newItem = event.detail.grade;
            if (newItem) {
                const current = this.get('grades') || [];
                this.set('grades', [newItem, ...current]);
                this.updateTableData();
                this.set('showAddModal', false);
            } else {
                this.loadGrades();
            }
        });

        this.addEventListener('student-grade-updated', (event) => {
            const updated = event.detail.grade;
            if (updated) {
                const current = this.get('grades') || [];
                const mapped = current.map(g => g.id === updated.id ? updated : g);
                this.set('grades', mapped);
                this.updateTableData();
                this.set('showUpdateModal', false);
            } else {
                this.loadGrades();
            }
        });

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
            const [classesResp, subjectsResp, periodsResp] = await Promise.all([
                api.withToken(token).get('/classes'),
                api.withToken(token).get('/subjects'),
                api.withToken(token).get('/grading-periods'),
            ]);
            this.classes = classesResp.data.data || [];
            this.subjects = subjectsResp.data.data || [];
            this.periods = periodsResp.data.data || [];
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

    onView(event) {
        const { detail } = event;
        const item = (this.get('grades') || []).find(g => g.id === detail.row.id);
        if (item) {
            this.closeAllModals();
            this.set('viewGradeData', item);
            this.set('showViewModal', true);
            setTimeout(() => {
                const modal = this.querySelector('student-grade-view-modal');
                if (modal) modal.setGradeData(item);
            }, 0);
        }
    }

    onEdit(event) {
        const { detail } = event;
        const item = (this.get('grades') || []).find(g => g.id === detail.row.id);
        if (item) {
            this.closeAllModals();
            this.set('updateGradeData', item);
            this.set('showUpdateModal', true);
            setTimeout(() => {
                const modal = this.querySelector('student-grade-update-modal');
                if (modal) modal.setGradeData(item);
            }, 0);
        }
    }

    onDelete(event) {
        const { detail } = event;
        const item = (this.get('grades') || []).find(g => g.id === detail.row.id);
        if (item) {
            this.closeAllModals();
            this.set('deleteGradeData', item);
            this.set('showDeleteDialog', true);
            setTimeout(() => {
                const dialog = this.querySelector('student-grade-delete-dialog');
                if (dialog) dialog.setGradeData(item);
            }, 0);
        }
    }

    onAdd() {
        this.closeAllModals();
        this.set('showAddModal', true);
        setTimeout(() => {
            const modal = this.querySelector('student-grade-add-modal');
            if (modal) modal.setFilterPrefill(this.filters, { classes: this.classes, subjects: this.subjects, periods: this.periods });
        }, 0);
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
            assign_total: g.assignment_total,
            exam_total: g.exam_total,
            final_pct: g.final_percentage,
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
        const subjectOptions = (this.subjects || []).map(s => `<ui-option value="${s.id}">${s.name}</ui-option>`).join('');
        const periodOptions = (this.periods || []).map(p => `<ui-option value="${p.id}">${p.name}</ui-option>`).join('');
        const studentOptions = (this.students || []).map(s => `<ui-option value="${s.id}">${s.first_name} ${s.last_name} (${s.student_id})</ui-option>`).join('');

        const filters = this.get('filters') || { class_id: '', subject_id: '', grading_period_id: '', student_id: '' };
        const { class_id, subject_id, grading_period_id, student_id } = filters;
        return `
            <div class="bg-white rounded-md p-3 mb-4 border border-gray-200">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                        <label class="block text-xs text-gray-600 mb-1">Class</label>
                        <ui-search-dropdown name="class_id" placeholder="Select class" class="w-full" value="${class_id || ''}">
                            ${classOptions}
                        </ui-search-dropdown>
                    </div>
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
        const showAddModal = this.get('showAddModal');
        const showUpdateModal = this.get('showUpdateModal');
        const showViewModal = this.get('showViewModal');
        const showDeleteDialog = this.get('showDeleteDialog');

        const tableData = grades ? grades.map((g, index) => ({
            id: g.id,
            index: index + 1,
            student: ([g.student_first_name, g.student_last_name].filter(Boolean).join(' ') || g.student_number || ''),
            class: g.class_name ? `${g.class_name}${g.class_section ? ' ('+g.class_section+')' : ''}` : '',
            subject: g.subject_name || '',
            period: g.grading_period_name || '',
            assign_total: g.assignment_total,
            exam_total: g.exam_total,
            final_pct: g.final_percentage,
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
            { key: 'final_grade', label: 'Letter' },
            { key: 'updated', label: 'Updated' }
        ];

        return `
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
                            action
                            addable
                            refresh
                            print
                            bordered
                            striped
                            class="w-full">
                        </ui-table>
                    </div>
                `}
            </div>

            <student-grade-add-modal ${showAddModal ? 'open' : ''}></student-grade-add-modal>
            <student-grade-update-modal ${showUpdateModal ? 'open' : ''}></student-grade-update-modal>
            <student-grade-view-modal ${showViewModal ? 'open' : ''}></student-grade-view-modal>
            <student-grade-delete-dialog ${showDeleteDialog ? 'open' : ''}></student-grade-delete-dialog>
        `;
    }
}

customElements.define('app-student-grades-management-page', StudentGradesManagementPage);
export default StudentGradesManagementPage;


