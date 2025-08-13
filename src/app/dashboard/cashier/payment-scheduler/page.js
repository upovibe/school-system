import App from '@/core/App.js';
import '@/components/ui/Table.js';
import '@/components/ui/Modal.js';
import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Skeleton.js';
import '@/components/ui/SearchDropdown.js';
import '@/components/layout/adminLayout/FinanceScheduleViewModal.js';
import api from '@/services/api.js';

/**
 * Cashier: Payment Scheduler Page
 *
 * Displays fee schedules for cashiers to view and understand fee structures.
 * Cashiers can only view schedules, not modify them.
 */
class CashierPaymentSchedulerPage extends App {
  constructor() {
    super();
    this.schedules = null;
    this.classes = [];
    this.loading = false;
    this.showViewModal = false;
    this.viewScheduleData = null;
    this.filters = { class_id: '', academic_year: '', term: '', student_type: '' };
  }

  // Header counts
  getHeaderCounts() {
    const schedules = this.get('schedules') || [];
    const filters = this.get('filters') || {};
    
    // Apply filters to get the data that should be displayed
    let displaySchedules = schedules;
    if (filters.class_id && filters.class_id !== '') {
      displaySchedules = displaySchedules.filter(s => String(s.class_id) === String(filters.class_id));
    }
    if (filters.academic_year && filters.academic_year !== '') {
      displaySchedules = displaySchedules.filter(s => String(s.academic_year) === String(filters.academic_year));
    }
    if (filters.term && filters.term !== '') {
      displaySchedules = displaySchedules.filter(s => String(s.term) === String(filters.term));
    }
    if (filters.student_type && filters.student_type !== '') {
      displaySchedules = displaySchedules.filter(s => String(s.student_type) === String(filters.student_type));
    }
    
    const total = displaySchedules.length;
    let active = 0;
    let inactive = 0;
    const classSet = new Set();
    const yearSet = new Set();
    displaySchedules.forEach((s) => {
      const isActive = Number(s.is_active) === 1 || String(s.is_active).toLowerCase() === '1' || String(s.is_active).toLowerCase() === 'active';
      if (isActive) active += 1; else inactive += 1;
      if (s.class_id) classSet.add(String(s.class_id));
      if (s.academic_year) yearSet.add(String(s.academic_year));
    });
    return { total, active, inactive, classes: classSet.size, years: yearSet.size };
  }

