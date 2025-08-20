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
    this.fallbackSubjects = [];
  }

  static get observedAttributes() {
    return ['open'];
  }

  attributeChangedCallback(name, _old, newVal) {
    if (name === 'open' && newVal !== null) {
      console.log('🚪 Dialog opened, rendering...');
      this.render();
    }
  }

  connectedCallback() {
    this.render();
    this.loadTeachers();
    this.loadClasses();
    this.addEventListener('confirm', this.save.bind(this));
  }

  setTeacherAssignmentData(primaryAssignment, teacherAssignments) {
    this.primaryAssignment = primaryAssignment || null;
    this.teacherAssignments = Array.isArray(teacherAssignments) ? teacherAssignments : null;

    console.log('🔍 setTeacherAssignmentData called with:', {
      primaryAssignment,
      teacherAssignments: teacherAssignments?.length || 0
    });

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

    console.log('📚 Class assignments found:', this.classAssignments);

    // Current class ids (default to existing single class)
    const existingClassId = this.classAssignments?.[0]?.class_id ?? null;
    this.selectedClassIds = existingClassId ? [existingClassId] : [];

    console.log('🎯 Selected class IDs:', this.selectedClassIds);
    console.log('📖 Primary assignment class info:', {
      class_name: this.primaryAssignment?.class_name,
      class_section: this.primaryAssignment?.class_section,
      class_id: this.primaryAssignment?.class_id
    });

    // Build fallback subjects from current class assignments so tags render with names immediately
    if (this.classAssignments && this.classAssignments.length > 0) {
      const byId = new Map();
      this.classAssignments.forEach(a => {
        if (a.subject_id) {
          byId.set(String(a.subject_id), {
            id: parseInt(a.subject_id),
            name: a.subject_name,
            code: a.subject_code
          });
        }
      });
      this.fallbackSubjects = Array.from(byId.values());
      // Use fallback immediately so chips show names before async load
      if (this.fallbackSubjects.length > 0) {
        this.subjects = this.fallbackSubjects;
      }
    }
    this.render();

    // After render: load class-specific subjects for the current class and sync
    if (existingClassId) {
      console.log('📚 Loading class subjects for existing class ID:', existingClassId);
      this.loadClassSubjects(existingClassId).then(() => {
        console.log('✅ Class subjects loaded, syncing dropdowns');
        this.syncDropdownSelections();
      });
    }

    // Extra retries to ensure options exist before applying selection
    const trySync = () => {
      console.log('🔄 Retry sync attempt');
      this.syncDropdownSelections();
    };
    setTimeout(trySync, 50);
    setTimeout(trySync, 200);
    setTimeout(trySync, 400);
    setTimeout(trySync, 800);

    // Bind class change to reload class-specific subjects (use first selected)
    setTimeout(() => {
      const classDropdown = this.querySelector('ui-search-dropdown[data-field="class_ids"]');
      if (classDropdown && !classDropdown._classChangeBound) {
        console.log('🔗 Binding class dropdown change event');
        classDropdown.addEventListener('change', () => {
          console.log('🔄 Class dropdown changed, new value:', classDropdown.value);
          const value = Array.isArray(classDropdown.value) ? classDropdown.value[0] : classDropdown.value;
          const newClassId = parseInt(value);
          console.log('🆕 New class ID:', newClassId);
          if (newClassId && !isNaN(newClassId)) {
            this.loadClassSubjects(newClassId).then(() => this.syncDropdownSelections());
          }
        });
        classDropdown._classChangeBound = true;
      }
    }, 200);
  }

  async loadClasses() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await api.withToken(token).get('/classes');
      if (res.status === 200 && res.data.success) {
        this.classes = res.data.data;
        console.log('📚 Loaded classes:', this.classes);
        this.render();
        this.syncDropdownSelections();
      }
    } catch (error) { 
      console.error('❌ Error loading classes:', error);
    }
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

  async loadSubjects() { /* not used; class-specific loader below */ }

  async loadClassSubjects(classId) {
    try {
      const token = localStorage.getItem('token');
      if (!token || !classId) return;
      const res = await api.withToken(token).get(`/class-subjects/by-class?class_id=${encodeURIComponent(classId)}`);
      if (res.status === 200 && res.data.success) {
        const list = (res.data.data || []).map(item => ({
          id: item.subject_id ?? item.id,
          name: item.subject_name ?? item.name ?? (item.subject?.name ?? `Subject ${item.subject_id ?? item.id}`),
          code: item.subject_code ?? item.code ?? (item.subject?.code ?? '')
        }));
        // Merge with fallback subjects to ensure all selected subjects have options
        const byId = new Map();
        list.forEach(s => byId.set(String(s.id), s));
        (this.fallbackSubjects || []).forEach(s => byId.set(String(s.id), s));
        this.subjects = Array.from(byId.values());
        this.render();
        const sync = () => this.syncDropdownSelections();
        setTimeout(sync, 10);
        setTimeout(sync, 100);
        setTimeout(sync, 250);
      }
    } catch (_) { /* silent */ }
  }

  syncDropdownSelections() {
    console.log('🔄 syncDropdownSelections called');
    console.log('🎯 Current selectedClassIds:', this.selectedClassIds);
    
    const classDropdown = this.querySelector('ui-search-dropdown[data-field="class_ids"]');
    console.log('📋 Class dropdown found:', !!classDropdown);
    
    if (classDropdown && this.selectedClassIds?.length) {
      console.log('✅ Setting class dropdown value to:', this.selectedClassIds);
      classDropdown.setAttribute('value', JSON.stringify(this.selectedClassIds));
      try { 
        classDropdown.value = this.selectedClassIds.map(id => String(id)); 
        console.log('✅ Class dropdown value set successfully');
      } catch (error) { 
        console.error('❌ Error setting class dropdown value:', error);
      }
    } else {
      console.log('⚠️ Cannot set class dropdown - missing dropdown or selectedClassIds');
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
      try { subjectDropdown.value = currentSubjectIds.map(id => String(id)); } catch (_) {}

      if (this.subjects?.length) {
        const selected = this.subjects.filter(s => currentSubjectIds.map(id => String(id)).includes(String(s.id)));
        const displayValue = selected.map(s => `${s.name} (${s.code})`).join(', ');
        subjectDropdown.setAttribute('display-value', displayValue);
      }

      // Force-mark selected options for robustness
      subjectDropdown.querySelectorAll('ui-option').forEach(opt => {
        const isSelected = currentSubjectIds.map(id => String(id)).includes(String(opt.getAttribute('value')));
        if (isSelected) opt.setAttribute('selected', ''); else opt.removeAttribute('selected');
      });
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
    
    console.log('🎨 Render called with:', {
      primaryAssignment: a,
      currentClassLabel,
      currentTeacherLabel,
      selectedClassIds: this.selectedClassIds,
      classesCount: this.classes.length
    });

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
                  ${this.classes.map(cls => {
                    const isSelected = this.selectedClassIds.includes(cls.id);
                    console.log(`🏷️ Class option: ${cls.name}-${cls.section} (ID: ${cls.id}, Selected: ${isSelected})`);
                    return `<ui-option value="${cls.id}" ${isSelected ? 'selected' : ''}>${cls.name}-${cls.section}</ui-option>`;
                  }).join('')}
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


