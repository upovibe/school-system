import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/SearchDropdown.js';
import api from '@/services/api.js';

class CashierInvoiceUpdateModal extends HTMLElement {
  constructor() {
    super();
    this._students = [];
    this._invoice = null;
    this._saving = false;
    this._listenersAttached = false;
  }

  static get observedAttributes() { return ['open']; }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  setStudents(students) {
    this._students = Array.isArray(students) ? students : [];
    this.render();
    this.setupEventListeners();
  }

  setInvoiceData(invoice) {
    this._invoice = invoice;
    this.render();
    this.setupEventListeners();
    this.populateForm();
  }

  setupEventListeners() {
    if (this._listenersAttached) return;
    this.addEventListener('confirm', () => this.updateInvoice());
    this.addEventListener('cancel', () => this.close());
    
    // Auto-fill amount_due when student/year/term changes (debounced)
    const rebindAuto = () => {
      const studentDd = this.querySelector('ui-search-dropdown[name="student_id"]');
      const yearInput = this.querySelector('ui-input[data-field="academic_year"]');
      const termInput = this.querySelector('ui-input[data-field="term"]');
      const trigger = () => this.autoFillAmountDueDebounced();
      
      if (studentDd && !studentDd._autoBound) {
        studentDd.addEventListener('change', () => { trigger(); });
        studentDd.addEventListener('value-change', () => { trigger(); });
        studentDd._autoBound = true;
      }
      
      if (yearInput && !yearInput._autoBound) {
        yearInput.addEventListener('input', () => { trigger(); });
        yearInput.addEventListener('change', () => { trigger(); });
        yearInput._autoBound = true;
      }
      
      if (termInput && !termInput._autoBound) {
        termInput.addEventListener('input', () => { trigger(); });
        termInput.addEventListener('change', () => { trigger(); });
        termInput._autoBound = true;
      }
    };
    
    setTimeout(rebindAuto, 0);
    
    // Capture any change events from the student dropdown
    if (!this._captureBound) {
      this.addEventListener(
        'change',
        async (e) => {
          const dropdown = e.target && e.target.closest && e.target.closest('ui-search-dropdown[name="student_id"]');
          if (!dropdown) return;
          
          const val = dropdown.value || (e.detail && e.detail.value);
          const id = Number(val);
          if (!id) return;
          
          try {
            const token = localStorage.getItem('token');
            if (!token) return;
            
            const resp = await api.withToken(token).get(`/cashier/students/${id}`).catch(() => null);
            const student = resp?.data?.data || null;
            const classId = student?.current_class_id || null;
            const infoEl = this.querySelector('#current-class-info');
            
            // Show student type badge and clear dependent fields
            const amountDueInput = this.querySelector('ui-input[data-field="amount_due"]');
            const yearInput2 = this.querySelector('ui-input[data-field="academic_year"]');
            const termInput2 = this.querySelector('ui-input[data-field="term"]');
            
            if (amountDueInput) amountDueInput.value = '';
            if (yearInput2) yearInput2.value = '';
            if (termInput2) termInput2.value = '';
            
            this.autoFillAmountDueDebounced();
            
            if (classId) {
              const cls = await api.withToken(token).get(`/classes/${classId}`).catch(() => null);
              const info = cls?.data?.data;
              if (info && infoEl) {
                const label = `${info.name || 'Class'}${info.section ? ' ' + info.section : ''}`;
                const type = student?.student_type || '';
                infoEl.innerHTML = `Current Class: ${label}${type ? ` <span id="current-student-type" class="ml-2 text-[11px] px-2 py-0.5 rounded bg-gray-200" data-type="${type}">${type}</span>` : ''}`;
              } else if (infoEl) {
                infoEl.textContent = `Current Class ID: ${classId}`;
              }
              // trigger amount-due fetch after class resolved
              this.autoFillAmountDueDebounced();
            } else if (infoEl) {
              infoEl.textContent = '';
            }
          } catch (_) {}
        },
        true
      );
      this._captureBound = true;
    }
    
    this._listenersAttached = true;
  }

  open() { this.setAttribute('open', ''); }
  close() { this.removeAttribute('open'); }

  populateForm() {
    if (!this._invoice) return;
    
    const invoice = this._invoice;
    
    // Set student dropdown
    const studentDropdown = this.querySelector('ui-search-dropdown[name="student_id"]');
    if (studentDropdown) studentDropdown.value = invoice.student_id;
    
    // Set other fields
    const fields = ['invoice_number', 'academic_year', 'term', 'amount_due', 'amount_paid', 'issue_date', 'due_date', 'notes'];
    fields.forEach(field => {
      const input = this.querySelector(`ui-input[data-field="${field}"]`);
      if (input && invoice[field]) {
        input.value = invoice[field];
      }
    });
    
    // Set student type if available
    if (invoice.student_type) {
      const typeInput = this.querySelector('ui-input[data-field="student_type"]');
      if (typeInput) typeInput.value = invoice.student_type;
    }
    
    // Update balance
    this.updateBalance();
    
    // Show current class info if available
    if (invoice.student_id) {
      this.showCurrentClassInfo(invoice.student_id);
    }
  }