  renderHeader() {
    const c = this.getHeaderCounts();
    return `
      <div class="space-y-8 mb-4">
        <div class="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-5 text-white">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
            <div>
              <div class="flex items-center gap-2">
                <h1 class="text-2xl sm:text-3xl font-bold">Payment Scheduler</h1>
                <button class="text-white/90 mt-2 hover:text-white transition-colors" data-action="show-cashier-schedules-info" title="About Payment Scheduler">
                  <i class="fas fa-question-circle text-lg"></i>
                </button>
              </div>
              <p class="text-blue-100 text-base sm:text-lg">View class fee schedules for payment processing</p>
            </div>
            <div class="mt-4 sm:mt-0 text-right">
              <div class="text-xl sm:text-2xl font-bold">${c.total}</div>
              <div class="text-blue-100 text-xs sm:text-sm">Total Schedules</div>
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-6">
            <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
              <div class="flex items-center">
                <div class="size-10 flex items-center justify-center bg-green-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                  <i class="fas fa-check text-white text-lg sm:text-xl"></i>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-xl sm:text-2xl font-bold">${c.active}</div>
                  <div class="text-blue-100 text-xs sm:text-sm">Active</div>
                </div>
              </div>
            </div>
            <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
              <div class="flex items-center">
                <div class="size-10 flex items-center justify-center bg-yellow-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                  <i class="fas fa-pause-circle text-white text-lg sm:text-xl"></i>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-xl sm:text-2xl font-bold">${c.inactive}</div>
                  <div class="text-blue-100 text-xs sm:text-sm">Inactive</div>
                </div>
              </div>
            </div>
            <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
              <div class="flex items-center">
                <div class="size-10 flex items-center justify-center bg-orange-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                  <i class="fas fa-layer-group text-white text-lg sm:text-xl"></i>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-xl sm:text-2xl font-bold">${c.classes}</div>
                  <div class="text-blue-100 text-xs sm:text-sm">Classes Covered</div>
                </div>
              </div>
            </div>
            <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
              <div class="flex items-center">
                <div class="size-10 flex items-center justify-center bg-red-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                  <i class="fas fa-calendar-alt text-white text-lg sm:text-xl"></i>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-xl sm:text-2xl font-bold">${c.years}</div>
                  <div class="text-blue-100 text-xs sm:text-sm">Academic Years</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderFilters() {
    // Ensure we have the latest classes data
    const classes = this.get('classes') || this.classes || [];
    const classOptions = classes.map(c => `<ui-option value="${c.id}">${c.name}${c.section ? ' - '+c.section : ''}</ui-option>`).join('');
    
    // Get unique academic years and terms from schedules data - filter out null/empty values
    const schedules = this.get('schedules') || [];
    const academicYears = [...new Set(schedules.map(s => s.academic_year).filter(year => year && year !== null && year !== ''))].sort().reverse();
    const terms = [...new Set(schedules.map(s => s.term).filter(term => term && term !== null && term !== ''))].sort();
    const studentTypes = [...new Set(schedules.map(s => s.student_type).filter(type => type && type !== null && type !== ''))].sort();
    
    const academicYearOptions = academicYears.map(year => `<ui-option value="${year}">${year}</ui-option>`).join('');
    const termOptions = terms.map(term => `<ui-option value="${term}">${term}</ui-option>`).join('');
    const studentTypeOptions = studentTypes.map(type => `<ui-option value="${type}">${type}</ui-option>`).join('');

    const filters = this.get('filters') || { class_id: '', academic_year: '', term: '', student_type: '' };
    const { class_id, academic_year, term, student_type } = filters;
    
    return `
      <div class="bg-gray-100 rounded-md p-3 mb-4 border border-gray-300">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label class="block text-xs text-gray-600 mb-1">Class</label>
            <ui-search-dropdown name="class_id" placeholder="Select class" class="w-full" value="${class_id || ''}">
              ${classOptions}
            </ui-search-dropdown>
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">Academic Year</label>
            <ui-search-dropdown name="academic_year" placeholder="Select year" class="w-full" value="${academic_year || ''}">
              ${academicYearOptions}
            </ui-search-dropdown>
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">Term</label>
            <ui-search-dropdown name="term" placeholder="Select term" class="w-full" value="${term || ''}">
              ${termOptions}
            </ui-search-dropdown>
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">Student Type</label>
            <ui-search-dropdown name="student_type" placeholder="Select type" class="w-full" value="${student_type || ''}">
              ${studentTypeOptions}
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

  connectedCallback() {
    super.connectedCallback();
    document.title = 'Payment Scheduler | Cashier Dashboard';
    this.loadData();
    this.addEventListener('click', this.handleHeaderActions.bind(this));

    this.addEventListener('table-view', this.onView.bind(this));
    this.addEventListener('table-refresh', () => this.loadData());

    // Filter interactions
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
        const defaults = { class_id: '', academic_year: '', term: '', student_type: '' };
        this.set('filters', defaults);
        // Reset table to show all data
        this.render();
        Toast.show({ 
          title: 'Filters Cleared', 
          message: 'Showing all fee schedules', 
          variant: 'info', 
          duration: 2000 
        });
      }
    });
  }

  handleHeaderActions(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const action = button.getAttribute('data-action');
    if (action === 'show-cashier-schedules-info') {
      this.showCashierSchedulesInfo();
    }
  }

  showCashierSchedulesInfo() {
    const dialog = document.createElement('ui-dialog');
    dialog.setAttribute('open', '');
    dialog.innerHTML = `
      <div slot="header" class="flex items-center">
        <i class="fas fa-calendar-alt text-indigo-500 mr-2"></i>
        <span class="font-semibold">About Payment Scheduler</span>
      </div>
      <div slot="content" class="space-y-4">
        <p class="text-gray-700">View per-class fee schedules by academic year and term. Cashiers use these as references when recording payments.</p>
        <div class="bg-gray-50 rounded-lg p-4 space-y-2">
          <div class="flex justify-between"><span class="text-sm font-medium">Class</span><span class="text-sm text-gray-600">Class and section</span></div>
          <div class="flex justify-between"><span class="text-sm font-medium">Academic Year & Term</span><span class="text-sm text-gray-600">Period covered</span></div>
          <div class="flex justify-between"><span class="text-sm font-medium">Total Fee</span><span class="text-sm text-gray-600">Used to compute invoice amount due</span></div>
        </div>
      </div>
      <div slot="footer" class="flex justify-end">
        <ui-button color="primary" onclick="this.closest('ui-dialog').close()">Got it</ui-button>
      </div>
    `;
    document.body.appendChild(dialog);
  }

  applyFilters() {
    const filters = this.get('filters') || {};
    const schedules = this.get('schedules') || [];
    
    // Count filtered results
    let filteredCount = schedules.length;
    if (filters.class_id && filters.class_id !== '') {
      filteredCount = schedules.filter(s => String(s.class_id) === String(filters.class_id)).length;
    }
    if (filters.academic_year && filters.academic_year !== '') {
      filteredCount = schedules.filter(s => String(s.academic_year) === String(filters.academic_year)).length;
    }
    if (filters.term && filters.term !== '') {
      filteredCount = schedules.filter(s => String(s.term) === String(filters.term)).length;
    }
    if (filters.student_type && filters.student_type !== '') {
      filteredCount = schedules.filter(s => String(s.student_type) === String(filters.student_type)).length;
    }
    
    // Trigger re-render to show filtered data
    this.render();
    
    // Show feedback about filtering
    if (filteredCount !== schedules.length) {
      Toast.show({ 
        title: 'Filters Applied', 
        message: `Showing ${filteredCount} of ${schedules.length} schedules`, 
        variant: 'info', 
        duration: 2000 
      });
    }
  }

  async loadData() {
    this.set('loading', true);
    const token = localStorage.getItem('token');
    if (!token) {
      Toast.show({ title: 'Authentication Error', message: 'Please log in to view data', variant: 'error', duration: 3000 });
      this.set('loading', false);
      return;
    }

    try {
      // Load both schedules and classes in parallel for better performance
      const [schedulesResp, classesResp] = await Promise.all([
        api.withToken(token).get('/cashier/schedules'),
        api.withToken(token).get('/classes/active/cashier')
      ]);

      // Set schedules data
      const schedules = (schedulesResp.data?.data) || [];
      this.set('schedules', schedules);

      // Set classes data
      const classes = (classesResp.data?.data) || [];
      this.classes = classes;
      this.set('classes', classes);

    } catch (error) {
      console.error('Error loading data:', error);
      
      // Try to load schedules separately if classes fail
      try {
        const schedulesResp = await api.withToken(token).get('/cashier/schedules');
        this.set('schedules', (schedulesResp.data?.data) || []);
      } catch (scheduleError) {
        Toast.show({ 
          title: 'Error', 
          message: scheduleError.response?.data?.message || 'Failed to load fee schedules', 
          variant: 'error', 
          duration: 3000 
        });
        this.set('schedules', []);
      }

      // Set empty classes if they failed to load
      this.classes = [];
      this.set('classes', []);
    }

    this.set('loading', false);
    // Trigger render to show the loaded data
    this.render();
  }

  onView(event) {
    const viewItem = (this.get('schedules') || []).find((s) => s.id === event.detail.row.id);
    if (viewItem) {
      this.closeAllModals();
      this.set('viewScheduleData', viewItem);
      this.set('showViewModal', true);
      setTimeout(() => {
        const modal = this.querySelector('finance-schedule-view-modal');
        if (modal) modal.setScheduleData({ ...viewItem, classDisplay: this.classDisplay(viewItem.class_id) });
      }, 0);
    }
  }

  classDisplay(classId) {
    // Use both the reactive state and the instance variable for better reliability
    const classList = this.get('classes') || this.classes || [];
    
    const c = classList.find((x) => String(x.id) === String(classId));
    if (c) {
      return `${c.name}${c.section ? ' ' + c.section : ''}`;
    } else {
      return `Class #${classId}`;
    }
  }

  closeAllModals() {
    this.set('showViewModal', false);
    this.set('viewScheduleData', null);
  }

  render() {
    const schedules = this.get('schedules');
    const loading = this.get('loading');
    const showViewModal = this.get('showViewModal');
    const filters = this.get('filters') || {};



    // Apply filters to get the data that should be displayed
    let displaySchedules = schedules || [];
    if (filters.class_id && filters.class_id !== '') {
      displaySchedules = displaySchedules.filter(s => String(s.class_id) === String(filters.class_id));
    }
    if (filters.academic_year && filters.academic_year !== '') {
      displaySchedules = displaySchedules.filter(s => String(s.academic_year) === String(filters.academic_year));
    }
    if (filters.term && filters.term !== '') {
      displaySchedules = displaySchedules.filter(s => String(s.term) === String(filters.term));
    }
    if (filters.student_type && filters.student_type !== '') {
      displaySchedules = displaySchedules.filter(s => String(s.student_type) === String(filters.student_type));
    }



    const tableData = displaySchedules.map((s, i) => {
      const classDisplay = this.classDisplay(s.class_id);
      
      return {
        id: s.id,
        index: i + 1,
        class: classDisplay,
        academic_year: s.academic_year,
        term: s.term,
        student_type: s.student_type || 'Day',
        total_fee: Number(s.total_fee).toFixed(2),
        status: (Number(s.is_active) === 1 ? 'Active' : 'Inactive'),
        updated: s.updated_at,
      };
    });



    const tableColumns = [
      { key: 'index', label: 'No.' },
      { key: 'class', label: 'Class' },
      { key: 'academic_year', label: 'Academic Year' },
      { key: 'term', label: 'Term' },
      { key: 'student_type', label: 'Type' },
      { key: 'total_fee', label: 'Total Fee' },
      { key: 'status', label: 'Status' },
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
              title="Fee Schedules"
              data='${JSON.stringify(tableData)}'
              columns='${JSON.stringify(tableColumns)}'
              sortable
              searchable
              search-placeholder="Search schedules..."
              pagination
              page-size="50"
              action
              actions="view"
              refresh
              print
              bordered
              striped
              class="w-full"
            ></ui-table>
          </div>
        `}
      </div>

      <finance-schedule-view-modal ${showViewModal ? 'open' : ''}></finance-schedule-view-modal>
    `;
  }
}

customElements.define('app-cashier-payment-scheduler-page', CashierPaymentSchedulerPage);
export default CashierPaymentSchedulerPage;
