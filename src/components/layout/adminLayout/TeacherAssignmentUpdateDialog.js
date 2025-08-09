import '@/components/ui/Dialog.js';
import '@/components/ui/SearchDropdown.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

/**
 * Teacher Assignment Update Dialog
 *
 * Edit a teacher's class and subjects for a specific class assignment.
 * Works for:
 * - Single assignment: setTeacherAssignmentData(primaryAssignment)
 * - Teacher-level edit: setTeacherAssignmentData(primaryAssignment, teacherAssignments)
 */
class TeacherAssignmentUpdateDialog extends HTMLElement {
  constructor() {
    super();
    this.primaryAssignment = null;
    this.teacherAssignments = null; // optional array
    this.classAssignments = []; // assignments limited to one class
    this.classes = [];
    this.subjects = [];
    this.teachers = [];
    this.loading = false;
    this.selectedClassIds = [];
  }

  static get observedAttributes() {
    return ['open'];
  }

  attributeChangedCallback(name, _old, newVal) {
    if (name === 'open' && newVal !== null) {
      this.render();
    }
  }

  connectedCallback() {
    this.render();
    this.loadTeachers();
    this.loadClasses();
    this.loadSubjects();
    this.addEventListener('confirm', this.save.bind(this));
  }

  setTeacherAssignmentData(primaryAssignment, teacherAssignments) {
    this.primaryAssignment = primaryAssignment || null;
    this.teacherAssignments = Array.isArray(teacherAssignments) ? teacherAssignments : null;

    // Determine the working class assignments (for the selected class)
    if (this.teacherAssignments && this.primaryAssignment) {
      this.classAssignments = this.teacherAssignments.filter(a =>
        a.class_name === this.primaryAssignment.class_name &&
        a.class_section === this.primaryAssignment.class_section
      );
    } else if (this.primaryAssignment) {
      this.classAssignments = [this.primaryAssignment];
    } else {
      this.classAssignments = [];
    }

    // Current class ids (default to existing single class)
    const existingClassId = this.classAssignments?.[0]?.class_id ?? null;
    this.selectedClassIds = existingClassId ? [existingClassId] : [];
    this.render();

    // After render and after options load, set dropdown defaults
    setTimeout(() => this.syncDropdownSelections(), 100);
  }

