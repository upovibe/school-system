<?php
// api/database/seeders/settings_seeder.php - Seeder for default settings

class SettingsSeeder
{
    private $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    public function run()
    {
        echo "🌱 Seeding default settings...\n";

        $this->seedDefaultSettings();

        echo "✅ Default settings seeded successfully!\n";
    }

    private function seedDefaultSettings()
    {
        echo "⚙️  Seeding default settings...\n";

        $defaultSettings = [
            // Theme Settings
            ['setting_key' => 'theme_color', 'setting_value' => '#a38d00', 'setting_type' => 'color', 'category' => 'theme', 'description' => 'Primary theme color'],
            ['setting_key' => 'brand_text_color', 'setting_value' => '#ffffff', 'setting_type' => 'color', 'category' => 'theme', 'description' => 'Text color for branding'],
            ['setting_key' => 'secondary_color', 'setting_value' => '#270061', 'setting_type' => 'color', 'category' => 'theme', 'description' => 'Secondary accent color'],
            ['setting_key' => 'background_color', 'setting_value' => '#F9FAFB', 'setting_type' => 'color', 'category' => 'theme', 'description' => 'Page background color'],
            ['setting_key' => 'hover_light_color', 'setting_value' => '#160066', 'setting_type' => 'color', 'category' => 'theme', 'description' => 'Hover overlay for light backgrounds'],
            ['setting_key' => 'hover_dark_color', 'setting_value' => '#878a00', 'setting_type' => 'color', 'category' => 'theme', 'description' => 'Hover overlay for dark backgrounds'],
            ['setting_key' => 'text_secondary_color', 'setting_value' => '#6e6e6e', 'setting_type' => 'color', 'category' => 'theme', 'description' => 'Secondary (muted) text color'],
            ['setting_key' => 'success_color', 'setting_value' => '#28a745', 'setting_type' => 'color', 'category' => 'theme', 'description' => 'Color used for success messages'],
            ['setting_key' => 'error_color', 'setting_value' => '#dc3545', 'setting_type' => 'color', 'category' => 'theme', 'description' => 'Color used for error messages'],
            ['setting_key' => 'warning_color', 'setting_value' => '#ffc107', 'setting_type' => 'color', 'category' => 'theme', 'description' => 'Color used for warning messages'],
            ['setting_key' => 'font_family', 'setting_value' => 'Inter, sans-serif', 'setting_type' => 'text', 'category' => 'theme', 'description' => 'Primary font family'],

            // Branding Settings
            ['setting_key' => 'school_name', 'setting_value' => 'Our School', 'setting_type' => 'text', 'category' => 'branding', 'description' => 'School name'],
            ['setting_key' => 'school_logo', 'setting_value' => 'uploads/settings/logo_1752712977_687847114ab44.png', 'setting_type' => 'file', 'category' => 'branding', 'description' => 'School logo path'],
            ['setting_key' => 'school_favicon', 'setting_value' => 'uploads/settings/favicon_1752713006_6878472e10dc2.png', 'setting_type' => 'file', 'category' => 'branding', 'description' => 'School favicon path'],
            ['setting_key' => 'school_tagline', 'setting_value' => 'Excellence in Education', 'setting_type' => 'text', 'category' => 'branding', 'description' => 'School tagline'],

            // Contact Settings
            ['setting_key' => 'contact_address', 'setting_value' => '123 School Street, City, Country', 'setting_type' => 'textarea', 'category' => 'contact', 'description' => 'School address'],
            ['setting_key' => 'contact_phone', 'setting_value' => '+233-54-283-8165', 'setting_type' => 'text', 'category' => 'contact', 'description' => 'Contact phone number'],
            ['setting_key' => 'contact_email', 'setting_value' => 'info@school.com', 'setting_type' => 'text', 'category' => 'contact', 'description' => 'Contact email address'],
            ['setting_key' => 'contact_website', 'setting_value' => 'https://school.com', 'setting_type' => 'text', 'category' => 'contact', 'description' => 'School website'],

            // Social Media Settings
            ['setting_key' => 'facebook_url', 'setting_value' => 'https://github.com/upovibe', 'setting_type' => 'text', 'category' => 'social', 'description' => 'Facebook page URL'],
            ['setting_key' => 'twitter_url', 'setting_value' => 'https://github.com/upovibe', 'setting_type' => 'text', 'category' => 'social', 'description' => 'Twitter profile URL'],
            ['setting_key' => 'instagram_url', 'setting_value' => 'https://github.com/upovibe', 'setting_type' => 'text', 'category' => 'social', 'description' => 'Instagram profile URL'],
            ['setting_key' => 'linkedin_url', 'setting_value' => 'https://github.com/upovibe', 'setting_type' => 'text', 'category' => 'social', 'description' => 'LinkedIn page URL'],
            ['setting_key' => 'whatsapp_url', 'setting_value' => 'https://github.com/upovibe', 'setting_type' => 'text', 'category' => 'social', 'description' => 'WhatsApp contact URL'],
            ['setting_key' => 'youtube_url', 'setting_value' => 'https://github.com/upovibe', 'setting_type' => 'text', 'category' => 'social', 'description' => 'YouTube channel URL'],

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
            ['setting_key' => 'maintenance_mode', 'setting_value' => '0', 'setting_type' => 'boolean', 'category' => 'general', 'description' => 'Enable maintenance mode'],
            
            // Hero Section Settings (General)
            ['setting_key' => 'hero_title', 'setting_value' => 'Welcome to Our School', 'setting_type' => 'text', 'category' => 'general', 'description' => 'Main hero section title'],
            ['setting_key' => 'hero_subtitle', 'setting_value' => 'Excellence in Education, Character, and Leadership', 'setting_type' => 'textarea', 'category' => 'general', 'description' => 'Hero section subtitle or description'],
            
            // About Section Settings (General)
            ['setting_key' => 'about_title', 'setting_value' => 'About Our School', 'setting_type' => 'text', 'category' => 'general', 'description' => 'About section title'],
            ['setting_key' => 'about_subtitle', 'setting_value' => 'Discover our story, values, and commitment to excellence', 'setting_type' => 'textarea', 'category' => 'general', 'description' => 'About section subtitle or description'],
            
            // Academics Section Settings (General)
            ['setting_key' => 'academics_title', 'setting_value' => 'Academic Excellence', 'setting_type' => 'text', 'category' => 'general', 'description' => 'Academics section title'],
            ['setting_key' => 'academics_subtitle', 'setting_value' => 'Comprehensive education programs designed for student success', 'setting_type' => 'textarea', 'category' => 'general', 'description' => 'Academics section subtitle or description']
        ];

        foreach ($defaultSettings as $setting) {
            $this->seedSetting($setting);
        }
    }

    private function seedSetting($settingData)
    {
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