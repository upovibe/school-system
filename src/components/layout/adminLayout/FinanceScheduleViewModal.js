import '@/components/ui/Modal.js';

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
    this.innerHTML = `
      <ui-modal ${this.hasAttribute('open') ? 'open' : ''} position="right" close-button="true">
        <div slot="title">View Fee Schedule</div>
        <div class="space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div class="text-xs text-gray-500">Class</div>
              <div class="text-sm font-medium text-gray-900">${s.classDisplay || ''}</div>
            </div>
            <div>
              <div class="text-xs text-gray-500">Academic Year</div>
              <div class="text-sm font-medium text-gray-900">${s.academic_year || ''}</div>
            </div>
            <div>
              <div class="text-xs text-gray-500">Term</div>
              <div class="text-sm font-medium text-gray-900">${s.term || ''}</div>
            </div>
            <div>
              <div class="text-xs text-gray-500">Total Fee</div>
              <div class="text-sm font-medium text-gray-900">${s.total_fee != null ? Number(s.total_fee).toFixed(2) : ''}</div>
            </div>
            <div>
              <div class="text-xs text-gray-500">Status</div>
              <div class="text-sm font-medium text-gray-900">${Number(s.is_active) === 1 ? 'Active' : 'Inactive'}</div>
            </div>
            <div>
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


