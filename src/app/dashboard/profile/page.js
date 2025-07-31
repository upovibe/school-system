import App from '@/core/App.js';
import '@/components/ui/Tabs.js';
import '@/components/layout/profileLayout/ProfileContent.js';
import '@/components/layout/profileLayout/ActivityContent.js';
import '@/components/layout/profileLayout/PasswordContent.js';
import '@/components/layout/profileLayout/PersonalInfoContent.js';

/**
 * User Profile Page Component (/dashboard/profile)
 * 
 * Enhanced profile page with tabs interface that can be used by any role.
 * Uses separate layout components for better organization.
 * Students get an additional "Personal Info" tab.
 */
class ProfilePage extends App {
    constructor() {
        super();
        this.userRole = null;
    }

    connectedCallback() {
        super.connectedCallback();
        document.title = 'Profile | School System';
        this.determineUserRole();
    }

    determineUserRole() {
        try {
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            this.userRole = userData.role || userData.role_name;
            this.set('userRole', this.userRole);
        } catch (error) {
            console.error('Error determining user role:', error);
            this.userRole = null;
        }
    }

    render() {
        const userRole = this.get('userRole');
        const isStudent = userRole === 'student' || userRole === 'Student';

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
                        ${isStudent ? `
                            <ui-tab value="personal-info">
                                <i class="fas fa-id-card mr-2"></i>Personal Info
                            </ui-tab>
                        ` : ''}
                        <ui-tab value="password">
                            <i class="fas fa-key mr-2"></i>Password
                        </ui-tab>
                        <ui-tab value="activity">
                            <i class="fas fa-chart-line mr-2"></i>Activity
                        </ui-tab>
                    </ui-tab-list>
                    
                    <ui-tab-panel value="profile">
                        <profile-content></profile-content>
                    </ui-tab-panel>
                    
                    ${isStudent ? `
                        <ui-tab-panel value="personal-info">
                            <personal-info-content></personal-info-content>
                        </ui-tab-panel>
                    ` : ''}
                    
                    <ui-tab-panel value="password">
                        <password-content></password-content>
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