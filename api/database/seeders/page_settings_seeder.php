<?php
// api/database/seeders/page_settings_seeder.php - Seeder for default pages and settings

class PageSettingsSeeder {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function run() {
        echo "🌱 Seeding default pages and settings...\n";
        
        $this->seedDefaultPages();
        $this->seedDefaultSettings();
        
        echo "✅ Default pages and settings seeded successfully!\n";
    }
    
    private function seedDefaultPages() {
        echo "📝 Seeding default pages...\n";
        
        $defaultPages = [
            [
                'slug' => 'about-us',
                'title' => 'About Us',
                'content' => '<h2>Welcome to Our School</h2><p>We are committed to providing quality education and fostering academic excellence.</p>',
                'meta_description' => 'Learn about our school\'s history, mission, and commitment to education.',
                'category' => 'about',
                'is_active' => 1,
                'sort_order' => 1,
                'banner_image' => '/assets/images/pages/about-us-banner.jpg'
            ],
            [
                'slug' => 'mission-vision',
                'title' => 'Mission & Vision',
                'content' => '<h2>Our Mission</h2><p>To provide comprehensive education that empowers students to achieve their full potential.</p><h2>Our Vision</h2><p>To be a leading educational institution that shapes future leaders.</p>',
                'meta_description' => 'Discover our school\'s mission and vision for academic excellence.',
                'category' => 'about',
                'is_active' => 1,
                'sort_order' => 2,
                'banner_image' => '/assets/images/pages/mission-vision-banner.jpg'
            ],
            [
                'slug' => 'values-aims',
                'title' => 'Our Values & Aims',
                'content' => '<h2>Core Values</h2><ul><li>Excellence in Education</li><li>Integrity and Honesty</li><li>Respect for Diversity</li><li>Innovation and Creativity</li></ul>',
                'meta_description' => 'Explore our core values and educational aims.',
                'category' => 'about',
                'is_active' => 1,
                'sort_order' => 3,
                'banner_image' => '/assets/images/pages/values-aims-banner.jpg'
            ],
            [
                'slug' => 'our-team',
                'title' => 'Our Team',
                'content' => '<h2>Leadership Team</h2><p>Meet our dedicated team of educators and administrators.</p>',
                'meta_description' => 'Meet our school\'s leadership team and staff.',
                'category' => 'about',
                'is_active' => 1,
                'sort_order' => 4,
                'banner_image' => '/assets/images/pages/our-team-banner.jpg'
            ],
            [
                'slug' => 'contact',
                'title' => 'Contact Us',
                'content' => '<h2>Get in Touch</h2><p>We\'d love to hear from you. Contact us for any inquiries.</p>',
                'meta_description' => 'Contact information and location details.',
                'category' => 'contact',
                'is_active' => 1,
                'sort_order' => 5,
                'banner_image' => '/assets/images/pages/contact-banner.jpg'
            ],
            [
                'slug' => 'academic-programs',
                'title' => 'Academic Programs',
                'content' => '<h2>Our Programs</h2><p>Explore our comprehensive academic programs designed for student success.</p>',
                'meta_description' => 'Discover our academic programs and curriculum.',
                'category' => 'academics',
                'is_active' => 1,
                'sort_order' => 6,
                'banner_image' => '/assets/images/pages/academic-programs-banner.jpg'
            ],
            [
                'slug' => 'admissions',
                'title' => 'Admissions',
                'content' => '<h2>How to Apply</h2><p>Learn about our admission process and requirements.</p>',
                'meta_description' => 'Information about school admissions and application process.',
                'category' => 'academics',
                'is_active' => 1,
                'sort_order' => 7,
                'banner_image' => '/assets/images/pages/admissions-banner.jpg'
            ]
        ];
        
        foreach ($defaultPages as $page) {
            $this->seedPage($page);
        }
    }
    
