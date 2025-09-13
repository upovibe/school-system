import App from '@/core/App.js';
import api from '@/services/api.js';
import '@/components/ui/SearchDropdown.js';

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
            
            // Gender Statistics (only male and female)
            studentGenderStats: {
                male: 0,
                female: 0
            },
            teacherGenderStats: {
                male: 0,
                female: 0
            },
            
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
         // Setup tab switching functionality for finance
         const tabButtons = this.querySelectorAll('[data-tab]');
         tabButtons.forEach(button => {
             button.addEventListener('click', (e) => {
                 const targetTab = e.target.getAttribute('data-tab');
                 this.switchTab(targetTab);
             });
         });

         // Setup gender chart tab switching
         const genderTabButtons = this.querySelectorAll('[data-gender-tab]');
         genderTabButtons.forEach(button => {
             button.addEventListener('click', (e) => {
                 const targetTab = e.target.getAttribute('data-gender-tab');
                 const target = e.target.getAttribute('data-target');
                 this.switchGenderTab(target, targetTab);
             });
         });

         // Setup monthly income chart tab switching
         const monthlyIncomeTabButtons = this.querySelectorAll('[data-monthly-income-tab]');
         monthlyIncomeTabButtons.forEach(button => {
             button.addEventListener('click', (e) => {
                 const targetTab = e.target.getAttribute('data-monthly-income-tab');
                 this.switchMonthlyIncomeTab(targetTab);
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

         // Setup class selector for collection rate
         const classSelector = this.querySelector('#collectionClassSelector');
         if (classSelector) {
             classSelector.addEventListener('change', (e) => {
                 const selectedClassId = e.target.value;
                 this.loadCollectionRateForClass(selectedClassId);
             });
         }

         // Setup grading period selector for collection rate
         const periodSelector = this.querySelector('#collectionPeriodSelector');
         if (periodSelector) {
             periodSelector.addEventListener('change', (e) => {
                 const selectedPeriodId = e.detail.value;
                 this.loadCollectionRateForPeriod(selectedPeriodId);
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

     switchGenderTab(target, activeTab) {
         // Hide all chart containers for the target
         const chartContainers = this.querySelectorAll(`[data-gender-chart^="${target}-"]`);
         chartContainers.forEach(container => {
             container.style.display = 'none';
         });

         // Show the active chart container
         const activeContainer = this.querySelector(`[data-gender-chart="${target}-${activeTab}"]`);
         if (activeContainer) {
             activeContainer.style.display = 'block';
         }

         // Update button styles for the target
         const tabButtons = this.querySelectorAll(`[data-target="${target}"]`);
         tabButtons.forEach(button => {
             button.classList.remove('bg-white', 'text-pink-600', 'shadow-sm');
             button.classList.add('text-gray-600');
         });

         // Highlight active button
         const activeButton = this.querySelector(`[data-target="${target}"][data-gender-tab="${activeTab}"]`);
         if (activeButton) {
             activeButton.classList.remove('text-gray-600');
             activeButton.classList.add('bg-white', 'text-pink-600', 'shadow-sm');
         }
     }

     switchMonthlyIncomeTab(activeTab) {
         // Hide all monthly income chart containers
         const chartContainers = this.querySelectorAll('[data-monthly-income-chart]');
         chartContainers.forEach(container => {
             container.style.display = 'none';
         });

         // Show the active chart container
         const activeContainer = this.querySelector(`[data-monthly-income-chart="${activeTab}"]`);
         if (activeContainer) {
             activeContainer.style.display = 'block';
         }

         // Update button styles
         const tabButtons = this.querySelectorAll('[data-monthly-income-tab]');
         tabButtons.forEach(button => {
             button.classList.remove('bg-white', 'text-purple-600', 'shadow-sm');
             button.classList.add('text-gray-600');
         });

         // Highlight active button
         const activeButton = this.querySelector(`[data-monthly-income-tab="${activeTab}"]`);
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
                            hoverBackgroundColor: 'rgba(147, 51, 234, 1)'
                        }
                    }
                }
            });
                 }
         
         // Create gender statistics charts
         this.createGenderCharts();
         
         // Create monthly income bar chart
         this.createMonthlyIncomeBarChart();
     }
     
     createGenderCharts() {
         const stats = this.get('stats') || this.stats;
         
         // Student Gender Charts
         this.createStudentGenderCharts(stats);
         
         // Teacher Gender Charts
         this.createTeacherGenderCharts(stats);
     }
     
     createStudentGenderCharts(stats) {
         // Doughnut Chart
         const studentGenderCtx = this.querySelector('#studentGenderChart');
         if (studentGenderCtx && typeof Chart !== 'undefined') {
             if (this.charts.studentGender) {
                 this.charts.studentGender.destroy();
             }
             
             this.charts.studentGender = new Chart(studentGenderCtx, {
                 type: 'doughnut',
                 data: {
                     labels: ['Male Students', 'Female Students'],
                     datasets: [{
                         data: [stats.studentGenderStats.male, stats.studentGenderStats.female],
                         backgroundColor: [
                             'rgba(59, 130, 246, 0.8)',  // blue
                             'rgba(236, 72, 153, 0.8)'   // pink
                         ],
                         borderColor: [
                             'rgba(59, 130, 246, 1)',
                             'rgba(236, 72, 153, 1)'
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
                                 font: { size: 12 }
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
         
         // Bar Chart
         const studentGenderBarCtx = this.querySelector('#studentGenderBarChart');
         if (studentGenderBarCtx && typeof Chart !== 'undefined') {
             if (this.charts.studentGenderBar) {
                 this.charts.studentGenderBar.destroy();
             }
             
             this.charts.studentGenderBar = new Chart(studentGenderBarCtx, {
                 type: 'bar',
                 data: {
                     labels: ['Male Students', 'Female Students'],
                     datasets: [{
                         label: 'Count',
                         data: [stats.studentGenderStats.male, stats.studentGenderStats.female],
                         backgroundColor: [
                             'rgba(59, 130, 246, 0.7)',  // blue
                             'rgba(236, 72, 153, 0.7)'   // pink
                         ],
                         borderColor: [
                             'rgba(59, 130, 246, 1)',
                             'rgba(236, 72, 153, 1)'
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
                         legend: { display: false },
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
                             grid: { color: 'rgba(0, 0, 0, 0.1)' },
                             ticks: { stepSize: 1, font: { size: 12 } }
                         },
                         x: {
                             grid: { display: false },
                             ticks: { font: { size: 12 } }
                         }
                     }
                 }
             });
         }
         

     }
     
     createTeacherGenderCharts(stats) {
         // Doughnut Chart
         const teacherGenderCtx = this.querySelector('#teacherGenderChart');
         if (teacherGenderCtx && typeof Chart !== 'undefined') {
             if (this.charts.teacherGender) {
                 this.charts.teacherGender.destroy();
             }
             
             this.charts.teacherGender = new Chart(teacherGenderCtx, {
                 type: 'doughnut',
                 data: {
                     labels: ['Male Teachers', 'Female Teachers'],
                     datasets: [{
                         data: [stats.teacherGenderStats.male, stats.teacherGenderStats.female],
                         backgroundColor: [
                             'rgba(59, 130, 246, 0.8)',  // blue
                             'rgba(236, 72, 153, 0.8)'   // pink
                         ],
                         borderColor: [
                             'rgba(59, 130, 246, 1)',
                             'rgba(236, 72, 153, 1)'
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
                                 font: { size: 12 }
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
         
         // Bar Chart
         const teacherGenderBarCtx = this.querySelector('#teacherGenderBarChart');
         if (teacherGenderBarCtx && typeof Chart !== 'undefined') {
             if (this.charts.teacherGenderBar) {
                 this.charts.teacherGenderBar.destroy();
             }
             
             this.charts.teacherGenderBar = new Chart(teacherGenderBarCtx, {
                 type: 'bar',
                 data: {
                     labels: ['Male Teachers', 'Female Teachers'],
                     datasets: [{
                         label: 'Count',
                         data: [stats.teacherGenderStats.male, stats.teacherGenderStats.female],
                         backgroundColor: [
                             'rgba(59, 130, 246, 0.7)',  // blue
                             'rgba(236, 72, 153, 0.7)'   // pink
                         ],
                         borderColor: [
                             'rgba(59, 130, 246, 1)',
                             'rgba(236, 72, 153, 1)'
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
                         legend: { display: false },
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
                             grid: { color: 'rgba(0, 0, 0, 0.1)' },
                             ticks: { stepSize: 1, font: { size: 12 } }
                         },
                         x: {
                             grid: { display: false },
                             ticks: { font: { size: 12 } }
                         }
                     }
                 }
             });
         }
         

     }

     createMonthlyIncomeBarChart() {
        // Monthly Income Bar Chart
        const monthlyIncomeBarCtx = this.querySelector('#monthlyIncomeBarChart');
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
                        backgroundColor: 'rgba(147, 51, 234, 0.7)',
                        borderColor: 'rgba(147, 51, 234, 1)',
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
        const collectionRateCtx = this.querySelector('#collectionRateChart');
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
            
            // Load collection rate data for active grading period
            const activePeriodId = this.getActiveGradingPeriodId();
            await this.loadCollectionRate(token, activePeriodId);
            
            // Load classes data
            await this.loadClasses(token);
            
            // Load grading periods data
            await this.loadGradingPeriods(token);

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
                
                // Gender Statistics
                Promise.race([
                    api.withToken(token).get('/students/gender-statistics'),
                    timeoutPromise(3000)
                ]).catch(() => ({ data: { data: { overall: [] } } })),
                
                Promise.race([
                    api.withToken(token).get('/teachers/gender-statistics'),
                    timeoutPromise(3000)
                ]).catch(() => ({ data: { data: { overall: [] } } })),
                
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
                
                // Gender Statistics
                            studentGenderStats: (() => {
                if (allStats[9].status === 'fulfilled' && allStats[9].value.data?.data?.overall) {
                    const stats = allStats[9].value.data.data.overall;
                    const result = { male: 0, female: 0 };
                    stats.forEach(stat => {
                        if (stat.gender && stat.count && (stat.gender === 'male' || stat.gender === 'female')) {
                            result[stat.gender] = parseInt(stat.count);
                        }
                    });
                    return result;
                }
                return { male: 0, female: 0 };
            })(),
                            teacherGenderStats: (() => {
                if (allStats[10].status === 'fulfilled' && allStats[10].value.data?.data?.overall) {
                    const stats = allStats[10].value.data.data.overall;
                    const result = { male: 0, female: 0 };
                    stats.forEach(stat => {
                        if (stat.gender && stat.count && (stat.gender === 'male' || stat.gender === 'female')) {
                            result[stat.gender] = parseInt(stat.count);
                        }
                    });
                    return result;
                }
                return { male: 0, female: 0 };
            })(),
                
                // General Management
                users: allStats[11].status === 'fulfilled' ? (allStats[11].value.data?.length || allStats[11].value.data.data?.length || 0) : 0,
                teams: allStats[12].status === 'fulfilled' ? (allStats[12].value.data.data?.length || 0) : 0,
                applications: allStats[13].status === 'fulfilled' ? (allStats[13].value.data.data?.length || 0) : 0,
                events: allStats[14].status === 'fulfilled' ? (allStats[14].value.data.data?.length || 0) : 0,
                galleries: allStats[15].status === 'fulfilled' ? (allStats[15].value.data.data?.length || 0) : 0,
                videoGalleries: allStats[16].status === 'fulfilled' ? (allStats[16].value.data.data?.length || 0) : 0,
                news: allStats[17].status === 'fulfilled' ? (allStats[17].value.data.data?.length || 0) : 0,
                pages: allStats[18].status === 'fulfilled' ? (allStats[18].value.data.data?.length || 0) : 0,
                logs: allStats[19].status === 'fulfilled' ? (allStats[19].value.data.data?.length || 0) : 0,
                
                // Finance
                feeSchedules: allStats[20].status === 'fulfilled' ? (allStats[20].value.data?.data?.length || 0) : 0,
                invoices: allStats[21].status === 'fulfilled' ? (allStats[21].value.data?.data?.length || 0) : 0,
                payments: allStats[22].status === 'fulfilled' ? (allStats[22].value.data?.data?.length || 0) : 0,
                receipts: allStats[23].status === 'fulfilled' ? (allStats[23].value.data?.data?.length || 0) : 0
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
             this.createGenderCharts();
             this.createMonthlyIncomeBarChart();
             this.createCollectionRateChart();
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

    async loadCollectionRate(token, gradingPeriodId = null, classId = null) {
        try {
            let url = '/finance/collection-rate?';
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
        this.createFinanceCharts();
        this.createMonthlyIncomeBarChart();
    }

    refreshCollectionRateChart() {
        if (this.charts.collectionRate) {
            this.charts.collectionRate.destroy();
        }
        this.createCollectionRateChart();
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
            <div class="space-y-8">
                <!-- Header -->
                <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                        <div>
                        <div class="flex items-center gap-2">
                            <h1 class="text-3xl sm:text-4xl font-bold">Admin Dashboard</h1>
                            <button 
                                onclick="this.closest('app-admin-dashboard-page').loadData()"
                                class="size-8 mt-2 flex items-center justify-center text-white/90 hover:text-white transition-colors duration-200 hover:bg-white/10 rounded-lg group"
                                title="Refresh data">
                                <i class="fas fa-sync-alt text-lg ${this.get('loading') ? 'animate-spin' : ''} group-hover:scale-110 transition-transform duration-200"></i>
                            </button>
                        </div>
                            <p class="text-blue-100 text-lg mt-2">Welcome back, <!-- <span class="font-semibold">${userName}</span></p>-->
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
                    <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-4">
                        <div class="flex items-center mb-6">
                            <div class="w-1 h-8 bg-blue-500 rounded-full mr-4 flex-shrink-0"></div>
                            <h2 class="text-2xl font-bold text-blue-900 truncate">Academic Management</h2>
                            <div class="ml-4 px-4 py-2 bg-blue-100 text-blue-800 text-sm font-medium rounded-full border border-blue-200 flex-shrink-0">
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

                    <!-- Gender Statistics Section -->
                    <div class="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl border border-pink-200 p-4">
                        <div class="flex items-center mb-6">
                            <div class="w-1 h-8 bg-pink-500 rounded-full mr-4 flex-shrink-0"></div>
                            <h2 class="text-2xl font-bold text-pink-900 truncate">Gender Statistics</h2>
                            <div class="ml-4 px-4 py-2 bg-pink-100 text-pink-800 text-sm font-medium rounded-full border border-pink-200 flex-shrink-0">
                                ${stats.studentGenderStats.male + stats.studentGenderStats.female + stats.teacherGenderStats.male + stats.teacherGenderStats.female} Total
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <!-- Student Gender Chart -->
                            <div class="bg-white rounded-xl shadow-lg border border-pink-200 p-6">
                                <div class="flex flex-col gap-2 w-full md:flex-row md:items-center justify-between mb-4">
                                    <div class="flex items-center">
                                        <div class="size-8 min-w-8 bg-pink-500 rounded-lg flex items-center justify-center mr-3">
                                            <i class="fas fa-user-graduate text-white text-sm"></i>
                                        </div>
                                        <h3 class="text-lg font-semibold text-gray-900 truncate">Student Gender Distribution</h3>
                                    </div>
                                    <!-- Tab Navigation -->
                                    <div class="flex bg-gray-100 rounded-lg p-1 w-fit justify-center items-center ml-auto">
                                        <button 
                                            data-gender-tab="doughnut"
                                            data-target="student"
                                            class="px-3 py-1.5 text-sm font-medium text-pink-600 bg-white rounded-md shadow-sm transition-all duration-200">
                                            Doughnut
                                        </button>
                                        <button 
                                            data-gender-tab="bar"
                                            data-target="student"
                                            class="px-3 py-1.5 text-sm font-medium text-gray-600 rounded-md transition-all duration-200">
                                            Bar
                                        </button>
                                    </div>
                                </div>
                                
                                <!-- Doughnut Chart Tab -->
                                <div data-gender-chart="student-doughnut" class="relative" style="height: 250px;">
                                    <canvas id="studentGenderChart"></canvas>
                                </div>
                                
                                <!-- Bar Chart Tab -->
                                <div data-gender-chart="student-bar" class="relative" style="height: 250px; display: none;">
                                    <canvas id="studentGenderBarChart"></canvas>
                                </div>
                                
                                
                                
                                <div class="mt-4 grid grid-cols-2 gap-4">
                                    <div class="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                                        <div class="text-2xl font-bold text-blue-600">${stats.studentGenderStats.male}</div>
                                        <div class="text-sm text-blue-700 font-medium">Male Students</div>
                                    </div>
                                    <div class="text-center p-3 bg-pink-50 rounded-lg border border-pink-200">
                                        <div class="text-2xl font-bold text-pink-600">${stats.studentGenderStats.female}</div>
                                        <div class="text-sm text-pink-700 font-medium">Female Students</div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Teacher Gender Chart -->
                            <div class="bg-white rounded-xl shadow-lg border border-pink-200 p-6">
                                <div class="flex flex-col gap-2 w-full md:flex-row md:items-center justify-between mb-4">
                                    <div class="flex items-center">
                                        <div class="size-8 min-w-8 bg-pink-500 rounded-lg flex items-center justify-center mr-3">
                                            <i class="fas fa-chalkboard-teacher text-white text-sm"></i>
                                        </div>
                                        <h3 class="text-lg font-semibold text-gray-900 truncate">Teacher Gender Distribution</h3>
                                    </div>
                                    <!-- Tab Navigation -->
                                    <div class="flex bg-gray-100 rounded-lg p-1 w-fit justify-center items-center ml-auto">
                                        <button 
                                            data-gender-tab="doughnut"
                                            data-target="teacher"
                                            class="px-3 py-1.5 text-sm font-medium text-pink-600 bg-white rounded-md shadow-sm transition-all duration-200">
                                            Doughnut
                                        </button>
                                        <button 
                                            data-gender-tab="bar"
                                            data-target="teacher"
                                            class="px-3 py-1.5 text-sm font-medium text-gray-600 rounded-md transition-all duration-200">
                                            Bar
                                        </button>
                                    </div>
                                </div>
                                
                                <!-- Doughnut Chart Tab -->
                                <div data-gender-chart="teacher-doughnut" class="relative" style="height: 250px;">
                                    <canvas id="teacherGenderChart"></canvas>
                                </div>
                                
                                <!-- Bar Chart Tab -->
                                <div data-gender-chart="teacher-bar" class="relative" style="height: 250px; display: none;">
                                    <canvas id="teacherGenderBarChart"></canvas>
                                </div>
                                
                                
                                
                                <div class="mt-4 grid grid-cols-2 gap-4">
                                    <div class="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                                        <div class="text-2xl font-bold text-blue-600">${stats.teacherGenderStats.male}</div>
                                        <div class="text-sm text-blue-700 font-medium">Male Teachers</div>
                                    </div>
                                    <div class="text-center p-3 bg-pink-50 rounded-lg border border-pink-200">
                                        <div class="text-2xl font-bold text-pink-600">${stats.teacherGenderStats.female}</div>
                                        <div class="text-sm text-pink-700 font-medium">Female Teachers</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- General Management Section -->
                    <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-4">
                        <div class="flex items-center mb-6">
                            <div class="w-1 h-8 bg-green-500 rounded-full mr-4 flex-shrink-0"></div>
                            <h2 class="text-2xl font-bold text-green-900 truncate">General Management</h2>
                            <div class="ml-4 px-4 py-2 bg-green-100 text-green-800 text-sm font-medium rounded-full border border-green-200 flex-shrink-0">
                                ${stats.users + stats.teams + stats.applications + stats.events} Total
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                            <!-- Users Card -->
                            <div class="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow">
                                <div class="flex items-center">
                                    <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
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
                                    <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
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
                                    <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
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
                                    <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
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
                                    <div class="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
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
                    <div class="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-200 p-4">
                        <div class="flex items-center mb-6">
                            <div class="w-1 h-8 bg-purple-500 rounded-full mr-4 flex-shrink-0"></div>
                            <h2 class="text-2xl font-bold text-purple-900 truncate">Finance Management</h2>
                            <div class="ml-4 px-4 py-2 bg-purple-100 text-purple-800 text-sm font-medium rounded-full border border-purple-200 flex-shrink-0">
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
                                <div class="flex flex-col gap-2 w-full md:flex-row md:items-center justify-between mb-4">
                                    <div class="flex items-center">
                                        <div class="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                                            <i class="fas fa-chart-pie text-white text-sm"></i>
                                        </div>
                                        <h3 class="text-lg font-semibold text-gray-900 truncate">Finance Analytics</h3>
                                    </div>
                                    <!-- Tab Navigation -->
                                    <div class="flex bg-gray-100 rounded-lg p-1 w-fit justify-center items-center ml-auto">
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

                           <!-- Monthly Income Chart -->
                             <div class="bg-white rounded-xl shadow-lg border border-purple-200 p-6">
                                 <div class="flex flex-col gap-2 w-full md:flex-row md:items-center justify-between mb-4">
                                     <div class="flex items-center">
                                         <div class="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                                             <i class="fas fa-chart-line text-white text-sm"></i>
                                         </div>
                                         <h3 class="text-lg font-semibold text-gray-900 truncate">Monthly Income</h3>
                                     </div>
                                     <div class="flex items-center justify-end  space-x-4 w-full md:w-fit ml-auto">
                                         <div class="flex items-center space-x-2">
                                             <label class="text-sm text-gray-600">Year:</label>
                                             <select id="incomeYearSelector" class="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500">
                                                 ${this.generateYearOptions()}
                                             </select>
                                         </div>
                                         <!-- Tab Navigation -->
                                         <div class="flex w-fit justify-center items-center ml-auto bg-gray-100 rounded-lg p-1">
                                             <button 
                                                 data-monthly-income-tab="line"
                                                 class="px-3 py-1.5 text-sm font-medium text-purple-600 bg-white rounded-md shadow-sm transition-all duration-200">
                                                 Line
                                             </button>
                                             <button 
                                                 data-monthly-income-tab="bar"
                                                 class="px-3 py-1.5 text-sm font-medium text-gray-600 rounded-md transition-all duration-200">
                                                 Bar
                                             </button>
                                         </div>
                                     </div>
                                 </div>
                                 
                                 <!-- Line Chart Tab -->
                                 <div data-monthly-income-chart="line" class="relative" style="height: 300px;">
                                     <canvas id="monthlyIncomeChart"></canvas>
                                 </div>
                                 
                                 <!-- Bar Chart Tab -->
                                 <div data-monthly-income-chart="bar" class="relative" style="height: 300px; display: none;">
                                     <canvas id="monthlyIncomeBarChart"></canvas>
                                 </div>
                                 
                                 <div class="mt-4 text-center">
                                     <p class="text-sm text-gray-600">Income trends over the selected year</p>
                                 </div>
                             </div>
                        </div>
                    </div>

                    <!-- Collection Rate Chart -->
                    <div class="bg-white rounded-xl shadow-lg border border-purple-200 p-6">
                        <div class="flex flex-col gap-2 w-full md:flex-row md:items-center justify-between mb-4">
                            <div class="flex items-center">
                                <div class="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                                    <i class="fas fa-percentage text-white text-sm"></i>
                                </div>
                                <h3 class="text-lg font-semibold text-gray-900">Fee Collection Rate by Class</h3>
                            </div>
                            <div class="flex items-center space-x-4 w-full justify-end md:w-fit ml-auto">
                                <div class="flex items-center space-x-2">
                                    <label class="text-sm text-gray-600 hidden lg:block">Class:</label>
                                    <select id="collectionClassSelector" class="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500">
                                        ${this.generateClassOptions()}
                                    </select>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <label class="text-sm text-gray-600 hidden lg:block">Grading Period:</label>
                                    <ui-search-dropdown 
                                        id="collectionPeriodSelector" 
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
                            <canvas id="collectionRateChart"></canvas>
                        </div>
                        <div class="mt-4 text-center">
                            <p class="text-sm text-gray-600">Collection rates by class considering student types (border/day)</p>
                        </div>
                    </div>
                </div>
            </div>

                    <!-- Quick Actions -->
                    <div class="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-200 p-4">
                        <div class="flex items-center mb-6">
                            <div class="w-1 h-8 bg-gray-500 rounded-full mr-4"></div>
                            <h2 class="text-2xl font-bold text-gray-900">Quick Actions</h2>
                        </div>
                        <div class="grid grid-cols-2 lg:grid-cols-6 gap-4">
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