import '@/components/ui/Dialog.js';
/**
 * Password Change Dialog Component
 * 
 * A dialog component that shows when a user needs to change their password.
 * This component is used in the dashboard layout when requiresPasswordChange is true.
 */

class PasswordChangeDialog extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
    }

    render() {
        this.innerHTML = `
            <ui-dialog open title="Password Change Required">
                <div slot="content">
                    <div class="text-center">
                        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                            <i class="fas fa-exclamation-triangle text-yellow-600 text-xl"></i>
                        </div>
                        <p class="text-sm text-gray-500">You haven't changed password</p>
                    </div>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('auth-password-change-dialog', PasswordChangeDialog);
export default PasswordChangeDialog; 