import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

class FinanceScheduleDeleteDialog extends HTMLElement {
  constructor() {
    super();
    this._schedule = null;
  }

  static get observedAttributes() { return ['open']; }

  connectedCallback() {
    this.render();
    this.setup();
  }

  setScheduleData(schedule) {
    this._schedule = schedule || null;
    this.render();
    this.setup();
  }

  setup() {
    const dialog = this.querySelector('ui-dialog');
    if (!dialog) return;
    dialog.addEventListener('confirm', () => this.deleteSchedule());
    dialog.addEventListener('cancel', () => this.close());
  }

  open() { this.setAttribute('open', ''); }
  close() { this.removeAttribute('open'); }

  async deleteSchedule() {
    try {
      if (!this._schedule) return;
      const token = localStorage.getItem('token');
      if (!token) return Toast.show({ title: 'Auth', message: 'Please log in', variant: 'error', duration: 3000 });
      const resp = await api.withToken(token).delete(`/finance/schedules/${this._schedule.id}`);
      if (resp.status === 200 || resp.data?.success) {
        Toast.show({ title: 'Deleted', message: 'Schedule deleted', variant: 'success', duration: 2500 });
        this.close();
        this.dispatchEvent(new CustomEvent('schedule-deleted', { detail: { id: this._schedule.id }, bubbles: true, composed: true }));
      } else {
        throw new Error(resp.data?.message || 'Failed to delete schedule');
      }
    } catch (error) {
      Toast.show({ title: 'Error', message: error.response?.data?.message || 'Failed to delete schedule', variant: 'error', duration: 3000 });
    }
  }

  render() {
    const s = this._schedule || {};
    this.innerHTML = `
      <ui-dialog ${this.hasAttribute('open') ? 'open' : ''} title="Delete Fee Schedule" variant="danger">
        <div slot="content">
          <p class="text-sm text-gray-700">Are you sure you want to delete this fee schedule?</p>
          <div class="mt-3 p-3 bg-red-50 border border-red-100 rounded text-red-700 text-sm">
            <div><strong>Class:</strong> ${s.class_id ?? ''}</div>
            <div><strong>Year/Term:</strong> ${s.academic_year ?? ''} - ${s.term ?? ''}</div>
            <div><strong>Total Fee:</strong> ${s.total_fee ?? ''}</div>
          </div>
        </div>
      </ui-dialog>
    `;
  }
}

customElements.define('finance-schedule-delete-dialog', FinanceScheduleDeleteDialog);
export default FinanceScheduleDeleteDialog;


