import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/SearchDropdown.js';
import api from '@/services/api.js';

class FinancePaymentAddModal extends HTMLElement {
  constructor() {
    super();
    this._invoices = [];
    this._students = [];
    this._saving = false;
    this._studentFeeAmount = null;
  }

  static get observedAttributes() { return ['open']; }

  connectedCallback() { this.render(); this.setup(); }

  setData({ invoices = [], students = [], classes = [] } = {}) {
    this._invoices = Array.isArray(invoices) ? invoices : [];
    this._students = Array.isArray(students) ? students : [];
    this._classes = Array.isArray(classes) ? classes : [];
    this.render();
    this.setup();
    // Ensure invoice dropdown is visible by default
    setTimeout(() => {
      const invoiceDd = this.querySelector('ui-search-dropdown[name="invoice_id"]');
      const invoiceReadOnly = this.querySelector('#invoice-readonly');
      if (invoiceDd) invoiceDd.style.display = 'block';
      if (invoiceReadOnly) invoiceReadOnly.style.display = 'none';
    }, 0);
  }

  setup() {
    this.addEventListener('confirm', () => this.save());
    this.addEventListener('cancel', () => this.close());
    
    // Set current date as default and minimum for paid_on field
    setTimeout(() => {
      const dateInput = this.querySelector('ui-input[data-field="paid_on"]');
      if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('value', today);
        dateInput.setAttribute('min', today);
      }
    }, 0);

    // Setup class selection event listeners
    const classDd = this.querySelector('ui-search-dropdown[name="class_id"]');
    if (classDd && !classDd._bound) {
      classDd.addEventListener('change', () => this.onClassChange());
      classDd.addEventListener('value-change', () => this.onClassChange());
      classDd._bound = true;
    }

    // Setup student selection event listeners
    const studentDd = this.querySelector('ui-search-dropdown[name="student_id"]');
    if (studentDd && !studentDd._bound) {
      studentDd.addEventListener('change', () => this.onStudentChange());
      studentDd.addEventListener('value-change', () => this.onStudentChange());
      studentDd._bound = true;
    }

    // Setup invoice selection event listeners
    const invoiceDd = this.querySelector('ui-search-dropdown[name="invoice_id"]');
    if (invoiceDd && !invoiceDd._bound) {
      invoiceDd.addEventListener('change', () => this.updateInvoiceInfo());
      invoiceDd.addEventListener('value-change', () => this.updateInvoiceInfo());
      invoiceDd._bound = true;
    }

    // Setup amount input event listener to update invoice info for new invoices
    setTimeout(() => {
      const amountInput = this.querySelector('ui-input[data-field="amount"]');
      if (amountInput && !amountInput._bound) {
        amountInput.addEventListener('input', () => this.updateInvoiceInfo());
        amountInput.addEventListener('change', () => this.updateInvoiceInfo());
        amountInput._bound = true;
      }
    }, 0);

