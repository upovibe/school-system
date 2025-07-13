import App from '@/core/App.js';
import '@/components/ui/Button.js';

class CounterLayout extends App {
    constructor() {
        super();
        this.set('count', 0);
    }

    increment() {
        this.set('count', this.get('count') + 1);
    }

    decrement() {
        this.set('count', Math.max(0, this.get('count') - 1));
    }

    render() {
        return `
            <div class="max-w-md mx-auto p-6 bg-white shadow-lg rounded-lg border border-gray-200">
                <img src="/src/assets/logo.png" alt="UPO UI Logo" class="h-20 mx-auto mb-6" />
                <h2 class="text-2xl font-bold text-center mb-4">Simple Counter</h2>
                <p class="text-4xl font-mono text-center mb-6">${this.get('count')}</p>
                <div class="flex justify-center space-x-4">
                    <ui-button 
                        variant="solid" 
                        color="error" 
                        size="md" 
                        onclick="this.parentElement.parentElement.parentElement.decrement()"
                    >
                        Decrement
                    </ui-button>
                    <ui-button 
                        variant="solid" 
                        color="primary" 
                        size="md" 
                        onclick="this.parentElement.parentElement.parentElement.increment()"
                    >
                        Increment
                    </ui-button>
                </div>
            </div>
        `;
    }
}

customElements.define('counter-layout', CounterLayout);

export default CounterLayout; 