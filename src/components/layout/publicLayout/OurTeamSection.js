import App from '@/core/App.js';
import { unescapeJsonFromAttribute } from '@/utils/jsonUtils.js';
import '@/components/ui/ContentDisplay.js';

/**
 * Our Team Section Component
 * 
 * Displays team content with a unique design layout
 */
class OurTeamSection extends App {
    constructor() {
        super();
    }

    connectedCallback() {
        super.connectedCallback();
        this.loadDataFromProps();
    }

    loadDataFromProps() {
        // Get data from props/attributes
        const colorsAttr = this.getAttribute('colors');
        const pageDataAttr = this.getAttribute('page-data');

        if (colorsAttr) {
            try {
                const colors = JSON.parse(colorsAttr);
                Object.entries(colors).forEach(([key, value]) => {
                    this.set(key, value);
                });
            } catch (error) {
                console.error('Error parsing colors:', error);
            }
        }

        if (pageDataAttr) {
            const pageData = unescapeJsonFromAttribute(pageDataAttr);
            if (pageData) {
                this.set('pageData', pageData);
            }
        }

        // Get team members from props
        const teamMembersAttr = this.getAttribute('team-members');
        if (teamMembersAttr) {
            const teamMembers = unescapeJsonFromAttribute(teamMembersAttr);
            if (teamMembers) {
                this.set('teamMembers', teamMembers);
            }
        }

        // Render immediately with the data
        this.render();
    }

    // Helper method to get proper image URL
    getImageUrl(imagePath) {
        if (!imagePath) return null;
        
        // If it's already a full URL, return as is
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
        }
        
        // If it's a relative path starting with /, construct the full URL
        if (imagePath.startsWith('/')) {
            const baseUrl = window.location.origin;
            return baseUrl + imagePath;
        }
        
