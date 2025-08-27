import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/SearchDropdown.js';
import '@/components/ui/Button.js';
import api from '@/services/api.js';

class FinanceInvoiceAddModal extends HTMLElement {
  constructor() {
    super();
    this._students = [];
    this._classes = [];
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

  // Set classes data (called from parent page)
  setClasses(classes) {
    this._classes = Array.isArray(classes) ? classes : [];
    this.render();
    this.setupEventListeners();
  }

  // Load students by class
  async loadStudentsByClass(classId) {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await api.withToken(token).get(`/students/by-class?class_id=${classId}`);
      const students = response.data?.data || [];
      
      // Update the student dropdown
      const studentDropdown = this.querySelector('ui-search-dropdown[name="student_id"]');
      if (studentDropdown) {
        const studentOptions = students.map(s => {
          const name = s.name || [s.first_name, s.last_name].filter(Boolean).join(' ') || s.full_name || s.username || s.email || `Student #${s.id}`;
          return `<ui-option value="${s.id}">${name}</ui-option>`;
        }).join('');
        studentDropdown.innerHTML = studentOptions;
        
        // Clear previous selection
        studentDropdown.value = '';
        
        // Enable the dropdown
        studentDropdown.removeAttribute('disabled');
        
        // Clear dependent fields
        this.clearDependentFields();
      }
    } catch (error) {
      console.error('Error loading students by class:', error);
    }
  }

  // Clear dependent fields when class changes
  clearDependentFields() {
    const yearInput = this.querySelector('ui-input[data-field="academic_year"]');
    const gradingPeriodInput = this.querySelector('ui-input[data-field="grading_period"]');
    const amountDueInput = this.querySelector('ui-input[data-field="amount_due"]');
    const infoEl = this.querySelector('#current-class-info');
    const missBadge = this.querySelector('#schedule-missing');

    if (yearInput) yearInput.value = '';
    if (gradingPeriodInput) gradingPeriodInput.value = '';
    if (amountDueInput) amountDueInput.value = '';
    if (infoEl) infoEl.textContent = '';
    if (missBadge) missBadge.remove();
  }

  // Get academic year for a selected class
  getClassAcademicYear(classId) {
    const selectedClass = this._classes.find(c => c.id === Number(classId));
    if (selectedClass && selectedClass.academic_year) {
      return selectedClass.academic_year;
    }
    return null;
  }

