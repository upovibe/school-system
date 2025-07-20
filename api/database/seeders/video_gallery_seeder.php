<?php
// api/database/seeders/video_gallery_seeder.php - Seeder for video galleries

require_once __DIR__ . '/../connection.php';
require_once __DIR__ . '/../../models/VideoGalleryModel.php';
require_once __DIR__ . '/../../helpers/SlugHelper.php';

class VideoGallerySeeder {
    private $pdo;
    private $videoGalleryModel;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->videoGalleryModel = new VideoGalleryModel($pdo);
    }

    public function run() {
        try {
            echo "Seeding video galleries...\n";

            $videoGalleries = [
                [
                    'name' => 'School Events 2024',
                    'description' => 'A collection of videos from various school events throughout 2024, including sports days, cultural festivals, and academic ceremonies.',
                    'video_links' => [
                        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        'https://www.youtube.com/watch?v=9bZkp7q19f0',
                        'https://www.youtube.com/watch?v=kJQP7kiw5Fk'
                    ],
                    'is_active' => 1
                ],
                [
                    'name' => 'Student Performances',
                    'description' => 'Amazing performances by our talented students in music, dance, drama, and other artistic endeavors.',
                    'video_links' => [
                        'https://www.youtube.com/watch?v=ZZ5LpwO-An4',
                        'https://www.youtube.com/watch?v=JGwWNGJdvx8',
                        'https://www.youtube.com/watch?v=OPf0YbXqDm0',
                        'https://www.youtube.com/watch?v=YykjpeuMNEk'
                    ],
                    'is_active' => 1
                ],
                [
                    'name' => 'Sports Highlights',
                    'description' => 'Exciting moments from our school sports teams, including football, basketball, swimming, and athletics competitions.',
                    'video_links' => [
                        'https://www.youtube.com/watch?v=3YxaaGgTQYM',
                        'https://www.youtube.com/watch?v=eviwJDNjvDk',
                        'https://www.youtube.com/watch?v=9bZkp7q19f0'
                    ],
                    'is_active' => 1
                ],
                [
                    'name' => 'Academic Achievements',
                    'description' => 'Celebrating our students academic successes, science fair projects, and educational achievements.',
                    'video_links' => [
                        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        'https://www.youtube.com/watch?v=ZZ5LpwO-An4'
                    ],
                    'is_active' => 1
                ],
                [
                    'name' => 'Campus Life',
                    'description' => 'A glimpse into daily campus life, showing the vibrant community and activities that make our school special.',
                    'video_links' => [
                        'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
                        'https://www.youtube.com/watch?v=OPf0YbXqDm0',
                        'https://www.youtube.com/watch?v=YykjpeuMNEk',
                        'https://www.youtube.com/watch?v=3YxaaGgTQYM',
                        'https://www.youtube.com/watch?v=eviwJDNjvDk'
                    ],
                    'is_active' => 1
                ]
            ];

            foreach ($videoGalleries as $videoGalleryData) {
                // Generate slug from name
                $generatedSlug = generateSlug($videoGalleryData['name']);
                $videoGalleryData['slug'] = ensureUniqueSlug($this->pdo, $generatedSlug, 'video_galleries', 'slug');
                
                // Create video gallery
                $videoGalleryId = $this->videoGalleryModel->create($videoGalleryData);
                
                if ($videoGalleryId) {
                    echo "Created video gallery: {$videoGalleryData['name']} (ID: {$videoGalleryId})\n";
                } else {
                    echo "Failed to create video gallery: {$videoGalleryData['name']}\n";
                }
            }

            echo "Video galleries seeding completed!\n";
        } catch (Exception $e) {
            echo "Error seeding video galleries: " . $e->getMessage() . "\n";
        }
    }

    public function clear() {
        echo "Clearing video_galleries table...\n";
        try {
            $this->pdo->exec("DELETE FROM video_galleries");
            $this->pdo->exec("ALTER TABLE video_galleries AUTO_INCREMENT = 1");
            echo "Video galleries table cleared successfully.\n";
        } catch (Exception $e) {
            echo "Error clearing video_galleries table: " . $e->getMessage() . "\n";
        }
    }
}

// Run seeder if called directly
if (php_sapi_name() === 'cli') {
    global $pdo;
    $seeder = new VideoGallerySeeder($pdo);
    
    if (isset($argv[1]) && $argv[1] === 'clear') {
        $seeder->clear();
    } else {
        $seeder->run();
    }
}
?> 