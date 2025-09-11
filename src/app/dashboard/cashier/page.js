import App from '@/core/App.js';
import api from '@/services/api.js';
import '@/components/ui/Skeleton.js';

class CashierPage extends App {
  constructor() {
    super();
    this.set('loading', true);
    this.set('currentUser', null);
    this.set('invoices', []);
    this.set('payments', []);
    this.set('receipts', []);
    this.set('students', []);
    this.userName = 'Cashier';
    this.charts = {};
    this.monthlyIncomeData = null;
  }

  connectedCallback() {
    super.connectedCallback();
    document.title = 'Cashier Dashboard | School System';
    this.loadAll();
    this.addEventListener('click', this.handleHeaderActions.bind(this));
    
    // Load Chart.js dynamically
    this.loadChartJS();
  }

  handleHeaderActions(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const action = button.getAttribute('data-action');
    if (action === 'show-cashier-dashboard-info') {
      this.showCashierDashboardInfo();
    }
  }

  showCashierDashboardInfo() {
    const dialog = document.createElement('ui-dialog');
    dialog.setAttribute('open', '');
    dialog.innerHTML = `
      <div slot="header" class="flex items-center">
        <i class="fas fa-cash-register text-green-500 mr-2"></i>
        <span class="font-semibold">About Cashier Dashboard</span>
      </div>
      <div slot="content" class="space-y-4">
        <p class="text-gray-700">Overview of invoices, payments, receipts and quick links for cashier operations.</p>
        <div class="bg-gray-50 rounded-lg p-4 space-y-2">
          <div class="flex justify-between"><span class="text-sm font-medium">Summary Cards</span><span class="text-sm text-gray-600">Quick KPI snapshots for today and totals</span></div>
          <div class="flex justify-between"><span class="text-sm font-medium">Financial Overview</span><span class="text-sm text-gray-600">Invoice status, payment totals, collection rate</span></div>
          <div class="flex justify-between"><span class="text-sm font-medium">Monthly Income Chart</span><span class="text-sm text-gray-600">Visual income trends and analytics</span></div>
          <div class="flex justify-between"><span class="text-sm font-medium">Quick Actions</span><span class="text-sm text-gray-600">Record payments, manage invoices, view receipts</span></div>
        </div>
      </div>
      <div slot="footer" class="flex justify-end">
        <ui-button color="primary" onclick="this.closest('ui-dialog').close()">Got it</ui-button>
      </div>
    `;
    document.body.appendChild(dialog);
  }

  async loadChartJS() {
    if (typeof Chart === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
      script.onload = () => this.initializeCharts();
      document.head.appendChild(script);
    } else {
      this.initializeCharts();
    }
  }

  initializeCharts() {
    // Wait for the next tick to ensure DOM is ready
    setTimeout(() => {
      this.createMonthlyIncomeChart();
      this.setupYearSelector();
    }, 100);
  }

  setupYearSelector() {
    // Setup year selector for monthly income
    const yearSelector = this.querySelector('#cashierIncomeYearSelector');
    if (yearSelector) {
      yearSelector.addEventListener('change', (e) => {
        const selectedYear = e.target.value;
        this.loadMonthlyIncomeForYear(selectedYear);
      });
    }
  }

  setupClassSelector() {
    // Setup class selector for collection rate
    const classSelector = this.querySelector('#cashierCollectionClassSelector');
    if (classSelector) {
      classSelector.addEventListener('change', (e) => {
        const selectedClassId = e.target.value;
        this.loadCollectionRateForClass(selectedClassId);
      });
    }
  }

  setupPeriodSelector() {
    // Setup grading period selector for collection rate
    const periodSelector = this.querySelector('#cashierCollectionPeriodSelector');
    if (periodSelector) {
      periodSelector.addEventListener('change', (e) => {
        const selectedPeriodId = e.detail.value;
        this.loadCollectionRateForPeriod(selectedPeriodId);
      });
    }
  }

