import App from '@/core/App.js';
import '@/components/ui/Table.js';
import '@/components/ui/Modal.js';
import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Skeleton.js';
import '@/components/ui/SearchDropdown.js';
import '@/components/ui/Button.js';
import '@/components/layout/cashierLayout/CashierInvoiceAddModal.js';
import '@/components/layout/cashierLayout/CashierInvoiceUpdateModal.js';
import '@/components/layout/cashierLayout/CashierInvoiceViewModal.js';
import '@/components/layout/cashierLayout/CashierInvoiceDeleteDialog.js';
import api from '@/services/api.js';

/**
 * Cashier: Fee Invoices Management Page
 */
class CashierInvoicesPage extends App {
  constructor() {
    super();
    this.invoices = null;
    this.students = [];
    this.loading = false;
    this.showAddModal = false;
    this.showUpdateModal = false;
    this.showViewModal = false;
    this.showDeleteDialog = false;
    this.updateInvoiceData = null;
    this.viewInvoiceData = null;
    this.deleteInvoiceData = null;
    this.filters = { academic_year: '', status: '', term: '' };
  }

  // Header counts
  getHeaderCounts() {
    const invoices = this.get('invoices') || [];
    const total = invoices.length;
    let open = 0;
    let paid = 0;
    invoices.forEach((inv) => {
      const status = String(inv.status || '').toLowerCase();
      if (status === 'paid') paid += 1; else open += 1;
    });
    const uniqueStudents = new Set((invoices || []).map(i => String(i.student_id))).size;
    return { total, open, paid, students: uniqueStudents };
  }

  renderFilters() {
    // Get unique academic years, statuses, and terms from invoices data - filter out null/empty values
    const invoices = this.get('invoices') || [];
    const academicYears = [...new Set(invoices.map(i => i.academic_year).filter(year => year && year !== null && year !== ''))].sort().reverse();
    const statuses = [...new Set(invoices.map(i => String(i.status || '')).filter(status => status && status !== null && status !== ''))].sort();
    const terms = [...new Set(invoices.map(i => i.term).filter(term => term && term !== null && term !== ''))].sort();
    
    const academicYearOptions = academicYears.map(year => `<ui-option value="${year}">${year}</ui-option>`).join('');
    const statusOptions = statuses.map(status => `<ui-option value="${status}">${status}</ui-option>`).join('');
    const termOptions = terms.map(term => `<ui-option value="${term}">${term}</ui-option>`).join('');

    const filters = this.get('filters') || { academic_year: '', status: '', term: '' };
    const { academic_year, status, term } = filters;
    
    return `
      <div class="bg-gray-100 rounded-md p-3 mb-4 border border-gray-300">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label class="block text-xs text-gray-600 mb-1">Academic Year</label>
            <ui-search-dropdown name="academic_year" placeholder="Select year" class="w-full" value="${academic_year || ''}">
              ${academicYearOptions}
            </ui-search-dropdown>
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">Status</label>
            <ui-search-dropdown name="status" placeholder="Select status" class="w-full" value="${status || ''}">
              ${statusOptions}
            </ui-search-dropdown>
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">Term</label>
            <ui-search-dropdown name="term" placeholder="Select term" class="w-full" value="${term || ''}">
              ${termOptions}
            </ui-search-dropdown>
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-3">
          <ui-button type="button" data-action="clear-filters" variant="secondary" size="sm">
            <i class="fas fa-times mr-1"></i> Clear Filters
          </ui-button>
        </div>
      </div>
    `;
  }