  async loadClasses() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await api.withToken(token).get('/classes');
      if (res.status === 200 && res.data.success) {
        this.classes = res.data.data;
        this.render();
        this.syncDropdownSelections();
      }
    } catch (_) { /* silent */ }
  }

  async loadTeachers() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await api.withToken(token).get('/teachers');
      if (res.status === 200 && res.data.success) {
        this.teachers = res.data.data;
        this.render();
        this.syncDropdownSelections();
      }
    } catch (_) { /* silent */ }
  }

  async loadSubjects() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await api.withToken(token).get('/subjects');
      if (res.status === 200 && res.data.success) {
        this.subjects = res.data.data;
        this.render();
        this.syncDropdownSelections();
      }
    } catch (_) { /* silent */ }
  }

  syncDropdownSelections() {
    const classDropdown = this.querySelector('ui-search-dropdown[data-field="class_ids"]');
    if (classDropdown && this.selectedClassIds?.length) {
      classDropdown.setAttribute('value', JSON.stringify(this.selectedClassIds));
    }

    const teacherDropdown = this.querySelector('ui-search-dropdown[data-field="teacher_id"]');
    if (teacherDropdown && this.primaryAssignment?.teacher_id) {
      teacherDropdown.setAttribute('value', String(this.primaryAssignment.teacher_id));
    }

    const subjectDropdown = this.querySelector('ui-search-dropdown[data-field="subject_ids"]');
    if (subjectDropdown && this.classAssignments?.length) {
      const currentSubjectIds = this.classAssignments
        .map(a => a.subject_id)
        .filter(id => id && !isNaN(id));
      subjectDropdown.setAttribute('value', JSON.stringify(currentSubjectIds));

      if (this.subjects?.length) {
        const selected = this.subjects.filter(s => currentSubjectIds.includes(s.id));
        const displayValue = selected.map(s => `${s.name} (${s.code})`).join(', ');
        subjectDropdown.setAttribute('display-value', displayValue);
      }
    }
  }

  async save() {
    if (this.loading || !this.primaryAssignment) return;

    const token = localStorage.getItem('token');
    if (!token) {
      Toast.show({ title: 'Authentication Error', message: 'Please log in to continue', variant: 'error', duration: 3000 });
      return;
    }

    try {
      this.setLoading(true);
      const classDropdown = this.querySelector('ui-search-dropdown[data-field="class_ids"]');
      const subjectDropdown = this.querySelector('ui-search-dropdown[data-field="subject_ids"]');
      const teacherDropdown = this.querySelector('ui-search-dropdown[data-field="teacher_id"]');

      const selectedClassIds = classDropdown ? classDropdown.value : [];
      const subjectIds = subjectDropdown ? subjectDropdown.value : [];
      const selectedTeacherIdRaw = teacherDropdown ? teacherDropdown.value : null;
      const selectedTeacherId = selectedTeacherIdRaw ? parseInt(selectedTeacherIdRaw) : null;

      if (!selectedTeacherId || isNaN(selectedTeacherId)) {
        Toast.show({ title: 'Validation Error', message: 'Please select a teacher', variant: 'error', duration: 3000 });
        return;
      }
      if (!Array.isArray(selectedClassIds) || selectedClassIds.length === 0) {
        Toast.show({ title: 'Validation Error', message: 'Please select at least one class', variant: 'error', duration: 3000 });
        return;
      }
      if (!Array.isArray(subjectIds) || subjectIds.length === 0) {
        Toast.show({ title: 'Validation Error', message: 'Please select at least one subject', variant: 'error', duration: 3000 });
        return;
      }

      const teacherId = this.primaryAssignment.teacher_id;
      const employeeId = this.primaryAssignment.employee_id;
      const currentClassId = this.classAssignments?.[0]?.class_id ?? null;
      const oldClassName = this.primaryAssignment.class_name;
      const oldClassSection = this.primaryAssignment.class_section;
      const teacherChanged = selectedTeacherId !== teacherId;

      // Simple update case: same teacher, single class equals current -> PUT subjects
      if (!teacherChanged && currentClassId && selectedClassIds.length === 1 && parseInt(selectedClassIds[0]) === currentClassId) {
        const res = await api.withToken(token).put(`/teacher-assignments/teacher/${teacherId}/class/${currentClassId}`, {
          subject_ids: subjectIds
        });

        if (res?.data?.success) {
          Toast.show({ title: 'Success', message: 'Updated subjects successfully', variant: 'success', duration: 3000 });
          this.close();
          this.dispatchEvent(new CustomEvent('teacher-class-assignments-updated', {
            detail: {
              updatedAssignments: res.data.data.assignments,
              teacherId,
              employeeId,
              className: oldClassName,
              classSection: oldClassSection
            },
            bubbles: true,
            composed: true
          }));
          return;
        }
        throw new Error(res?.data?.message || 'Failed to update subjects');
      }

      // Complex update: teacher and/or classes changed -> delete old then recreate for each selected class under selected teacher
      if (currentClassId) {
        await api.withToken(token).delete(`/teacher-assignments/teacher/${teacherId}/class/${currentClassId}`);
      }

      const createPromises = [];
      selectedClassIds.forEach(cid => {
        subjectIds.forEach(subjectId => {
          createPromises.push(
            api.withToken(token).post('/teacher-assignments', {
              teacher_id: parseInt(selectedTeacherId),
              class_id: parseInt(cid),
              subject_id: parseInt(subjectId)
            })
          );
        });
      });
      const responses = await Promise.all(createPromises);
      const createdAssignments = responses.filter(r => r?.data?.success).map(r => r.data.data);

      Toast.show({ title: 'Success', message: 'Teacher, classes and subjects updated successfully', variant: 'success', duration: 3000 });
      this.close();
      this.dispatchEvent(new CustomEvent('teacher-class-assignments-updated', {
        detail: {
          updatedAssignments: createdAssignments,
          teacherId, // old teacher id to remove old entries
          employeeId,
          className: oldClassName, // remove old entries
          classSection: oldClassSection
        },
        bubbles: true,
        composed: true
      }));
    } catch (error) {
      console.error('Update failed:', error);
      Toast.show({ title: 'Error', message: error.response?.data?.message || 'Failed to update assignment', variant: 'error', duration: 3000 });
    } finally {
      this.setLoading(false);
    }
  }

  setLoading(loading) {
    this.loading = loading;
  }

  open() { this.setAttribute('open', ''); }
  close() { this.removeAttribute('open'); }

  render() {
    const a = this.primaryAssignment;
    const currentClassLabel = a ? `${a.class_name || 'N/A'} - ${a.class_section || 'N/A'}` : 'N/A';
    const currentTeacherLabel = a ? `${a.teacher_first_name || 'N/A'} ${a.teacher_last_name || 'N/A'} (${a.employee_id || 'N/A'})` : 'N/A';

    this.innerHTML = `
      <ui-dialog ${this.hasAttribute('open') ? 'open' : ''} title="Edit Teacher Class & Subjects">
        <div slot="content">
          <div class="space-y-4">
            <!-- Current Teacher (read-only) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Current Teacher</label>
              <div class="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-700">${currentTeacherLabel}</div>
            </div>

            <!-- New Teacher -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Teacher *</label>
              ${this.teachers.length > 0 ? `
                <ui-search-dropdown data-field="teacher_id" placeholder="Search teachers..." class="w-full">
                  ${this.teachers.map(t => `<ui-option value="${t.id}">${t.first_name} ${t.last_name} (${t.employee_id})</ui-option>`).join('')}
                </ui-search-dropdown>
              ` : `<div class="w-full h-8 bg-gray-200 rounded"></div>`}
            </div>

            <!-- Current Class -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Current Class</label>
              <div class="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-700">${currentClassLabel}</div>
            </div>

            <!-- New Classes -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Classes *</label>
              ${this.classes.length > 0 ? `
                <ui-search-dropdown data-field="class_ids" placeholder="Search and select multiple classes..." multiple class="w-full">
                  ${this.classes.map(cls => `<ui-option value="${cls.id}">${cls.name}-${cls.section}</ui-option>`).join('')}
                </ui-search-dropdown>
              ` : `<div class="w-full h-8 bg-gray-200 rounded"></div>`}
            </div>

            <!-- Subjects -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Subjects *</label>
              ${this.subjects.length > 0 ? `
                <ui-search-dropdown data-field="subject_ids" placeholder="Search and select multiple subjects..." multiple class="w-full">
                  ${this.subjects.map(s => `<ui-option value="${s.id}">${s.name} (${s.code})</ui-option>`).join('')}
                </ui-search-dropdown>
              ` : `<div class="w-full h-8 bg-gray-200 rounded"></div>`}
            </div>

            <!-- Current subjects note -->
            ${this.classAssignments?.length ? `
              <div class="mt-2 p-3 bg-blue-50 rounded-md">
                <p class="text-xs font-medium text-blue-700 mb-2">Current subjects for this class:</p>
                <div class="space-y-1">
                  ${this.classAssignments.map(asg => `<div class="text-xs text-blue-700">• ${asg.subject_name} (${asg.subject_code})</div>`).join('')}
                </div>
              </div>
            ` : ''}

            <!-- How it works -->
            <div class="p-3 rounded-md bg-blue-50 border border-blue-100 text-blue-800 text-sm">
              <div class="flex items-start space-x-2">
                <i class="fas fa-info-circle mt-0.5"></i>
                <div>
                  <p class="font-medium">How this works</p>
                  <ul class="list-disc pl-5 mt-1 space-y-1">
                    <li>Pick a teacher (defaults to current).</li>
                    <li>Select one or more destination classes.</li>
                    <li>Select one or more subjects.</li>
                    <li>If you keep the same single class, it only update the subjects. Otherwise, move the current assignments to the selected class(es).</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ui-dialog>
    `;
  }
}

customElements.define('teacher-assignment-update-dialog', TeacherAssignmentUpdateDialog);
export default TeacherAssignmentUpdateDialog;