  setupEventListeners() {
    if (this._listenersAttached) return;
    this.addEventListener('cancel', () => this.close());
    // Auto-fill amount_due when student/year/term changes (debounced)
    const rebindAuto = () => {
      const studentDd = this.querySelector('ui-search-dropdown[name="student_id"]');
      const yearInput = this.querySelector('ui-input[data-field="academic_year"]');
      const gradingPeriodInput = this.querySelector('ui-input[data-field="grading_period"]');
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
      if (gradingPeriodInput && !gradingPeriodInput._autoBound) {
        gradingPeriodInput.addEventListener('input', () => { trigger(); });
        gradingPeriodInput.addEventListener('change', () => { trigger(); });
        gradingPeriodInput._autoBound = true;
      }
    };
    setTimeout(rebindAuto, 0);

         // Add event listener for grading period dropdown changes
     this.addEventListener('change', (e) => {
       const gradingPeriodDropdown = e.target.closest('ui-search-dropdown[name="grading_period"]');
       if (gradingPeriodDropdown) {
         // When grading period changes, update the amount
         this.updateAmountForSelectedGradingPeriod();
         // Also trigger form validation to enable/disable save button
         setTimeout(() => this.validateForm(), 100);
       }
     });
    // Capture any change events from the student dropdown to ensure logging triggers
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
            const resp = await api.withToken(token).get(`/students/${id}`).catch(() => null);
            const student = resp?.data?.data || null;
            const classId = student?.current_class_id || null;
            const infoEl = this.querySelector('#current-class-info');
            // Show student type badge and clear dependent fields
            const amountDueInput = this.querySelector('ui-input[data-field="amount_due"]');
            const yearInput2 = this.querySelector('ui-input[data-field="academic_year"]');
            const termInput2 = this.querySelector('ui-input[data-field="term"]');
            const missBadge = this.querySelector('#schedule-missing');
            if (amountDueInput) amountDueInput.value = '';
            if (yearInput2) yearInput2.value = '';
            if (termInput2) termInput2.value = '';
            if (missBadge) missBadge.remove();
            this.autoFillAmountDueDebounced();
            if (classId) {
              const cls = await api.withToken(token).get(`/classes/${classId}`).catch(() => null);
              const info = cls?.data?.data;
              if (info && infoEl) {
                const label = `${info.name || 'Class'}${info.section ? ' ' + info.section : ''}`;
                const type = student?.student_type || '';
                infoEl.innerHTML = `Current Class: ${label}${type ? ` <span id=\"current-student-type\" class=\"ml-2 text-[11px] px-2 py-0.5 rounded bg-gray-200\" data-type=\"${type}\">${type}</span>` : ''}`;
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

     async saveInvoice() {
     if (this._saving) return;
     this._saving = true;
     try {
       const studentDropdown = this.querySelector('ui-search-dropdown[name="student_id"]');
       const yearInput = this.querySelector('ui-input[data-field="academic_year"]');
       const gradingPeriodInput = this.querySelector('ui-input[data-field="grading_period"]');
       const gradingPeriodDropdown = this.querySelector('ui-search-dropdown[name="grading_period"]');
       const amountDueInput = this.querySelector('ui-input[data-field="amount_due"]');
       const amountPaidInput = this.querySelector('ui-input[data-field="amount_paid"]');
       const issueDateInput = this.querySelector('ui-input[data-field="issue_date"]');
       const dueDateInput = this.querySelector('ui-input[data-field="due_date"]');
       const notesInput = this.querySelector('ui-input[data-field="notes"]');
       const studentTypeEl = this.querySelector('#current-student-type');

       // Get grading period value from either input or dropdown
       const gradingPeriodValue = gradingPeriodInput?.value || gradingPeriodDropdown?.value || '';

       const payload = {
         student_id: studentDropdown ? Number(studentDropdown.value) : null,
         academic_year: yearInput?.value || '',
         grading_period: gradingPeriodValue,
         amount_due: amountDueInput?.value ? Number(amountDueInput.value) : 0,
         amount_paid: amountPaidInput?.value ? Number(amountPaidInput.value) : 0,
         issue_date: issueDateInput?.value || undefined,
         due_date: dueDateInput?.value || undefined,
         notes: notesInput?.value || undefined,
         student_type: (studentTypeEl?.dataset?.type) || undefined,
       };

      if (!payload.student_id) return Toast.show({ title: 'Validation', message: 'Select a student', variant: 'error', duration: 3000 });
      if (!payload.academic_year) return Toast.show({ title: 'Validation', message: 'Enter academic year', variant: 'error', duration: 3000 });
      if (!payload.grading_period) return Toast.show({ title: 'Validation', message: 'Enter grading period', variant: 'error', duration: 3000 });
      if (!payload.amount_due || isNaN(payload.amount_due)) return Toast.show({ title: 'Validation', message: 'Enter amount due', variant: 'error', duration: 3000 });

      const token = localStorage.getItem('token');
      if (!token) return Toast.show({ title: 'Auth', message: 'Please log in', variant: 'error', duration: 3000 });

      // Frontend duplicate check: one invoice per student/year/grading_period
      try {
        const q = new URLSearchParams({ student_id: String(payload.student_id), academic_year: payload.academic_year, grading_period: payload.grading_period }).toString();
        const dupResp = await api.withToken(token).get(`/finance/invoices?${q}`);
        const list = dupResp?.data?.data || [];
        if (Array.isArray(list) && list.length > 0) {
          this._saving = false;
          return Toast.show({ title: 'Duplicate', message: 'An invoice already exists for this student, year and grading period', variant: 'warning', duration: 3500 });
        }
      } catch (_) { /* ignore – backend unique index still protects */ }

      const resp = await api.withToken(token).post('/finance/invoices', payload);
      if (resp.status === 201 || resp.data?.success) {
        Toast.show({ title: 'Success', message: 'Invoice created', variant: 'success', duration: 2500 });
        const id = resp.data?.data?.id;
        const invoice = {
          id,
          invoice_number: resp.data?.data?.invoice_number,
          status: payload.amount_due - payload.amount_paid <= 0 ? 'paid' : 'open',
          balance: (payload.amount_due - (payload.amount_paid || 0)),
          created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
          updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
          ...payload,
        };
        this.close();
        this.dispatchEvent(new CustomEvent('invoice-saved', { detail: { invoice }, bubbles: true, composed: true }));
      } else {
        throw new Error(resp.data?.message || 'Failed to create invoice');
      }
    } catch (error) {
      Toast.show({ title: 'Error', message: error.response?.data?.message || 'Failed to create invoice', variant: 'error', duration: 3000 });
    } finally {
      this._saving = false;
    }
  }

     // Validate required fields and toggle Save button
   validateForm() {
     try {
       const classDropdown = this.querySelector('ui-search-dropdown[name="class_id"]');
       const studentDropdown = this.querySelector('ui-search-dropdown[name="student_id"]');
       const yearInput = this.querySelector('ui-input[data-field="academic_year"]');
       const gradingPeriodInput = this.querySelector('ui-input[data-field="grading_period"]');
       const gradingPeriodDropdown = this.querySelector('ui-search-dropdown[name="grading_period"]');
       const amountDueInput = this.querySelector('ui-input[data-field="amount_due"]');
       const saveBtn = this.querySelector('#save-invoice-btn');
       
       // Get grading period value from either input or dropdown
       const gradingPeriodValue = gradingPeriodInput?.value || gradingPeriodDropdown?.value || '';
       
               const allFilled = !!String(classDropdown?.value || '').trim() &&
          !!String(studentDropdown?.value || '').trim() &&
          !!String(yearInput?.value || '').trim() &&
          !!String(gradingPeriodValue || '').trim() &&
          Number(amountDueInput?.value || 0) > 0;
        
        if (saveBtn) {
          if (allFilled) {
            saveBtn.removeAttribute('disabled');
          } else {
            saveBtn.setAttribute('disabled', '');
          }
        }
      } catch (error) { 
        // Silent error handling
      }
   }

  addFormEventListeners() {
    const classDropdown = this.querySelector('ui-search-dropdown[name="class_id"]');
    const studentDropdown = this.querySelector('ui-search-dropdown[name="student_id"]');
    const yearInput = this.querySelector('ui-input[data-field="academic_year"]');
    const gradingPeriodInput = this.querySelector('ui-input[data-field="grading_period"]');
    const amountDueInput = this.querySelector('ui-input[data-field="amount_due"]');
    const saveBtn = this.querySelector('#save-invoice-btn');
    
    // Handle class selection to load students and auto-fill academic year
    if (classDropdown) {
      classDropdown.addEventListener('change', () => {
        const classId = classDropdown.value;
        if (classId) {
          // Load students for this class
          this.loadStudentsByClass(classId);
          
          // Auto-fill academic year
          if (yearInput) {
            const academicYear = this.getClassAcademicYear(classId);
            if (academicYear) {
              yearInput.value = academicYear;
            }
          }
        }
        this.validateForm();
      });
    }
    
    if (studentDropdown) studentDropdown.addEventListener('change', () => this.validateForm());
    [yearInput, gradingPeriodInput, amountDueInput].forEach(el => {
      if (!el) return;
      el.addEventListener('input', () => this.validateForm());
      el.addEventListener('change', () => this.validateForm());
    });
    if (saveBtn) saveBtn.addEventListener('click', () => this.saveInvoice());
    this.validateForm();
  }

  autoFillAmountDueDebounced() {
    clearTimeout(this._autoDueTimeout);
    this._autoDueTimeout = setTimeout(() => this.autoFillAmountDue(), 200);
  }

  async autoFillAmountDue() {
    try {
      const studentDropdown = this.querySelector('ui-search-dropdown[name="student_id"]');
      const classInput = this.querySelector('ui-input[data-field="class"]');
      const yearInput = this.querySelector('ui-input[data-field="academic_year"]');
      const gradingPeriodInput = this.querySelector('ui-input[data-field="grading_period"]');
      const amountDueInput = this.querySelector('ui-input[data-field="amount_due"]');
      const studentTypeInput = this.querySelector('ui-input[data-field="student_type"]');

             const studentId = studentDropdown?.value ? Number(studentDropdown.value) : null;
       if (!studentId) return;

             // Get student details - try both the individual student endpoint and the students list
       const token = localStorage.getItem('token');
       if (!token) return;

       // First try to get from the students list we already have
       let student = this._students.find(s => s.id === studentId);
       
       // Always fetch from API to get the full student details including current_class_id
       const studentResp = await api.withToken(token).get(`/students/${studentId}`);
       student = studentResp?.data?.data;
       
              if (!student) return;

      // Auto-fill class and student type
      if (classInput && student.class_name) {
        classInput.value = student.class_name;
      }
      if (studentTypeInput && student.student_type) {
        studentTypeInput.value = student.student_type;
      }

             // Get class ID for fee schedule lookup - try different possible field names
       const classId = student.class_id || student.current_class_id || student.classId;
       
       if (!classId) {
         // Show a message to the user that the student needs to be enrolled in a class
         const infoEl = this.querySelector('#current-class-info');
         if (infoEl) {
           infoEl.innerHTML = '<span class="text-red-600 text-xs">⚠️ Student is not enrolled in any class. Please enroll the student in a class first.</span>';
         }
         return;
       }

      // Get amount due from schedule
      const qs = new URLSearchParams();
      qs.append('student_id', String(studentId));
      
      if (yearInput?.value) {
        qs.append('academic_year', yearInput.value);
      }
             if (gradingPeriodInput?.value) {
         qs.append('grading_period', gradingPeriodInput.value);
       }

      const amtResp = await api.withToken(token).get(`/finance/amount-due?${qs.toString()}`);
      const amountDue = amtResp?.data?.data?.amount_due;
      const schedule = amtResp?.data?.data?.schedule || {};

      if (amountDue != null) {
        amountDueInput.value = String(amountDue);
      }

      // Auto-fill academic year and grading period from schedule
      if (yearInput && schedule.academic_year && !yearInput.value) {
        yearInput.value = schedule.academic_year;
      }
      if (gradingPeriodInput && schedule.grading_period && !gradingPeriodInput.value) {
        gradingPeriodInput.value = schedule.grading_period;
      }

      // Check for multiple schedules and convert grading period to dropdown if needed
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const schedulesResp = await api.withToken(token).get(`/finance/schedules/by-class?class_id=${classId}${student.student_type ? `&student_type=${student.student_type}` : ''}`).catch(() => null);
          const schedules = schedulesResp?.data?.data?.schedules || [];
          
          if (schedules.length > 1) {
            // Multiple schedules - convert to dropdown
            this.convertGradingPeriodToDropdown(schedules);
          } else if (schedules.length === 1) {
            // Single schedule - keep as readonly input
            this.convertGradingPeriodToInput(schedules[0]);
          }
        }
      } catch (error) {
        // Silent error handling
      }

    } catch (error) {
      // Silent error handling
    }
  }

  convertGradingPeriodToDropdown(schedules) {
    // Find the current grading period container (could be input or dropdown)
    const gradingPeriodContainer = this.querySelector('[data-field="grading_period"]');
    
    if (!gradingPeriodContainer) {
      return;
    }
    
    // If it's already a dropdown, just update the options
    if (gradingPeriodContainer.tagName === 'UI-SEARCH-DROPDOWN') {
      const options = schedules.map(schedule => 
        `<ui-option value="${schedule.grading_period}">${schedule.grading_period}</ui-option>`
      ).join('');
      gradingPeriodContainer.innerHTML = options;
      return;
    }
    
    // Convert input to dropdown
    const dropdown = document.createElement('ui-search-dropdown');
    dropdown.setAttribute('name', 'grading_period');
    dropdown.setAttribute('placeholder', 'Select grading period');
    dropdown.setAttribute('class', 'w-full');
    dropdown.setAttribute('data-field', 'grading_period');
    
    // Add options
    const options = schedules.map(schedule => 
      `<ui-option value="${schedule.grading_period}">${schedule.grading_period}</ui-option>`
    ).join('');
    dropdown.innerHTML = options;
    
    // Replace input with dropdown
    gradingPeriodContainer.parentElement.replaceChild(dropdown, gradingPeriodContainer);
    
    // Re-attach event listeners
    this.setupEventListeners();
  }

  convertGradingPeriodToInput(schedule) {
    // Find the current grading period container (could be input or dropdown)
    const gradingPeriodContainer = this.querySelector('[data-field="grading_period"]');
    
    if (!gradingPeriodContainer) {
      return;
    }
    
    // If it's already an input, just update the value
    if (gradingPeriodContainer.tagName === 'UI-INPUT') {
      gradingPeriodContainer.value = schedule.grading_period || '';
      return;
    }
    
    // Convert dropdown back to input
    const input = document.createElement('ui-input');
    input.setAttribute('data-field', 'grading_period');
    input.setAttribute('type', 'text');
    input.setAttribute('placeholder', 'e.g., First Term');
    input.setAttribute('class', 'w-full');
    input.setAttribute('readonly', '');
    input.value = schedule.grading_period || '';
    
    // Replace dropdown with input
    gradingPeriodContainer.parentElement.replaceChild(input, gradingPeriodContainer);
    
    // Re-attach event listeners
    this.setupEventListeners();
  }

  async updateAmountForSelectedGradingPeriod() {
    try {
      const studentDropdown = this.querySelector('ui-search-dropdown[name="student_id"]');
      const yearInput = this.querySelector('ui-input[data-field="academic_year"]');
      const gradingPeriodInput = this.querySelector('ui-input[data-field="grading_period"]');
      const gradingPeriodDropdown = this.querySelector('ui-search-dropdown[name="grading_period"]');
      const amountDueInput = this.querySelector('ui-input[data-field="amount_due"]');
      
      const studentId = studentDropdown?.value ? Number(studentDropdown.value) : null;
      const academicYear = yearInput?.value || '';
      const gradingPeriod = gradingPeriodInput?.value || gradingPeriodDropdown?.value || '';
      
      if (!studentId || !academicYear || !gradingPeriod) {
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) return;

      // Get the amount for the selected grading period
      const qs = new URLSearchParams({ 
        student_id: String(studentId),
        academic_year: academicYear,
        grading_period: gradingPeriod
      });
      
      const amtResp = await api.withToken(token).get(`/finance/amount-due?${qs.toString()}`);
      const amountDue = amtResp?.data?.data?.amount_due;
      const schedule = amtResp?.data?.data?.schedule || {};
      
      if (amountDue != null) {
        amountDueInput.value = String(amountDue);
        // Update academic year if not set
        if (!yearInput.value && schedule.academic_year) {
          yearInput.value = schedule.academic_year;
        }
        // Trigger form validation after updating values
        setTimeout(() => this.validateForm(), 50);
      }
    } catch (error) {
      // Silent error handling
    }
  }

  render() {
    this.innerHTML = `
      <ui-modal ${this.hasAttribute('open') ? 'open' : ''} position="right" close-button="true">
        <div slot="title">Add Fee Invoice</div>
        <form class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Class *</label>
            <ui-search-dropdown name="class_id" placeholder="Select class" class="w-full">
              ${(this._classes || []).map(c => `
                <ui-option value="${c.id}">${c.name}${c.section ? ' ' + c.section : ''}</ui-option>
              `).join('')}
            </ui-search-dropdown>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Student *</label>
            <ui-search-dropdown name="student_id" placeholder="Select class first" class="w-full" disabled>
              <ui-option value="">Select a class first</ui-option>
            </ui-search-dropdown>
            <div id="current-class-info" class="text-xs text-gray-500 mt-1"></div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
              <ui-input data-field="academic_year" type="text" placeholder="Auto-filled from class" class="w-full" readonly></ui-input>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Grading Period *</label>
              <ui-input data-field="grading_period" type="text" placeholder="e.g., First Term" class="w-full" readonly></ui-input>
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text sm font-medium text-gray-700 mb-1">Amount Due *</label>
              <ui-input data-field="amount_due" type="number" step="0.01" placeholder="e.g., 1500.00" class="w-full" readonly></ui-input>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Amount Paid *</label>
              <ui-input data-field="amount_paid" type="number" step="0.01" placeholder="0.00" class="w-full" required></ui-input>
            </div>           
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
              <ui-input data-field="issue_date" type="date" class="w-full" max="${new Date().toISOString().split('T')[0]}"></ui-input>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <ui-input data-field="due_date" type="date" class="w-full"></ui-input>
            </div>
          </div>
          <div class="grid grid-cols-1">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <ui-input data-field="notes" type="text" placeholder="Optional note" class="w-full"></ui-input>
            </div>
          </div>
        </form>

        <div class="mt-4 p-3 rounded-md bg-blue-50 border border-blue-100 text-blue-800 text-sm">
          <div class="flex items-start space-x-2">
            <i class="fas fa-info-circle mt-0.5"></i>
            <div>
              <p class="font-medium">How this works</p>
              <ul class="list-disc pl-5 mt-1 space-y-1">
                <li><strong>Class</strong>: first select the class to narrow down student options.</li>
                <li><strong>Student</strong>: then select a student from the selected class.</li>
                <li><strong>Academic Year</strong>: automatically filled from the selected class.</li>
                <li><strong>Grading Period & Amount</strong>: automatically filled from student's class fee schedule.</li>
              </ul>
            </div>
          </div>
        </div>
        <div slot="footer" class="flex items-center justify-end gap-2">
          <ui-button variant="outline" color="secondary" modal-action="cancel">Cancel</ui-button>
          <ui-button id="save-invoice-btn" color="primary" disabled>Save</ui-button>
        </div>
      </ui-modal>
    `;
    // Attach validation/save wiring
    this.addFormEventListeners();
  }
}

customElements.define('finance-invoice-add-modal', FinanceInvoiceAddModal);
export default FinanceInvoiceAddModal;



