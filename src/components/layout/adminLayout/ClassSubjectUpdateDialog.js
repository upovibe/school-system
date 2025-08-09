import '@/components/ui/Dialog.js';
import '@/components/ui/SearchDropdown.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

/**
 * Class Subject Update Dialog
 *
 * Edit a class's subjects (optionally moving to other classes and/or different teacher).
 * Similar to TeacherAssignmentUpdateDialog but class-centric.
 *
 * Use setClassSubjectData({
 *   classId, className, classSection,
 *   teacherId, employeeId, teacherFirstName, teacherLastName,
 *   assignments: [ { class_id, class_name, class_section, subject_id, subject_name, subject_code, teacher_id, employee_id } ]
 * }) to seed defaults.
 */
class ClassSubjectUpdateDialog extends HTMLElement {
  constructor() {
    super();
    this.classData = null;
    this.teachers = [];
    this.classes = [];
    this.subjects = [];
    this.loading = false;

    this.selectedTeacherId = null;
    this.selectedClassIds = [];
    this.selectedSubjectIds = [];
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

  setClassSubjectData(data) {
    this.classData = data || null;

    // Prefill selections from provided data
    const first = data?.assignments?.[0] || null;
    const classId = data?.classId ?? first?.class_id ?? null;
    const teacherId = data?.teacherId ?? first?.teacher_id ?? null;
    const subjectIds = Array.isArray(data?.assignments)
      ? data.assignments.map(a => a.subject_id).filter(id => id && !isNaN(id))
      : [];

    this.selectedTeacherId = teacherId || null;
    this.selectedClassIds = classId ? [classId] : [];
    this.selectedSubjectIds = subjectIds;

    this.render();
    setTimeout(() => this.syncDropdownSelections(), 100);
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
    const teacherDropdown = this.querySelector('ui-search-dropdown[data-field="teacher_id"]');
    if (teacherDropdown && this.selectedTeacherId) {
      teacherDropdown.setAttribute('value', String(this.selectedTeacherId));
    }

    const classDropdown = this.querySelector('ui-search-dropdown[data-field="class_ids"]');
    if (classDropdown && this.selectedClassIds?.length) {
      classDropdown.setAttribute('value', JSON.stringify(this.selectedClassIds));
    }

    const subjectDropdown = this.querySelector('ui-search-dropdown[data-field="subject_ids"]');
    if (subjectDropdown && this.selectedSubjectIds?.length) {
      subjectDropdown.setAttribute('value', JSON.stringify(this.selectedSubjectIds));
      if (this.subjects?.length) {
        const selected = this.subjects.filter(s => this.selectedSubjectIds.includes(s.id));
        const displayValue = selected.map(s => `${s.name} (${s.code})`).join(', ');
        subjectDropdown.setAttribute('display-value', displayValue);
      }
    }
  }

  async save() {
    if (this.loading || !this.classData) return;

    const token = localStorage.getItem('token');
    if (!token) {
      Toast.show({ title: 'Authentication Error', message: 'Please log in to continue', variant: 'error', duration: 3000 });
      return;
    }

    try {
      this.setLoading(true);

      const teacherDropdown = this.querySelector('ui-search-dropdown[data-field="teacher_id"]');
      const classDropdown = this.querySelector('ui-search-dropdown[data-field="class_ids"]');
      const subjectDropdown = this.querySelector('ui-search-dropdown[data-field="subject_ids"]');

      const selectedTeacherIdRaw = teacherDropdown ? teacherDropdown.value : null;
      const selectedTeacherId = selectedTeacherIdRaw ? parseInt(selectedTeacherIdRaw) : null;
      const selectedClassIds = classDropdown ? classDropdown.value : [];
      const subjectIds = subjectDropdown ? subjectDropdown.value : [];

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

      const oldAssignment = this.classData?.assignments?.[0] || null;
      const oldTeacherId = oldAssignment?.teacher_id ?? this.classData?.teacherId ?? null;
      const oldEmployeeId = oldAssignment?.employee_id ?? this.classData?.employeeId ?? null;
      const oldClassId = oldAssignment?.class_id ?? this.classData?.classId ?? null;
      const oldClassName = this.classData?.className ?? oldAssignment?.class_name;
      const oldClassSection = this.classData?.classSection ?? oldAssignment?.class_section;

      // If same teacher and same single class, just PUT
      if (oldClassId && selectedClassIds.length === 1 && parseInt(selectedClassIds[0]) === oldClassId && selectedTeacherId === oldTeacherId) {
        const res = await api.withToken(token).put(`/teacher-assignments/teacher/${oldTeacherId}/class/${oldClassId}`, {
          subject_ids: subjectIds
        });

        if (res?.data?.success) {
          Toast.show({ title: 'Success', message: 'Updated subjects successfully', variant: 'success', duration: 3000 });
          this.close();
          this.dispatchEvent(new CustomEvent('teacher-class-assignments-updated', {
            detail: {
              updatedAssignments: res.data.data.assignments,
              teacherId: oldTeacherId,
              employeeId: oldEmployeeId,
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

      // Otherwise: delete old (if present) and create new combinations for selected teacher/classes/subjects
      if (oldTeacherId && oldClassId) {
        await api.withToken(token).delete(`/teacher-assignments/teacher/${oldTeacherId}/class/${oldClassId}`);
      }

      const createPromises = [];
      selectedClassIds.forEach(cid => {
        subjectIds.forEach(sid => {
          createPromises.push(
            api.withToken(token).post('/teacher-assignments', {
              teacher_id: parseInt(selectedTeacherId),
              class_id: parseInt(cid),
              subject_id: parseInt(sid)
            })
          );
        });
      });
      const responses = await Promise.all(createPromises);
      const createdAssignments = responses.filter(r => r?.data?.success).map(r => r.data.data);

      Toast.show({ title: 'Success', message: 'Class subjects updated successfully', variant: 'success', duration: 3000 });
      this.close();
      this.dispatchEvent(new CustomEvent('teacher-class-assignments-updated', {
        detail: {
          updatedAssignments: createdAssignments,
          teacherId: oldTeacherId, // parent uses this to remove prior entries
          employeeId: oldEmployeeId,
          className: oldClassName,
          classSection: oldClassSection
        },
        bubbles: true,
        composed: true
      }));
    } catch (error) {
      console.error('Class subjects update failed:', error);
      Toast.show({ title: 'Error', message: error.response?.data?.message || 'Failed to update class subjects', variant: 'error', duration: 3000 });
    } finally {
      this.setLoading(false);
    }
  }

  setLoading(loading) { this.loading = loading; }
  open() { this.setAttribute('open', ''); }
  close() { this.removeAttribute('open'); }

  render() {
    const d = this.classData;
    const currentClassLabel = d ? `${d.className || d.assignments?.[0]?.class_name || 'N/A'} - ${d.classSection || d.assignments?.[0]?.class_section || 'N/A'}` : 'N/A';
    const currentTeacherLabel = d ? `${d.teacherFirstName || d.assignments?.[0]?.teacher_first_name || 'N/A'} ${d.teacherLastName || d.assignments?.[0]?.teacher_last_name || 'N/A'} (${d.employeeId || d.assignments?.[0]?.employee_id || 'N/A'})` : 'N/A';

    this.innerHTML = `
      <ui-dialog ${this.hasAttribute('open') ? 'open' : ''} title="Edit Class Subjects">
        <div slot="content">
          <div class="space-y-4">
            <!-- Current Class -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Current Class</label>
              <div class="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-700">${currentClassLabel}</div>
            </div>

            <!-- Current Teacher -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Current Teacher</label>
              <div class="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-700">${currentTeacherLabel}</div>
            </div>

            <!-- Teacher -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Teacher *</label>
              ${this.teachers.length > 0 ? `
                <ui-search-dropdown data-field="teacher_id" placeholder="Search teachers..." class="w-full">
                  ${this.teachers.map(t => `<ui-option value="${t.id}">${t.first_name} ${t.last_name} (${t.employee_id})</ui-option>`).join('')}
                </ui-search-dropdown>
              ` : `<div class="w-full h-8 bg-gray-200 rounded"></div>`}
            </div>

            <!-- Classes -->
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
            ${d?.assignments?.length ? `
              <div class="mt-2 p-3 bg-blue-50 rounded-md">
                <p class="text-xs font-medium text-blue-700 mb-2">Current subjects for this class:</p>
                <div class="space-y-1">
                  ${d.assignments.map(asg => `<div class="text-xs text-blue-700">• ${asg.subject_name} (${asg.subject_code})</div>`).join('')}
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
                    <li>If you keep the same single class and teacher, it only updates the subjects. Otherwise, it moves the current assignments to the selected class(es) for the selected teacher.</li>
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

customElements.define('class-subject-update-dialog', ClassSubjectUpdateDialog);
export default ClassSubjectUpdateDialog;


