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