  async showCurrentClassInfo(studentId) {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const resp = await api.withToken(token).get(`/cashier/students/${studentId}`).catch(() => null);
      const student = resp?.data?.data || null;
      const classId = student?.current_class_id || null;
      const infoEl = this.querySelector('#current-class-info');
      
      if (classId && infoEl) {
        const cls = await api.withToken(token).get(`/classes/${classId}`).catch(() => null);
        const info = cls?.data?.data;
        if (info) {
          const label = `${info.name || 'Class'}${info.section ? ' ' + info.section : ''}`;
          const type = student?.student_type || '';
          infoEl.innerHTML = `Current Class: ${label}${type ? ` <span id="current-student-type" class="ml-2 text-[11px] px-2 py-0.5 rounded bg-gray-200" data-type="${type}">${type}</span>` : ''}`;
        } else {
          infoEl.textContent = `Current Class ID: ${classId}`;
        }
      } else if (infoEl) {
        infoEl.textContent = '';
      }
    } catch (_) {}
  }

  updateBalance() {
    const amountDueInput = this.querySelector('ui-input[data-field="amount_due"]');
    const amountPaidInput = this.querySelector('ui-input[data-field="amount_paid"]');
    const balanceInput = this.querySelector('ui-input[data-field="balance"]');
    
    if (amountDueInput && amountPaidInput && balanceInput) {
      const amountDue = parseFloat(amountDueInput.value || 0);
      const amountPaid = parseFloat(amountPaidInput.value || 0);
      const balance = amountDue - amountPaid;
      balanceInput.value = balance.toFixed(2);
    }
  }

  async updateInvoice() {
    if (this._saving || !this._invoice) return;
    this._saving = true;
    
    try {
      const studentDropdown = this.querySelector('ui-search-dropdown[name="student_id"]');
      const yearInput = this.querySelector('ui-input[data-field="academic_year"]');
      const termInput = this.querySelector('ui-input[data-field="term"]');
      const amountDueInput = this.querySelector('ui-input[data-field="amount_due"]');
      const amountPaidInput = this.querySelector('ui-input[data-field="amount_paid"]');
      const issueDateInput = this.querySelector('ui-input[data-field="issue_date"]');
      const dueDateInput = this.querySelector('ui-input[data-field="due_date"]');
      const notesInput = this.querySelector('ui-input[data-field="notes"]');
      const studentTypeEl = this.querySelector('#current-student-type');

      const payload = {
        student_id: studentDropdown ? Number(studentDropdown.value) : null,
        academic_year: yearInput?.value || '',
        term: termInput?.value || '',
        amount_due: amountDueInput?.value ? Number(amountDueInput.value) : 0,
        amount_paid: amountPaidInput?.value ? Number(amountPaidInput.value) : 0,
        issue_date: issueDateInput?.value || '',
        due_date: dueDateInput?.value || null,
        notes: notesInput?.value || '',
        student_type: studentTypeEl?.getAttribute('data-type') || '',
        status: 'open'
      };

      // Validation
      if (!payload.student_id) {
        Toast.show({ title: 'Validation Error', message: 'Please select a student', variant: 'error', duration: 3000 });
        return;
      }
      if (!payload.academic_year) {
        Toast.show({ title: 'Validation Error', message: 'Please enter academic year', variant: 'error', duration: 3000 });
        return;
      }
      if (!payload.term) {
        Toast.show({ title: 'Validation Error', message: 'Please enter term', variant: 'error', duration: 3000 });
        return;
      }
      if (!payload.amount_due || payload.amount_due <= 0) {
        Toast.show({ title: 'Validation Error', message: 'Please enter a valid amount due', variant: 'error', duration: 3000 });
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        Toast.show({ title: 'Authentication Error', message: 'Please log in to update invoice', variant: 'error', duration: 3000 });
        return;
      }

      const response = await api.withToken(token).put(`/cashier/invoices/${this._invoice.id}`, payload);
      
      if (response.data?.success) {
        Toast.show({ title: 'Success', message: 'Invoice updated successfully', variant: 'success', duration: 3000 });
        
        // Dispatch event to parent
        this.dispatchEvent(new CustomEvent('invoice-updated', {
          bubbles: true,
          detail: { invoice: response.data.data }
        }));
        
        this.close();
      } else {
        Toast.show({ title: 'Error', message: response.data?.message || 'Failed to update invoice', variant: 'error', duration: 3000 });
      }
    } catch (error) {
      console.error('Error updating invoice:', error);
      Toast.show({ 
        title: 'Error', 
        message: error.response?.data?.message || 'Failed to update invoice. Please try again.', 
        variant: 'error', 
        duration: 3000 
      });
    } finally {
      this._saving = false;
      this.render();
    }
  }

  autoFillAmountDueDebounced() {
    clearTimeout(this._autoFillTimeout);
    this._autoFillTimeout = setTimeout(() => this.autoFillAmountDue(), 300);
  }

  async autoFillAmountDue() {
    try {
      const studentDropdown = this.querySelector('ui-search-dropdown[name="student_id"]');
      const yearInput = this.querySelector('ui-input[data-field="academic_year"]');
      const termInput = this.querySelector('ui-input[data-field="term"]');
      const amountDueInput = this.querySelector('ui-input[data-field="amount_due"]');
      
      if (!studentDropdown?.value || !yearInput?.value || !termInput?.value || !amountDueInput) return;
      
      const studentId = Number(studentDropdown.value);
      const academicYear = yearInput.value;
      const term = termInput.value;
      
      if (!studentId || !academicYear || !term) return;
      
      const token = localStorage.getItem('token');
      if (!token) return;
      
      // Try to get class fee for this student/class/year/term combination
      try {
        const resp = await api.withToken(token).get(`/cashier/class-fees?student_id=${studentId}&academic_year=${academicYear}&term=${term}`);
        const fee = resp?.data?.data;
        if (fee && fee.amount) {
          const amount = Number(fee.amount);
          amountDueInput.value = amount.toFixed(2);
          this.updateBalance();
          Toast.show({ title: 'Auto-filled', message: `Amount due: ${amount.toFixed(2)} from class fee`, variant: 'info', duration: 2000 });
          return;
        }
      } catch (_) {
        // Ignore errors
      }
    } catch (error) {
      console.error('Error auto-filling amount due:', error);
    }
  }

  render() {
    const students = this._students || [];
    const studentOptions = students.map(s => {
      const name = s.name || [s.first_name, s.last_name].filter(Boolean).join(' ') || s.full_name || s.username || s.email || `Student #${s.id}`;
      return `<ui-option value="${s.id}">${name}</ui-option>`;
    }).join('');

    return `
      <ui-modal ${this.hasAttribute('open') ? 'open' : ''} position="right" size="lg" close-button="true">
        <div slot="title">Update Fee Invoice</div>
        <div class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Student *</label>
              <ui-search-dropdown name="student_id" placeholder="Select student" class="w-full" required>
                ${studentOptions}
              </ui-search-dropdown>
              <div id="current-class-info" class="text-xs text-gray-500 mt-1"></div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
              <ui-input data-field="invoice_number" placeholder="Auto-generated" class="w-full" readonly></ui-input>
              <div class="text-xs text-gray-500 mt-1">Auto-generated invoice number</div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
              <ui-input data-field="academic_year" placeholder="e.g., 2024/2025" class="w-full" required></ui-input>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Term *</label>
              <ui-input data-field="term" placeholder="e.g., Term 1" class="w-full" required></ui-input>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Student Type</label>
              <ui-input data-field="student_type" placeholder="e.g., Day, Boarding" class="w-full"></ui-input>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Amount Due *</label>
              <ui-input data-field="amount_due" type="number" step="0.01" placeholder="0.00" class="w-full" required></ui-input>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Amount Paid</label>
              <ui-input data-field="amount_paid" type="number" step="0.01" placeholder="0.00" class="w-full" value="0"></ui-input>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Balance</label>
              <ui-input data-field="balance" type="number" step="0.01" placeholder="0.00" class="w-full" readonly></ui-input>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
              <ui-input data-field="issue_date" type="date" class="w-full"></ui-input>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <ui-input data-field="due_date" type="date" class="w-full"></ui-input>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <ui-input data-field="notes" placeholder="Additional notes..." class="w-full"></ui-input>
          </div>
        </div>

        <div slot="footer" class="flex justify-end gap-2">
          <ui-button modal-action="cancel" variant="secondary">Cancel</ui-button>
          <ui-button modal-action="confirm" variant="primary" loading="${this._saving}">
            ${this._saving ? 'Updating...' : 'Update Invoice'}
          </ui-button>
        </div>
      </ui-modal>
    `;
  }
}

customElements.define('cashier-invoice-update-modal', CashierInvoiceUpdateModal);
export default CashierInvoiceUpdateModal;
