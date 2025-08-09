import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Switch.js';
import '@/components/ui/SearchDropdown.js';
import api from '@/services/api.js';

class FinanceScheduleAddModal extends HTMLElement {
  constructor() {
    super();
    this._classes = [];
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

  setupEventListeners() {
    if (this._listenersAttached) return;
    this._onConfirm = () => this.saveSchedule();
    this._onCancel = () => this.close();
    this.addEventListener('confirm', this._onConfirm);
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
      const termInput = this.querySelector('ui-input[data-field="term"]');
      const totalFeeInput = this.querySelector('ui-input[data-field="total_fee"]');
      const activeSwitch = this.querySelector('ui-switch[name="is_active"]');

      const payload = {
        class_id: classDropdown ? Number(classDropdown.value) : null,
        academic_year: yearInput?.value || '',
        term: termInput?.value || '',
        total_fee: totalFeeInput?.value ? Number(totalFeeInput.value) : 0,
        is_active: activeSwitch?.checked ? 1 : 0,
      };

      if (!payload.class_id) return Toast.show({ title: 'Validation', message: 'Select a class', variant: 'error', duration: 3000 });
      if (!payload.academic_year) return Toast.show({ title: 'Validation', message: 'Enter academic year', variant: 'error', duration: 3000 });
      if (!payload.term) return Toast.show({ title: 'Validation', message: 'Enter term', variant: 'error', duration: 3000 });
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

  render() {
    this.innerHTML = `
      <ui-modal ${this.hasAttribute('open') ? 'open' : ''} position="right" close-button="true">
        <div slot="title">Add Fee Schedule</div>
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
              <ui-input data-field="academic_year" type="text" placeholder="e.g., 2024-2025" class="w-full"></ui-input>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Term</label>
              <ui-input data-field="term" type="text" placeholder="e.g., Term 1" class="w-full"></ui-input>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Total Fee</label>
            <ui-input data-field="total_fee" type="number" step="0.01" placeholder="e.g., 1500.00" class="w-full"></ui-input>
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
                <li><strong>Academic Year & Term</strong>: uniquely identify a schedule per class.</li>
                <li><strong>Total Fee</strong>: enter the total payable amount for the period.</li>
                <li><strong>Active</strong>: only one active schedule per class/year/term is typical.</li>
              </ul>
            </div>
          </div>
        </div>
      </ui-modal>
    `;
  }
}

customElements.define('finance-schedule-add-modal', FinanceScheduleAddModal);
export default FinanceScheduleAddModal;


