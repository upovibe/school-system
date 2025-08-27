import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Switch.js';
import '@/components/ui/SearchDropdown.js';
import api from '@/services/api.js';

class FinanceScheduleUpdateModal extends HTMLElement {
  constructor() {
    super();
    this._schedule = null;
    this._classes = [];
    this._academicYears = [];
    this._gradingPeriods = [];
  }

  static get observedAttributes() { return ['open']; }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  setScheduleData(schedule) {
    this._schedule = schedule || null;
    this.fillForm();
  }

  setClasses(classes) {
    this._classes = Array.isArray(classes) ? classes : [];
    this.render();
    this.setupEventListeners();
    this.fillForm();
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
    this.fillForm();
  }

  fillForm() {
    const s = this._schedule;
    if (!s) return;
    const classDropdown = this.querySelector('ui-search-dropdown[name="class_id"]');
    const yearInput = this.querySelector('ui-input[data-field="academic_year"]');
    const termInput = this.querySelector('ui-input[data-field="term"]');
    const totalFeeInput = this.querySelector('ui-input[data-field="total_fee"]');
    const studentTypeDd = this.querySelector('ui-search-dropdown[name="student_type"]');
    const notesInput = this.querySelector('ui-input[data-field="notes"]');
    const activeSwitch = this.querySelector('ui-switch[name="is_active"]');
    
    if (classDropdown && s.class_id != null) {
      classDropdown.value = String(s.class_id);
      // Auto-populate academic year based on selected class
      const academicYear = this.getClassAcademicYear(s.class_id);
      if (yearInput && academicYear) {
        yearInput.value = academicYear;
      }
    }
    
    // If academic year is still empty, use the existing value from the schedule
    if (yearInput && !yearInput.value) {
      yearInput.value = s.academic_year || '';
    }
    const gradingPeriodDropdown = this.querySelector('ui-search-dropdown[name="grading_period"]');
    if (gradingPeriodDropdown && s.grading_period) gradingPeriodDropdown.value = String(s.grading_period);
    if (totalFeeInput) totalFeeInput.value = s.total_fee;
    if (studentTypeDd && s.student_type) studentTypeDd.value = String(s.student_type);
    if (notesInput) notesInput.value = s.notes || '';
    if (activeSwitch) {
      const isActive = Number(s.is_active) === 1;
      if (isActive) {
        activeSwitch.setAttribute('checked', '');
      } else {
        activeSwitch.removeAttribute('checked');
      }
      const indicator = this.querySelector('#active-indicator');
      if (indicator) indicator.textContent = isActive ? 'Active: 1' : 'Active: 0';
    }
  }

  setupEventListeners() {
    this.addEventListener('confirm', () => this.updateSchedule());
    this.addEventListener('cancel', () => this.close());
    this.addEventListener('switch-change', (e) => {
      if (e.target?.getAttribute('name') === 'is_active') {
        const indicator = this.querySelector('#active-indicator');
        if (indicator) indicator.textContent = e.detail.checked ? 'Active: 1' : 'Active: 0';
      }
    });

    // Handle class selection to auto-populate academic year
    this.addEventListener('change', (e) => {
      const classDropdown = e.target.closest('ui-search-dropdown[name="class_id"]');
      if (classDropdown) {
        const selectedClassId = classDropdown.value;
        const yearInput = this.querySelector('ui-input[data-field="academic_year"]');
        
        if (selectedClassId && yearInput) {
          const academicYear = this.getClassAcademicYear(selectedClassId);
          if (academicYear) {
            yearInput.value = academicYear;
          } else {
            // If no academic year available, keep the existing value or clear it
            yearInput.value = this._schedule?.academic_year || '';
          }
        }
      }
    });
  }

  open() { this.setAttribute('open', ''); }
  close() { this.removeAttribute('open'); }