  setupMonthlyIncomeTabListeners() {
    // Setup monthly income chart tab switching
    const monthlyIncomeTabButtons = this.querySelectorAll('[data-cashier-monthly-income-tab]');
    monthlyIncomeTabButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const targetTab = e.target.getAttribute('data-cashier-monthly-income-tab');
        this.switchCashierMonthlyIncomeTab(targetTab);
      });
    });
  }

  switchCashierMonthlyIncomeTab(activeTab) {
    // Hide all monthly income chart containers
    const chartContainers = this.querySelectorAll('[data-cashier-monthly-income-chart]');
    chartContainers.forEach(container => {
      container.style.display = 'none';
    });

    // Show the active chart container
    const activeContainer = this.querySelector(`[data-cashier-monthly-income-chart="${activeTab}"]`);
    if (activeContainer) {
      activeContainer.style.display = 'block';
    }

    // Update button styles
    const tabButtons = this.querySelectorAll('[data-cashier-monthly-income-tab]');
    tabButtons.forEach(button => {
      button.classList.remove('bg-white', 'text-green-600', 'shadow-sm');
      button.classList.add('text-gray-600');
    });

    // Highlight active button
    const activeButton = this.querySelector(`[data-cashier-monthly-income-tab="${activeTab}"]`);
    if (activeButton) {
      activeButton.classList.remove('text-gray-600');
      activeButton.classList.add('bg-white', 'text-green-600', 'shadow-sm');
    }
  }

  async loadMonthlyIncome(token, year = null) {
    try {
      const url = year ? `/cashier/monthly-income?year=${year}` : '/cashier/monthly-income';
      const response = await api.withToken(token).get(url);
      if (response?.data?.success && response.data.data) {
        // Extract income values from the API response
        this.monthlyIncomeData = response.data.data.map(item => item.income);
      } else {
        console.warn('⚠️ No monthly income data available, using sample data');
        this.monthlyIncomeData = null;
      }
    } catch (error) {
      console.error('❌ Error loading monthly income data:', error);
      this.monthlyIncomeData = null;
    }
  }

  async loadCollectionRate(token, gradingPeriodId = null, classId = null) {
    try {
      let url = '/cashier/collection-rate?';
      const params = new URLSearchParams();
      
      if (gradingPeriodId) params.append('grading_period_id', gradingPeriodId);
      if (classId) params.append('class_id', classId);
      
      url += params.toString();
      
      const response = await api.withToken(token).get(url);
      if (response?.data?.success && response.data.data) {
        this.collectionRateData = response.data.data;
        this.collectionRateSummary = response.data.summary;
      } else {
        console.warn('⚠️ No collection rate data available');
        this.collectionRateData = [];
        this.collectionRateSummary = null;
      }
    } catch (error) {
      console.error('❌ Error loading collection rate data:', error);
      this.collectionRateData = [];
      this.collectionRateSummary = null;
    }
  }

  async loadClasses(token) {
    try {
      const response = await api.withToken(token).get('/classes');
      if (response?.data?.success && response.data.data) {
        this.classes = response.data.data;
      } else {
        console.warn('⚠️ No classes data available');
        this.classes = [];
      }
    } catch (error) {
      console.error('❌ Error loading classes:', error);
      this.classes = [];
    }
  }

  async loadGradingPeriods(token) {
    try {
      const response = await api.withToken(token).get('/grading-periods');
      if (response?.data?.success && response.data.data) {
        this.gradingPeriods = response.data.data;
      } else {
        console.warn('⚠️ No grading periods data available');
        this.gradingPeriods = [];
      }
    } catch (error) {
      console.error('❌ Error loading grading periods:', error);
      this.gradingPeriods = [];
    }
  }

  getActiveGradingPeriodId() {
    const periods = this.gradingPeriods || [];
    const activePeriod = periods.find(period => period.is_active === 1);
    return activePeriod ? activePeriod.id : null;
  }

  async loadMonthlyIncomeForYear(year) {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await this.loadMonthlyIncome(token, year);
      
      // Refresh the monthly income chart
      this.refreshMonthlyIncomeChart();
    } catch (error) {
      console.error('❌ Error loading monthly income data for year:', error);
    }
  }

  async loadCollectionRateForClass(classId) {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await this.loadCollectionRate(token, null, classId);
      
      // Refresh the collection rate chart
      this.refreshCollectionRateChart();
    } catch (error) {
      console.error('❌ Error loading collection rate data for class:', error);
    }
  }

  async loadCollectionRateForPeriod(gradingPeriodId) {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await this.loadCollectionRate(token, gradingPeriodId, null);
      
      // Refresh the collection rate chart
      this.refreshCollectionRateChart();
    } catch (error) {
      console.error('❌ Error loading collection rate data for period:', error);
    }
  }

  refreshMonthlyIncomeChart() {
    if (this.charts.monthlyIncome) {
      this.charts.monthlyIncome.destroy();
    }
    if (this.charts.monthlyIncomeBar) {
      this.charts.monthlyIncomeBar.destroy();
    }
    this.createMonthlyIncomeChart();
    this.createMonthlyIncomeBarChart();
  }

  refreshCollectionRateChart() {
    if (this.charts.collectionRate) {
      this.charts.collectionRate.destroy();
    }
    this.createCollectionRateChart();
  }

  createMonthlyIncomeChart() {
    // Monthly Income Line Chart
    const monthlyIncomeCtx = this.querySelector('#cashierMonthlyIncomeChart');
    if (monthlyIncomeCtx && typeof Chart !== 'undefined') {
      if (this.charts.monthlyIncome) {
        this.charts.monthlyIncome.destroy();
      }
      
      // Use real data from API or fallback to sample data
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyIncome = this.monthlyIncomeData || months.map(() => Math.floor(Math.random() * 50000) + 10000);
      
      this.charts.monthlyIncome = new Chart(monthlyIncomeCtx, {
        type: 'line',
        data: {
          labels: months,
          datasets: [{
            label: 'Monthly Income',
            data: monthlyIncome,
            borderColor: 'rgba(34, 197, 94, 1)', // green color for cashier theme
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: 'rgba(34, 197, 94, 1)',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: 'white',
              bodyColor: 'white',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              borderWidth: 1,
              callbacks: {
                label: function(context) {
                  return `Income: ₵${context.parsed.y.toLocaleString()}`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.1)'
              },
              ticks: {
                callback: function(value) {
                  return '₵' + value.toLocaleString();
                },
                font: {
                  size: 12
                }
              }
            },
            x: {
              grid: {
                display: false
              },
              ticks: {
                font: {
                  size: 12
                }
              }
            }
          },
          elements: {
            point: {
              hoverBackgroundColor: 'rgba(34, 197, 94, 1)'
            }
          }
        }
      });
    }
  }

  createMonthlyIncomeBarChart() {
    // Monthly Income Bar Chart
    const monthlyIncomeBarCtx = this.querySelector('#cashierMonthlyIncomeBarChart');
    if (monthlyIncomeBarCtx && typeof Chart !== 'undefined') {
      if (this.charts.monthlyIncomeBar) {
        this.charts.monthlyIncomeBar.destroy();
      }
      
      // Use real data from API or fallback to sample data
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyIncome = this.monthlyIncomeData || months.map(() => Math.floor(Math.random() * 50000) + 10000);
      
      this.charts.monthlyIncomeBar = new Chart(monthlyIncomeBarCtx, {
        type: 'bar',
        data: {
          labels: months,
          datasets: [{
            label: 'Monthly Income',
            data: monthlyIncome,
            backgroundColor: 'rgba(34, 197, 94, 0.7)', // green color for cashier theme
            borderColor: 'rgba(34, 197, 94, 1)',
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: 'white',
              bodyColor: 'white',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              borderWidth: 1,
              callbacks: {
                label: function(context) {
                  return `Income: ₵${context.parsed.y.toLocaleString()}`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.1)'
              },
              ticks: {
                callback: function(value) {
                  return '₵' + value.toLocaleString();
                },
                font: {
                  size: 12
                }
              }
            },
            x: {
              grid: {
                display: false
              },
              ticks: {
                font: {
                  size: 12
                }
              }
            }
          }
        }
      });
    }
  }

  createCollectionRateChart() {
    // Collection Rate Bar Chart
    const collectionRateCtx = this.querySelector('#cashierCollectionRateChart');
    if (collectionRateCtx && typeof Chart !== 'undefined') {
      if (this.charts.collectionRate) {
        this.charts.collectionRate.destroy();
      }
      
      const data = this.collectionRateData || [];
      const labels = data.map(item => `${item.class_name} (${item.class_section})`);
      const expectedCollection = data.map(item => item.expected_collection || 0);
      const actualCollection = data.map(item => item.actual_collection || 0);
      const students = data.map(item => item.total_students);
      
      this.charts.collectionRate = new Chart(collectionRateCtx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Expected Collection (₵)',
              data: expectedCollection,
              backgroundColor: 'rgba(59, 130, 246, 0.7)', // Blue
              borderColor: 'rgba(59, 130, 246, 1)',
              borderWidth: 2,
              borderRadius: 8,
              borderSkipped: false
            },
            {
              label: 'Actual Collection (₵)',
              data: actualCollection,
              backgroundColor: 'rgba(34, 197, 94, 0.7)', // Green
              borderColor: 'rgba(34, 197, 94, 1)',
              borderWidth: 2,
              borderRadius: 8,
              borderSkipped: false
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: {
                usePointStyle: true,
                padding: 20,
                font: {
                  size: 12
                }
              }
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: 'white',
              bodyColor: 'white',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              borderWidth: 1,
              callbacks: {
                label: function(context) {
                  const dataIndex = context.dataIndex;
                  const value = context.parsed.y;
                  const studentCount = students[dataIndex];
                  const rate = data[dataIndex].collection_rate || 0;
                  
                  if (context.datasetIndex === 0) {
                    return [
                      `Expected Collection: ₵${value.toLocaleString()}`,
                      `Students: ${studentCount}`,
                      `Target: 100%`
                    ];
                  } else {
                    return [
                      `Actual Collection: ₵${value.toLocaleString()}`,
                      `Students: ${studentCount}`,
                      `Collection Rate: ${rate}%`
                    ];
                  }
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.1)'
              },
              ticks: {
                callback: function(value) {
                  return '₵' + value.toLocaleString();
                },
                font: {
                  size: 12
                }
              }
            },
            x: {
              grid: {
                display: false
              },
              ticks: {
                font: {
                  size: 10
                },
                maxRotation: 45
              }
            }
          }
        }
      });
    }
  }

  generateYearOptions() {
    const currentYear = new Date().getFullYear();
    let options = '';
    for (let year = currentYear; year >= currentYear - 5; year--) {
      const selected = year === currentYear ? 'selected' : '';
      options += `<option value="${year}" ${selected}>${year}</option>`;
    }
    return options;
  }

  generateClassOptions() {
    const classes = this.classes || [];
    let options = '<option value="">All Classes</option>';
    classes.forEach(cls => {
      const displayName = cls.section ? `${cls.name} (${cls.section})` : cls.name;
      options += `<option value="${cls.id}">${displayName}</option>`;
    });
    return options;
  }

  generateGradingPeriodOptions() {
    const periods = this.gradingPeriods || [];
    let options = '';
    periods.forEach(period => {
      const isActive = period.is_active === 1;
      const statusText = isActive ? ' (Active)' : ' (Inactive)';
      const disabledAttr = !isActive ? ' disabled' : '';
      const selectedAttr = isActive ? ' selected' : '';
      options += `<ui-option value="${period.id}"${disabledAttr}${selectedAttr}>${period.name}${statusText}</ui-option>`;
    });
    return options;
  }

  refreshCharts() {
    // Wait a bit for the DOM to update, then refresh charts
    setTimeout(() => {
      this.createMonthlyIncomeChart();
      this.createMonthlyIncomeBarChart();
      this.createCollectionRateChart();
      this.setupYearSelector();
      this.setupClassSelector();
      this.setupPeriodSelector();
      this.setupMonthlyIncomeTabListeners();
    }, 200);
  }

  async loadAll() {
    try {
      this.set('loading', true);
      const token = localStorage.getItem('token');
      if (!token) {
        this.set('loading', false);
        return;
      }

      // Load user data
      try {
        const raw = localStorage.getItem('userData');
        if (raw) {
          const user = JSON.parse(raw);
          const computedName = user?.name || [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.username || user?.email || 'Cashier';
          this.set('userName', computedName);
          this.set('currentUser', user);
        }
      } catch (_) {
        // ignore
      }

      // Load monthly income data
      await this.loadMonthlyIncome(token);
      
      // Load collection rate data for active grading period
      const activePeriodId = this.getActiveGradingPeriodId();
      await this.loadCollectionRate(token, activePeriodId);
      
      // Load classes data
      await this.loadClasses(token);
      
      // Load grading periods data
      await this.loadGradingPeriods(token);

      // Fetch financial data
      const [invoicesResp, paymentsResp, receiptsResp, studentsResp] = await Promise.all([
        api.withToken(token).get('/cashier/invoices').catch(() => ({ data: { data: [] } })),
        api.withToken(token).get('/cashier/payments').catch(() => ({ data: { data: [] } })),
        api.withToken(token).get('/cashier/receipts').catch(() => ({ data: { data: [] } })),
        api.withToken(token).get('/cashier/students').catch(() => ({ data: { data: [] } }))
      ]);

      this.set('invoices', invoicesResp?.data?.data || []);
      this.set('payments', paymentsResp?.data?.data || []);
      this.set('receipts', receiptsResp?.data?.data || []);
      this.set('students', studentsResp?.data?.data || []);
      
      // Refresh charts with new data
      this.refreshCharts();
    } finally {
      this.set('loading', false);
    }
  }

  calculateInvoiceStats() {
    const invoices = this.get('invoices') || [];
    return {
      total: invoices.length,
      open: invoices.filter(i => i.status === 'open' && !i.deleted_at).length,
      paid: invoices.filter(i => i.status === 'paid' && !i.deleted_at).length,
      overdue: invoices.filter(i => i.status === 'overdue' && !i.deleted_at).length,
      totalAmount: invoices.reduce((sum, i) => sum + (parseFloat(i.amount_due) || 0), 0),
      totalCollected: invoices.reduce((sum, i) => sum + (parseFloat(i.amount_paid) || 0), 0)
    };
  }

  calculatePaymentStats() {
    const payments = this.get('payments') || [];
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0');
    
    return {
      total: payments.length,
      today: payments.filter(p => p.paid_on && p.paid_on.startsWith(today)).length,
      thisMonth: payments.filter(p => p.paid_on && p.paid_on.startsWith(thisMonth)).length,
      totalAmount: payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
      todayAmount: payments.filter(p => p.paid_on && p.paid_on.startsWith(today))
        .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
      thisMonthAmount: payments.filter(p => p.paid_on && p.paid_on.startsWith(thisMonth))
        .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
    };
  }

  calculateReceiptStats() {
    const receipts = this.get('receipts') || [];
    const today = new Date().toISOString().split('T')[0];
    
    return {
      total: receipts.length,
      today: receipts.filter(r => r.printed_on && r.printed_on.startsWith(today)).length,
      totalPrinted: receipts.filter(r => r.printed_on).length
    };
  }

  render() {
    const loading = this.get('loading');
    const userName = this.get('userName') || this.userName;
    const invoiceStats = this.calculateInvoiceStats();
    const paymentStats = this.calculatePaymentStats();
    const receiptStats = this.calculateReceiptStats();
    const students = this.get('students') || [];

    return `
      <div class="space-y-8 p-6">
        <!-- Header -->
        <div class="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl shadow-lg p-5 text-white">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
            <div>
              <div class="flex items-center gap-2">
                <h1 class="text-2xl sm:text-3xl font-bold">Cashier Dashboard</h1>
                <button class="text-white/90 mt-2 hover:text-white transition-colors" data-action="show-cashier-dashboard-info" title="About Cashier Dashboard">
                  <i class="fas fa-question-circle text-lg"></i>
                </button>
                <button 
                  onclick="this.closest('app-cashier-dashboard-page').loadAll()"
                  class="size-8 mt-2 flex items-center justify-center text-white/90 hover:text-white transition-colors duration-200 hover:bg-white/10 rounded-lg group"
                  title="Refresh data">
                  <i class="fas fa-sync-alt text-lg ${this.get('loading') ? 'animate-spin' : ''} group-hover:scale-110 transition-transform duration-200"></i>
                </button>
              </div>
              <p class="text-green-100 text-base sm:text-lg">Welcome back, ${userName}.</p>
              <p class="text-green-100 text-sm mt-1">
                <i class="fas fa-calendar-alt mr-1"></i>
                ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div class="mt-4 sm:mt-0">
              <div class="text-right">
                <div class="text-xl sm:text-2xl font-bold">${students.length}</div>
                <div class="text-green-100 text-xs sm:text-sm">Total Students</div>
              </div>
            </div>
          </div>

          <!-- Summary Cards -->
          ${loading ? `
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-4">
              <ui-skeleton class="h-24 w-full"></ui-skeleton>
              <ui-skeleton class="h-24 w-full"></ui-skeleton>
              <ui-skeleton class="h-24 w-full"></ui-skeleton>
              <ui-skeleton class="h-24 w-full"></ui-skeleton>
            </div>
          ` : `
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-4">
              <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                <div class="flex items-center">
                  <div class="size-10 flex items-center justify-center bg-emerald-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                    <i class="fas fa-file-invoice text-white text-lg sm:text-xl"></i>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="text-xl sm:text-2xl font-bold">${invoiceStats.total}</div>
                    <div class="text-green-100 text-xs sm:text-sm">Total Invoices</div>
                  </div>
                </div>
              </div>

              <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                <div class="flex items-center">
                  <div class="size-10 flex items-center justify-center bg-blue-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                    <i class="fas fa-credit-card text-white text-lg sm:text-xl"></i>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="text-xl sm:text-2xl font-bold">${paymentStats.today}</div>
                    <div class="text-green-100 text-xs sm:text-sm">Today's Payments</div>
                  </div>
                </div>
              </div>

              <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                <div class="flex items-center">
                  <div class="size-10 flex items-center justify-center bg-amber-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                    <i class="fas fa-money-bill text-white text-lg sm:text-xl"></i>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="text-xl sm:text-2xl font-bold">₵${paymentStats.todayAmount.toFixed(2)}</div>
                    <div class="text-green-100 text-xs sm:text-sm">Today's Collection</div>
                  </div>
                </div>
              </div>

              <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                <div class="flex items-center">
                  <div class="size-10 flex items-center justify-center bg-purple-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                    <i class="fas fa-receipt text-white text-lg sm:text-xl"></i>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="text-xl sm:text-2xl font-bold">${receiptStats.today}</div>
                    <div class="text-green-100 text-xs sm:text-sm">Today's Receipts</div>
                  </div>
                </div>
              </div>
            </div>
          `}
        </div>

        <!-- Financial Overview -->
        ${!loading ? `
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Invoice Status Card -->
            <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-sm border border-blue-200 p-5">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center">
                  <div class="p-2.5 rounded-lg bg-blue-500 text-white size-10 flex items-center justify-center">
                    <i class="fas fa-file-invoice text-lg"></i>
                  </div>
                  <div class="ml-3">
                    <p class="text-sm font-medium text-blue-700">Invoice Status</p>
                    <p class="text-2xl font-bold text-blue-900">${invoiceStats.total}</p>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-lg font-semibold text-blue-600">${invoiceStats.open + invoiceStats.paid}</div>
                  <div class="text-xs text-blue-500">Active</div>
                </div>
              </div>
              <div class="flex space-x-2">
                <div class="flex-1 text-center py-2 bg-white rounded-md border border-blue-200">
                  <div class="text-sm font-semibold text-orange-600">${invoiceStats.open}</div>
                  <div class="text-xs text-gray-500">Open</div>
                </div>
                <div class="flex-1 text-center py-2 bg-white rounded-md border border-blue-200">
                  <div class="text-sm font-semibold text-green-600">${invoiceStats.paid}</div>
                  <div class="text-xs text-gray-500">Paid</div>
                </div>
                <div class="flex-1 text-center py-2 bg-white rounded-md border border-blue-200">
                  <div class="text-sm font-semibold text-red-600">${invoiceStats.overdue}</div>
                  <div class="text-xs text-gray-500">Overdue</div>
                </div>
              </div>
            </div>

            <!-- Payment Summary Card -->
            <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow-sm border border-green-200 p-5">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center">
                  <div class="p-2.5 rounded-lg bg-green-500 text-white size-10 flex items-center justify-center">
                    <i class="fas fa-chart-line text-lg"></i>
                  </div>
                  <div class="ml-3">
                    <p class="text-sm font-medium text-green-700">Payment Summary</p>
                    <p class="text-2xl font-bold text-green-900">₵${paymentStats.totalAmount.toFixed(2)}</p>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-lg font-semibold text-green-600">${paymentStats.total}</div>
                  <div class="text-xs text-green-500">Total</div>
                </div>
              </div>
              <div class="space-y-2">
                <div class="flex justify-between items-center py-2 px-3 bg-white rounded-md border border-green-200">
                  <span class="text-sm text-gray-600">This Month</span>
                  <span class="font-semibold text-green-700">₵${paymentStats.thisMonthAmount.toFixed(2)}</span>
                </div>
                <div class="flex justify-between items-center py-2 px-3 bg-white rounded-md border border-green-200">
                  <span class="text-sm text-gray-600">Today</span>
                  <span class="font-semibold text-blue-700">₵${paymentStats.todayAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <!-- Collection Progress Card -->
            <div class="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg shadow-sm border border-purple-200 p-5">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center">
                  <div class="p-2.5 rounded-lg bg-purple-500 text-white size-10 flex items-center justify-center">
                    <i class="fas fa-percentage text-lg"></i>
                  </div>
                  <div class="ml-3">
                    <p class="text-sm font-medium text-purple-700">Collection Rate</p>
                    <p class="text-2xl font-bold text-purple-900">${invoiceStats.totalAmount > 0 ? ((invoiceStats.totalCollected / invoiceStats.totalAmount) * 100).toFixed(1) : 0}%</p>
                  </div>
                </div>
              </div>
              <div class="space-y-3">
                <div class="bg-white rounded-md p-3 border border-purple-200">
                  <div class="flex justify-between text-sm mb-2">
                    <span class="text-gray-600">Progress</span>
                    <span class="font-medium text-purple-600">${invoiceStats.totalAmount > 0 ? ((invoiceStats.totalCollected / invoiceStats.totalAmount) * 100).toFixed(1) : 0}%</span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-1.5">
                    <div class="bg-purple-500 h-1.5 rounded-full" style="width: ${invoiceStats.totalAmount > 0 ? ((invoiceStats.totalCollected / invoiceStats.totalAmount) * 100) : 0}%"></div>
                  </div>
                </div>
                <div class="flex space-x-2">
                  <div class="flex-1 text-center py-2 bg-white rounded-md border border-purple-200">
                    <div class="text-sm font-semibold text-red-600">₵${invoiceStats.totalAmount.toFixed(2)}</div>
                    <div class="text-xs text-gray-500">Total Due</div>
                  </div>
                  <div class="flex-1 text-center py-2 bg-white rounded-md border border-purple-200">
                    <div class="text-sm font-semibold text-green-600">₵${invoiceStats.totalCollected.toFixed(2)}</div>
                    <div class="text-xs text-gray-500">Collected</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ` : `
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ui-skeleton class="h-40 w-full"></ui-skeleton>
            <ui-skeleton class="h-40 w-full"></ui-skeleton>
            <ui-skeleton class="h-40 w-full"></ui-skeleton>
          </div>
        `}

        <!-- Monthly Income Chart -->
        ${!loading ? `
          <div class="bg-white shadow rounded-lg p-6">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center">
                <div class="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                  <i class="fas fa-chart-line text-white text-sm"></i>
                </div>
                <h3 class="text-lg font-semibold text-gray-900">Monthly Income Trends</h3>
              </div>
              <div class="flex items-center space-x-4">
                <div class="flex items-center space-x-2">
                  <label class="text-sm text-gray-600">Year:</label>
                  <select id="cashierIncomeYearSelector" class="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                    ${this.generateYearOptions()}
                  </select>
                </div>
                <!-- Tab Navigation -->
                <div class="flex bg-gray-100 rounded-lg p-1">
                  <button 
                      data-cashier-monthly-income-tab="line"
                      class="px-3 py-1.5 text-sm font-medium text-green-600 bg-white rounded-md shadow-sm transition-all duration-200">
                      Line
                  </button>
                  <button 
                      data-cashier-monthly-income-tab="bar"
                      class="px-3 py-1.5 text-sm font-medium text-gray-600 rounded-md transition-all duration-200">
                      Bar
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Line Chart Tab -->
            <div data-cashier-monthly-income-chart="line" class="relative" style="height: 300px;">
              <canvas id="cashierMonthlyIncomeChart"></canvas>
            </div>
            
            <!-- Bar Chart Tab -->
            <div data-cashier-monthly-income-chart="bar" class="relative" style="height: 300px; display: none;">
              <canvas id="cashierMonthlyIncomeBarChart"></canvas>
            </div>
            
            <div class="mt-4 text-center">
              <p class="text-sm text-gray-600">Income trends over the selected year</p>
            </div>
          </div>
        ` : `
          <div class="bg-white shadow rounded-lg p-6">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center">
                <div class="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                  <i class="fas fa-chart-line text-white text-sm"></i>
                </div>
                <h3 class="text-lg font-semibold text-gray-900">Monthly Income Trends</h3>
              </div>
            </div>
            <div class="relative" style="height: 300px;">
              <ui-skeleton class="h-full w-full"></ui-skeleton>
            </div>
          </div>
        `}

        <!-- Collection Rate Chart -->
        ${!loading ? `
          <div class="bg-white shadow rounded-lg p-6">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center">
                <div class="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                  <i class="fas fa-percentage text-white text-sm"></i>
                </div>
                <h3 class="text-lg font-semibold text-gray-900">Fee Collection Rate by Class</h3>
              </div>
              <div class="flex items-center space-x-4">
                <div class="flex items-center space-x-2">
                  <label class="text-sm text-gray-600">Class:</label>
                  <select id="cashierCollectionClassSelector" class="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                    ${this.generateClassOptions()}
                  </select>
                </div>
                <div class="flex items-center space-x-2">
                  <label class="text-sm text-gray-600">Grading Period:</label>
                  <ui-search-dropdown 
                    id="cashierCollectionPeriodSelector" 
                    name="grading_period_id" 
                    placeholder="Select grading period" 
                    class="w-48"
                    value="${this.getActiveGradingPeriodId() || ''}">
                    ${this.generateGradingPeriodOptions()}
                  </ui-search-dropdown>
                </div>
              </div>
            </div>
            <div class="relative" style="height: 400px;">
              <canvas id="cashierCollectionRateChart"></canvas>
            </div>
            <div class="mt-4 text-center">
              <p class="text-sm text-gray-600">Collection rates by class considering student types (border/day)</p>
            </div>
          </div>
        ` : `
          <div class="bg-white shadow rounded-lg p-6">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center">
                <div class="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                  <i class="fas fa-percentage text-white text-sm"></i>
                </div>
                <h3 class="text-lg font-semibold text-gray-900">Fee Collection Rate by Class</h3>
              </div>
            </div>
            <div class="relative" style="height: 400px;">
              <ui-skeleton class="h-full w-full"></ui-skeleton>
            </div>
          </div>
        `}

        <!-- Quick Actions -->
        ${loading ? `
          <div class="bg-white shadow rounded-lg p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <ui-skeleton class="h-28 w-full"></ui-skeleton>
              <ui-skeleton class="h-28 w-full"></ui-skeleton>
              <ui-skeleton class="h-28 w-full"></ui-skeleton>
              <ui-skeleton class="h-28 w-full"></ui-skeleton>
            </div>
          </div>
        ` : `
          <div class="bg-white shadow rounded-lg p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <a href="/dashboard/cashier/payment" class="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-3 rounded-lg text-center transition-all duration-200 transform hover:scale-105 shadow-md">
                <i class="fas fa-credit-card text-xl mb-2 block"></i>
                <div class="font-medium">Record Payment</div>
                <div class="text-xs opacity-90">Process student payments</div>
              </a>
              <a href="/dashboard/cashier/invoices" class="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-3 rounded-lg text-center transition-all duration-200 transform hover:scale-105 shadow-md">
                <i class="fas fa-file-invoice text-xl mb-2 block"></i>
                <div class="font-medium">Manage Invoices</div>
                <div class="text-xs opacity-90">Create & track invoices</div>
              </a>
              <a href="/dashboard/cashier/receipts" class="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-3 rounded-lg text-center transition-all duration-200 transform hover:scale-105 shadow-md">
                <i class="fas fa-receipt text-xl mb-2 block"></i>
                <div class="font-medium">View Receipts</div>
                <div class="text-xs opacity-90">Print & manage receipts</div>
              </a>
              <a href="/dashboard/profile" class="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-4 py-3 rounded-lg text-center transition-all duration-200 transform hover:scale-105 shadow-md">
                <i class="fas fa-user text-xl mb-2 block"></i>
                <div class="font-medium">My Profile</div>
                <div class="text-xs opacity-90">Update information</div>
              </a>
            </div>
          </div>
        `}
      </div>
    `;
  }
}

customElements.define('app-cashier-page', CashierPage);
export default CashierPage;