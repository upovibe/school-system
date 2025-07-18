<?php
// api/database/seeders/seed.php - Main seed file (Express/Node.js style)

class Seed {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function run() {
        echo "🌱 Starting database seeding...\n\n";
        
        $this->seedUsers();
        $this->seedPagesAndSettings();
        echo "\n✅ Database seeding completed!\n";
    }
    
    private function seedUsers() {
        echo "👥 Seeding users...\n";
        
        // Include the user seeder
        require_once __DIR__ . '/user_seeder.php';
        $userSeeder = new UserSeeder($this->pdo);
        $userSeeder->run();
    }
    
    private function seedPagesAndSettings() {
        echo "📄 Seeding pages and settings...\n";
        
        // Include the page seeder
        require_once __DIR__ . '/page_seeder.php';
        $pageSeeder = new PageSeeder($this->pdo);
        $pageSeeder->run();
        
        // Include the settings seeder
        require_once __DIR__ . '/settings_seeder.php';
        $settingsSeeder = new SettingsSeeder($this->pdo);
        $settingsSeeder->run();
    }
    
}
?> 