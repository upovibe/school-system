import App from '@/core/App.js';
import api from '@/services/api.js';

/**
 * Admin Dashboard Page Component (/dashboard/admin)
 * 
 * Comprehensive admin dashboard with academic management and general management statistics.
 */
class AdminDashboardPage extends App {
    constructor() {
        super();
        this.stats = {
            // Academic Management
            subjects: 0,
            classes: 0,
            teachers: 0,
            students: 0,
            classSubjects: 0,
            teacherAssignments: 0,
            gradingPeriods: 0,
            gradingPolicies: 0,
            studentGrades: 0,
            
            // General Management
            users: 0,
            teams: 0,
            applications: 0,
            events: 0,
            galleries: 0,
            videoGalleries: 0,
            news: 0,
            pages: 0,
            logs: 0,
            
            // Finance
            feeSchedules: 0,
            invoices: 0,
            payments: 0,
            receipts: 0
        };
        this.loading = true;
        this.currentUser = null;
        this.charts = {};
        
        // Initialize state properly
        this.set('stats', this.stats);
        this.set('loading', true);
        this.set('currentUser', null);
    }

    connectedCallback() {
        super.connectedCallback();
        document.title = 'Admin Dashboard | School System';
        this.loadUserData();
        this.loadStats();
        
        // Load Chart.js dynamically
        this.loadChartJS();
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
            this.createFinanceCharts();
            this.setupTabListeners();
        }, 100);
    }

    setupTabListeners() {
        // Setup tab switching functionality
        const tabButtons = this.querySelectorAll('[data-tab]');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const targetTab = e.target.getAttribute('data-tab');
                this.switchTab(targetTab);
            });
        });

        // Setup year selector for monthly income
        const yearSelector = this.querySelector('#incomeYearSelector');
        if (yearSelector) {
            yearSelector.addEventListener('change', (e) => {
                const selectedYear = e.target.value;
                this.loadMonthlyIncomeForYear(selectedYear);
            });
        }
    }

    switchTab(activeTab) {
        // Hide all chart containers
        const chartContainers = this.querySelectorAll('[data-chart]');
        chartContainers.forEach(container => {
            container.style.display = 'none';
        });

        // Show the active chart container
        const activeContainer = this.querySelector(`[data-chart="${activeTab}"]`);
        if (activeContainer) {
            activeContainer.style.display = 'block';
        }

        // Update button styles
        const tabButtons = this.querySelectorAll('[data-tab]');
        tabButtons.forEach(button => {
            button.classList.remove('bg-white', 'text-purple-600', 'shadow-sm');
            button.classList.add('text-gray-600');
        });

        // Highlight active button
        const activeButton = this.querySelector(`[data-tab="${activeTab}"]`);
        if (activeButton) {
            activeButton.classList.remove('text-gray-600');
            activeButton.classList.add('bg-white', 'text-purple-600', 'shadow-sm');
        }
    }

    createFinanceCharts() {
        const stats = this.get('stats') || this.stats;
        
        // Finance Overview Chart
        const financeCtx = this.querySelector('#financeOverviewChart');
        if (financeCtx && typeof Chart !== 'undefined') {
            if (this.charts.financeOverview) {
                this.charts.financeOverview.destroy();
            }
            
            this.charts.financeOverview = new Chart(financeCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Fee Schedules', 'Invoices', 'Payments', 'Receipts'],
                    datasets: [{
                        data: [stats.feeSchedules, stats.invoices, stats.payments, stats.receipts],
                        backgroundColor: [
                            'rgba(16, 185, 129, 0.8)',  // emerald
                            'rgba(59, 130, 246, 0.8)',  // blue
                            'rgba(34, 197, 94, 0.8)',   // green
                            'rgba(147, 51, 234, 0.8)'   // purple
                        ],
                        borderColor: [
                            'rgba(16, 185, 129, 1)',
                            'rgba(59, 130, 246, 1)',
                            'rgba(34, 197, 94, 1)',
                            'rgba(147, 51, 234, 1)'
                        ],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                usePointStyle: true,
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
                            borderWidth: 1
                        }
                    }
                }
            });
        }

        // Finance Trend Chart (Bar Chart)
        const financeTrendCtx = this.querySelector('#financeTrendChart');
        if (financeTrendCtx && typeof Chart !== 'undefined') {
            if (this.charts.financeTrend) {
                this.charts.financeTrend.destroy();
            }
            
            this.charts.financeTrend = new Chart(financeTrendCtx, {
                type: 'bar',
                data: {
                    labels: ['Fee Schedules', 'Invoices', 'Payments', 'Receipts'],
                    datasets: [{
                        label: 'Count',
                        data: [stats.feeSchedules, stats.invoices, stats.payments, stats.receipts],
                        backgroundColor: [
                            'rgba(16, 185, 129, 0.7)',
                            'rgba(34, 197, 94, 0.7)',
                            'rgba(59, 130, 246, 0.7)',
                            'rgba(147, 51, 234, 0.7)'
                        ],
                        borderColor: [
                            'rgba(16, 185, 129, 1)',
                            'rgba(34, 197, 94, 1)',
                            'rgba(59, 130, 246, 1)',
                            'rgba(147, 51, 234, 1)'
                        ],
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
                            borderWidth: 1
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            },
                            ticks: {
                                stepSize: 1,
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

        // Monthly Income Line Chart
        const monthlyIncomeCtx = this.querySelector('#monthlyIncomeChart');
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
                        borderColor: 'rgba(147, 51, 234, 1)',
                        backgroundColor: 'rgba(147, 51, 234, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: 'rgba(147, 51, 234, 1)',
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
                                    return `Income: $${context.parsed.y.toLocaleString()}`;
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
                                    return '$' + value.toLocaleString();
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
                            hoverBackgroundColor: 'rgba(147, 51, 234, 1)'
                        }
                    }
                }
            });
        }
    }

    async loadStats() {
        try {
            this.set('loading', true);
            
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Please log in to view dashboard',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Load monthly income data
            await this.loadMonthlyIncome(token);

            // Create a timeout promise for API calls
            const timeoutPromise = (ms) => new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Request timeout')), ms)
            );

            // Load all statistics in parallel with timeouts
            const allStats = await Promise.allSettled([
                // Academic Management
                Promise.race([
                    api.withToken(token).get('/subjects'),
                    timeoutPromise(5000)
                ]).catch(() => ({ data: { data: [] } })),
                
                Promise.race([
                    api.withToken(token).get('/classes'),
                    timeoutPromise(5000)
                ]).catch(() => ({ data: { data: [] } })),
                
                Promise.race([
                    api.withToken(token).get('/teachers'),
                    timeoutPromise(5000)
                ]).catch(() => ({ data: { data: [] } })),
                
                Promise.race([
                    api.withToken(token).get('/students'),
                    timeoutPromise(5000)
                ]).catch(() => ({ data: { data: [] } })),
                
                Promise.race([
                    api.withToken(token).get('/class-subjects'),
                    timeoutPromise(3000)
                ]).catch(() => ({ data: { data: [] } })),
                
                Promise.race([
                    api.withToken(token).get('/teacher-assignments'),
                    timeoutPromise(3000)
                ]).catch(() => ({ data: { data: [] } })),
                
                Promise.race([
                    api.withToken(token).get('/grading-periods'),
                    timeoutPromise(3000)
                ]).catch(() => ({ data: { data: [] } })),
                
                Promise.race([
                    api.withToken(token).get('/grading-policies'),
                    timeoutPromise(3000)
                ]).catch(() => ({ data: { data: [] } })),
                
                Promise.race([
                    api.withToken(token).get('/student-grades'),
                    timeoutPromise(3000)
                ]).catch(() => ({ data: { data: [] } })),
                
                // General Management
                Promise.race([
                    api.withToken(token).get('/users'),
                    timeoutPromise(5000)
                ]).catch(() => ({ data: { data: [] } })),
                
                Promise.race([
                    api.withToken(token).get('/teams'),
                    timeoutPromise(5000)
                ]).catch(() => ({ data: { data: [] } })),
                
                Promise.race([
                    api.withToken(token).get('/applications'),
                    timeoutPromise(5000)
                ]).catch(() => ({ data: { data: [] } })),
                
                Promise.race([
                    api.withToken(token).get('/events'),
                    timeoutPromise(5000)
                ]).catch(() => ({ data: { data: [] } })),
                
                Promise.race([
                    api.withToken(token).get('/galleries'),
                    timeoutPromise(3000)
                ]).catch(() => ({ data: { data: [] } })),
                
                Promise.race([
                    api.withToken(token).get('/video-galleries'),
                    timeoutPromise(3000)
                ]).catch(() => ({ data: { data: [] } })),
                
                Promise.race([
                    api.withToken(token).get('/news'),
                    timeoutPromise(3000)
                ]).catch(() => ({ data: { data: [] } })),
                
                Promise.race([
                    api.withToken(token).get('/pages'),
                    timeoutPromise(3000)
                ]).catch(() => ({ data: { data: [] } })),
                
                Promise.race([
                    api.withToken(token).get('/logs'),
                    timeoutPromise(3000)
                ]).catch(() => ({ data: { data: [] } })),
                
                // Finance
                Promise.race([
                    api.withToken(token).get('/finance/schedules'),
                    timeoutPromise(3000)
                ]).catch(() => ({ data: { data: [] } })),
                
                Promise.race([
                    api.withToken(token).get('/finance/invoices'),
                    timeoutPromise(3000)
                ]).catch(() => ({ data: { data: [] } })),
                
                Promise.race([
                    api.withToken(token).get('/finance/payments'),
                    timeoutPromise(3000)
                ]).catch(() => ({ data: { data: [] } })),
                
                Promise.race([
                    api.withToken(token).get('/finance/receipts'),
                    timeoutPromise(3000)
                ]).catch(() => ({ data: { data: [] } }))
            ]);

            // Update stats with all data at once
            const statsData = {
                // Academic Management
                subjects: allStats[0].status === 'fulfilled' ? (allStats[0].value.data?.data?.length || 0) : 0,
                classes: allStats[1].status === 'fulfilled' ? (allStats[1].value.data?.data?.length || 0) : 0,
                teachers: allStats[2].status === 'fulfilled' ? (allStats[2].value.data?.data?.length || 0) : 0,
                students: allStats[3].status === 'fulfilled' ? (allStats[3].value.data?.data?.length || 0) : 0,
                classSubjects: allStats[4].status === 'fulfilled' ? (allStats[4].value.data?.data?.length || 0) : 0,
                teacherAssignments: allStats[5].status === 'fulfilled' ? (allStats[5].value.data?.data?.length || 0) : 0,
                gradingPeriods: allStats[6].status === 'fulfilled' ? (allStats[6].value.data?.data?.length || 0) : 0,
                gradingPolicies: allStats[7].status === 'fulfilled' ? (allStats[7].value.data?.data?.length || 0) : 0,
                studentGrades: allStats[8].status === 'fulfilled' ? (allStats[8].value.data?.data?.length || 0) : 0,
                
                // General Management
                users: allStats[9].status === 'fulfilled' ? (allStats[9].value.data?.length || allStats[9].value.data.data?.length || 0) : 0,
                teams: allStats[10].status === 'fulfilled' ? (allStats[10].value.data.data?.length || 0) : 0,
                applications: allStats[11].status === 'fulfilled' ? (allStats[11].value.data.data?.length || 0) : 0,
                events: allStats[12].status === 'fulfilled' ? (allStats[12].value.data.data?.length || 0) : 0,
                galleries: allStats[13].status === 'fulfilled' ? (allStats[13].value.data.data?.length || 0) : 0,
                videoGalleries: allStats[14].status === 'fulfilled' ? (allStats[14].value.data.data?.length || 0) : 0,
                news: allStats[15].status === 'fulfilled' ? (allStats[15].value.data.data?.length || 0) : 0,
                pages: allStats[16].status === 'fulfilled' ? (allStats[16].value.data.data?.length || 0) : 0,
                logs: allStats[17].status === 'fulfilled' ? (allStats[17].value.data.data?.length || 0) : 0,
                
                // Finance
                feeSchedules: allStats[18].status === 'fulfilled' ? (allStats[18].value.data?.data?.length || 0) : 0,
                invoices: allStats[19].status === 'fulfilled' ? (allStats[19].value.data?.data?.length || 0) : 0,
                payments: allStats[20].status === 'fulfilled' ? (allStats[20].value.data?.data?.length || 0) : 0,
                receipts: allStats[21].status === 'fulfilled' ? (allStats[21].value.data?.data?.length || 0) : 0
            };

            // Update UI with all data at once
            this.set('stats', statsData);
            
            // Refresh charts with new data
            this.refreshCharts();
            
        } catch (error) {
            console.error('❌ Error loading dashboard stats:', error);
            
            Toast.show({
                title: 'Error',
                message: 'Failed to load dashboard statistics',
                variant: 'error',
                duration: 3000
            });
        } finally {
            this.set('loading', false);
        }
    }

    refreshCharts() {
        // Wait a bit for the DOM to update, then refresh charts
        setTimeout(() => {
            this.createFinanceCharts();
            this.setupTabListeners();
        }, 200);
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

    async loadMonthlyIncome(token, year = null) {
        try {
            const url = year ? `/finance/monthly-income?year=${year}` : '/finance/monthly-income';
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

    refreshMonthlyIncomeChart() {
        if (this.charts.monthlyIncome) {
            this.charts.monthlyIncome.destroy();
        }
        this.createFinanceCharts();
    }

    async loadUserData() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const stored = localStorage.getItem('userData');
            let userId = null;
            if (stored) {
                try { userId = JSON.parse(stored)?.id || null; } catch (_) { userId = null; }
            }
            if (userId) {
                const resp = await api.withToken(token).get(`/users/${userId}/profile`).catch(() => null);
                if (resp?.data) {
                    this.set('currentUser', resp.data);
                                 } else if (stored) {
                     try { this.set('currentUser', JSON.parse(stored)); } catch (_) {}
                 }
             }
         } catch (error) {
             console.error('❌ Error loading user data:', error);
         }
     }

    render() {
        const stats = this.get('stats') || this.stats;
        const loading = this.get('loading');
        const currentUser = this.get('currentUser');
        const userName = (currentUser && (
            currentUser.name ||
            currentUser.full_name ||
            (currentUser.first_name && currentUser.last_name ? `${currentUser.first_name} ${currentUser.last_name}` : null) ||
            currentUser.username ||
            currentUser.email ||
            currentUser.displayName
        )) || 'Admin';
        
        return `
            <div class="space-y-8 p-6">
                <!-- Header -->
                <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                        <div>
                            <h1 class="text-3xl sm:text-4xl font-bold">Admin Dashboard</h1>
                            <p class="text-blue-100 text-lg mt-2">Welcome back, <span class="font-semibold">${userName}</span></p>
                            <p class="text-blue-100 text-sm mt-1">
                                <i class="fas fa-calendar-alt mr-1"></i>
                                ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                        <div class="mt-4 sm:mt-0 text-right">
                            <div class="text-2xl font-bold">${stats.users + stats.students + stats.teachers}</div>
                            <div class="text-blue-100 text-sm">Total System Users</div>
                        </div>
                    </div>
                </div>

                ${loading ? `
                    <!-- Loading Skeleton -->
                    <div class="space-y-6">
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div class="bg-white shadow rounded-lg p-6 animate-pulse">
                                <div class="flex items-center">
                                    <div class="w-12 h-12 bg-gray-200 rounded-lg"></div>
                                    <div class="ml-4 flex-1">
                                        <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                        <div class="h-6 bg-gray-200 rounded w-1/2"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="bg-white shadow rounded-lg p-6 animate-pulse">
                                <div class="flex items-center">
                                    <div class="w-12 h-12 bg-gray-200 rounded-lg"></div>
                                    <div class="ml-4 flex-1">
                                        <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                        <div class="h-6 bg-gray-200 rounded w-1/2"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="bg-white shadow rounded-lg p-6 animate-pulse">
                                <div class="flex items-center">
                                    <div class="w-12 h-12 bg-gray-200 rounded-lg"></div>
                                    <div class="ml-4 flex-1">
                                        <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                        <div class="h-6 bg-gray-200 rounded w-1/2"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="bg-white shadow rounded-lg p-6 animate-pulse">
                                <div class="flex items-center">
                                    <div class="w-12 h-12 bg-gray-200 rounded-lg"></div>
                                    <div class="ml-4 flex-1">
                                        <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                        <div class="h-6 bg-gray-200 rounded w-1/2"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ` : `
                    <!-- Academic Management Section -->
                    <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-8">
                        <div class="flex items-center mb-6">
                            <div class="w-1 h-8 bg-blue-500 rounded-full mr-4"></div>
                            <h2 class="text-2xl font-bold text-blue-900">Academic Management</h2>
                            <div class="ml-4 px-4 py-2 bg-blue-100 text-blue-800 text-sm font-medium rounded-full border border-blue-200">
                                ${stats.subjects + stats.classes + stats.teachers + stats.students} Total
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                            <!-- Subjects Card -->
                            <div class="bg-white rounded-lg shadow-lg border border-blue-200 p-6 hover:shadow-xl transition-all duration-300">
                                <div class="flex items-center justify-between mb-4">
                                    <div class="p-3 rounded-xl bg-blue-500 text-white size-12 flex items-center justify-center">
                                        <i class="fas fa-book-open text-xl"></i>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-sm text-blue-600 font-medium">Active</div>
                                        <div class="text-lg font-bold text-blue-700">${stats.subjects}</div>
                                    </div>
                                </div>
                                <div class="text-center mb-4">
                                    <div class="text-3xl font-bold text-blue-900">${stats.subjects}</div>
                                    <div class="text-sm text-blue-700 font-medium">Subjects</div>
                                </div>
                                <div class="bg-blue-50 rounded-lg p-3 text-center">
                                    <div class="text-xs text-blue-600 font-medium">Total Academic</div>
                                    <div class="text-sm font-semibold text-blue-800">${stats.subjects} Available</div>
                                </div>
                            </div>

                            <!-- Classes Card -->
                            <div class="bg-white rounded-lg shadow-lg border border-green-200 p-6 hover:shadow-xl transition-all duration-300">
                                <div class="flex items-center justify-between mb-4">
                                    <div class="p-3 rounded-xl bg-green-500 text-white size-12 flex items-center justify-center">
                                        <i class="fas fa-chalkboard text-xl"></i>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-sm text-green-600 font-medium">Active</div>
                                        <div class="text-lg font-bold text-green-700">${stats.classes}</div>
                                    </div>
                                </div>
                                <div class="text-center mb-4">
                                    <div class="text-3xl font-bold text-green-900">${stats.classes}</div>
                                    <div class="text-sm text-green-700 font-medium">Classes</div>
                                </div>
                                <div class="bg-green-50 rounded-lg p-3 text-center">
                                    <div class="text-xs text-green-600 font-medium">Total Classes</div>
                                    <div class="text-sm font-semibold text-green-800">${stats.classes} Running</div>
                                </div>
                            </div>

                            <!-- Teachers Card -->
                            <div class="bg-white rounded-lg shadow-lg border border-purple-200 p-6 hover:shadow-xl transition-all duration-300">
                                <div class="flex items-center justify-between mb-4">
                                    <div class="p-3 rounded-xl bg-purple-500 text-white size-12 flex items-center justify-center">
                                        <i class="fas fa-chalkboard-teacher text-xl"></i>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-sm text-purple-600 font-medium">Active</div>
                                        <div class="text-lg font-bold text-purple-700">${stats.teachers}</div>
                                    </div>
                                </div>
                                <div class="text-center mb-4">
                                    <div class="text-3xl font-bold text-purple-900">${stats.teachers}</div>
                                    <div class="text-sm text-purple-700 font-medium">Teachers</div>
                                </div>
                                <div class="bg-purple-50 rounded-lg p-3 text-center">
                                    <div class="text-xs text-purple-600 font-medium">Total Staff</div>
                                    <div class="text-sm font-semibold text-purple-800">${stats.teachers} Teaching</div>
                                </div>
                            </div>

                            <!-- Students Card -->
                            <div class="bg-white rounded-lg shadow-lg border border-orange-200 p-6 hover:shadow-xl transition-all duration-300">
                                <div class="flex items-center justify-between mb-4">
                                    <div class="p-3 rounded-xl bg-orange-500 text-white size-12 flex items-center justify-center">
                                        <i class="fas fa-user-graduate text-xl"></i>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-sm text-orange-600 font-medium">Enrolled</div>
                                        <div class="text-lg font-bold text-orange-700">${stats.students}</div>
                                    </div>
                                </div>
                                <div class="text-center mb-4">
                                    <div class="text-3xl font-bold text-orange-900">${stats.students}</div>
                                    <div class="text-sm text-orange-700 font-medium">Students</div>
                                </div>
                                <div class="bg-orange-50 rounded-lg p-3 text-center">
                                    <div class="text-xs text-orange-600 font-medium">Total Students</div>
                                    <div class="text-sm font-semibold text-orange-800">${stats.students} Enrolled</div>
                                </div>
                            </div>
                        </div>

                        <!-- Academic Details Row -->
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div class="bg-white rounded-lg p-4 border border-blue-200 text-center hover:shadow-md transition-shadow">
                                <div class="text-lg font-semibold text-blue-600">${stats.classSubjects}</div>
                                <div class="text-sm text-gray-600">Class-Subject Links</div>
                            </div>
                            <div class="bg-white rounded-lg p-4 border border-green-200 text-center hover:shadow-md transition-shadow">
                                <div class="text-lg font-semibold text-green-600">${stats.teacherAssignments}</div>
                                <div class="text-sm text-gray-600">Teacher Assignments</div>
                            </div>
                            <div class="bg-white rounded-lg p-4 border border-purple-200 text-center hover:shadow-md transition-shadow">
                                <div class="text-lg font-semibold text-purple-600">${stats.gradingPeriods}</div>
                                <div class="text-sm text-gray-600">Grading Periods</div>
                            </div>
                            <div class="bg-white rounded-lg p-4 border border-orange-200 text-center hover:shadow-md transition-shadow">
                                <div class="text-lg font-semibold text-orange-600">${stats.studentGrades}</div>
                                <div class="text-sm text-gray-600">Student Grades</div>
                            </div>
                        </div>
                    </div>

                    <!-- General Management Section -->
                    <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-8">
                        <div class="flex items-center mb-6">
                            <div class="w-1 h-8 bg-green-500 rounded-full mr-4"></div>
                            <h2 class="text-2xl font-bold text-green-900">General Management</h2>
                            <div class="ml-4 px-4 py-2 bg-green-100 text-green-800 text-sm font-medium rounded-full border border-green-200">
                                ${stats.users + stats.teams + stats.applications + stats.events} Total
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                            <!-- Users Card -->
                            <div class="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow">
                                <div class="flex items-center">
                                    <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <i class="fas fa-users text-blue-600 text-xl"></i>
                                    </div>
                                    <div class="ml-4">
                                        <p class="text-sm font-medium text-gray-600">Total Users</p>
                                        <p class="text-2xl font-bold text-gray-900">${stats.users}</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Teams Card -->
                            <div class="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow">
                                <div class="flex items-center">
                                    <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                        <i class="fas fa-user-tie text-green-600 text-xl"></i>
                                    </div>
                                    <div class="ml-4">
                                        <p class="text-sm font-medium text-gray-600">Team Members</p>
                                        <p class="text-2xl font-bold text-gray-900">${stats.teams}</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Applications Card -->
                            <div class="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow">
                                <div class="flex items-center">
                                    <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <i class="fas fa-file-alt text-purple-600 text-xl"></i>
                                    </div>
                                    <div class="ml-4">
                                        <p class="text-sm font-medium text-gray-600">Applications</p>
                                        <p class="text-2xl font-bold text-gray-900">${stats.applications}</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Events Card -->
                            <div class="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow">
                                <div class="flex items-center">
                                    <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                        <i class="fas fa-calendar-alt text-red-600 text-xl"></i>
                                    </div>
                                    <div class="ml-4">
                                        <p class="text-sm font-medium text-gray-600">Events</p>
                                        <p class="text-2xl font-bold text-gray-900">${stats.events}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Additional Management Cards -->
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <!-- Galleries Card -->
                            <div class="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow">
                                <div class="flex items-center">
                                    <div class="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                                        <i class="fas fa-images text-pink-600 text-xl"></i>
                                    </div>
                                    <div class="ml-4">
                                        <p class="text-sm font-medium text-gray-600">Galleries</p>
                                        <p class="text-2xl font-bold text-gray-900">${stats.galleries}</p>
                                    </div>
                                </div>
                            </div>

                            <!-- News Card -->
                            <div class="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow">
                                <div class="flex items-center">
                                    <div class="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                                        <i class="fas fa-newspaper text-indigo-600 text-xl"></i>
                                    </div>
                                    <div class="ml-4">
                                        <p class="text-sm font-medium text-gray-600">News</p>
                                        <p class="text-2xl font-bold text-gray-900">${stats.news}</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Pages Card -->
                            <div class="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow">
                                <div class="flex items-center">
                                    <div class="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                                        <i class="fas fa-file text-teal-600 text-xl"></i>
                                    </div>
                                    <div class="ml-4">
                                        <p class="text-sm font-medium text-gray-600">Pages</p>
                                        <p class="text-2xl font-bold text-gray-900">${stats.pages}</p>
                                    </div>
                                </div>
                            </div>

                            <!-- System Logs Card -->
                            <div class="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow">
                                <div class="flex items-center">
                                    <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                        <i class="fas fa-clipboard-list text-orange-600 text-xl"></i>
                                    </div>
                                    <div class="ml-4">
                                        <p class="text-sm font-medium text-gray-600">System Logs</p>
                                        <p class="text-2xl font-bold text-gray-900">${stats.logs}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Finance Section -->
                    <div class="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-200 p-8">
                        <div class="flex items-center mb-6">
                            <div class="w-1 h-8 bg-purple-500 rounded-full mr-4"></div>
                            <h2 class="text-2xl font-bold text-purple-900">Finance Management</h2>
                            <div class="ml-4 px-4 py-2 bg-purple-100 text-purple-800 text-sm font-medium rounded-full border border-purple-200">
                                ${stats.feeSchedules + stats.invoices + stats.payments + stats.receipts} Total
                            </div>
                        </div>
                        
                        <!-- Finance Metrics Cards -->
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <!-- Fee Schedules Card -->
                            <div class="bg-white rounded-lg shadow-lg border border-emerald-200 p-6 hover:shadow-xl transition-all duration-300">
                                <div class="flex items-center justify-between mb-4">
                                    <div class="p-3 rounded-xl bg-emerald-500 text-white size-12 flex items-center justify-center">
                                        <i class="fas fa-money-bill-wave text-xl"></i>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-sm text-emerald-600 font-medium">Active</div>
                                        <div class="text-lg font-bold text-emerald-700">${stats.feeSchedules}</div>
                                    </div>
                                </div>
                                <div class="text-center mb-4">
                                    <div class="text-3xl font-bold text-emerald-900">${stats.feeSchedules}</div>
                                    <div class="text-sm text-emerald-700 font-medium">Fee Schedules</div>
                                </div>
                                <div class="bg-emerald-50 rounded-lg p-3 text-center">
                                    <div class="text-xs text-emerald-600 font-medium">Total Schedules</div>
                                    <div class="text-sm font-semibold text-emerald-800">${stats.feeSchedules} Active</div>
                                </div>
                            </div>

                            <!-- Invoices Card -->
                            <div class="bg-white rounded-lg shadow-lg border border-blue-200 p-6 hover:shadow-xl transition-all duration-300">
                                <div class="flex items-center justify-between mb-4">
                                    <div class="p-3 rounded-xl bg-blue-500 text-white size-12 flex items-center justify-center">
                                        <i class="fas fa-file-invoice text-xl"></i>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-sm text-blue-600 font-medium">Total</div>
                                        <div class="text-lg font-bold text-blue-700">${stats.invoices}</div>
                                    </div>
                                </div>
                                <div class="text-center mb-4">
                                    <div class="text-3xl font-bold text-blue-900">${stats.invoices}</div>
                                    <div class="text-sm text-blue-700 font-medium">Invoices</div>
                                </div>
                                <div class="bg-blue-50 rounded-lg p-3 text-center">
                                    <div class="text-xs text-blue-600 font-medium">Total Invoices</div>
                                    <div class="text-sm font-semibold text-blue-800">${stats.invoices} Generated</div>
                                </div>
                            </div>

                            <!-- Payments Card -->
                            <div class="bg-white rounded-lg shadow-lg border border-green-200 p-6 hover:shadow-xl transition-all duration-300">
                                <div class="flex items-center justify-between mb-4">
                                    <div class="p-3 rounded-xl bg-green-500 text-white size-12 flex items-center justify-center">
                                        <i class="fas fa-cash-register text-xl"></i>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-sm text-green-600 font-medium">Total</div>
                                        <div class="text-lg font-bold text-green-700">${stats.payments}</div>
                                    </div>
                                </div>
                                <div class="text-center mb-4">
                                    <div class="text-3xl font-bold text-green-900">${stats.payments}</div>
                                    <div class="text-sm text-green-700 font-medium">Payments</div>
                                </div>
                                <div class="bg-green-50 rounded-lg p-3 text-center">
                                    <div class="text-xs text-green-600 font-medium">Total Payments</div>
                                    <div class="text-sm font-semibold text-green-800">${stats.payments} Processed</div>
                                </div>
                            </div>

                            <!-- Receipts Card -->
                            <div class="bg-white rounded-lg shadow-lg border border-purple-200 p-6 hover:shadow-xl transition-all duration-300">
                                <div class="flex items-center justify-between mb-4">
                                    <div class="p-3 rounded-xl bg-purple-500 text-white size-12 flex items-center justify-center">
                                        <i class="fas fa-receipt text-xl"></i>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-sm text-purple-600 font-medium">Total</div>
                                        <div class="text-lg font-bold text-purple-700">${stats.receipts}</div>
                                    </div>
                                </div>
                                <div class="text-center mb-4">
                                    <div class="text-3xl font-bold text-purple-900">${stats.receipts}</div>
                                    <div class="text-sm text-purple-700 font-medium">Receipts</div>
                                </div>
                                <div class="bg-purple-50 rounded-lg p-3 text-center">
                                    <div class="text-xs text-purple-600 font-medium">Total Receipts</div>
                                    <div class="text-sm font-semibold text-purple-800">${stats.receipts} Issued</div>
                                </div>
                            </div>
                        </div>

                        <!-- Finance Charts Section -->
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <!-- Finance Overview & Metrics (Tabbed) -->
                            <div class="bg-white rounded-xl shadow-lg border border-purple-200 p-6">
                                <div class="flex items-center justify-between mb-4">
                                    <div class="flex items-center">
                                        <div class="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                                            <i class="fas fa-chart-pie text-white text-sm"></i>
                                        </div>
                                        <h3 class="text-lg font-semibold text-gray-900">Finance Analytics</h3>
                                    </div>
                                    <!-- Tab Navigation -->
                                    <div class="flex bg-gray-100 rounded-lg p-1">
                                        <button 
                                            data-tab="overview"
                                            class="px-3 py-1.5 text-sm font-medium text-purple-600 bg-white rounded-md shadow-sm transition-all duration-200">
                                            Overview
                                        </button>
                                        <button 
                                            data-tab="metrics"
                                            class="px-3 py-1.5 text-sm font-medium text-gray-600 rounded-md transition-all duration-200">
                                            Metrics
                                        </button>
                                    </div>
                                </div>
                                
                                <!-- Overview Chart Tab -->
                                <div data-chart="overview" class="relative" style="height: 300px;">
                                    <canvas id="financeOverviewChart"></canvas>
                                </div>
                                
                                <!-- Metrics Chart Tab -->
                                <div data-chart="metrics" class="relative" style="height: 300px; display: none;">
                                    <canvas id="financeTrendChart"></canvas>
                                </div>
                                
                                <div class="mt-4 text-center">
                                    <p class="text-sm text-gray-600">Switch between overview distribution and detailed metrics</p>
                                </div>
                            </div>

                                                         <!-- Monthly Income Line Chart -->
                             <div class="bg-white rounded-xl shadow-lg border border-purple-200 p-6">
                                 <div class="flex items-center justify-between mb-4">
                                     <div class="flex items-center">
                                         <div class="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                                             <i class="fas fa-chart-line text-white text-sm"></i>
                                         </div>
                                         <h3 class="text-lg font-semibold text-gray-900">Monthly Income</h3>
                                     </div>
                                     <div class="flex items-center space-x-2">
                                         <label class="text-sm text-gray-600">Year:</label>
                                         <select id="incomeYearSelector" class="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500">
                                             ${this.generateYearOptions()}
                                         </select>
                                     </div>
                                 </div>
                                 <div class="relative" style="height: 300px;">
                                     <canvas id="monthlyIncomeChart"></canvas>
                                 </div>
                                 <div class="mt-4 text-center">
                                     <p class="text-sm text-gray-600">Income trends over the selected year</p>
                                 </div>
                             </div>
                        </div>
                    </div>

                    <!-- Quick Actions -->
                    <div class="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-200 p-8">
                        <div class="flex items-center mb-6">
                            <div class="w-1 h-8 bg-gray-500 rounded-full mr-4"></div>
                            <h2 class="text-2xl font-bold text-gray-900">Quick Actions</h2>
                        </div>
                        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            <!-- Academic Management Actions -->
                            <a href="/dashboard/admin/subjects" class="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200">
                                <i class="fas fa-book-open text-blue-600 text-xl mb-2"></i>
                                <span class="text-sm font-medium text-gray-700">Subjects</span>
                            </a>
                            <a href="/dashboard/admin/classes" class="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors border border-green-200">
                                <i class="fas fa-chalkboard text-green-600 text-xl mb-2"></i>
                                <span class="text-sm font-medium text-gray-700">Classes</span>
                            </a>
                            <a href="/dashboard/admin/teachers" class="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors border border-purple-200">
                                <i class="fas fa-chalkboard-teacher text-purple-600 text-xl mb-2"></i>
                                <span class="text-sm font-medium text-gray-700">Teachers</span>
                            </a>
                            <a href="/dashboard/admin/students" class="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors border border-orange-200">
                                <i class="fas fa-user-graduate text-orange-600 text-xl mb-2"></i>
                                <span class="text-sm font-medium text-gray-700">Students</span>
                            </a>
                            <a href="/dashboard/admin/student-grades" class="flex flex-col items-center p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-200">
                                <i class="fas fa-graduation-cap text-indigo-600 text-xl mb-2"></i>
                                <span class="text-sm font-medium text-gray-700">Grades</span>
                            </a>
                            <a href="/dashboard/admin/finance/schedules" class="flex flex-col items-center p-4 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-200">
                                <i class="fas fa-money-bill-wave text-emerald-600 text-xl mb-2"></i>
                                <span class="text-sm font-medium text-gray-700">Finance</span>
                            </a>
                        </div>
                    </div>
                `}
            </div>
        `;
    }
}

customElements.define('app-admin-dashboard-page', AdminDashboardPage);
export default AdminDashboardPage; 