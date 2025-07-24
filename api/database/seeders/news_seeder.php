<?php
// api/database/seeders/news_seeder.php - News seeder

require_once __DIR__ . '/../connection.php';
require_once __DIR__ . '/../../models/NewsModel.php';
require_once __DIR__ . '/../../helpers/SlugHelper.php';

class NewsSeeder {
    private $pdo;
    private $newsModel;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->newsModel = new NewsModel($pdo);
    }

    public function run() {
        echo "Seeding news...\n";
        
        $news = [
            [
                'title' => 'New Library Resources Available',
                'content' => '<p>We are excited to announce that our school library has been expanded with new digital resources and physical books. Students now have access to over 10,000 additional titles, including e-books, audiobooks, and educational databases.</p><p>The new collection includes:</p><ul><li>STEM-focused literature and reference materials</li><li>Multilingual books to support our diverse student body</li><li>Interactive learning platforms for all grade levels</li><li>Professional development resources for teachers</li></ul><p>Visit the library to explore these new resources and speak with our librarians about how to make the most of these materials.</p>',
                'is_active' => true
            ],
            [
                'title' => 'School Achieves Outstanding Academic Performance',
                'content' => '<p>We are proud to announce that our school has achieved outstanding results in the latest academic assessments. Our students consistently demonstrate excellence across all subject areas, with significant improvements in mathematics, science, and literacy.</p><p>Key highlights include:</p><ul><li>95% of students meeting or exceeding grade-level expectations</li><li>40% improvement in standardized test scores</li><li>Recognition for innovative teaching methods</li><li>Strong performance in extracurricular activities</li></ul><p>These achievements reflect the dedication of our teachers, students, and parents working together to create an exceptional learning environment.</p>',
                'is_active' => true
            ],
            [
                'title' => 'Technology Upgrade Initiative Launched',
                'content' => '<p>Our school is embarking on a comprehensive technology upgrade initiative to enhance the learning experience for all students. This multi-phase project will modernize our digital infrastructure and provide cutting-edge tools for education.</p><p>The upgrade includes:</p><ul><li>New computer labs with the latest hardware</li><li>Interactive whiteboards in all classrooms</li><li>High-speed internet connectivity throughout campus</li><li>Digital learning platforms and software licenses</li><li>Professional development for teachers on new technologies</li></ul><p>This investment ensures our students are prepared for the digital future and have access to the best educational technology available.</p>',
                'is_active' => true
            ]
        ];

        $insertedCount = 0;
        foreach ($news as $newsData) {
            try {
                // Generate slug from title
                $newsData['slug'] = generateSlug($newsData['title']);
                $newsData['slug'] = ensureUniqueSlug($this->pdo, $newsData['slug'], 'news', 'slug');
                
                // Set default values
                if (!isset($newsData['is_active'])) {
                    $newsData['is_active'] = true;
                }
                
                // Create news
                $newsId = $this->newsModel->create($newsData);
                $insertedCount++;
                
                echo "Created news: {$newsData['title']} (ID: {$newsId})\n";
                
            } catch (Exception $e) {
                echo "Error creating news '{$newsData['title']}': " . $e->getMessage() . "\n";
            }
        }
        
        echo "Successfully seeded {$insertedCount} news articles.\n";
    }

    public function clear() {
        echo "Clearing news table...\n";
        try {
            $this->pdo->exec("DELETE FROM news");
            $this->pdo->exec("ALTER TABLE news AUTO_INCREMENT = 1");
            echo "News table cleared successfully.\n";
        } catch (Exception $e) {
            echo "Error clearing news table: " . $e->getMessage() . "\n";
        }
    }
}

// Run seeder if called directly
if (php_sapi_name() === 'cli') {
    global $pdo;
    $seeder = new NewsSeeder($pdo);
    
    if (isset($argv[1]) && $argv[1] === 'clear') {
        $seeder->clear();
    } else {
        $seeder->run();
    }
}
?> 