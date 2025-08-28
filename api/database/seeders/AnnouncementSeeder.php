<?php
// api/database/seeders/AnnouncementSeeder.php - Seeder for announcements table

class AnnouncementSeeder {
    private $pdo;
    private $announcementModel;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->announcementModel = new AnnouncementModel($pdo);
    }

    public function run() {
        try {
            echo "Seeding announcements table...\n";
            
            // Sample announcements data
            $announcements = [
                [
                    'title' => 'Welcome Back to School!',
                    'content' => 'Welcome back students! We hope you had a wonderful break. The new academic year begins with exciting opportunities for learning and growth. Please ensure you have all your required materials and are ready for an amazing year ahead.',
                    'announcement_type' => 'general',
                    'priority' => 'high',
                    'target_audience' => 'students',
                    'is_pinned' => 1,
                    'created_by' => 1 // Assuming user ID 1 is an admin
                ],
                [
                    'title' => 'Parent-Teacher Conference Schedule',
                    'content' => 'Parent-Teacher conferences will be held on Friday, October 15th, from 2:00 PM to 6:00 PM. Please schedule your appointment through the school portal. This is a great opportunity to discuss your child\'s progress.',
                    'announcement_type' => 'academic',
                    'priority' => 'normal',
                    'target_audience' => 'all',
                    'is_pinned' => 0,
                    'created_by' => 1
                ],
                [
                    'title' => 'Sports Day Registration Open',
                    'content' => 'Sports Day registration is now open! Students can register for various athletic events including track, field, and team sports. Registration closes on October 10th. Contact your PE teacher for more details.',
                    'announcement_type' => 'event',
                    'priority' => 'normal',
                    'target_audience' => 'students',
                    'is_pinned' => 0,
                    'created_by' => 1
                ],
                [
                    'title' => 'Library Hours Extended',
                    'content' => 'The school library will now be open until 5:00 PM on weekdays to accommodate students who need extra study time. Evening study sessions are also available on Tuesdays and Thursdays.',
                    'announcement_type' => 'general',
                    'priority' => 'low',
                    'target_audience' => 'students',
                    'is_pinned' => 0,
                    'created_by' => 1
                ],
                [
                    'title' => 'Emergency Contact Update Required',
                    'content' => 'All parents are requested to update their emergency contact information in the school portal by the end of this week. This ensures we can reach you quickly in case of any emergency.',
                    'announcement_type' => 'reminder',
                    'priority' => 'high',
                    'target_audience' => 'all',
                    'is_pinned' => 1,
                    'created_by' => 1
                ],
                [
                    'title' => 'Science Fair Project Guidelines',
                    'content' => 'Science Fair project guidelines are now available. All students in grades 6-12 are required to participate. Project proposals are due by October 20th. Please review the guidelines carefully.',
                    'announcement_type' => 'academic',
                    'priority' => 'normal',
                    'target_audience' => 'students',
                    'is_pinned' => 0,
                    'created_by' => 1
                ],
                [
                    'title' => 'Staff Meeting - Friday 3:00 PM',
                    'content' => 'All teaching staff are required to attend the staff meeting this Friday at 3:00 PM in the conference room. Agenda includes curriculum updates and upcoming events planning.',
                    'announcement_type' => 'general',
                    'priority' => 'normal',
                    'target_audience' => 'teachers',
                    'is_pinned' => 0,
                    'created_by' => 1
                ],
                [
                    'title' => 'Cafeteria Menu Update',
                    'content' => 'Starting next week, the cafeteria will offer new healthy meal options including vegetarian and gluten-free choices. The updated menu is available on the school website.',
                    'announcement_type' => 'general',
                    'priority' => 'low',
                    'target_audience' => 'all',
                    'is_pinned' => 0,
                    'created_by' => 1
                ]
            ];

            // Insert announcements
            foreach ($announcements as $announcement) {
                $this->announcementModel->create($announcement);
            }

            echo "Announcements seeded successfully!\n";
            echo "Total announcements created: " . count($announcements) . "\n";

        } catch (Exception $e) {
            echo "Error seeding announcements: " . $e->getMessage() . "\n";
        }
    }
}

// This seeder is designed to be run through the main Seeder class
// Example usage: $seeder = new AnnouncementSeeder($pdo); $seeder->run();
?>
