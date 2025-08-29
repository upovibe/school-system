<?php
// api/database/seeders/AnnouncementSeeder.php - Seeder for announcements table

class AnnouncementSeeder {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function run() {
        try {
            echo "Seeding announcements table...\n";
            
            // Check if users exist, if not create a default admin user
            $adminUserId = $this->ensureAdminUserExists();
            
            // Sample announcements data
            $announcements = [
                [
                    'title' => 'Welcome Back to School!',
                    'content' => 'Welcome back students! We hope you had a wonderful break. The new academic year begins with exciting opportunities for learning and growth. Please ensure you have all your required materials and are ready for an amazing year ahead.',
                    'announcement_type' => 'general',
                    'priority' => 'high',
                    'target_audience' => 'students',
                    'is_pinned' => 1,
                    'created_by' => $adminUserId
                ],
                [
                    'title' => 'Parent-Teacher Conference Schedule',
                    'content' => 'Parent-Teacher conferences will be held on Friday, October 15th, from 2:00 PM to 6:00 PM. Please schedule your appointment through the school portal. This is a great opportunity to discuss your child\'s progress.',
                    'announcement_type' => 'academic',
                    'priority' => 'normal',
                    'target_audience' => 'all',
                    'is_pinned' => 0,
                    'created_by' => $adminUserId
                ],
                [
                    'title' => 'Sports Day Registration Open',
                    'content' => 'Sports Day registration is now open! Students can register for various athletic events including track, field, and team sports. Registration closes on October 10th. Contact your PE teacher for more details.',
                    'announcement_type' => 'event',
                    'priority' => 'normal',
                    'target_audience' => 'students',
                    'is_pinned' => 0,
                    'created_by' => $adminUserId
                ],
                [
                    'title' => 'Library Hours Extended',
                    'content' => 'The school library will now be open until 5:00 PM on weekdays to accommodate students who need extra study time. Evening study sessions are also available on Tuesdays and Thursdays.',
                    'announcement_type' => 'general',
                    'priority' => 'low',
                    'target_audience' => 'students',
                    'is_pinned' => 0,
                    'created_by' => $adminUserId
                ],
                [
                    'title' => 'Emergency Contact Update Required',
                    'content' => 'All parents are requested to update their emergency contact information in the school portal by the end of this week. This ensures we can reach you quickly in case of any emergency.',
                    'announcement_type' => 'reminder',
                    'priority' => 'high',
                    'target_audience' => 'all',
                    'is_pinned' => 1,
                    'created_by' => $adminUserId
                ],
                [
                    'title' => 'Science Fair Project Guidelines',
                    'content' => 'Science Fair project guidelines are now available. All students in grades 6-12 are required to participate. Project proposals are due by October 20th. Please review the guidelines carefully.',
                    'announcement_type' => 'academic',
                    'priority' => 'normal',
                    'target_audience' => 'students',
                    'is_pinned' => 0,
                    'created_by' => $adminUserId
                ],
                [
                    'title' => 'Staff Meeting - Friday 3:00 PM',
                    'content' => 'All teaching staff are required to attend the staff meeting this Friday at 3:00 PM in the conference room. Agenda includes curriculum updates and upcoming events planning.',
                    'announcement_type' => 'general',
                    'priority' => 'normal',
                    'target_audience' => 'teachers',
                    'is_pinned' => 0,
                    'created_by' => $adminUserId
                ],
                [
                    'title' => 'Cafeteria Menu Update',
                    'content' => 'Starting next week, the cafeteria will offer new healthy meal options including vegetarian and gluten-free choices. The updated menu is available on the school website.',
                    'announcement_type' => 'general',
                    'priority' => 'low',
                    'target_audience' => 'all',
                    'is_pinned' => 0,
                    'created_by' => $adminUserId
                ],
                [
                    'title' => 'Financial Report Due - Cashiers',
                    'content' => 'All cashiers are reminded that monthly financial reports are due by the 5th of each month. Please ensure all transactions are properly recorded and reconciled.',
                    'announcement_type' => 'reminder',
                    'priority' => 'normal',
                    'target_audience' => 'cashier',
                    'is_pinned' => 0,
                    'created_by' => $adminUserId
                ],
                [
                    'title' => 'System Maintenance Notice',
                    'content' => 'Scheduled system maintenance will occur this weekend from 2:00 AM to 6:00 AM. During this time, the school portal may be temporarily unavailable. We apologize for any inconvenience.',
                    'announcement_type' => 'general',
                    'priority' => 'normal',
                    'target_audience' => 'admin',
                    'is_pinned' => 1,
                    'created_by' => $adminUserId
                ],
                [
                    'title' => 'Fee Payment Deadline Extended',
                    'content' => 'The deadline for first term fee payments has been extended to October 30th. Please ensure all payments are made through the cashier\'s office or online portal. Late payments will incur additional charges.',
                    'announcement_type' => 'financial',
                    'priority' => 'high',
                    'target_audience' => 'all',
                    'is_pinned' => 1,
                    'created_by' => $adminUserId
                ],
                [
                    'title' => 'New Payment Methods Available',
                    'content' => 'We now accept mobile money payments (MTN, Vodafone, AirtelTigo) for all school fees and charges. This provides a convenient way for parents to make payments without visiting the cashier\'s office.',
                    'announcement_type' => 'payment',
                    'priority' => 'normal',
                    'target_audience' => 'cashier',
                    'is_pinned' => 0,
                    'created_by' => $adminUserId
                ],
                [
                    'title' => 'Billing System Update',
                    'content' => 'The school billing system will be updated this weekend. All cashiers should complete their daily reconciliations by Friday evening. The new system will provide better reporting and tracking capabilities.',
                    'announcement_type' => 'billing',
                    'priority' => 'normal',
                    'target_audience' => 'cashier',
                    'is_pinned' => 0,
                    'created_by' => $adminUserId
                ],
                [
                    'title' => 'JHS 1 Class Meeting - Parents Only',
                    'content' => 'Important class meeting for JHS 1 parents on Friday, October 20th at 4:00 PM in the JHS 1 classroom. We will discuss academic progress, upcoming exams, and class activities. Attendance is mandatory.',
                    'announcement_type' => 'academic',
                    'priority' => 'high',
                    'target_audience' => 'specific_class',
                    'target_class_id' => 9,
                    'is_pinned' => 1,
                    'created_by' => $adminUserId
                ],
                [
                    'title' => 'JHS 1 Science Project Due Date',
                    'content' => 'JHS 1 students: Your science project presentations are scheduled for November 15th. Please ensure all projects are completed and ready for demonstration. Contact your science teacher for any questions.',
                    'announcement_type' => 'academic',
                    'priority' => 'normal',
                    'target_audience' => 'specific_class',
                    'target_class_id' => 9,
                    'is_pinned' => 0,
                    'created_by' => $adminUserId
                ],
                [
                    'title' => 'JHS 1 Field Trip to Science Museum',
                    'content' => 'JHS 1 students will have an educational field trip to the Science Museum on November 10th. Permission slips must be returned by October 25th. Cost: $5 per student. Contact your class teacher for details.',
                    'announcement_type' => 'event',
                    'priority' => 'normal',
                    'target_audience' => 'specific_class',
                    'target_class_id' => 9,
                    'is_pinned' => 0,
                    'created_by' => $adminUserId
                ],
                [
                    'title' => 'Fee Structure Update for 2024',
                    'content' => 'The school fee structure for the 2024 academic year has been updated. New rates will be effective from January 2024. Detailed breakdown is available at the cashier\'s office. Contact the administration for any clarifications.',
                    'announcement_type' => 'fee',
                    'priority' => 'high',
                    'target_audience' => 'all',
                    'is_pinned' => 1,
                    'created_by' => $adminUserId
                ]
            ];

            // Insert announcements using direct SQL
            $stmt = $this->pdo->prepare('
                INSERT INTO announcements (title, content, announcement_type, priority, target_audience, target_class_id, is_pinned, created_by, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ');

            foreach ($announcements as $announcement) {
                $stmt->execute([
                    $announcement['title'],
                    $announcement['content'],
                    $announcement['announcement_type'],
                    $announcement['priority'],
                    $announcement['target_audience'],
                    $announcement['target_class_id'] ?? null,
                    $announcement['is_pinned'],
                    $announcement['created_by']
                ]);
            }

            echo "Announcements seeded successfully!\n";
            echo "Total announcements created: " . count($announcements) . "\n";

        } catch (Exception $e) {
            echo "Error seeding announcements: " . $e->getMessage() . "\n";
        }
    }

    /**
     * Ensure an admin user exists, create one if needed
     */
    private function ensureAdminUserExists() {
        try {
            // First check if any users exist
            $stmt = $this->pdo->prepare('SELECT id FROM users LIMIT 1');
            $stmt->execute();
            $existingUser = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($existingUser) {
                // Users exist, return the first one
                return $existingUser['id'];
            }
            
            // No users exist, we need to create an admin user
            echo "No users found, creating default admin user...\n";
            
            // First check if admin role exists
            $stmt = $this->pdo->prepare('SELECT id FROM roles WHERE name = ?');
            $stmt->execute(['admin']);
            $adminRole = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$adminRole) {
                // Create admin role if it doesn't exist
                $stmt = $this->pdo->prepare('INSERT INTO roles (name, description) VALUES (?, ?)');
                $stmt->execute(['admin', 'System Administrator']);
                $adminRoleId = $this->pdo->lastInsertId();
            } else {
                $adminRoleId = $adminRole['id'];
            }
            
            // Create default admin user
            $stmt = $this->pdo->prepare('
                INSERT INTO users (name, email, phone, password, password_changed, role_id, status, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ');
            
            $stmt->execute([
                'System Administrator',
                'admin@school.com',
                '+1234567890',
                password_hash('admin123', PASSWORD_DEFAULT),
                true,
                $adminRoleId,
                'active'
            ]);
            
            $adminUserId = $this->pdo->lastInsertId();
            echo "Default admin user created with ID: $adminUserId\n";
            
            return $adminUserId;
            
        } catch (Exception $e) {
            echo "Error ensuring admin user exists: " . $e->getMessage() . "\n";
            throw $e;
        }
    }
}

// This seeder is designed to be run through the main Seeder class
// Example usage: $seeder = new AnnouncementSeeder($pdo); $seeder->run();
?>
