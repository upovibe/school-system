<?php
// api/database/seeders/gallery_seeder.php - Gallery seeder

require_once __DIR__ . '/../connection.php';
require_once __DIR__ . '/../../models/GalleryModel.php';
require_once __DIR__ . '/../../helpers/SlugHelper.php';

class GallerySeeder {
    private $pdo;
    private $galleryModel;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->galleryModel = new GalleryModel($pdo);
    }

    public function run() {
        echo "Seeding galleries...\n";
        
        $galleries = [
            [
                'name' => 'School Events 2024',
                'description' => 'A collection of memorable moments from various school events throughout 2024, including sports days, cultural festivals, and academic celebrations.',
                'images' => [],
                'is_active' => true
            ],
            [
                'name' => 'Graduation Ceremony',
                'description' => 'Photos from our annual graduation ceremony, capturing the proud moments of our graduating students and their families.',
                'images' => [],
                'is_active' => true
            ],
            [
                'name' => 'Sports Day',
                'description' => 'Highlights from our annual sports day featuring students participating in various athletic events, team sports, and friendly competitions.',
                'images' => [],
                'is_active' => true
            ],
            [
                'name' => 'Cultural Festival',
                'description' => 'Images from our cultural festival showcasing student performances, art exhibitions, and traditional celebrations.',
                'images' => [],
                'is_active' => true
            ],
            [
                'name' => 'Science Fair',
                'description' => 'Photos from our annual science fair where students showcase their innovative projects and scientific discoveries.',
                'images' => [],
                'is_active' => true
            ],
            [
                'name' => 'Campus Life',
                'description' => 'Daily life at our school campus, including classroom activities, library sessions, and student interactions.',
                'images' => [],
                'is_active' => true
            ],
            [
                'name' => 'Field Trips',
                'description' => 'Educational field trips and outdoor learning experiences that enrich our students\' educational journey.',
                'images' => [],
                'is_active' => true
            ],
            [
                'name' => 'Teacher Appreciation',
                'description' => 'Special moments celebrating our dedicated teachers and their contributions to student success.',
                'images' => [],
                'is_active' => true
            ],
            [
                'name' => 'Art Exhibition',
                'description' => 'Student artwork and creative projects displayed in our annual art exhibition.',
                'images' => [],
                'is_active' => true
            ],
            [
                'name' => 'Community Service',
                'description' => 'Photos from various community service activities and volunteer programs organized by our school.',
                'images' => [],
                'is_active' => true
            ]
        ];

        $insertedCount = 0;
        foreach ($galleries as $galleryData) {
            try {
                // Generate slug from name
                $galleryData['slug'] = generateSlug($galleryData['name']);
                $galleryData['slug'] = ensureUniqueSlug($this->pdo, $galleryData['slug'], 'galleries', 'slug');
                
                // Set default values
                if (!isset($galleryData['is_active'])) {
                    $galleryData['is_active'] = true;
                }
                
                // Create gallery
                $galleryId = $this->galleryModel->create($galleryData);
                $insertedCount++;
                
                echo "Created gallery: {$galleryData['name']} (ID: {$galleryId})\n";
                
            } catch (Exception $e) {
                echo "Error creating gallery '{$galleryData['name']}': " . $e->getMessage() . "\n";
            }
        }
        
        echo "Successfully seeded {$insertedCount} galleries.\n";
    }

    public function clear() {
        echo "Clearing galleries table...\n";
        try {
            $this->pdo->exec("DELETE FROM galleries");
            $this->pdo->exec("ALTER TABLE galleries AUTO_INCREMENT = 1");
            echo "Galleries table cleared successfully.\n";
        } catch (Exception $e) {
            echo "Error clearing galleries table: " . $e->getMessage() . "\n";
        }
    }
}

// Run seeder if called directly
if (php_sapi_name() === 'cli') {
    global $pdo;
    $seeder = new GallerySeeder($pdo);
    
    if (isset($argv[1]) && $argv[1] === 'clear') {
        $seeder->clear();
    } else {
        $seeder->run();
    }
}
?> 