  renderHeader() {
    const c = this.getHeaderCounts();
    return `
      <div class="space-y-8 mb-4">
        <div class="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl shadow-lg p-5 text-white">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
            <div>
              <h1 class="text-2xl sm:text-3xl font-bold">Fee Invoices</h1>
              <p class="text-green-100 text-base sm:text-lg">Manage invoices for student fees</p>
            </div>
            <div class="mt-4 sm:mt-0 text-right">
              <div class="text-xl sm:text-2xl font-bold">${c.total}</div>
              <div class="text-green-100 text-xs sm:text-sm">Total Invoices</div>
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-6">
            <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
              <div class="flex items-center">
                <div class="size-10 flex items-center justify-center bg-yellow-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                  <i class="fas fa-file-invoice-dollar text-white text-lg sm:text-xl"></i>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-xl sm:text-2xl font-bold">${c.open}</div>
                  <div class="text-green-100 text-xs sm:text-sm">Open</div>
                </div>
              </div>
            </div>
            <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
              <div class="flex items-center">
                <div class="size-10 flex items-center justify-center bg-green-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                  <i class="fas fa-check text-white text-lg sm:text-xl"></i>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-xl sm:text-2xl font-bold">${c.paid}</div>
                  <div class="text-green-100 text-xs sm:text-sm">Paid</div>
                </div>
              </div>
            </div>
            <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
              <div class="flex items-center">
                <div class="size-10 flex items-center justify-center bg-orange-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                  <i class="fas fa-user-graduate text-white text-lg sm:text-xl"></i>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-xl sm:text-2xl font-bold">${c.students}</div>
                  <div class="text-green-100 text-xs sm:text-sm">Students Invoiced</div>
                </div>
              </div>
            </div>
            <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
              <div class="flex items-center">
                <div class="size-10 flex items-center justify-center bg-blue-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                  <i class="fas fa-sync-alt text-white text-lg sm:text-xl"></i>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-xl sm:text-2xl font-bold">${new Date().getFullYear()}</div>
                  <div class="text-green-100 text-xs sm:text-sm">Current Year</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    document.title = 'Cashier - Fee Invoices';
    this.loadData(); // Add this line to load data on page load
    
    // Event listeners for table actions - use the correct event names that match the admin version
    this.addEventListener('table-view', this.onView.bind(this));
    this.addEventListener('table-edit', this.onEdit.bind(this));
    this.addEventListener('table-delete', this.onDelete.bind(this));
    this.addEventListener('table-add', this.onAdd.bind(this));
    this.addEventListener('table-refresh', () => this.loadData());

    // Filter interactions - match the admin version exactly
    this.addEventListener('change', (e) => {
      const dd = e.target.closest('ui-search-dropdown');
      if (!dd) return;
      
      // Only close modals if this dropdown is in the filters section (not in a modal)
      const isInFilters = dd.closest('.bg-gray-100');
      if (isInFilters) {
        this.closeAllModals();
      }
      
      const name = dd.getAttribute('name');
      if (!name) return;
      
      // Only update filters if this dropdown is in the filters section
      if (isInFilters) {
        const next = { ...this.get('filters'), [name]: dd.value };
        this.set('filters', next);
        
        // Auto-apply filters when any filter changes for better UX
        setTimeout(() => this.applyFilters(), 100);
      }
    });

    this.addEventListener('click', (e) => {
      const clearBtn = e.target.closest('[data-action="clear-filters"]');
      if (clearBtn) {
        e.preventDefault();
        this.closeAllModals();
        const defaults = { academic_year: '', status: '', term: '' };
        this.set('filters', defaults);
        // Reset table to show all data
        this.render();
        Toast.show({ 
          title: 'Filters Cleared', 
          message: 'Showing all invoices', 
          variant: 'info', 
          duration: 2000 
        });
      }
    });

    // Event listeners for modal actions
    this.addEventListener('invoice-deleted', (event) => {
      const id = event.detail.id;
      const current = this.get('invoices') || [];
      this.set('invoices', current.filter((i) => String(i.id) !== String(id)));
      this.render();
      this.set('showDeleteDialog', false);
    });

    this.addEventListener('invoice-saved', (event) => {
      const newInv = event.detail.invoice;
      if (newInv) {
        const list = this.get('invoices') || [];
        const updated = [...list, newInv];
        this.set('invoices', updated);
        this.render();
        this.set('showAddModal', false);
      } else {
        this.loadData();
      }
    });

    this.addEventListener('invoice-updated', (event) => {
      const updated = event.detail.invoice;
      if (updated) {
        const current = this.get('invoices') || [];
        this.set('invoices', current.map((i) => (String(i.id) === String(updated.id) ? updated : i)));
        this.render();
        this.set('showUpdateModal', false);
      } else {
        this.loadData();
      }
    });
  }

  async loadData() {
    this.set('loading', true);
    const token = localStorage.getItem('token');
    if (!token) {
      Toast.show({ title: 'Authentication Error', message: 'Please log in to view data', variant: 'error', duration: 3000 });
      this.set('loading', false);
      return;
    }

    // Load invoices first
    try {
      const resp = await api.withToken(token).get('/cashier/invoices');
      this.set('invoices', (resp.data?.data) || []);
    } catch (error) {
      Toast.show({ title: 'Error', message: error.response?.data?.message || 'Failed to load invoices', variant: 'error', duration: 3000 });
      this.set('invoices', []);
    }

    // Load students for display names; ignore failure
    try {
      const sresp = await api.withToken(token).get('/cashier/students');
      const students = (sresp.data?.data) || [];
      this.students = students;
      this.set('students', students);
    } catch (error) {
      this.students = [];
      this.set('students', []);
    }

    this.set('loading', false);
    // Trigger render to show the loaded data
    this.render();
  }

  applyFilters() {
    const filters = this.get('filters') || {};
    const invoices = this.get('invoices') || [];
    
    // Count filtered results
    let filteredCount = invoices.length;
    if (filters.academic_year && filters.academic_year !== '') {
      filteredCount = invoices.filter(inv => String(inv.academic_year) === String(filters.academic_year)).length;
    }
    if (filters.status && filters.status !== '') {
      filteredCount = invoices.filter(inv => String(inv.status || '') === String(filters.status)).length;
    }
    if (filters.term && filters.term !== '') {
      filteredCount = invoices.filter(inv => String(inv.term) === String(filters.term)).length;
    }
    
    // Trigger re-render to show filtered data
    this.render();
    
    // Show feedback about filtering
    if (filteredCount !== invoices.length) {
      Toast.show({ 
        title: 'Filters Applied', 
        message: `Showing ${filteredCount} of ${invoices.length} invoices`, 
        variant: 'info', 
        duration: 2000 
      });
    }
  }

  studentDisplay(studentId) {
    const list = this.get('students') || this.students || [];
    const s = list.find(x => String(x.id) === String(studentId));
    if (!s) return `Student #${studentId}`;
    const fullName = s.name || [s.first_name, s.last_name].filter(Boolean).join(' ') || s.full_name || s.username || s.email || `Student #${studentId}`;
    return fullName;
  }