    setTimeout(() => this.updateInvoiceInfo(), 0);
  }

  open() { this.setAttribute('open', ''); }
  close() { this.removeAttribute('open'); }

  // Handle class selection change
  onClassChange() {
    const classDd = this.querySelector('ui-search-dropdown[name="class_id"]');
    const studentDd = this.querySelector('ui-search-dropdown[name="student_id"]');
    const invoiceDd = this.querySelector('ui-search-dropdown[name="invoice_id"]');
    const invoiceReadOnly = this.querySelector('#invoice-readonly');
    
    if (!classDd || !studentDd || !invoiceDd) return;
    
    const selectedClassId = classDd.value;
    
    // Reset student and invoice selections
    studentDd.value = '';
    invoiceDd.value = '';
    
    // Filter students by selected class
    if (selectedClassId) {
      const classStudents = this._students.filter(s => String(s.current_class_id) === String(selectedClassId));
      this.renderStudentOptions(classStudents);
    } else {
      this.renderStudentOptions([]);
    }
    
    // Clear invoice info
    this.updateInvoiceInfo();

    // Show invoice dropdown by default when no student is selected
    invoiceDd.style.display = 'block';
    if (invoiceReadOnly) invoiceReadOnly.style.display = 'none';
    
    // Reset invoice dropdown to show "Select student first" message
    this.renderInvoiceOptions([]);
  }

  // Handle student selection change
  onStudentChange() {
    const studentDd = this.querySelector('ui-search-dropdown[name="student_id"]');
    const invoiceDd = this.querySelector('ui-search-dropdown[name="invoice_id"]');
    const invoiceReadOnly = this.querySelector('#invoice-readonly');
    
    if (!studentDd || !invoiceDd) return;
    
    const selectedStudentId = studentDd.value;
    
    // Reset invoice selection
    invoiceDd.value = '';
    
    // Check if student has any invoices
    if (selectedStudentId) {
      const studentInvoices = this._invoices.filter(i => String(i.student_id) === String(selectedStudentId));
      const openInvoices = studentInvoices.filter(i => 
        String(i.status).toLowerCase() !== 'paid' && 
        Number(i.balance || (i.amount_due - (i.amount_paid || 0))) > 0
      );
      
      if (openInvoices.length > 0) {
        // Student has invoices - show dropdown, hide read-only
        invoiceDd.style.display = 'block';
        if (invoiceReadOnly) invoiceReadOnly.style.display = 'none';
        this.renderInvoiceOptions(openInvoices);
      } else {
        // Student has no invoices - hide dropdown, show read-only
        invoiceDd.style.display = 'none';
        if (invoiceReadOnly) invoiceReadOnly.style.display = 'block';
        // Get the fee amount for this student
        this.getStudentFeeAmount(selectedStudentId);
      }
    } else {
      // No student selected - show dropdown, hide read-only
      invoiceDd.style.display = 'block';
      if (invoiceReadOnly) invoiceReadOnly.style.display = 'none';
      this.renderInvoiceOptions([]);
    }
    
    // Clear invoice info
    this.updateInvoiceInfo();
  }

  // Render student options for selected class
  renderStudentOptions(students) {
    const studentDd = this.querySelector('ui-search-dropdown[name="student_id"]');
    if (!studentDd) return;
    
    const options = students.map(s => {
      const name = s.name || [s.first_name, s.last_name].filter(Boolean).join(' ') || s.full_name || s.username || s.email || `Student #${s.id}`;
      return `<ui-option value="${s.id}">${name}</ui-option>`;
    }).join('');
    
    studentDd.innerHTML = options;
  }

  // Render invoice options for selected student
  renderInvoiceOptions(invoices) {
    const invoiceDd = this.querySelector('ui-search-dropdown[name="invoice_id"]');
    if (!invoiceDd) return;
    
    const openInvoices = invoices.filter(i => 
      String(i.status).toLowerCase() !== 'paid' && 
      Number(i.balance || (i.amount_due - (i.amount_paid || 0))) > 0
    );
    
    if (openInvoices.length === 0) {
      // No invoices available - show appropriate message
      invoiceDd.innerHTML = '<ui-option value="">Select student first</ui-option>';
    } else {
      // Has invoices - show only the invoices
      const options = openInvoices.map(i => {
        const name = this.invoiceDisplay(i);
        return `<ui-option value="${i.id}">${name}</ui-option>`;
      }).join('');
      invoiceDd.innerHTML = options;
    }
  }

  invoiceDisplay(inv) {
    if (!inv) return '';
    const student = (this._students || []).find(s => String(s.id) === String(inv.student_id));
    const name = student ? (student.name || [student.first_name, student.last_name].filter(Boolean).join(' ') || student.full_name || student.username || student.email) : `Student #${inv.student_id}`;
    return `${inv.invoice_number || ('#' + inv.id)} — ${name}`;
  }

  // Get the fee amount for a student from the fee schedule
  async getStudentFeeAmount(studentId) {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await api.withToken(token).get(`/finance/amount-due?student_id=${studentId}`);
      if (response.status === 200 && response.data?.success) {
        this._studentFeeAmount = response.data.data.amount_due;
        // Update the invoice info to show the actual fee amount
        this.updateInvoiceInfo();
      }
    } catch (error) {
      console.error('Error getting student fee amount:', error);
      this._studentFeeAmount = null;
    }
  }

  updateInvoiceInfo() {
    const invoiceDd = this.querySelector('ui-search-dropdown[name="invoice_id"]');
    const infoEl = this.querySelector('#invoice-info');
    if (!infoEl) return;
    
    // Check if dropdown is visible (student has invoices) or hidden (student has no invoices)
    if (invoiceDd && invoiceDd.style.display !== 'none') {
      // Dropdown is visible - show invoice details
      const inv = (this._invoices || []).find(i => String(i.id) === String(invoiceDd.value));
      if (!inv) { 
        infoEl.innerHTML = ''; 
        return; 
      }
      const bal = Number(inv.balance || (inv.amount_due - (inv.amount_paid || 0))).toFixed(2);
      infoEl.innerHTML = `
        <div class="text-xs text-gray-600 mt-1">
          Amount Due: <span class="font-medium">${Number(inv.amount_due).toFixed(2)}</span>
          • Paid: <span class="font-medium">${Number(inv.amount_paid || 0).toFixed(2)}</span>
          • Balance: <span class="font-semibold ${Number(bal)>0?'text-red-600':'text-green-600'}">${bal}</span>
        </div>
      `;
    } else {
      // Read-only input is visible - show new invoice details
      const amountInput = this.querySelector('ui-input[data-field="amount"]');
      const amount = amountInput?.value ? Number(amountInput.value) : 0;
      
      // Use the actual fee amount from fee schedule if available, otherwise use payment amount
      const feeAmount = this._studentFeeAmount || amount;
      
      if (feeAmount > 0) {
        // Show new invoice details based on fee schedule amount
        const paymentAmount = amount || 0;
        const balance = feeAmount - paymentAmount;
        
        infoEl.innerHTML = `
          <div class="text-xs text-gray-600 mt-1">
            Amount Due: <span class="font-medium">${feeAmount.toFixed(2)}</span>
            • Paid: <span class="font-medium">${paymentAmount.toFixed(2)}</span>
            • Balance: <span class="font-semibold ${balance > 0 ? 'text-red-600' : 'text-green-600'}">${balance.toFixed(2)}</span>
          </div>
        `;
      } else {
        // No fee amount available yet
        infoEl.innerHTML = `
          <div class="text-xs text-gray-600 mt-1">
            Amount Due: <span class="font-medium">Loading...</span>
            • Paid: <span class="font-medium">0.00</span>
            • Balance: <span class="font-semibold text-gray-600">Loading...</span>
          </div>
        `;
      }
    }
  }

  async save() {
    if (this._saving) return;
    this._saving = true;
    try {
      const classDd = this.querySelector('ui-search-dropdown[name="class_id"]');
      const studentDd = this.querySelector('ui-search-dropdown[name="student_id"]');
      const invoiceDd = this.querySelector('ui-search-dropdown[name="invoice_id"]');
      const amountInput = this.querySelector('ui-input[data-field="amount"]');
      const methodDd = this.querySelector('ui-search-dropdown[name="method"]');
      const refInput = this.querySelector('ui-input[data-field="reference"]');
      const dateInput = this.querySelector('ui-input[data-field="paid_on"]');
      const notesInput = this.querySelector('ui-input[data-field="notes"]');

      const amount = amountInput?.value ? Number(amountInput.value) : 0;
      if (!amount || isNaN(amount) || amount <= 0) {
        return Toast.show({ title: 'Validation', message: 'Enter valid amount', variant: 'error', duration: 3000 });
      }

      let payload = {
        amount: amount,
        method: methodDd?.value || undefined,
        reference: refInput?.value || undefined,
        paid_on: dateInput?.value || undefined,
        notes: notesInput?.value || undefined,
      };

      // Check if we have invoice_id or need to create invoice
      if (invoiceDd?.value) {
        // Existing invoice payment
        payload.invoice_id = Number(invoiceDd.value);
      } else if (studentDd?.value) {
        // New payment - auto-create invoice
        const selectedStudent = this._students.find(s => String(s.id) === String(studentDd.value));
        if (!selectedStudent) {
          return Toast.show({ title: 'Validation', message: 'Please select a valid student', variant: 'error', duration: 3000 });
        }
        
        // Get current academic year and grading period (you might want to make these configurable)
        const currentYear = new Date().getFullYear();
        const academicYear = `${currentYear}-${currentYear + 1}`;
        const gradingPeriod = 'First Term'; // This could be made dynamic
        
        payload.student_id = Number(studentDd.value);
        payload.academic_year = academicYear;
        payload.grading_period = gradingPeriod;
      } else {
        return Toast.show({ title: 'Validation', message: 'Please select a student or invoice', variant: 'error', duration: 3000 });
      }

      const token = localStorage.getItem('token');
      if (!token) return Toast.show({ title: 'Auth', message: 'Please log in', variant: 'error', duration: 3000 });

      const resp = await api.withToken(token).post('/finance/payments', payload);
      if (resp.status === 201 || resp.data?.success) {
        const message = payload.invoice_id ? 'Payment recorded' : 'Invoice created and payment recorded';
        Toast.show({ title: 'Success', message: message, variant: 'success', duration: 2000 });
        this.close();
        this.dispatchEvent(new CustomEvent('payment-saved', { bubbles: true, composed: true }));
      } else {
        throw new Error(resp.data?.message || 'Failed to record payment');
      }
    } catch (error) {
      Toast.show({ title: 'Error', message: error.response?.data?.message || 'Failed to record payment', variant: 'error', duration: 3000 });
    } finally {
      this._saving = false;
    }
  }

  render() {
    const today = new Date().toISOString().split('T')[0];
    this.innerHTML = `
      <ui-dialog ${this.hasAttribute('open') ? 'open' : ''} title="Add Payment">
        <div slot="content">
        <form class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Class</label>
              <ui-search-dropdown name="class_id" placeholder="Select class" class="w-full">
                ${(this._classes || []).map(c => `<ui-option value="${c.id}">${c.name}${c.section ? ' (' + c.section + ')' : ''}</ui-option>`).join('')}
              </ui-search-dropdown>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Student</label>
              <ui-search-dropdown name="student_id" placeholder="Select student" class="w-full">
                <ui-option value="">Select class first</ui-option>
              </ui-search-dropdown>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Invoice</label>
            <ui-search-dropdown name="invoice_id" placeholder="Select invoice or leave empty to create new" class="w-full">
              <ui-option value="">No invoice selected - will create new</ui-option>
            </ui-search-dropdown>
            <div id="invoice-readonly" style="display: none;">
              <ui-input type="text" readonly value="New invoice will be created for this student" class="w-full bg-gray-50 text-gray-600 mt-2"></ui-input>
            </div>
            <div id="invoice-info"></div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <ui-input data-field="amount" type="number" step="0.01" placeholder="0.00" class="w-full"></ui-input>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Paid On</label>
              <ui-input data-field="paid_on" type="date" value="${today}" min="${today}" class="w-full"></ui-input>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Method</label>
            <ui-search-dropdown name="method" placeholder="Select method" class="w-full">
              <ui-option value="Cash">Cash</ui-option>
              <ui-option value="Bank">Bank</ui-option>
              <ui-option value="Mobile Money">Mobile Money</ui-option>
              <ui-option value="Cheque">Cheque</ui-option>
            </ui-search-dropdown>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Reference</label>
            <ui-input data-field="reference" type="text" placeholder="Optional reference" class="w-full"></ui-input>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <ui-input data-field="notes" type="text" placeholder="Optional note" class="w-full"></ui-input>
          </div>
        </form>

        <div class="mt-4 p-3 rounded-md bg-blue-50 border border-blue-100 text-blue-800 text-sm">
          <div class="flex items-start space-x-2">
            <i class="fas fa-info-circle mt-0.5"></i>
            <div>
              <p class="font-medium">How to make a payment</p>
              <ul class="list-disc pl-5 mt-1 space-y-1">
                <li><strong>Class & Student</strong>: First select a class, then select a student from that class.</li>
                <li><strong>Invoice</strong>: If the student has an existing invoice, select it. If none exists, leave empty and the system will auto-create one.</li>
                <li><strong>Amount</strong>: Enter the payment amount. This will automatically update the invoice balance.</li>
                <li><strong>Method</strong>: Choose how the payment was made (cash, bank transfer, etc.).</li>
                <li><strong>Paid On</strong>: The payment date defaults to today and cannot be backdated.</li>
                <li><strong>Notes</strong>: Add any additional details about this payment.</li>
              </ul>
            </div>
          </div>
        </div>
      </ui-dialog>
    `;
  }
}

customElements.define('finance-payment-add-modal', FinancePaymentAddModal);
export default FinancePaymentAddModal;


