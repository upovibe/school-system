import '@/components/ui/Modal.js';
import '@/components/ui/Badge.js';

class FinanceScheduleViewModal extends HTMLElement {
  constructor() {
    super();
    this._schedule = null;
  }

  static get observedAttributes() { return ['open']; }

  connectedCallback() {
    this.render();
  }

  setScheduleData(schedule) {
    this._schedule = schedule || null;
    this.render();
  }

  render() {
    const s = this._schedule || {};
    const statusActive = Number(s.is_active) === 1;
    this.innerHTML = `
      <ui-modal ${this.hasAttribute('open') ? 'open' : ''} position="right" size="lg" close-button="true">
        <div slot="title">Fee Schedule Details</div>
        <div class="space-y-6">
          <!-- Header -->
          <div class="flex items-center gap-3 border-b pb-4">
            <h3 class="text-xl font-semibold text-gray-900">${s.classDisplay || ''} • ${s.academic_year || ''} • ${s.term || ''}</h3>
            <ui-badge color="${statusActive ? 'success' : 'error'}">
              <i class="fas fa-${statusActive ? 'check' : 'times'} mr-1"></i>
              ${statusActive ? 'Active' : 'Inactive'}
            </ui-badge>
          </div>

          <!-- Info Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-gray-50 p-3 rounded-lg">
              <div class="text-xs text-gray-500">Class</div>
              <div class="text-sm font-medium text-gray-900">${s.classDisplay || ''}</div>
            </div>
            <div class="bg-gray-50 p-3 rounded-lg">
              <div class="text-xs text-gray-500">Academic Year</div>
              <div class="text-sm font-medium text-gray-900">${s.academic_year || ''}</div>
            </div>
            <div class="bg-gray-50 p-3 rounded-lg">
              <div class="text-xs text-gray-500">Term</div>
              <div class="text-sm font-medium text-gray-900">${s.term || ''}</div>
            </div>
            <div class="bg-gray-50 p-3 rounded-lg">
              <div class="text-xs text-gray-500">Student Type</div>
              <div class="text-sm font-medium text-gray-900">${s.student_type || 'Day'}</div>
            </div>
            <div class="bg-gray-50 p-3 rounded-lg">
              <div class="text-xs text-gray-500">Total Fee</div>
              <div class="text-sm font-medium text-gray-900">${s.total_fee != null ? Number(s.total_fee).toFixed(2) : ''}</div>
            </div>
            <div class="bg-gray-50 p-3 rounded-lg">
              <div class="text-xs text-gray-500">Updated</div>
              <div class="text-sm font-medium text-gray-900">${s.updated_at || ''}</div>
            </div>
          </div>
        </div>
      </ui-modal>
    `;
  }
}

customElements.define('finance-schedule-view-modal', FinanceScheduleViewModal);
export default FinanceScheduleViewModal;