  onView(event) {
    const item = (this.get('invoices') || []).find((i) => String(i.id) === String(event.detail.row.id));
    if (item) {
      this.closeAllModals();
      this.set('viewInvoiceData', item);
      this.set('showViewModal', true);
      setTimeout(() => {
        const modal = this.querySelector('cashier-invoice-view-modal');
        if (modal) modal.setInvoiceData({ ...item, studentDisplay: this.studentDisplay(item.student_id) });
      }, 0);
    }
  }

  onEdit(event) {
    const item = (this.get('invoices') || []).find((i) => String(i.id) === String(event.detail.row.id));
    if (item) {
      this.closeAllModals();
      this.set('updateInvoiceData', item);
      this.set('showUpdateModal', true);
      setTimeout(() => {
        const modal = this.querySelector('cashier-invoice-update-modal');
        if (modal) {
          modal.setStudents(this.students);
          modal.setInvoiceData(item);
        }
      }, 0);
    }
  }

  onDelete(event) {
    const item = (this.get('invoices') || []).find((i) => String(i.id) === String(event.detail.row.id));
    if (item) {
      this.closeAllModals();
      this.set('deleteInvoiceData', item);
      this.set('showDeleteDialog', true);
      setTimeout(() => {
        const dlg = this.querySelector('cashier-invoice-delete-dialog');
        if (dlg) dlg.setInvoiceData(item);
      }, 0);
    }
  }

  onAdd() {
    this.closeAllModals();
    this.set('showAddModal', true);
    setTimeout(() => {
      const modal = this.querySelector('cashier-invoice-add-modal');
      if (modal) modal.setStudents(this.students);
    }, 0);
  }

