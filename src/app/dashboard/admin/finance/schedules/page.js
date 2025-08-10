import App from '@/core/App.js';
import '@/components/ui/Table.js';
import '@/components/ui/Modal.js';
import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Skeleton.js';
import '@/components/layout/adminLayout/FinanceScheduleAddModal.js';
import '@/components/layout/adminLayout/FinanceScheduleUpdateModal.js';
import '@/components/layout/adminLayout/FinanceScheduleViewModal.js';
import '@/components/layout/adminLayout/FinanceScheduleDeleteDialog.js';
import api from '@/services/api.js';

/**
 * Finance: Fee Schedules Management Page
 *
 * Displays fee schedules with CRUD actions using the Table component.
 */
class FinanceSchedulesPage extends App {
  constructor() {
    super();
    this.schedules = null;
    this.classes = [];
    this.loading = false;
    this.showAddModal = false;
    this.showUpdateModal = false;
    this.showViewModal = false;
    this.showDeleteDialog = false;
    this.updateScheduleData = null;
    this.viewScheduleData = null;
    this.deleteScheduleData = null;
    this.filters = { class_id: '', academic_year: '', term: '', student_type: '' };
  }

  // Header counts
  getHeaderCounts() {
    const schedules = this.get('schedules') || [];
    const total = schedules.length;
    let active = 0;
    let inactive = 0;
    const classSet = new Set();
    const yearSet = new Set();
    schedules.forEach((s) => {
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
        <div class="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl shadow-lg p-5 text-white">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
            <div>
              <h1 class="text-2xl sm:text-3xl font-bold">Fee Schedules</h1>
              <p class="text-emerald-100 text-base sm:text-lg">Manage class fee schedules by year and term</p>
            </div>
            <div class="mt-4 sm:mt-0 text-right">
              <div class="text-xl sm:text-2xl font-bold">${c.total}</div>
              <div class="text-emerald-100 text-xs sm:text-sm">Total Schedules</div>
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
                  <div class="text-emerald-100 text-xs sm:text-sm">Active</div>
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
                  <div class="text-emerald-100 text-xs sm:text-sm">Inactive</div>
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
                  <div class="text-emerald-100 text-xs sm:text-sm">Classes Covered</div>
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
                  <div class="text-emerald-100 text-xs sm:text-sm">Academic Years</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderFilters() {
    const classOptions = (this.classes || []).map(c => `<ui-option value="${c.id}">${c.name}${c.section ? ' - '+c.section : ''}</ui-option>`).join('');
    
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
    document.title = 'Fee Schedules | School System';
    this.loadData();

    this.addEventListener('table-view', this.onView.bind(this));
    this.addEventListener('table-edit', this.onEdit.bind(this));
    this.addEventListener('table-delete', this.onDelete.bind(this));
    this.addEventListener('table-add', this.onAdd.bind(this));
    this.addEventListener('table-refresh', () => this.loadData());

    // Filter interactions
    this.addEventListener('change', (e) => {
      const dd = e.target.closest('ui-search-dropdown');
      if (!dd) return;
      // Any dropdown change should close any open modal
      this.closeAllModals();
      const name = dd.getAttribute('name');
      if (!name) return;
      const next = { ...this.get('filters'), [name]: dd.value };
      console.log('Filter changed:', name, 'Value:', dd.value, 'New filters:', next);
      this.set('filters', next);
      
      // Auto-apply filters when any filter changes for better UX
      setTimeout(() => this.applyFilters(), 100);
    });

    this.addEventListener('click', (e) => {
      const clearBtn = e.target.closest('[data-action="clear-filters"]');
      if (clearBtn) {
        e.preventDefault();
        this.closeAllModals();
        const defaults = { class_id: '', academic_year: '', term: '', student_type: '' };
        this.set('filters', defaults);
        // Reset table to show all data
        this.updateTableData();
        Toast.show({ 
          title: 'Filters Cleared', 
          message: 'Showing all fee schedules', 
          variant: 'info', 
          duration: 2000 
        });
      }
    });

    this.addEventListener('schedule-deleted', (event) => {
      const id = event.detail.id;
      const current = this.get('schedules') || [];
      this.set('schedules', current.filter((s) => s.id !== id));
      this.updateTableData();
      this.set('showDeleteDialog', false);
    });

    this.addEventListener('schedule-saved', (event) => {
      const newSched = event.detail.schedule;
      if (newSched) {
        // Avoid duplicates if backend blocked due to unique key
        const existingList = this.get('schedules') || [];
        const dup = existingList.find(s => String(s.class_id) === String(newSched.class_id)
          && String(s.academic_year) === String(newSched.academic_year)
          && String(s.term) === String(newSched.term));
        if (dup) {
          Toast.show({ title: 'Info', message: 'Schedule already exists for this class/year/term', variant: 'warning', duration: 2500 });
          this.set('showAddModal', false);
          return;
        }
        const updatedList = [...existingList, newSched];
        this.set('schedules', updatedList);
        this.updateTableData();
        this.set('showAddModal', false);
      } else {
        this.loadData();
      }
    });

    this.addEventListener('schedule-updated', (event) => {
      const updated = event.detail.schedule;
      if (updated) {
        const current = this.get('schedules') || [];
        this.set('schedules', current.map((s) => (s.id === updated.id ? updated : s)));
        this.updateTableData();
        this.set('showUpdateModal', false);
      } else {
        this.loadData();
      }
    });
  }

  applyFilters() {
    const schedules = this.get('schedules') || [];
    const filters = this.get('filters') || {};
    
    console.log('Applying filters:', filters);
    console.log('Total schedules before filtering:', schedules.length);
    
    let filteredSchedules = schedules;
    
    // Filter by class_id (only if a specific class is selected)
    if (filters.class_id && filters.class_id !== '') {
      filteredSchedules = filteredSchedules.filter(s => String(s.class_id) === String(filters.class_id));
      console.log('After class filter:', filteredSchedules.length);
    }
    
    // Filter by academic_year (only if a specific year is selected)
    if (filters.academic_year && filters.academic_year !== '') {
      filteredSchedules = filteredSchedules.filter(s => String(s.academic_year) === String(filters.academic_year));
      console.log('After year filter:', filteredSchedules.length);
    }
    
    // Filter by term (only if a specific term is selected)
    if (filters.term && filters.term !== '') {
      filteredSchedules = filteredSchedules.filter(s => String(s.term) === String(filters.term));
      console.log('After term filter:', filteredSchedules.length);
    }
    
    // Filter by student_type (only if a specific type is selected)
    if (filters.student_type && filters.student_type !== '') {
      filteredSchedules = filteredSchedules.filter(s => String(s.student_type) === String(filters.student_type));
      console.log('After type filter:', filteredSchedules.length);
    }
    
    console.log('Final filtered schedules:', filteredSchedules.length);
    
    // Update the table with filtered data
    this.updateTableData(filteredSchedules);
    
    // Show feedback about filtering
    const totalOriginal = schedules.length;
    const totalFiltered = filteredSchedules.length;
    if (totalFiltered !== totalOriginal) {
      Toast.show({ 
        title: 'Filters Applied', 
        message: `Showing ${totalFiltered} of ${totalOriginal} schedules`, 
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

    // Load schedules first so table can render even if classes fail
    try {
      const schedulesResp = await api.withToken(token).get('/finance/schedules');
      this.set('schedules', (schedulesResp.data?.data) || []);
    } catch (error) {
      Toast.show({ title: 'Error', message: error.response?.data?.message || 'Failed to load fee schedules', variant: 'error', duration: 3000 });
      this.set('schedules', []);
    }

    // Load classes for display names; ignore failure
    try {
      const classesResp = await api.withToken(token).get('/classes');
      const classes = (classesResp.data?.data) || [];
      this.classes = classes;
      this.set('classes', classes);
    } catch (_) {
      this.classes = [];
      this.set('classes', []);
    }

    this.set('loading', false);
    // Rely on reactive render. Also push data into table explicitly as safety.
    this.updateTableData();
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

  onEdit(event) {
    const editItem = (this.get('schedules') || []).find((s) => s.id === event.detail.row.id);
    if (editItem) {
      this.closeAllModals();
      this.set('updateScheduleData', editItem);
      this.set('showUpdateModal', true);
      setTimeout(() => {
        const modal = this.querySelector('finance-schedule-update-modal');
        if (modal) {
          modal.setClasses(this.classes);
          modal.setScheduleData(editItem);
        }
      }, 0);
    }
  }

  onDelete(event) {
    const delItem = (this.get('schedules') || []).find((s) => s.id === event.detail.row.id);
    if (delItem) {
      this.closeAllModals();
      this.set('deleteScheduleData', delItem);
      this.set('showDeleteDialog', true);
      setTimeout(() => {
        const dlg = this.querySelector('finance-schedule-delete-dialog');
        if (dlg) dlg.setScheduleData(delItem);
      }, 0);
    }
  }

  onAdd() {
    this.closeAllModals();
    this.set('showAddModal', true);
    setTimeout(() => {
      const modal = this.querySelector('finance-schedule-add-modal');
      if (modal) {
        modal.setClasses(this.classes);
      }
    }, 0);
  }

  classDisplay(classId) {
    const classList = this.get('classes') || this.classes || [];
    const c = classList.find((x) => String(x.id) === String(classId));
    return c ? `${c.name}${c.section ? ' ' + c.section : ''}` : `Class #${classId}`;
  }

  updateTableData(schedulesToUse = null) {
    const schedules = schedulesToUse || this.get('schedules');
    if (!schedules) return;
    const tableData = schedules.map((s, i) => ({
      id: s.id,
      index: i + 1,
      class: this.classDisplay(s.class_id),
      academic_year: s.academic_year,
      term: s.term,
      student_type: s.student_type || 'Day',
      total_fee: Number(s.total_fee).toFixed(2),
      status: (Number(s.is_active) === 1 ? 'Active' : 'Inactive'),
      updated: s.updated_at,
    }));
    const table = this.querySelector('ui-table');
    if (table) {
      table.setAttribute('data', JSON.stringify(tableData));
    }
  }

  closeAllModals() {
    this.set('showAddModal', false);
    this.set('showUpdateModal', false);
    this.set('showViewModal', false);
    this.set('showDeleteDialog', false);
    this.set('updateScheduleData', null);
    this.set('viewScheduleData', null);
    this.set('deleteScheduleData', null);
  }

  render() {
    const schedules = this.get('schedules');
    const loading = this.get('loading');
    const showAddModal = this.get('showAddModal');
    const showUpdateModal = this.get('showUpdateModal');
    const showViewModal = this.get('showViewModal');
    const showDeleteDialog = this.get('showDeleteDialog');

    const tableData = schedules ? schedules.map((s, i) => ({
      id: s.id,
      index: i + 1,
      class: this.classDisplay(s.class_id),
      academic_year: s.academic_year,
      term: s.term,
      student_type: s.student_type || 'Day',
      total_fee: Number(s.total_fee).toFixed(2),
      status: (Number(s.is_active) === 1 ? 'Active' : 'Inactive'),
      updated: s.updated_at,
    })) : [];

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

      <finance-schedule-add-modal ${showAddModal ? 'open' : ''}></finance-schedule-add-modal>
      <finance-schedule-update-modal ${showUpdateModal ? 'open' : ''}></finance-schedule-update-modal>
      <finance-schedule-view-modal ${showViewModal ? 'open' : ''}></finance-schedule-view-modal>
      <finance-schedule-delete-dialog ${showDeleteDialog ? 'open' : ''}></finance-schedule-delete-dialog>
    `;
  }
}

customElements.define('app-finance-schedules-page', FinanceSchedulesPage);
export default FinanceSchedulesPage;


