import App from '@/core/App.js';

class CashierPage extends App {
  constructor() {
    super();
    this.userName = 'Cashier';
  }

  connectedCallback() {
    super.connectedCallback();
    document.title = 'Cashier Dashboard | School System';
    try {
      const raw = localStorage.getItem('userData');
      if (raw) {
        const user = JSON.parse(raw);
        const computedName = user?.name || [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.username || user?.email || 'Cashier';
        this.set('userName', computedName);
      }
    } catch (_) {
      // ignore
    }
  }

  render() {
    const userName = this.get('userName') || this.userName;
    return `
      <div class="space-y-8 p-6">
        <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-5 text-white">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 class="text-2xl sm:text-3xl font-bold">Cashier Dashboard</h1>
              <p class="text-blue-100 text-base sm:text-lg">Welcome back, ${userName}.</p>
              <p class="text-blue-100 text-sm mt-1">
                <i class="fas fa-calendar-alt mr-1"></i>
                ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('app-cashier-page', CashierPage);
export default CashierPage;

 