  clearFilters() {
    this.set('filters', { academic_year: '', status: '', term: '' });
    this.render(); // Just re-render with cleared filters
  }

  closeAllModals() {
    this.set('showAddModal', false);
    this.set('showUpdateModal', false);
    this.set('showViewModal', false);
    this.set('showDeleteDialog', false);
    this.set('updateInvoiceData', null);
    this.set('viewInvoiceData', null);
    this.set('deleteInvoiceData', null);
  }

  render() {
    const invoices = this.get('invoices');
    const loading = this.get('loading');
    const showAddModal = this.get('showAddModal');
    const showUpdateModal = this.get('showUpdateModal');
    const showViewModal = this.get('showViewModal');
    const showDeleteDialog = this.get('showDeleteDialog');
    const filters = this.get('filters') || {};

    // Apply filters to get the data that should be displayed
    let displayInvoices = invoices || [];
    if (filters.academic_year && filters.academic_year !== '') {
      displayInvoices = displayInvoices.filter(inv => String(inv.academic_year) === String(filters.academic_year));
    }
    if (filters.status && filters.status !== '') {
      displayInvoices = displayInvoices.filter(inv => String(inv.status || '') === String(filters.status));
    }
    if (filters.term && filters.term !== '') {
      displayInvoices = displayInvoices.filter(inv => String(inv.term) === String(filters.term));
    }

    const tableData = displayInvoices.map((i, idx) => ({
      id: i.id,
      index: idx + 1,
      student: this.studentDisplay(i.student_id),
      academic_year: i.academic_year,
      term: i.term,
      invoice_number: i.invoice_number,
      amount_due: Number(i.amount_due).toFixed(2),
      amount_paid: Number(i.amount_paid).toFixed(2),
      balance: Number(i.balance).toFixed(2),
      status: (i.status || '').toString(),
      issue_date: i.issue_date,
      updated: i.updated_at,
    }));

    const tableColumns = [
      { key: 'index', label: 'No.' },
      { key: 'student', label: 'Student' },
      { key: 'academic_year', label: 'Academic Year' },
      { key: 'term', label: 'Term' },
      { key: 'invoice_number', label: 'Invoice #' },
      { key: 'amount_due', label: 'Amount Due' },
      { key: 'amount_paid', label: 'Amount Paid' },
      { key: 'balance', label: 'Balance' },
      { key: 'status', label: 'Status' },
      { key: 'issue_date', label: 'Issued' },
      { key: 'updated', label: 'Updated' },
    ];

    return `
      ${this.renderHeader()}
      ${this.renderFilters()}
      <div class="bg-white rounded-lg shadow-lg p-4">
        ${loading ? `
          <div class="space-y-4">
            <ui-skeleton class="h-24 w-full"></ui-skeleton>
            <ui-skeleton class="h-24 w-full"></ui-skeleton>
            <ui-skeleton class="h-24 w-full"></ui-skeleton>
          </div>
        ` : `
          <div class="mb-8">
            <ui-table
              title="Fee Invoices"
              data='${JSON.stringify(tableData)}'
              columns='${JSON.stringify(tableColumns)}'
              sortable
              searchable
              search-placeholder="Search invoices..."
              pagination
              page-size="50"
              action
              addable
              refresh
              print
              bordered
              striped
              class="w-full"
            ></ui-table>
          </div>
        `}
      </div>

      <cashier-invoice-add-modal ${showAddModal ? 'open' : ''}></cashier-invoice-add-modal>
      <cashier-invoice-update-modal ${showUpdateModal ? 'open' : ''}></cashier-invoice-update-modal>
      <cashier-invoice-view-modal ${showViewModal ? 'open' : ''}></cashier-invoice-view-modal>
      <cashier-invoice-delete-dialog ${showDeleteDialog ? 'open' : ''}></cashier-invoice-delete-dialog>
    `;
  }
}

customElements.define('app-cashier-invoices-page', CashierInvoicesPage);
export default CashierInvoicesPage;
