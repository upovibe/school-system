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
    this.loading = false;
    this.selectedClassId = null;
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

    // Current class id
    this.selectedClassId = this.classAssignments?.[0]?.class_id ?? null;
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
    const classDropdown = this.querySelector('ui-search-dropdown[data-field="class_id"]');
    if (classDropdown && this.selectedClassId) {
      classDropdown.setAttribute('value', String(this.selectedClassId));
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
      const classDropdown = this.querySelector('ui-search-dropdown[data-field="class_id"]');
      const subjectDropdown = this.querySelector('ui-search-dropdown[data-field="subject_ids"]');

      const newClassIdRaw = classDropdown ? classDropdown.value : null;
      const newClassId = newClassIdRaw ? parseInt(newClassIdRaw) : null;
      const subjectIds = subjectDropdown ? subjectDropdown.value : [];

      if (!newClassId || isNaN(newClassId)) {
        Toast.show({ title: 'Validation Error', message: 'Please select a class', variant: 'error', duration: 3000 });
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

      // Same class -> PUT update subjects
      if (currentClassId && newClassId === currentClassId) {
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

      // Class changed -> delete old, create new
      if (currentClassId) {
        await api.withToken(token).delete(`/teacher-assignments/teacher/${teacherId}/class/${currentClassId}`);
      }

      const createPromises = subjectIds.map(subjectId =>
        api.withToken(token).post('/teacher-assignments', {
          teacher_id: parseInt(teacherId),
          class_id: parseInt(newClassId),
          subject_id: parseInt(subjectId)
        })
      );
      const responses = await Promise.all(createPromises);
      const createdAssignments = responses.filter(r => r?.data?.success).map(r => r.data.data);

      Toast.show({ title: 'Success', message: 'Class and subjects updated successfully', variant: 'success', duration: 3000 });
      this.close();
      this.dispatchEvent(new CustomEvent('teacher-class-assignments-updated', {
        detail: {
          updatedAssignments: createdAssignments,
          teacherId,
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
    const teacherLabel = a ? `${a.teacher_first_name || 'N/A'} ${a.teacher_last_name || 'N/A'} (${a.employee_id || 'N/A'})` : 'N/A';

    this.innerHTML = `
      <ui-dialog ${this.hasAttribute('open') ? 'open' : ''} title="Edit Teacher Class & Subjects">
        <div slot="content">
          <div class="space-y-4">
            <!-- Teacher -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
              <div class="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-700">${teacherLabel}</div>
            </div>

            <!-- Current Class -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Current Class</label>
              <div class="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-700">${currentClassLabel}</div>
            </div>

            <!-- New Class -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Class *</label>
              ${this.classes.length > 0 ? `
                <ui-search-dropdown data-field="class_id" placeholder="Search classes..." class="w-full">
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
          </div>
        </div>
      </ui-dialog>
    `;
  }
}

customElements.define('teacher-assignment-update-dialog', TeacherAssignmentUpdateDialog);
export default TeacherAssignmentUpdateDialog;


