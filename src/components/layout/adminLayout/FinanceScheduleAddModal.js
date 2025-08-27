import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Switch.js';
import '@/components/ui/SearchDropdown.js';
import '@/components/ui/Button.js';
import api from '@/services/api.js';

class FinanceScheduleAddModal extends HTMLElement {
  constructor() {
    super();
    this._classes = [];
    this._gradingPeriods = [];
    this._listenersAttached = false;
    this._saving = false;
  }

  static get observedAttributes() {
    return ['open'];
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  setClasses(classes) {
    this._classes = Array.isArray(classes) ? classes : [];
    // Re-render so options are slotted as <ui-option>, which SearchDropdown expects
    this.render();
    this.setupEventListeners();
  }

  // Get academic year for a selected class
  getClassAcademicYear(classId) {
    // If we have academic years data, use the first one (current academic year)
    // This is a fallback since classes might not have academic_year_id
    if (this._academicYears && this._academicYears.length > 0) {
      const academicYear = this._academicYears[0];
      return `${academicYear.year_code} (${academicYear.display_name})`;
    }
    
    // Fallback: return null if no academic years available
    return null;
  }

  // Set academic years data (called from parent page)
  setAcademicYears(academicYears) {
    this._academicYears = Array.isArray(academicYears) ? academicYears : [];
  }

  // Set grading periods data (called from parent page)
  setGradingPeriods(gradingPeriods) {
    this._gradingPeriods = Array.isArray(gradingPeriods) ? gradingPeriods : [];
    this.render();
    this.setupEventListeners();
  }

  setupEventListeners() {
    if (this._listenersAttached) return;
    this._onCancel = () => this.close();
    this.addEventListener('cancel', this._onCancel);
    this._listenersAttached = true;
  }

  open() { this.setAttribute('open', ''); }
  close() { this.removeAttribute('open'); }

  async saveSchedule() {
    if (this._saving) return;
    this._saving = true;
    try {
      const classDropdown = this.querySelector('ui-search-dropdown[name="class_id"]');
      const yearInput = this.querySelector('ui-input[data-field="academic_year"]');
      const gradingPeriodDropdown = this.querySelector('ui-search-dropdown[name="grading_period"]');
      const totalFeeInput = this.querySelector('ui-input[data-field="total_fee"]');
      const studentTypeDd = this.querySelector('ui-search-dropdown[name="student_type"]');
      const notesInput = this.querySelector('ui-input[data-field="notes"]');
      const activeSwitch = this.querySelector('ui-switch[name="is_active"]');

      const payload = {
        class_id: classDropdown ? Number(classDropdown.value) : null,
        academic_year: yearInput?.value || '',
        grading_period: gradingPeriodDropdown?.value || '',
        student_type: studentTypeDd?.value || 'Day',
        total_fee: totalFeeInput?.value ? Number(totalFeeInput.value) : 0,
        notes: notesInput?.value || undefined,
        is_active: activeSwitch?.checked ? 1 : 0,
      };

      if (!payload.class_id) return Toast.show({ title: 'Validation', message: 'Select a class', variant: 'error', duration: 3000 });
      if (!payload.academic_year) return Toast.show({ title: 'Validation', message: 'Academic year is required', variant: 'error', duration: 3000 });
      if (!payload.grading_period) return Toast.show({ title: 'Validation', message: 'Enter grading period', variant: 'error', duration: 3000 });
      if (!payload.student_type) return Toast.show({ title: 'Validation', message: 'Select student type', variant: 'error', duration: 3000 });
      if (!payload.total_fee || isNaN(payload.total_fee)) return Toast.show({ title: 'Validation', message: 'Enter total fee', variant: 'error', duration: 3000 });

      const token = localStorage.getItem('token');
      if (!token) return Toast.show({ title: 'Auth', message: 'Please log in', variant: 'error', duration: 3000 });

      const resp = await api.withToken(token).post('/finance/schedules', payload);
      if (resp.status === 201 || resp.data?.success) {
        Toast.show({ title: 'Success', message: 'Schedule created', variant: 'success', duration: 2500 });
        const newSchedule = {
          id: resp.data?.data?.id,
          ...payload,
          created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
          updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        };
        this.close();
        this.dispatchEvent(new CustomEvent('schedule-saved', { detail: { schedule: newSchedule }, bubbles: true, composed: true }));
      } else {
        throw new Error(resp.data?.message || 'Failed to create schedule');
      }
    } catch (error) {
      Toast.show({ title: 'Error', message: error.response?.data?.message || 'Failed to create schedule', variant: 'error', duration: 3000 });
    } finally {
      this._saving = false;
    }
  }

  // Validate required fields and toggle Save button
  validateForm() {
    try {
      const classDropdown = this.querySelector('ui-search-dropdown[name="class_id"]');
      const yearInput = this.querySelector('ui-input[data-field="academic_year"]');
      const gradingPeriodDropdown = this.querySelector('ui-search-dropdown[name="grading_period"]');
      const totalFeeInput = this.querySelector('ui-input[data-field="total_fee"]');
      const studentTypeDd = this.querySelector('ui-search-dropdown[name="student_type"]');
      const saveBtn = this.querySelector('#save-schedule-btn');
      const allFilled = !!String(classDropdown?.value || '').trim() &&
        !!String(yearInput?.value || '').trim() &&
        !!String(gradingPeriodDropdown?.value || '').trim() &&
        !!String(studentTypeDd?.value || '').trim() &&
        Number(totalFeeInput?.value || 0) > 0;
      if (saveBtn) {
        if (allFilled) saveBtn.removeAttribute('disabled');
        else saveBtn.setAttribute('disabled', '');
      }
    } catch (_) { /* noop */ }
  }

  // Wire up validation and save
  addFormEventListeners() {
    const classDropdown = this.querySelector('ui-search-dropdown[name="class_id"]');
    const yearInput = this.querySelector('ui-input[data-field="academic_year"]');
    const gradingPeriodDropdown = this.querySelector('ui-search-dropdown[name="grading_period"]');
    const totalFeeInput = this.querySelector('ui-input[data-field="total_fee"]');
    const studentTypeDd = this.querySelector('ui-search-dropdown[name="student_type"]');
    const saveBtn = this.querySelector('#save-schedule-btn');
    
    // Handle class selection to auto-populate academic year
    if (classDropdown) {
      classDropdown.addEventListener('change', () => {
        const selectedClassId = classDropdown.value;
        if (selectedClassId) {
          const academicYear = this.getClassAcademicYear(selectedClassId);
          if (yearInput && academicYear) {
            yearInput.value = academicYear;
          }
        } else {
          // Clear academic year if no class selected
          if (yearInput) yearInput.value = '';
        }
        this.validateForm();
      });
    }
    
    [totalFeeInput].forEach(el => {
      if (!el) return;
      el.addEventListener('input', () => this.validateForm());
      el.addEventListener('change', () => this.validateForm());
    });
    
    // Handle grading period dropdown change
    if (gradingPeriodDropdown) {
      gradingPeriodDropdown.addEventListener('change', () => this.validateForm());
    }
    if (studentTypeDd) studentTypeDd.addEventListener('change', () => this.validateForm());
    if (saveBtn) saveBtn.addEventListener('click', () => this.saveSchedule());
    this.validateForm();
  }

  render() {
    this.innerHTML = `
      <ui-modal ${this.hasAttribute('open') ? 'open' : ''} position="right" close-button="true">
        <div slot="title">Add Fee Schedule</div>
        <form class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Class *</label>
            <ui-search-dropdown name="class_id" placeholder="Select class" class="w-full">
              ${(this._classes || []).map(c => `
                <ui-option value="${c.id}">${c.name}${c.section ? ' ' + c.section : ''}</ui-option>
              `).join('')}
            </ui-search-dropdown>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
              <ui-input data-field="academic_year" type="text" placeholder="Auto-populated from class" class="w-full" readonly></ui-input>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Grading Period *</label>
              <ui-search-dropdown name="grading_period" placeholder="Select grading period" class="w-full">
                ${(this._gradingPeriods || []).map(gp => {
                  const isActive = gp.is_active === 1; // Check if is_active = 1
                  return `<ui-option value="${gp.name}" ${!isActive ? 'disabled' : ''}>${gp.name}${!isActive ? ' (Inactive)' : ''}</ui-option>`;
                }).join('')}
              </ui-search-dropdown>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Student Type *</label>
            <ui-search-dropdown name="student_type" placeholder="Select type" class="w-full">
              <ui-option value="Day">Day</ui-option>
              <ui-option value="Boarding">Boarding</ui-option>
            </ui-search-dropdown>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Total Fee *</label>
            <ui-input data-field="total_fee" type="number" step="0.01" placeholder="e.g., 1500.00" class="w-full"></ui-input>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <ui-input data-field="notes" type="text" placeholder="Optional notes" class="w-full"></ui-input>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Active</label>
            <ui-switch name="is_active" checked class="w-full"><span slot="label">Active</span></ui-switch>
          </div>
        </form>

        <div class="mt-4 p-3 rounded-md bg-blue-50 border border-blue-100 text-blue-800 text-sm">
          <div class="flex items-start space-x-2">
            <i class="fas fa-info-circle mt-0.5"></i>
            <div>
              <p class="font-medium">How this works</p>
              <ul class="list-disc pl-5 mt-1 space-y-1">
                <li><strong>Class</strong>: choose the class this schedule applies to.</li>
                <li><strong>Academic Year</strong>: automatically set from the selected class (read-only).</li>
                <li><strong>Grading Period</strong>: choose the grading period for this schedule (First Term, Second Term, or Third Term).</li>
                <li><strong>Total Fee</strong>: enter the total payable amount for the period.</li>
                <li><strong>Active</strong>: only one active schedule per class/year/grading period is typical.</li>
              </ul>
            </div>
          </div>
        </div>
        <div slot="footer" class="flex items-center justify-end gap-2">
          <ui-button variant="outline" color="secondary" modal-action="cancel">Cancel</ui-button>
          <ui-button id="save-schedule-btn" color="primary" disabled>Save</ui-button>
        </div>
      </ui-modal>
    `;
    // Attach validation and save wiring
    this.addFormEventListeners();
  }
}

customElements.define('finance-schedule-add-modal', FinanceScheduleAddModal);
export default FinanceScheduleAddModal;


