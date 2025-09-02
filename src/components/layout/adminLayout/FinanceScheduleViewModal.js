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
    const safe = (v) => (v == null || v === '' ? 'N/A' : v);
    const money = (v) => (v != null ? Number(v).toFixed(2) : '0.00');
    const statusActive = Number(s.is_active) === 1;
    const type = s.student_type || 'Day';

    this.innerHTML = `
      <ui-modal 
        ${this.hasAttribute('open') ? 'open' : ''}
        position="right"
        size="lg"
        close-button="true">
        <div slot="title">View Schedule Details</div>

        <div>
          <!-- Header -->
          <div class="flex items-center gap-3 border-b pb-4">
            <h3 class="text-xl font-semibold text-gray-900">${safe(s.classDisplay)} • ${safe(s.academic_year)} • ${safe(s.grading_period)}</h3>
            <ui-badge color="${statusActive ? 'success' : 'error'}">
              <i class="fas fa-${statusActive ? 'check' : 'times'} mr-1"></i>
              ${statusActive ? 'Active' : 'Inactive'}
            </ui-badge>
            <ui-badge color="${type === 'Boarding' ? 'warning' : 'info'}">
              <i class="fas fa-user-graduate mr-1"></i>${safe(type)}
            </ui-badge>
          </div>

          <!-- Schedule Information -->
          <div class="border-b pb-4 mt-4">
            <div class="flex items-center gap-2 mb-3">
              <i class="fas fa-info-circle text-blue-500"></i>
              <h4 class="text-md font-semibold text-gray-800">Schedule Information</h4>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-gray-50 p-3 rounded-lg">
                <label class="block text-sm font-medium text-gray-700 mb-1"><i class="fas fa-chalkboard mr-1"></i>Class</label>
                <p class="text-gray-900 text-sm font-medium">${safe(s.classDisplay)}</p>
              </div>
              <div class="bg-gray-50 p-3 rounded-lg">
                <label class="block text-sm font-medium text-gray-700 mb-1"><i class="fas fa-calendar mr-1"></i>Academic Year</label>
                <p class="text-gray-900 text-sm">${safe(s.academic_year)}</p>
              </div>
              <div class="bg-gray-50 p-3 rounded-lg">
                <label class="block text-sm font-medium text-gray-700 mb-1"><i class="fas fa-layer-group mr-1"></i>Grading Period</label>
                <p class="text-gray-900 text-sm">${safe(s.grading_period)}</p>
              </div>
              <div class="bg-gray-50 p-3 rounded-lg">
                <label class="block text-sm font-medium text-gray-700 mb-1"><i class="fas fa-user mr-1"></i>Student Type</label>
                <p class="text-gray-900 text-sm">${safe(type)}</p>
              </div>
              <div class="bg-gray-50 p-3 rounded-lg">
                <label class="block text-sm font-medium text-gray-700 mb-1"><i class="fas fa-coins mr-1"></i>Total Fee</label>
                <p class="text-gray-900 text-sm font-semibold">${money(s.total_fee)}</p>
              </div>
              <div class="bg-gray-50 p-3 rounded-lg md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1"><i class="fas fa-sticky-note mr-1"></i>Notes</label>
                <p class="text-gray-900 text-sm">${safe(s.notes)}</p>
              </div>
            </div>
          </div>

          <!-- Timestamps -->
          <div class="mt-4">
            <div class="flex items-center gap-2 mb-3">
              <i class="fas fa-clock text-orange-500"></i>
              <h4 class="text-md font-semibold text-gray-800">Timestamps</h4>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-gray-50 p-3 rounded-lg">
                <label class="block text-sm font-medium text-gray-700 mb-1"><i class="fas fa-plus mr-1"></i>Created</label>
                <span class="text-gray-900 text-sm">${safe(s.created_at)}</span>
              </div>
              <div class="bg-gray-50 p-3 rounded-lg">
                <label class="block text-sm font-medium text-gray-700 mb-1"><i class="fas fa-edit mr-1"></i>Updated</label>
                <span class="text-gray-900 text-sm">${safe(s.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div slot="footer" class="flex justify-end">
          <ui-button variant="outline" color="secondary" modal-action="cancel">Close</ui-button>
        </div>
      </ui-modal>
    `;
  }
}

customElements.define('finance-schedule-view-modal', FinanceScheduleViewModal);
export default FinanceScheduleViewModal;


