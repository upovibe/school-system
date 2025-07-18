<?php
// api/database/seeders/event_seeder.php - Event seeder

require_once __DIR__ . '/../connection.php';
require_once __DIR__ . '/../../models/EventModel.php';
require_once __DIR__ . '/../../helpers/SlugHelper.php';

class EventSeeder {
    private $pdo;
    private $eventModel;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->eventModel = new EventModel($pdo);
    }

    public function run() {
        echo "Seeding events...\n";
        
        $events = [
            [
                'title' => 'Annual Sports Day',
                'description' => 'Join us for our annual sports day celebration featuring various athletic competitions, team sports, and fun activities for all students. This event promotes physical fitness, teamwork, and school spirit.',
                'start_date' => date('Y-m-d H:i:s', strtotime('+2 weeks')),
                'end_date' => date('Y-m-d H:i:s', strtotime('+2 weeks +6 hours')),
                'category' => 'sports',
                'status' => 'upcoming',
                'location' => 'School Sports Complex'
            ],
            [
                'title' => 'Science Fair 2024',
                'description' => 'Explore the amazing world of science through student projects, experiments, and demonstrations. This year\'s theme focuses on environmental sustainability and renewable energy solutions.',
                'start_date' => date('Y-m-d H:i:s', strtotime('+1 month')),
                'end_date' => date('Y-m-d H:i:s', strtotime('+1 month +8 hours')),
                'category' => 'academic',
                'status' => 'upcoming',
                'location' => 'School Auditorium'
            ],
            [
                'title' => 'Parent-Teacher Conference',
                'description' => 'Meet with your child\'s teachers to discuss academic progress, goals, and ways to support learning at home. Individual appointments available throughout the day.',
                'start_date' => date('Y-m-d H:i:s', strtotime('+3 days')),
                'end_date' => date('Y-m-d H:i:s', strtotime('+3 days +4 hours')),
                'category' => 'meeting',
                'status' => 'upcoming',
                'location' => 'School Classrooms'
            ],
            [
                'title' => 'Music Concert: Spring Melodies',
                'description' => 'Enjoy an evening of beautiful music performed by our talented students. The concert will feature choir performances, instrumental solos, and ensemble pieces.',
                'start_date' => date('Y-m-d H:i:s', strtotime('+1 week')),
                'end_date' => date('Y-m-d H:i:s', strtotime('+1 week +2 hours')),
                'category' => 'arts',
                'status' => 'upcoming',
                'location' => 'School Auditorium'
            ],
            [
                'title' => 'Career Day Workshop',
                'description' => 'Students will have the opportunity to learn about various career paths from professionals in different fields. Interactive sessions and Q&A with industry experts.',
                'start_date' => date('Y-m-d H:i:s', strtotime('+2 months')),
                'end_date' => date('Y-m-d H:i:s', strtotime('+2 months +5 hours')),
                'category' => 'career',
                'status' => 'upcoming',
                'location' => 'School Library'
            ],
            [
                'title' => 'Math Olympiad Competition',
                'description' => 'Test your mathematical skills in this challenging competition. Open to all students with different difficulty levels for various age groups.',
                'start_date' => date('Y-m-d H:i:s', strtotime('+3 weeks')),
                'end_date' => date('Y-m-d H:i:s', strtotime('+3 weeks +3 hours')),
                'category' => 'academic',
                'status' => 'upcoming',
                'location' => 'School Computer Lab'
            ],
            [
                'title' => 'Art Exhibition: Student Creativity',
                'description' => 'Celebrate the artistic talents of our students through this beautiful exhibition featuring paintings, sculptures, digital art, and mixed media works.',
                'start_date' => date('Y-m-d H:i:s', strtotime('+1.5 months')),
                'end_date' => date('Y-m-d H:i:s', strtotime('+1.5 months +6 hours')),
                'category' => 'arts',
                'status' => 'upcoming',
                'location' => 'School Art Gallery'
            ],
            [
                'title' => 'Community Service Day',
                'description' => 'Join us in giving back to our community through various service activities. Students, parents, and staff will work together on meaningful projects.',
                'start_date' => date('Y-m-d H:i:s', strtotime('+1 month +1 week')),
                'end_date' => date('Y-m-d H:i:s', strtotime('+1 month +1 week +4 hours')),
                'category' => 'community',
                'status' => 'upcoming',
                'location' => 'Various Community Locations'
            ],
            [
                'title' => 'Technology Workshop: Coding for Kids',
                'description' => 'Introduce your child to the world of programming through fun, interactive coding activities. Suitable for beginners with no prior experience required.',
                'start_date' => date('Y-m-d H:i:s', strtotime('+2 weeks +3 days')),
                'end_date' => date('Y-m-d H:i:s', strtotime('+2 weeks +3 days +2 hours')),
                'category' => 'technology',
                'status' => 'upcoming',
                'location' => 'School Computer Lab'
            ],
            [
                'title' => 'Graduation Ceremony 2024',
                'description' => 'Celebrate the achievements of our graduating class in this special ceremony. Family and friends are welcome to attend this memorable event.',
                'start_date' => date('Y-m-d H:i:s', strtotime('+3 months')),
                'end_date' => date('Y-m-d H:i:s', strtotime('+3 months +3 hours')),
                'category' => 'ceremony',
                'status' => 'upcoming',
                'location' => 'School Auditorium'
            ],
            [
                'title' => 'Book Fair and Reading Week',
                'description' => 'Discover new books and foster a love for reading. The book fair will feature a wide selection of age-appropriate books, author visits, and reading activities.',
                'start_date' => date('Y-m-d H:i:s', strtotime('+1 month +2 weeks')),
                'end_date' => date('Y-m-d H:i:s', strtotime('+1 month +2 weeks +7 days')),
                'category' => 'academic',
                'status' => 'upcoming',
                'location' => 'School Library'
            ],
            [
                'title' => 'Drama Club Performance: Shakespeare in the Park',
                'description' => 'Experience the magic of live theater with our drama club\'s outdoor performance of a classic Shakespeare play. Bring a blanket and enjoy the show under the stars.',
                'start_date' => date('Y-m-d H:i:s', strtotime('+2 months +1 week')),
                'end_date' => date('Y-m-d H:i:s', strtotime('+2 months +1 week +2.5 hours')),
                'category' => 'arts',
                'status' => 'upcoming',
                'location' => 'School Garden'
            ]
        ];

        $insertedCount = 0;
        foreach ($events as $eventData) {
            try {
                // Generate slug from title
                $eventData['slug'] = generateSlug($eventData['title']);
                $eventData['slug'] = ensureUniqueSlug($this->pdo, $eventData['slug'], 'events', 'slug');
                
                // Set default values
                $eventData['is_active'] = true;
                
                // Create event
                $eventId = $this->eventModel->create($eventData);
                $insertedCount++;
                
                echo "Created event: {$eventData['title']} (ID: {$eventId})\n";
                
            } catch (Exception $e) {
                echo "Error creating event '{$eventData['title']}': " . $e->getMessage() . "\n";
            }
        }
        
        echo "Successfully seeded {$insertedCount} events.\n";
    }

    public function clear() {
        echo "Clearing events table...\n";
        try {
            $this->pdo->exec("DELETE FROM events");
            $this->pdo->exec("ALTER TABLE events AUTO_INCREMENT = 1");
            echo "Events table cleared successfully.\n";
        } catch (Exception $e) {
            echo "Error clearing events table: " . $e->getMessage() . "\n";
        }
    }
}

// Run seeder if called directly
if (php_sapi_name() === 'cli') {
    global $pdo;
    $seeder = new EventSeeder($pdo);
    
    if (isset($argv[1]) && $argv[1] === 'clear') {
        $seeder->clear();
    } else {
        $seeder->run();
    }
}
?> 