    private function seedPage($pageData) {
        try {
            // Check if page already exists
            $stmt = $this->pdo->prepare('SELECT id FROM pages WHERE slug = ?');
            $stmt->execute([$pageData['slug']]);
            
            if ($stmt->fetch()) {
                echo "⚠️  Page '{$pageData['slug']}' already exists\n";
                return;
            }
            
            $stmt = $this->pdo->prepare('
                INSERT INTO pages (slug, title, content, meta_description, category, is_active, sort_order, banner_image, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ');
            
            $stmt->execute([
                $pageData['slug'],
                $pageData['title'],
                $pageData['content'],
                $pageData['meta_description'],
                $pageData['category'],
                $pageData['is_active'],
                $pageData['sort_order'],
                $pageData['banner_image']
            ]);
            
            echo "✅ Seeded page: {$pageData['slug']}\n";
        } catch (Exception $e) {
            echo "❌ Error seeding page {$pageData['slug']}: " . $e->getMessage() . "\n";
        }
    }
    
    private function seedDefaultSettings() {
        echo "⚙️  Seeding default settings...\n";
        
        $defaultSettings = [
            // Theme Settings
            ['setting_key' => 'theme_color', 'setting_value' => '#3B82F6', 'setting_type' => 'color', 'category' => 'theme', 'description' => 'Primary theme color'],
            ['setting_key' => 'brand_text_color', 'setting_value' => '#FFFFFF', 'setting_type' => 'color', 'category' => 'theme', 'description' => 'Text color for branding'],
            ['setting_key' => 'secondary_color', 'setting_value' => '#10B981', 'setting_type' => 'color', 'category' => 'theme', 'description' => 'Secondary accent color'],
            ['setting_key' => 'background_color', 'setting_value' => '#F9FAFB', 'setting_type' => 'color', 'category' => 'theme', 'description' => 'Page background color'],
            ['setting_key' => 'font_family', 'setting_value' => 'Inter, sans-serif', 'setting_type' => 'text', 'category' => 'theme', 'description' => 'Primary font family'],
            
            // Branding Settings
            ['setting_key' => 'school_name', 'setting_value' => 'Our School', 'setting_type' => 'text', 'category' => 'branding', 'description' => 'School name'],
            ['setting_key' => 'school_logo', 'setting_value' => '/assets/images/logo.png', 'setting_type' => 'file', 'category' => 'branding', 'description' => 'School logo path'],
            ['setting_key' => 'school_favicon', 'setting_value' => '/assets/images/favicon.ico', 'setting_type' => 'file', 'category' => 'branding', 'description' => 'School favicon path'],
            ['setting_key' => 'school_tagline', 'setting_value' => 'Excellence in Education', 'setting_type' => 'text', 'category' => 'branding', 'description' => 'School tagline'],
            
            // Contact Settings
            ['setting_key' => 'contact_address', 'setting_value' => '123 School Street, City, Country', 'setting_type' => 'textarea', 'category' => 'contact', 'description' => 'School address'],
            ['setting_key' => 'contact_phone', 'setting_value' => '+233-54-283-8165', 'setting_type' => 'text', 'category' => 'contact', 'description' => 'Contact phone number'],
            ['setting_key' => 'contact_email', 'setting_value' => 'info@school.com', 'setting_type' => 'text', 'category' => 'contact', 'description' => 'Contact email address'],
            ['setting_key' => 'contact_website', 'setting_value' => 'https://school.com', 'setting_type' => 'text', 'category' => 'contact', 'description' => 'School website'],
            
            // Social Media Settings
            ['setting_key' => 'facebook_url', 'setting_value' => '', 'setting_type' => 'text', 'category' => 'social', 'description' => 'Facebook page URL'],
            ['setting_key' => 'twitter_url', 'setting_value' => '', 'setting_type' => 'text', 'category' => 'social', 'description' => 'Twitter profile URL'],
            ['setting_key' => 'instagram_url', 'setting_value' => '', 'setting_type' => 'text', 'category' => 'social', 'description' => 'Instagram profile URL'],
            ['setting_key' => 'linkedin_url', 'setting_value' => '', 'setting_type' => 'text', 'category' => 'social', 'description' => 'LinkedIn page URL'],
            ['setting_key' => 'whatsapp_url', 'setting_value' => '', 'setting_type' => 'text', 'category' => 'social', 'description' => 'WhatsApp contact URL'],
            ['setting_key' => 'youtube_url', 'setting_value' => '', 'setting_type' => 'text', 'category' => 'social', 'description' => 'YouTube channel URL'],
            
            // Map Settings
            ['setting_key' => 'map_location_name', 'setting_value' => 'Our School Campus', 'setting_type' => 'text', 'category' => 'map', 'description' => 'Location name for map'],
            ['setting_key' => 'map_address', 'setting_value' => '123 School Street, City, Country', 'setting_type' => 'textarea', 'category' => 'map', 'description' => 'Full address for map'],
            ['setting_key' => 'map_latitude', 'setting_value' => '40.7128', 'setting_type' => 'text', 'category' => 'map', 'description' => 'Latitude coordinate'],
            ['setting_key' => 'map_longitude', 'setting_value' => '-74.0060', 'setting_type' => 'text', 'category' => 'map', 'description' => 'Longitude coordinate'],
            ['setting_key' => 'map_embed_url', 'setting_value' => 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.1!2d-73.9!3d40.7!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDDCsDQyJzAwLjAiTiA3M8KwNTQnMDAuMCJX!5e0!3m2!1sen!2sus!4v1600000000000!5m2!1sen!2sus', 'setting_type' => 'text', 'category' => 'map', 'description' => 'Google Maps embed URL'],
            ['setting_key' => 'map_zoom_level', 'setting_value' => '15', 'setting_type' => 'number', 'category' => 'map', 'description' => 'Map zoom level (1-20)'],
            
            // General Settings
            ['setting_key' => 'footer_text', 'setting_value' => '© 2024 Our School. All rights reserved.', 'setting_type' => 'text', 'category' => 'general', 'description' => 'Footer copyright text'],
            ['setting_key' => 'meta_keywords', 'setting_value' => 'school, education, learning, students', 'setting_type' => 'text', 'category' => 'general', 'description' => 'SEO meta keywords'],
            ['setting_key' => 'google_analytics', 'setting_value' => '', 'setting_type' => 'text', 'category' => 'general', 'description' => 'Google Analytics tracking code'],
            ['setting_key' => 'maintenance_mode', 'setting_value' => '0', 'setting_type' => 'boolean', 'category' => 'general', 'description' => 'Enable maintenance mode']
        ];
        
        foreach ($defaultSettings as $setting) {
            $this->seedSetting($setting);
        }
    }
    
    private function seedSetting($settingData) {
        try {
            // Check if setting already exists
            $stmt = $this->pdo->prepare('SELECT id FROM settings WHERE setting_key = ?');
            $stmt->execute([$settingData['setting_key']]);
            
            if ($stmt->fetch()) {
                echo "⚠️  Setting '{$settingData['setting_key']}' already exists\n";
                return;
            }
            
            $stmt = $this->pdo->prepare('
                INSERT INTO settings (setting_key, setting_value, setting_type, category, description, is_active, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())
            ');
            
            $stmt->execute([
                $settingData['setting_key'],
                $settingData['setting_value'],
                $settingData['setting_type'],
                $settingData['category'],
                $settingData['description']
            ]);
            
            echo "✅ Seeded setting: {$settingData['setting_key']}\n";
        } catch (Exception $e) {
            echo "❌ Error seeding setting {$settingData['setting_key']}: " . $e->getMessage() . "\n";
        }
    }
}
?> 