        // If it's a relative path without /, construct the URL
        const baseUrl = window.location.origin;
        const apiPath = '/api';
        return baseUrl + apiPath + '/' + imagePath;
    }

    // Helper method to parse banner images from various formats
    getBannerImages(pageData) {
        if (!pageData || !pageData.banner_image) {
            return [];
        }

        let bannerImages = pageData.banner_image;

        // If it's a string, try to parse as JSON
        if (typeof bannerImages === 'string') {
            try {
                const parsed = JSON.parse(bannerImages);
                if (Array.isArray(parsed)) {
                    bannerImages = parsed;
                } else {
                    bannerImages = [bannerImages];
                }
            } catch (e) {
                // If parsing fails, treat as single path
                bannerImages = [bannerImages];
            }
        } else if (!Array.isArray(bannerImages)) {
            // If it's not an array, wrap in array
            bannerImages = [bannerImages];
        }

        // Filter out empty/null values
        return bannerImages.filter(img => img && img.trim() !== '');
    }

    render() {
        const pageData = this.get('pageData');
        const teamMembers = this.get('teamMembers') || [];
        
        // Get colors from state
        const primaryColor = this.get('primary_color');
        const secondaryColor = this.get('secondary_color');
        const accentColor = this.get('accent_color');
        const textColor = this.get('text_color');

        // Only render if there's content
        if (!pageData?.content || pageData.content.trim() === '') {
            return `
                <div class="text-center py-16">
                    <div class="bg-white rounded-3xl shadow-lg p-8">
                        <i class="fas fa-users text-gray-400 text-6xl mb-4"></i>
                        <h2 class="text-2xl font-semibold text-gray-600 mb-2">Our Team</h2>
                        <p class="text-gray-500">Our team information is being prepared.</p>
                    </div>
                </div>
            `;
        }

        const bannerImages = this.getBannerImages(pageData);

        return `
            <!-- Our Team Section -->
            <section class="mx-auto py-10 bg-gray-50">
                <!-- Team Header -->
                <div class="text-center mb-12">
                    <h2 class="text-3xl lg:text-4xl font-bold text-[${primaryColor}] mb-4">
                        Our Team
                    </h2>
                    <p class="text-lg opacity-80 mb-4">
                        Dedicated educators committed to excellence
                    </p>
                    <div class="w-24 h-1 bg-[${primaryColor}] mx-auto rounded-full"></div>
                </div>
                
                <!-- Main Content Section (Image Left, Content Right) -->
                <div class="bg-white rounded-3xl shadow-lg overflow-hidden">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-0">
                        <!-- Banner Image Column (Left) -->
                        <div class="relative h-64 lg:h-auto">
                            ${bannerImages.length > 0 ? `
                                <img src="${this.getImageUrl(bannerImages[0])}" 
                                     alt="Our Team" 
                                     class="w-full h-full object-cover"
                                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                            ` : ''}
                            <div class="absolute inset-0 hidden items-center justify-center bg-gray-100">
                                <div class="text-center">
                                    <i class="fas fa-users text-gray-400 text-4xl mb-2"></i>
                                    <p class="text-gray-500 font-medium">Our team image</p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Content Column (Right) -->
                        <div class="p-5 lg:p-12 flex flex-col justify-center">
                            <content-display 
                                content="${pageData.content.replace(/"/g, '&quot;')}"
                                no-styles>
                            </content-display>
                        </div>
                    </div>
                </div>
                
                <!-- Team Members Grid -->
                ${teamMembers.length > 0 ? `
                    <div class="mt-16">
                        <div class="text-center mb-12">
                            <h3 class="text-2xl lg:text-3xl font-bold text-[${secondaryColor}] mb-4">Our Team Members</h3>
                            <p class="text-lg text-gray-600">Get to know the dedicated professionals behind our success</p>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            ${teamMembers.map(member => `
                                <div class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
                                    <!-- Team Member Image -->
                                    <div class="relative h-48 overflow-hidden">
                                        ${member.profile_image ? `
                                            <img src="${this.getImageUrl(member.profile_image)}" 
                                                 alt="${member.name}" 
                                                 class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                        ` : ''}
                                        <div class="absolute inset-0 hidden items-center justify-center bg-gradient-to-br from-[${secondaryColor}] to-[${primaryColor}]">
                                            <div class="text-center text-white">
                                                <i class="fas fa-user text-4xl mb-2"></i>
                                                <p class="text-sm">No image</p>
                                            </div>
                                        </div>
                                        
                                        <!-- Department Badge -->
                                        ${member.department ? `
                                            <div class="absolute top-3 right-3">
                                                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[${primaryColor}] text-white">
                                                    ${member.department}
                                                </span>
                                            </div>
                                        ` : ''}
                                    </div>
                                    
                                    <!-- Team Member Info -->
                                    <div class="p-6">
                                        <h4 class="text-lg font-semibold text-[${secondaryColor}] mb-2">${member.name}</h4>
                                        ${member.position ? `
                                            <p class="text-sm text-gray-600 mb-3">${member.position}</p>
                                        ` : ''}
                                        
                                        ${member.bio ? `
                                            <p class="text-sm text-gray-500 line-clamp-3">${member.bio}</p>
                                        ` : ''}
                                        
                                        <!-- Contact Info -->
                                        <div class="mt-4 pt-4 border-t border-gray-100">
                                            ${member.email ? `
                                                <div class="flex items-center text-sm text-gray-600 mb-1">
                                                    <i class="fas fa-envelope w-4 mr-2"></i>
                                                    <span class="truncate">${member.email}</span>
                                                </div>
                                            ` : ''}
                                            ${member.phone ? `
                                                <div class="flex items-center text-sm text-gray-600">
                                                    <i class="fas fa-phone w-4 mr-2"></i>
                                                    <span>${member.phone}</span>
                                                </div>
                                            ` : ''}
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </section>
        `;
    }
}

customElements.define('our-team-section', OurTeamSection);
export default OurTeamSection; 