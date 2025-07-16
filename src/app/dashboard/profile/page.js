import App from '@/core/App.js';
import '@/components/ui/Tabs.js';
import '@/components/layout/profileLayout/ProfileContent.js';
import '@/components/layout/profileLayout/ActivityContent.js';

/**
 * User Profile Page Component (/dashboard/profile)
 * 
 * Enhanced profile page with tabs interface that can be used by any role.
 * Uses separate layout components for better organization.
 */
class ProfilePage extends App {
    constructor() {
        super();
    }

    connectedCallback() {
        super.connectedCallback();
        document.title = 'Profile | School System';
    }

    render() {
        return `
            <div class="max-w-6xl mx-auto">
                <!-- Page Header -->
                <div class="mb-8">
                    <h1 class="text-3xl font-bold text-gray-900">Account Settings</h1>
                    <p class="text-gray-600 mt-2">Manage your account information and preferences</p>
                </div>

                <!-- Tabs Interface -->
                <ui-tabs>
                    <ui-tab-list>
                        <ui-tab value="profile">
                            <i class="fas fa-user mr-2"></i>Profile
                        </ui-tab>
                        <ui-tab value="activity">
                            <i class="fas fa-chart-line mr-2"></i>Activity
                        </ui-tab>
                    </ui-tab-list>
                    
                    <ui-tab-panel value="profile">
                        <profile-content></profile-content>
                    </ui-tab-panel>
                    
                    <ui-tab-panel value="activity">
                        <activity-content></activity-content>
                    </ui-tab-panel>
                </ui-tabs>
            </div>
        `;
    }
}

customElements.define('app-profile-page', ProfilePage);
export default ProfilePage; 