  async updateSchedule() {
    try {
      if (!this._schedule) return;
      const classDropdown = this.querySelector('ui-search-dropdown[name="class_id"]');
      const yearInput = this.querySelector('ui-input[data-field="academic_year"]');
      const gradingPeriodDropdown = this.querySelector('ui-search-dropdown[name="grading_period"]');
      const totalFeeInput = this.querySelector('ui-input[data-field="total_fee"]');
      const studentTypeDd = this.querySelector('ui-search-dropdown[name="student_type"]');
      const notesInput = this.querySelector('ui-input[data-field="notes"]');
      const activeSwitch = this.querySelector('ui-switch[name="is_active"]');

      const payload = {
        class_id: classDropdown?.value ? Number(classDropdown.value) : undefined,
        academic_year: yearInput?.value || '',
        grading_period: gradingPeriodDropdown?.value || '',
        student_type: studentTypeDd?.value || undefined,
        total_fee: totalFeeInput?.value ? Number(totalFeeInput.value) : 0,
        notes: notesInput?.value || undefined,
        is_active: activeSwitch?.checked ? 1 : 0,
      };

      if (!payload.academic_year) return Toast.show({ title: 'Validation', message: 'Enter academic year', variant: 'error', duration: 3000 });
      if (!payload.grading_period) return Toast.show({ title: 'Validation', message: 'Enter grading period', variant: 'error', duration: 3000 });
      if (!payload.total_fee || isNaN(payload.total_fee)) return Toast.show({ title: 'Validation', message: 'Enter total fee', variant: 'error', duration: 3000 });

      const token = localStorage.getItem('token');
      if (!token) return Toast.show({ title: 'Auth', message: 'Please log in', variant: 'error', duration: 3000 });

      const resp = await api.withToken(token).put(`/finance/schedules/${this._schedule.id}`, payload);
      if (resp.status === 200 || resp.data?.success) {
        this.close();
        const updated = { ...this._schedule, ...payload, updated_at: new Date().toISOString().slice(0,19).replace('T',' ') };
        this.dispatchEvent(new CustomEvent('schedule-updated', { detail: { schedule: updated }, bubbles: true, composed: true }));
      } else {
        throw new Error(resp.data?.message || 'Failed to update schedule');
      }
    } catch (error) {
      Toast.show({ title: 'Error', message: error.response?.data?.message || 'Failed to update schedule', variant: 'error', duration: 3000 });
    }
  }

  render() {
    this.innerHTML = `
      <ui-modal ${this.hasAttribute('open') ? 'open' : ''} position="right" close-button="true">
        <div slot="title">Update Fee Schedule</div>
        <form class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <ui-search-dropdown name="class_id" placeholder="Select class" class="w-full">
              ${(this._classes || []).map(c => `
                <ui-option value="${c.id}">${c.name}${c.section ? ' ' + c.section : ''}</ui-option>
              `).join('')}
            </ui-search-dropdown>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
              <ui-input data-field="academic_year" type="text" placeholder="Auto-populated from class" class="w-full" readonly></ui-input>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Grading Period</label>
              <ui-search-dropdown name="grading_period" placeholder="Select grading period" class="w-full">
                ${(this._gradingPeriods || []).map(gp => {
                  const isActive = gp.is_active === 1; // Check if is_active = 1
                  return `<ui-option value="${gp.name}" ${!isActive ? 'disabled' : ''}>${gp.name}${!isActive ? ' (Inactive)' : ''}</ui-option>`;
                }).join('')}
              </ui-search-dropdown>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Total Fee</label>
            <ui-input data-field="total_fee" type="number" step="0.01" placeholder="e.g., 1500.00" class="w-full"></ui-input>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Student Type</label>
            <ui-search-dropdown name="student_type" placeholder="Select type" class="w-full">
              <ui-option value="Day">Day</ui-option>
              <ui-option value="Boarding">Boarding</ui-option>
            </ui-search-dropdown>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <ui-input data-field="notes" type="text" placeholder="Optional notes" class="w-full"></ui-input>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Active</label>
            <ui-switch name="is_active" class="w-full"><span slot="label">Active</span></ui-switch>
          </div>
        </form>

        <div class="mt-4 p-3 rounded-md bg-blue-50 border border-blue-100 text-blue-800 text-sm">
          <div class="flex items-start space-x-2">
            <i class="fas fa-info-circle mt-0.5"></i>
            <div>
              <p class="font-medium">How this works</p>
              <ul class="list-disc pl-5 mt-1 space-y-1">
                <li><strong>Class</strong>: changing the class will automatically update the academic year.</li>
                <li><strong>Academic Year</strong>: automatically set from the selected class (read-only).</li>
                <li><strong>Grading Period</strong>: choose the grading period for this schedule (First Term, Second Term, or Third Term).</li>
                <li><strong>Active</strong>: controls whether this schedule is used by default.</li>
              </ul>
            </div>
          </div>
        </div>
      </ui-modal>
    `;

    setTimeout(() => this.fillForm(), 0);
  }
}

customElements.define('finance-schedule-update-modal', FinanceScheduleUpdateModal);
export default FinanceScheduleUpdateModal;


