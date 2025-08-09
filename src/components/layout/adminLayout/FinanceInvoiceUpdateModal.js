import "@/components/ui/Modal.js";
import "@/components/ui/Toast.js";
import "@/components/ui/Input.js";
import "@/components/ui/SearchDropdown.js";
import api from "@/services/api.js";

class FinanceInvoiceUpdateModal extends HTMLElement {
  constructor() {
    super();
    this._invoice = null;
    this._students = [];
  }

  static get observedAttributes() {
    return ["open"];
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  setStudents(students) {
    this._students = Array.isArray(students) ? students : [];
    this.render();
    this.setupEventListeners();
    this.fillForm();
  }

  setInvoiceData(invoice) {
    this._invoice = invoice || null;
    this.fillForm();
  }

  fillForm() {
    const inv = this._invoice;
    if (!inv) return;
    const studentDropdown = this.querySelector(
      'ui-search-dropdown[name="student_id"]'
    );
    const yearInput = this.querySelector(
      'ui-input[data-field="academic_year"]'
    );
    const termInput = this.querySelector('ui-input[data-field="term"]');
    const amountDueInput = this.querySelector(
      'ui-input[data-field="amount_due"]'
    );
    const amountPaidInput = this.querySelector(
      'ui-input[data-field="amount_paid"]'
    );
    const issueDateInput = this.querySelector(
      'ui-input[data-field="issue_date"]'
    );
    const dueDateInput = this.querySelector('ui-input[data-field="due_date"]');
    const notesInput = this.querySelector('ui-input[data-field="notes"]');
    if (studentDropdown && inv.student_id != null)
      studentDropdown.value = String(inv.student_id);
    if (yearInput) yearInput.value = inv.academic_year || "";
    if (termInput) termInput.value = inv.term || "";
    if (amountDueInput) amountDueInput.value = inv.amount_due;
    if (amountPaidInput) amountPaidInput.value = inv.amount_paid;
    if (issueDateInput) issueDateInput.value = inv.issue_date || "";
    if (dueDateInput) dueDateInput.value = inv.due_date || "";
    if (notesInput) notesInput.value = inv.notes || "";
  }

  setupEventListeners() {
    this.addEventListener("confirm", () => this.updateInvoice());
    this.addEventListener("cancel", () => this.close());
    const rebindAuto = () => {
      const studentDd = this.querySelector(
        'ui-search-dropdown[name="student_id"]'
      );
      const yearInput = this.querySelector(
        'ui-input[data-field="academic_year"]'
      );
      const termInput = this.querySelector('ui-input[data-field="term"]');
      const trigger = () => this.autoFillAmountDueDebounced();
      if (studentDd && !studentDd._autoBound) {
        studentDd.addEventListener("change", trigger);
        studentDd.addEventListener("value-change", trigger);
        studentDd._autoBound = true;
      }
      if (yearInput && !yearInput._autoBound) {
        yearInput.addEventListener("input", trigger);
        yearInput.addEventListener("change", trigger);
        yearInput._autoBound = true;
      }
      if (termInput && !termInput._autoBound) {
        termInput.addEventListener("input", trigger);
        termInput.addEventListener("change", trigger);
        termInput._autoBound = true;
      }
      // No manual billing type selector in update modal
    };
    setTimeout(rebindAuto, 0);
    // Capture change events to ensure we see student selection
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
            if (classId) {
              const cls = await api.withToken(token).get(`/classes/${classId}`).catch(() => null);
              const info = cls?.data?.data;
              if (info && infoEl) {
                const label = `${info.name || 'Class'}${info.section ? ' ' + info.section : ''}`;
                infoEl.textContent = `Current Class: ${label}`;
              } else if (infoEl) {
                infoEl.textContent = `Current Class ID: ${classId}`;
              }
            } else if (infoEl) {
              infoEl.textContent = '';
            }
          } catch (_) {}
        },
        true
      );
      this._captureBound = true;
    }
  }

  open() {
    this.setAttribute("open", "");
  }
  close() {
    this.removeAttribute("open");
  }

  async updateInvoice() {
    try {
      if (!this._invoice) return;
      const studentDropdown = this.querySelector(
        'ui-search-dropdown[name="student_id"]'
      );
      const yearInput = this.querySelector(
        'ui-input[data-field="academic_year"]'
      );
      const termInput = this.querySelector('ui-input[data-field="term"]');
      const amountDueInput = this.querySelector(
        'ui-input[data-field="amount_due"]'
      );
      const amountPaidInput = this.querySelector(
        'ui-input[data-field="amount_paid"]'
      );
      const issueDateInput = this.querySelector(
        'ui-input[data-field="issue_date"]'
      );
      const dueDateInput = this.querySelector(
        'ui-input[data-field="due_date"]'
      );
      const notesInput = this.querySelector('ui-input[data-field="notes"]');

      const payload = {
        student_id: studentDropdown?.value
          ? Number(studentDropdown.value)
          : undefined,
        academic_year: yearInput?.value || "",
        term: termInput?.value || "",
        amount_due: amountDueInput?.value ? Number(amountDueInput.value) : 0,
        amount_paid: amountPaidInput?.value ? Number(amountPaidInput.value) : 0,
        issue_date: issueDateInput?.value || undefined,
        due_date: dueDateInput?.value || undefined,
        notes: notesInput?.value || undefined,
      };

      if (!payload.academic_year)
        return Toast.show({
          title: "Validation",
          message: "Enter academic year",
          variant: "error",
          duration: 3000,
        });
      if (!payload.term)
        return Toast.show({
          title: "Validation",
          message: "Enter term",
          variant: "error",
          duration: 3000,
        });
      if (!payload.amount_due || isNaN(payload.amount_due))
        return Toast.show({
          title: "Validation",
          message: "Enter amount due",
          variant: "error",
          duration: 3000,
        });

      const token = localStorage.getItem("token");
      if (!token)
        return Toast.show({
          title: "Auth",
          message: "Please log in",
          variant: "error",
          duration: 3000,
        });

      const resp = await api
        .withToken(token)
        .put(`/finance/invoices/${this._invoice.id}`, payload);
      if (resp.status === 200 || resp.data?.success) {
        Toast.show({
          title: "Success",
          message: "Invoice updated",
          variant: "success",
          duration: 2500,
        });
        this.close();
        const amountDue = payload.amount_due;
        const amountPaid = payload.amount_paid;
        const updated = {
          ...this._invoice,
          ...payload,
          balance: amountDue - (amountPaid || 0),
          status: amountDue - (amountPaid || 0) <= 0 ? "paid" : "open",
          updated_at: new Date().toISOString().slice(0, 19).replace("T", " "),
        };
        this.dispatchEvent(
          new CustomEvent("invoice-updated", {
            detail: { invoice: updated },
            bubbles: true,
            composed: true,
          })
        );
      } else {
        throw new Error(resp.data?.message || "Failed to update invoice");
      }
    } catch (error) {
      Toast.show({
        title: "Error",
        message: error.response?.data?.message || "Failed to update invoice",
        variant: "error",
        duration: 3000,
      });
    }
  }

  autoFillAmountDueDebounced() {
    clearTimeout(this._autoDueTimeout);
    this._autoDueTimeout = setTimeout(() => this.autoFillAmountDue(), 200);
  }

  async autoFillAmountDue() {
    try {
      const amountDueInput = this.querySelector(
        'ui-input[data-field="amount_due"]'
      );
      if (!amountDueInput) return;
      // Only auto-fill if empty or zero to avoid overriding manual edits
      const current = parseFloat(amountDueInput.value || "0");
      if (current > 0) return;

      const studentDropdown = this.querySelector(
        'ui-search-dropdown[name="student_id"]'
      );
      const yearInput = this.querySelector(
        'ui-input[data-field="academic_year"]'
      );
      const termInput = this.querySelector('ui-input[data-field="term"]');
      const studentId = studentDropdown?.value
        ? Number(studentDropdown.value)
        : null;
      const academicYear = yearInput?.value || "";
      const term = termInput?.value || "";
      if (!studentId) return;

      let classId = null;
      const fromList = (this._students || []).find(
        (s) => String(s.id) === String(studentId)
      );
      if (fromList && fromList.current_class_id) {
        classId = fromList.current_class_id;
      }
      if (!classId) {
        const token = localStorage.getItem("token");
        if (!token) return;
        const resp = await api.withToken(token).get(`/students/${studentId}`);
        classId = resp?.data?.data?.current_class_id || null;
      }
      if (!classId) return;

      // Resolve class label silently
      try {
        const token2 = localStorage.getItem('token');
        if (token2) {
          const cls = await api.withToken(token2).get(`/classes/${classId}`).catch(() => null);
          const info = cls?.data?.data;
          if (info) {
            const infoEl = this.querySelector('#current-class-info');
            if (infoEl) {
              const label = `${info.name || 'Class'}${info.section ? ' ' + info.section : ''}`;
              const typeBadge = this.querySelector('#current-student-type');
              const type = typeBadge?.dataset?.type || '';
              infoEl.innerHTML = `Current Class: ${label}${type ? ` <span id="current-student-type" class="ml-2 text-[11px] px-2 py-0.5 rounded bg-gray-200" data-type="${type}">${type}</span>` : ''}`;
            }
          }
        }
      } catch (_) {}

      const token = localStorage.getItem("token");
      if (!token) return;
      const qs = new URLSearchParams({ student_id: String(studentId) });
      if (academicYear) qs.append("academic_year", academicYear);
      if (term) qs.append("term", term);
      const typeBadge = this.querySelector('#current-student-type');
      const overrideType = typeBadge?.dataset?.type || '';
      // no manual override

      const missBefore = this.querySelector('#schedule-missing');
      if (missBefore) missBefore.remove();

      try {
        const amtResp = await api.withToken(token).get(`/finance/amount-due?${qs.toString()}`);
        const amountDue = amtResp?.data?.data?.amount_due;
        const schedule = amtResp?.data?.data?.schedule || {};
        if (amountDue != null) {
          amountDueInput.value = String(amountDue);
          if (yearInput && !yearInput.value) yearInput.value = schedule.academic_year || '';
          if (termInput && !termInput.value) termInput.value = schedule.term || '';
        }
      } catch (err) {
        if (err?.response?.status === 404) {
          amountDueInput.value = '';
          if (yearInput) yearInput.value = '';
          if (termInput) termInput.value = '';
          const typeBadge2 = this.querySelector('#current-student-type');
          const parent = typeBadge2?.parentElement || this.querySelector('#current-class-info');
          const typeText = (typeBadge2?.dataset?.type || 'type');
          if (parent) {
            const existed = this.querySelector('#schedule-missing');
            if (existed) existed.remove();
            parent.insertAdjacentHTML('beforeend', ` <span id="schedule-missing" class="ml-2 text-[11px] px-2 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">No schedule for ${typeText}</span>`);
          }
        }
      }
    } catch (_) {
      // Silent fail
    }
  }

  render() {
    this.innerHTML = `
      <ui-modal ${
        this.hasAttribute("open") ? "open" : ""
      } position="right" close-button="true">
        <div slot="title">Update Fee Invoice</div>
        <form class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Student</label>
            <ui-search-dropdown name="student_id" placeholder="Select student" class="w-full">
              ${(this._students || [])
                .map((s) => {
                  const name =
                    s.name ||
                    [s.first_name, s.last_name].filter(Boolean).join(" ") ||
                    s.full_name ||
                    s.username ||
                    s.email ||
                    `Student #${s.id}`;
                  return `<ui-option value="${s.id}">${name}</ui-option>`;
                })
                .join("")}
            </ui-search-dropdown>
            <div id="current-class-info" class="text-xs text-gray-500 mt-1"></div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
              <ui-input data-field="academic_year" type="text" placeholder="e.g., 2024-2025" class="w-full"></ui-input>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Term</label>
              <ui-input data-field="term" type="text" placeholder="e.g., Term 1" class="w-full"></ui-input>
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Amount Due</label>
              <ui-input data-field="amount_due" type="number" step="0.01" placeholder="e.g., 1500.00" class="w-full" readonly></ui-input>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Amount Paid</label>
              <ui-input data-field="amount_paid" type="number" step="0.01" placeholder="0.00" class="w-full"></ui-input>
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <ui-input data-field="due_date" type="date" class="w-full"></ui-input>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
              <ui-input data-field="issue_date" type="date" class="w-full"></ui-input>
            </div>
          </div>
          <div class="grid grid-cols-1">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <ui-input data-field="notes" type="text" placeholder="Optional note" class="w-full"></ui-input>
            </div>
          </div>
          <div id="schedule-hint" class="text-xs text-red-600 mt-1 hidden"></div>
        </form>

        <div class="mt-4 p-3 rounded-md bg-blue-50 border border-blue-100 text-blue-800 text-sm">
          <div class="flex items-start space-x-2">
            <i class="fas fa-info-circle mt-0.5"></i>
            <div>
              <p class="font-medium">How this works</p>
              <ul class="list-disc pl-5 mt-1 space-y-1">
                <li>Changing amounts will recompute <strong>balance</strong> and <strong>status</strong>.</li>
              </ul>
            </div>
          </div>
        </div>
      </ui-modal>
    `;
    setTimeout(() => this.fillForm(), 0);
  }
}

customElements.define(
  "finance-invoice-update-modal",
  FinanceInvoiceUpdateModal
);
export default FinanceInvoiceUpdateModal;
