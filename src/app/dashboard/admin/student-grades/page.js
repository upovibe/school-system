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
        this.classSubjects = []; // Store subjects specific to selected class

        this.showAddModal = false;
        this.showUpdateModal = false;
        this.showViewModal = false;
        this.showDeleteDialog = false;
        this.updateGradeData = null;
        this.viewGradeData = null;
        this.deleteGradeData = null;
    }



    renderHeader() {
        const c = this.getGradeCounts();
        return `
            <div class="space-y-8 mb-4">
                <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-5 text-white">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
                        <div>
                            <div class="flex items-center gap-2">
                                <h1 class="text-2xl sm:text-3xl font-bold">Student Grades Overview</h1>
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
        document.title = 'Student Grades | School System';
        this.bootstrap();

        // Header actions (question mark button)
        this.addEventListener('click', this.handleHeaderActions.bind(this));

        // Table actions
        this.addEventListener('table-view', this.onView.bind(this));
        this.addEventListener('table-edit', this.onEdit.bind(this));
        this.addEventListener('table-delete', this.onDelete.bind(this));
        this.addEventListener('table-add', this.onAdd.bind(this));
        this.addEventListener('table-custom-action', this.onCustomAction.bind(this));

        // Keep page state in sync when modals close via backdrop/X
        this.addEventListener('modal-close', () => this.closeAllModals());
        this.addEventListener('modal-closed', () => this.closeAllModals());

        // Modal events (live updates)
        this.addEventListener('student-grade-deleted', (event) => {
            const deletedId = event.detail.gradeId;
            const current = this.get('grades') || [];
            this.set('grades', current.filter(g => g.id !== deletedId));
            this.render();
            this.set('showDeleteDialog', false);
        });

        this.addEventListener('student-grade-saved', (event) => {
            const newItem = event.detail.grade;
            if (newItem) {
                const current = this.get('grades') || [];
                this.set('grades', [newItem, ...current]);
                this.render();
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
                this.render();
                this.set('showUpdateModal', false);
            } else {
                this.loadGrades();
            }
        });

        // Filter interactions
        this.addEventListener('change', (e) => {
            const dd = e.target.closest('ui-search-dropdown');
            if (!dd) return;
            
            // Any dropdown change should close any open modal
            this.closeAllModals();
            const name = dd.getAttribute('name');
            const value = dd.value;
            
            if (!name) return;
            const next = { ...this.get('filters'), [name]: value };
            this.set('filters', next);
            
            if (name === 'class_id') {
                this.loadStudentsByClass(value);
            }
            
            // Only load when BOTH class and subject are selected
            const readyToLoad = Boolean(next.class_id && String(next.class_id).length > 0 && next.subject_id && String(next.subject_id).length > 0);
            if (readyToLoad) { this.loadGrades(); }
            
            // When class changes, load subjects for that class and auto-select first subject
            if (name === 'class_id' && value) {
                // Clear current subject selection first
                const currentFilters = this.get('filters');
                this.set('filters', { ...currentFilters, subject_id: '' });
                this.render(); // Re-render to clear subject dropdown
                
                // Load new class subjects and auto-select first one
                this.loadClassSubjectsAndAutoSelect(value);
            }
            
            // When subject or period changes, reload grades only if class + subject are set
            if (name === 'subject_id' || name === 'grading_period_id') {
                const f = this.get('filters');
                const both = Boolean(f.class_id && String(f.class_id).length > 0 && f.subject_id && String(f.subject_id).length > 0);
                if (both) { this.loadGrades(); }
                else {
                    // Clear table if not ready
                    this.set('grades', []);
                    this.render();
                }
            }
            
            // When grading period changes, re-render to update custom actions
            if (name === 'grading_period_id') {
                // Force a re-render to update custom actions based on grading period selection
                setTimeout(() => {
                    this.render();
                }, 100);
            }
        });

        this.addEventListener('click', (e) => {
            const applyBtn = e.target.closest('[data-action="apply-filters"]');
            if (applyBtn) {
                e.preventDefault();
                this.closeAllModals();
                const f = this.get('filters');
                const both = Boolean(f.class_id && String(f.class_id).length > 0 && f.subject_id && String(f.subject_id).length > 0);
                if (both) { this.loadGrades(); } else { this.set('grades', []); this.render(); }
                return;
            }
            const clearBtn = e.target.closest('[data-action="clear-filters"]');
            if (clearBtn) {
                e.preventDefault();
                this.closeAllModals();
                const defaults = { class_id: '', subject_id: '', grading_period_id: '', student_id: '' };
                this.set('filters', defaults);
                this.students = [];
                this.set('grades', []);
                this.render();
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
                    const next = { ...currentFilters, class_id: lastId, subject_id: '' };
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
            if (!token || !classId) { 
                this.students = []; 
                return; 
            }
            
            const resp = await api.withToken(token).get('/students/by-class', { class_id: classId });
            this.students = resp.data.data || [];
            
            // Auto-select all students in the class (no individual student selection needed)
            // Clear any existing student filter since we want all students in the class
            const flt = this.get('filters');
            this.set('filters', { ...flt, student_id: '' });
        } catch (error) {
            console.error('Error in loadStudentsByClass:', error);
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
        } catch (_) {
            return [];
        }
    }

    async loadClassSubjectsAndAutoSelect(classId) {
        try {
            const classSubjects = await this.loadClassSubjects(classId);
            // Update and render only class-specific subjects
            this.classSubjects = classSubjects;
            this.updateSubjectDropdown(classSubjects);
            
            // Auto-select the first subject for the selected class (like teacher page)
            if (classSubjects && classSubjects.length > 0) {
                const firstSubjectId = String(classSubjects[0].id);
                const currentFilters = this.get('filters');
                this.set('filters', { ...currentFilters, subject_id: firstSubjectId });
                
                // Update the dropdown to reflect the selected value
                this.updateSubjectDropdown(classSubjects);
            } else {
                // Clear subject selection if no subjects available
                const currentFilters = this.get('filters');
                this.set('filters', { ...currentFilters, subject_id: '' });
            }
        } catch (error) {
            console.error('Error loading class subjects:', error);
        }
    }

    updateSubjectDropdown(classSubjects) {
        // Find the subject dropdown and update its options
        const subjectDropdown = this.querySelector('ui-search-dropdown[name="subject_id"]');
        if (subjectDropdown) {
            // Clear existing options
            subjectDropdown.innerHTML = '';
            
            // Add options for subjects assigned to this class
            classSubjects.forEach(subject => {
                const option = document.createElement('ui-option');
                option.setAttribute('value', subject.id);
                option.textContent = subject.name;
                subjectDropdown.appendChild(option);
            });
            
            // Set the selected value based on current filters
            const currentFilters = this.get('filters') || {};
            if (currentFilters.subject_id) {
                subjectDropdown.setAttribute('value', currentFilters.subject_id);
            }
        }
    }

    createGradeEntriesForClass(classId, subjectId, gradingPeriodId) {
        try {
            const token = localStorage.getItem('token');
            if (!token || !classId) {
                return;
            }

            // Get the selected class and subject info
            const selectedClass = this.classes.find(c => String(c.id) === String(classId));
            const selectedSubject = this.classSubjects.find(s => String(s.id) === String(subjectId));
            const selectedPeriod = this.periods.find(p => String(p.id) === String(gradingPeriodId));

            // Create grade entries for all students in the class
            const gradeEntries = this.students.map(student => {
                // Try to find existing grade for this student
                const existingGrade = this.get('grades')?.find(g => 
                    String(g.student_id) === String(student.id) && 
                    String(g.class_id) === String(classId) &&
                    (!subjectId || String(g.subject_id) === String(subjectId)) &&
                    (!gradingPeriodId || String(g.grading_period_id) === String(gradingPeriodId))
                );

                if (existingGrade) {
                    return existingGrade;
                }

                // Create a new grade entry structure for grading
                const newEntry = {
                    id: null, // Will be set when saved
                    student_id: student.id,
                    student_first_name: student.first_name,
                    student_last_name: student.last_name,
                    student_number: student.student_id,
                    class_id: classId,
                    class_name: selectedClass?.name || '',
                    class_section: selectedClass?.section || '',
                    subject_id: subjectId || '',
                    subject_name: selectedSubject?.name || '',
                    subject_code: selectedSubject?.code || '',
                    grading_period_id: gradingPeriodId || '',
                    grading_period_name: selectedPeriod?.name || '',
                    assignment_total: null,
                    exam_total: null,
                    final_percentage: null,
                    final_letter_grade: null,
                    created_at: null,
                    updated_at: null,
                    is_new: true // Flag to indicate this is a new entry for grading
                };
                
                return newEntry;
            });

            this.set('grades', gradeEntries);
            // Force a full re-render to ensure custom actions are properly updated
            this.render();
        } catch (error) {
            console.error('Error creating grade entries:', error);
            Toast.show({ title: 'Error', message: 'Failed to create grade entries for class', variant: 'error', duration: 3000 });
        }
    }

    getCustomActions() {
        // Use showField flags from the table row instead of functions (which can't be JSON-serialized)
        return [
            {
                name: 'add-grade',
                label: 'Add',
                icon: 'fas fa-plus',
                variant: 'primary',
                size: 'sm',
                showField: 'can_add'
            },
            {
                name: 'edit-grade',
                label: 'Edit',
                icon: 'fas fa-edit',
                variant: 'secondary',
                size: 'sm',
                showField: 'can_edit'
            }
        ];
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
            
            // Require BOTH class and subject to be selected before loading
            if (!class_id || !subject_id) {
                this.set('grades', []);
                this.render();
                this.set('loading', false);
                // No toast here to avoid noise while selecting filters
                return;
            }

            // If class is selected, fetch existing grades for the class with optional filters
            if (class_id) {
                await this.loadStudentsByClass(class_id);
                const params = { class_id };
                if (subject_id) params.subject_id = subject_id;
                if (grading_period_id) params.grading_period_id = grading_period_id;
                const response = await api.withToken(token).get('/student-grades', params);
                const existingGrades = response?.data?.data || [];

                // Build per-student rows (existing grade or placeholder)
                const selectedClass = (this.classes || []).find(c => String(c.id) === String(class_id));
                const selectedSubject = (this.classSubjects || []).find(s => String(s.id) === String(subject_id));
                const selectedPeriod = (this.periods || []).find(p => String(p.id) === String(grading_period_id));

                const byStudentId = new Map();
                existingGrades.forEach(g => { byStudentId.set(String(g.student_id), { ...g, is_new: false }); });

                const merged = (this.students || []).map(student => {
                    const key = String(student.id);
                    if (byStudentId.has(key)) {
                        const g = byStudentId.get(key);
                        return { ...g, is_new: false };
                    }
                    // Placeholder row (no grade yet for this subject/period)
                    return {
                        id: null,
                        student_id: student.id,
                        student_first_name: student.first_name,
                        student_last_name: student.last_name,
                        student_number: student.student_id,
                        class_id: class_id,
                        class_name: selectedClass?.name || '',
                        class_section: selectedClass?.section || '',
                        subject_id: subject_id,
                        subject_name: selectedSubject?.name || '',
                        subject_code: selectedSubject?.code || '',
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

                this.set('grades', merged);
                this.render();
                this.set('loading', false);
                return;
            }

            // Original logic for individual student grades
            const params = {};
            if (class_id) params.class_id = class_id;
            if (student_id) params.student_id = student_id;
            if (subject_id) params.subject_id = subject_id;
            if (grading_period_id) params.grading_period_id = grading_period_id;

            const response = await api.withToken(token).get('/student-grades', params);
            this.set('grades', response.data.data || []);
            this.render();
            this.set('loading', false);
        } catch (error) {
            console.error('Error in loadGrades:', error);
            this.set('loading', false);
            Toast.show({ title: 'Error', message: error.response?.data?.message || 'Failed to load grades', variant: 'error', duration: 3000 });
        }
    }

    onView(event) {
        const { detail } = event;
        const item = (this.get('grades') || []).find(g => {
            // For new entries, match by student_id and other identifiers
            if (detail.row.is_new) {
                return g.student_id === detail.row.student_id && g.is_new;
            }
            // For existing entries, match by id
            return g.id === detail.row.id;
        });
        
        if (item) {
            this.closeAllModals();
            this.set('viewGradeData', item);
            this.set('showViewModal', true);
            setTimeout(() => {
                const modal = this.querySelector('student-grade-view-modal');
                if (modal) { 
                    modal.setGradeData(item); 
                    modal.open?.(); 
                }
            }, 0);
        }
    }

    onEdit(event) {
        const { detail } = event;
        const item = (this.get('grades') || []).find(g => {
            // For new entries, match by student_id and other identifiers
            if (detail.row.is_new) {
                return g.student_id === detail.row.student_id && g.is_new;
            }
            // For existing entries, match by id
            return g.id === detail.row.id;
        });
        
        if (item) {
            this.closeAllModals();
            this.set('updateGradeData', item);
            this.set('showUpdateModal', true);
            setTimeout(() => {
                const modal = this.querySelector('student-grade-update-modal');
                if (modal) { 
                    modal.setGradeData(item); 
                    modal.open?.(); 
                }
            }, 0);
        }
    }

    onDelete(event) {
        const { detail } = event;
        const item = (this.get('grades') || []).find(g => {
            // For new entries, match by student_id and other identifiers
            if (detail.row.is_new) {
                return g.student_id === detail.row.student_id && g.is_new;
            }
            // For existing entries, match by id
            return g.id === detail.row.id;
        });
        
        if (item) {
            this.closeAllModals();
            this.set('deleteGradeData', item);
            this.set('showDeleteDialog', true);
            setTimeout(() => {
                const dialog = this.querySelector('student-grade-delete-dialog');
                if (dialog) { 
                    dialog.setGradeData(item); 
                    dialog.open?.(); 
                }
            }, 0);
        }
    }

    onAdd() {
        this.closeAllModals();
        this.set('showAddModal', true);
        setTimeout(() => {
            const modal = this.querySelector('student-grade-add-modal');
            if (modal) {
                modal.setFilterPrefill(this.get('filters') || {}, { 
                    classes: this.classes, 
                    subjects: this.classSubjects, 
                    periods: this.periods 
                });
                modal.open?.();
            }
        }, 0);
    }

    onCustomAction(event) {
        const { actionName, action, row } = event.detail;
        const act = actionName || action;
        
        if (act === 'add-grade') {
            // Find the grade data for this student
            const gradeData = this.get('grades')?.find(g => g.student_id === row.student_id);
            if (gradeData) {
                this.closeAllModals();
                this.set('showAddModal', true);
                setTimeout(() => {
                    const modal = this.querySelector('student-grade-add-modal');
                    if (modal) {
                        // Pre-fill the modal with the student's data and current filters
                        const filters = this.get('filters') || {};
                        const prefillData = {
                            ...filters,
                            student_id: gradeData.student_id,
                            student_name: `${gradeData.student_first_name} ${gradeData.student_last_name}`.trim()
                        };
                        modal.setFilterPrefill(prefillData, { 
                            classes: this.classes, 
                            subjects: this.classSubjects, 
                            periods: this.periods 
                        });
                        modal.open?.();
                    }
                }, 0);
            }
        }

        if (act === 'edit-grade') {
            const existing = this.get('grades')?.find(g => g.student_id === row.student_id && !g.is_new);
            if (existing) {
                this.closeAllModals();
                this.set('updateGradeData', existing);
                this.set('showUpdateModal', true);
                setTimeout(() => {
                    const modal = this.querySelector('student-grade-update-modal');
                    if (modal) { 
                        modal.setGradeData(existing); 
                        modal.open?.(); 
                    }
                }, 0);
            }
        }
    }

    renderFilters() {
        const classOptions = (this.classes || []).map(c => `<ui-option value="${c.id}">${c.name}${c.section ? ' - '+c.section : ''}</ui-option>`).join('');
        const subjectOptions = (this.classSubjects && this.classSubjects.length > 0)
            ? this.classSubjects.map(s => `<ui-option value="${s.id}">${s.name}</ui-option>`).join('')
            : '<ui-option value="" disabled>No subjects assigned to this class</ui-option>';
        const periodOptions = (this.periods || []).map(p => `<ui-option value="${p.id}">${p.name}</ui-option>`).join('');

        const filters = this.get('filters') || { class_id: '', subject_id: '', grading_period_id: '', student_id: '' };
        const { class_id, subject_id, grading_period_id } = filters;
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

        const currentFilters = this.get('filters') || { class_id: '', subject_id: '', grading_period_id: '', student_id: '' };
        const periodSelected = Boolean(currentFilters.grading_period_id && String(currentFilters.grading_period_id).length > 0);
        const tableData = grades ? grades.map((g, index) => {
            const hasGrades = g.assignment_total !== null || g.exam_total !== null;
            const canAdd = periodSelected && (g.is_new === true || !g.id) && !hasGrades;
            const canEdit = periodSelected ? (!g.is_new && hasGrades) : Boolean(g.id);
            return ({
            id: g.id || `new_${g.student_id}_${index}`,
            index: index + 1,
            student: ([g.student_first_name, g.student_last_name].filter(Boolean).join(' ') || g.student_number || ''),
            class: g.class_name ? `${g.class_name}${g.class_section ? ' ('+g.class_section+')' : ''}` : '',
            subject: g.subject_name || '',
            period: g.grading_period_name || '',
            assign_total: this.formatNumber(g.assignment_total),
            exam_total: this.formatNumber(g.exam_total),
            final_pct: this.formatNumber(g.final_percentage),
            final_grade: g.final_letter_grade || (g.is_new ? 'Not Graded' : ''),
            updated: g.updated_at ? new Date(g.updated_at).toLocaleDateString() : (g.is_new ? 'Pending' : ''),
            // Add metadata for custom actions
            student_id: g.student_id,
            is_new: g.is_new,
            has_grades: hasGrades,
            can_add: canAdd,
            can_edit: canEdit
        }); }) : [];

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

        const filters = currentFilters;
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
                            action
                            actions="view, delete"
                            refresh
                            print
                            bordered
                            striped
                            custom-actions='${JSON.stringify(this.getCustomActions())}'
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

    closeAllModals() {
        this.set('showAddModal', false);
        this.set('showUpdateModal', false);
        this.set('showViewModal', false);
        this.set('showDeleteDialog', false);
        this.set('updateGradeData', null);
        this.set('viewGradeData', null);
        this.set('deleteGradeData', null);
    }
}

customElements.define('app-student-grades-management-page', StudentGradesManagementPage);
export default StudentGradesManagementPage;


