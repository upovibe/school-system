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
        $this->seedEvents();
        $this->seedNews();
        $this->seedGalleries();
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
    
    private function seedEvents() {
        echo "📅 Seeding events...\n";
        
        // Include the event seeder
        require_once __DIR__ . '/event_seeder.php';
        $eventSeeder = new EventSeeder($this->pdo);
        $eventSeeder->run();
    }
    
    private function seedNews() {
        echo "📰 Seeding news...\n";
        
        // Include the news seeder
        require_once __DIR__ . '/news_seeder.php';
        $newsSeeder = new NewsSeeder($this->pdo);
        $newsSeeder->run();
    }
    
    private function seedGalleries() {
        echo "🖼️  Seeding galleries...\n";
        
        // Include the gallery seeder
        require_once __DIR__ . '/gallery_seeder.php';
        $gallerySeeder = new GallerySeeder($this->pdo);
        $gallerySeeder->run();
    }
    
}
?> 