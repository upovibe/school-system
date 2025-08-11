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
      <div class="p-8">
        <div class="max-w-3xl mx-auto">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Cashier Dashboard</h1>
          <p class="text-gray-600 text-lg">Welcome, <span class="font-semibold">${userName}</span></p>
        </div>
      </div>
    `;
  }
}

customElements.define('cashier-page', CashierPage);
export default CashierPage;

 
