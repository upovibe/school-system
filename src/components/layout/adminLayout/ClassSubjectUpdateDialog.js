import '@/components/ui/Dialog.js';
import '@/components/ui/SearchDropdown.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

// Simple in-memory caches for this module (persists across dialog openings in-session)
let CSU_CACHED_CLASSES = null; // Array<{id,name,section}>
let CSU_CACHED_SUBJECTS = null; // Array<{id,name,code}>
const CSU_CACHED_SUBJECTS_BY_CLASS = new Map(); // Map<classId:string, Array<{id,name,code}>>

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
    this.classes = [];
    this.subjects = [];
    this.loading = false;
    this.selectedClassIds = [];
    this.selectedSubjectIds = [];
  }

  // Debug logger
  logDebug(label, payload) {
    try {
      // eslint-disable-next-line no-console
      console.log(`[ClassSubjectUpdateDialog] ${label}:`, payload);
    } catch (_) {}
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
    this.logDebug('connected', true);
    this.render();
    this.loadClasses();
    // Load ALL subjects so dropdown shows every subject (class subjects will be preselected)
    this.loadSubjects();
    this.addEventListener('confirm', this.save.bind(this));
  }

  setClassSubjectData(data, classAssignments) {
    this.classData = data || null;

    // Normalize incoming assignments: prefer explicit list if provided
    const assignments = Array.isArray(classAssignments) && classAssignments.length > 0
      ? classAssignments
      : (Array.isArray(data?.assignments) && data.assignments.length > 0 ? data.assignments : []);

    // Prefill selections from provided data (supports single-object or array)
    const first = assignments[0] || data || null;
    const classId = data?.classId ?? data?.class_id ?? first?.class_id ?? null;
    const subjectIds = assignments.length > 0
      ? assignments.map(a => parseInt(a.subject_id)).filter(id => id && !isNaN(id))
      : (data?.subject_id ? [parseInt(data.subject_id)] : []);

    this.selectedClassIds = classId ? [classId] : [];
    this.selectedSubjectIds = subjectIds;

    this.logDebug('setClassSubjectData.incoming', {
      classId,
      assignmentsCount: data?.assignments?.length || 0,
      subjectIds
    });

    // Temporary fallback options from current assignments so dropdown isn't empty
    if (assignments.length > 0) {
      this.subjects = assignments.map(a => ({
        id: parseInt(a.subject_id),
        name: a.subject_name,
        code: a.subject_code
      }));
    }

    this.render();

    // Load authoritative subject list for the class (replaces fallback options) and re-apply selection each time
    // Ensure full subject list is available; preselection uses selectedSubjectIds
    this.loadSubjects();

    // Try multiple times to ensure options are rendered before setting values
    const trySync = () => this.syncDropdownSelections();
    setTimeout(trySync, 50);
    setTimeout(trySync, 200);
    setTimeout(trySync, 400);
    setTimeout(trySync, 800);

    // Attach change listener to class dropdown to reload subjects for new selection (first selected)
    setTimeout(() => {
      const classDropdown = this.querySelector('ui-search-dropdown[data-field="class_ids"]');
      if (classDropdown && !classDropdown._classChangeBound) {
        classDropdown.addEventListener('change', () => {
          const value = Array.isArray(classDropdown.value) ? classDropdown.value[0] : classDropdown.value;
          const newClassId = parseInt(value);
          this.logDebug('classDropdown.change', { value: classDropdown.value, newClassId });
          if (newClassId && !isNaN(newClassId)) {
            this.selectedClassIds = [newClassId];
            this.loadClassSubjects(newClassId).then(() => this.syncDropdownSelections());
          }
        });
        classDropdown._classChangeBound = true;
      }
    }, 300);
  }

  async loadClasses() {
    try {
      if (Array.isArray(CSU_CACHED_CLASSES) && CSU_CACHED_CLASSES.length > 0) {
        this.classes = CSU_CACHED_CLASSES;
        this.logDebug('loadClasses.cache', { count: this.classes.length });
        this.render();
        this.syncDropdownSelections();
        return;
      }
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await api.withToken(token).get('/classes');
      if (res.status === 200 && res.data.success) {
        this.classes = res.data.data;
        CSU_CACHED_CLASSES = this.classes;
        this.logDebug('loadClasses.success', { count: this.classes.length });
        this.render();
        this.syncDropdownSelections();
      }
    } catch (_) { /* silent */ }
  }

  async loadClassSubjects(classId) {
    try {
      const cacheKey = String(classId);
      if (CSU_CACHED_SUBJECTS_BY_CLASS.has(cacheKey)) {
        const cached = CSU_CACHED_SUBJECTS_BY_CLASS.get(cacheKey) || [];
        if (cached.length > 0) {
          this.subjects = this._mergeSubjects(cached, this.subjects);
          this.logDebug('loadClassSubjects.cache', { classId, count: cached.length });
          this.render();
          const sync = () => this.syncDropdownSelections();
          setTimeout(sync, 10);
          setTimeout(sync, 100);
          return;
        }
      }
      const token = localStorage.getItem('token');
      if (!token || !classId) return;
      const res = await api.withToken(token).get(`/class-subjects/by-class?class_id=${encodeURIComponent(classId)}`);
      if (res.status === 200 && res.data.success) {
        const list = (res.data.data || []).map(item => ({
          id: item.subject_id ?? item.id,
          name: item.subject_name ?? item.name ?? (item.subject?.name ?? `Subject ${item.subject_id ?? item.id}`),
          code: item.subject_code ?? item.code ?? (item.subject?.code ?? '')
        }));
        CSU_CACHED_SUBJECTS_BY_CLASS.set(cacheKey, list);
        if (Array.isArray(list) && list.length > 0) {
          this.subjects = this._mergeSubjects(list, this.subjects);
          this.logDebug('loadClassSubjects.success', { classId, count: list.length, subjectIds: list.map(s => s.id) });
          this.render();
          // After render, re-apply selection (multiple retries)
          const sync = () => this.syncDropdownSelections();
          setTimeout(sync, 10);
          setTimeout(sync, 100);
          setTimeout(sync, 250);
        }
      }
    } catch (e) {
      this.logDebug('loadClassSubjects.error', e?.message || e);
      // Keep fallback options; no-op on failure
    }
  }

  async loadSubjects() {
    try {
      if (Array.isArray(CSU_CACHED_SUBJECTS) && CSU_CACHED_SUBJECTS.length > 0) {
        // Merge any preexisting subjects with cache
        const byId = new Map();
        CSU_CACHED_SUBJECTS.forEach(s => byId.set(String(s.id), s));
        (this.subjects || []).forEach(s => byId.set(String(s.id), s));
        this.subjects = Array.from(byId.values());
        this.render();
        this.syncDropdownSelections();
        return;
      }
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await api.withToken(token).get('/subjects');
      if (res.status === 200 && res.data.success) {
        const all = (res.data.data || []).map(s => ({ id: s.id, name: s.name, code: s.code }));
        CSU_CACHED_SUBJECTS = all;
        // Merge with any class-specific fallback subjects to ensure no loss
        const byId = new Map();
        all.forEach(s => byId.set(String(s.id), s));
        (this.subjects || []).forEach(s => byId.set(String(s.id), s));
        this.subjects = Array.from(byId.values());
        this.render();
        this.syncDropdownSelections();
      }
    } catch (_) { /* silent */ }
  }

  _mergeSubjects(primary, secondary) {
    const byId = new Map();
    (Array.isArray(primary) ? primary : []).forEach(s => byId.set(String(s.id), s));
    (Array.isArray(secondary) ? secondary : []).forEach(s => byId.set(String(s.id), s));
    return Array.from(byId.values());
  }

  syncDropdownSelections() {
    this.logDebug('sync.start', {
      selectedClassIds: this.selectedClassIds,
      selectedSubjectIds: this.selectedSubjectIds,
      subjectsCount: this.subjects?.length || 0
    });
    const classDropdown = this.querySelector('ui-search-dropdown[data-field="class_ids"]');
    if (classDropdown && this.selectedClassIds?.length) {
      const classIdsStr = this.selectedClassIds.map(id => String(id));
      try { classDropdown.value = classIdsStr; } catch (_) {}
      classDropdown.setAttribute('value', JSON.stringify(classIdsStr));
      // Force-mark selected options for robustness
      classDropdown.querySelectorAll('ui-option').forEach(opt => {
        const isSelected = classIdsStr.includes(String(opt.getAttribute('value')));
        if (isSelected) opt.setAttribute('selected', ''); else opt.removeAttribute('selected');
      });
      this.logDebug('sync.classDropdown', {
        options: Array.from(classDropdown.querySelectorAll('ui-option')).map(o => o.getAttribute('value')),
        valueProp: classDropdown.value,
        valueAttr: classDropdown.getAttribute('value')
      });
    }

    const subjectDropdown = this.querySelector('ui-search-dropdown[data-field="subject_ids"]');
    if (subjectDropdown && this.selectedSubjectIds?.length) {
      const subjectIdsStr = this.selectedSubjectIds.map(id => String(id));
      try { subjectDropdown.value = subjectIdsStr; } catch (_) {}
      subjectDropdown.setAttribute('value', JSON.stringify(subjectIdsStr));
      // Set display label from loaded subjects; fallback to assignments
      let displayValue = '';
      if (this.subjects?.length) {
        const selected = this.subjects.filter(s => subjectIdsStr.includes(String(s.id)));
        displayValue = selected.map(s => `${s.name} (${s.code})`).join(', ');
      } else if (this.classData?.assignments?.length) {
        displayValue = this.classData.assignments.map(a => `${a.subject_name} (${a.subject_code})`).join(', ');
      }
      if (displayValue) subjectDropdown.setAttribute('display-value', displayValue);
      // Force-mark selected options
      subjectDropdown.querySelectorAll('ui-option').forEach(opt => {
        const isSelected = subjectIdsStr.includes(String(opt.getAttribute('value')));
        if (isSelected) opt.setAttribute('selected', ''); else opt.removeAttribute('selected');
      });
      this.logDebug('sync.subjectDropdown', {
        options: Array.from(subjectDropdown.querySelectorAll('ui-option')).map(o => o.getAttribute('value')),
        valueProp: subjectDropdown.value,
        valueAttr: subjectDropdown.getAttribute('value'),
        displayValue: subjectDropdown.getAttribute('display-value')
      });
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

      const classDropdown = this.querySelector('ui-search-dropdown[data-field="class_ids"]');
      const subjectDropdown = this.querySelector('ui-search-dropdown[data-field="subject_ids"]');

      const selectedClassIds = classDropdown ? classDropdown.value : [];
      const subjectIds = subjectDropdown ? subjectDropdown.value : [];

      if (!Array.isArray(selectedClassIds) || selectedClassIds.length === 0) {
        Toast.show({ title: 'Validation Error', message: 'Please select at least one class', variant: 'error', duration: 3000 });
        return;
      }
      if (!Array.isArray(subjectIds) || subjectIds.length === 0) {
        Toast.show({ title: 'Validation Error', message: 'Please select at least one subject', variant: 'error', duration: 3000 });
        return;
      }

      const oldAssignment = this.classData?.assignments?.[0] || null;
      const oldTeacherId = oldAssignment?.teacher_id ?? this.classData?.teacherId ?? null; // keep same teacher
      const oldEmployeeId = oldAssignment?.employee_id ?? this.classData?.employeeId ?? null;
      const oldClassId = oldAssignment?.class_id ?? this.classData?.classId ?? null;
      const oldClassName = this.classData?.className ?? oldAssignment?.class_name;
      const oldClassSection = this.classData?.classSection ?? oldAssignment?.class_section;

      // If same teacher and same single class, just PUT
      if (oldClassId && selectedClassIds.length === 1 && parseInt(selectedClassIds[0]) === oldClassId) {
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
              teacher_id: parseInt(oldTeacherId),
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

    this.innerHTML = `
      <ui-dialog ${this.hasAttribute('open') ? 'open' : ''} title="Edit Class Subjects">
        <div slot="content">
          <div class="space-y-4">
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

            <!-- How it works (always at bottom) -->
            <div class="p-3 rounded-md bg-blue-50 border border-blue-100 text-blue-800 text-sm">
              <div class="flex items-start space-x-2">
                <i class="fas fa-info-circle mt-0.5"></i>
                <div>
                  <p class="font-medium">How this works</p>
                  <ul class="list-disc pl-5 mt-1 space-y-1">
                    <li>Select one or more destination classes (defaults to current class).</li>
                    <li>Select one or more subjects from the full catalog; existing class subjects are preselected.</li>
                    <li>Same class: only updates the subject list (adds/removes).</li>
                    <li>Different classes: old class assignments are removed; new combinations are created for the selected classes.</li>
                    <li>Duplicates are ignored by the server; only new combinations are created.</li>
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


