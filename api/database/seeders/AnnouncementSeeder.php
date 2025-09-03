<?php
// api/database/seeders/AnnouncementSeeder.php - Seeder for announcements table

class announcementSeeder {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function run() {
        try {
            echo "Seeding announcements table...\n";
            
            // Check if users exist, if not create a default admin user
            $adminUserId = $this->ensureAdminUserExists();
            
            // Sample announcements data - Focused on JHS 1-3 class teachers only
            $announcements = [
                // General school announcements
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
                
                // JHS 1 Class Teacher Announcements (Ama Serwaa - T250811011)
                [
                    'title' => 'JHS 1 Class Meeting - Parents Only',
                    'content' => 'Important class meeting for JHS 1 parents on Friday, October 20th at 4:00 PM in the JHS 1 classroom. We will discuss academic progress, upcoming exams, and class activities. Attendance is mandatory.',
                    'announcement_type' => 'academic',
                    'priority' => 'high',
                    'target_audience' => 'specific_class',
                    'target_class_id' => $this->getJHS1ClassId(),
                    'is_pinned' => 1,
                    'created_by' => $this->getTeacherUserId('akua.gyasi@school.com')
                ],
                [
                    'title' => 'JHS 1 Mathematics Test Schedule',
                    'content' => 'Dear JHS 1 students, your Mathematics test has been scheduled for Friday, October 25th at 10:00 AM. Please bring your calculators and ensure you have completed all practice problems from Chapter 3. Good luck!',
                    'announcement_type' => 'academic',
                    'priority' => 'high',
                    'target_audience' => 'specific_class',
                    'target_class_id' => $this->getJHS1ClassId(),
                    'is_pinned' => 1,
                    'created_by' => $this->getTeacherUserId('akua.gyasi@school.com')
                ],
                [
                    'title' => 'Homework Reminder - JHS 1',
                    'content' => 'JHS 1 students: Please remember to complete your Mathematics homework (pages 45-48) and Science project proposal by tomorrow. Late submissions will not be accepted. Contact me if you have any questions.',
                    'announcement_type' => 'reminder',
                    'priority' => 'normal',
                    'target_audience' => 'specific_class',
                    'target_class_id' => $this->getJHS1ClassId(),
                    'is_pinned' => 0,
                    'created_by' => $this->getTeacherUserId('akua.gyasi@school.com')
                ],
                
                // JHS 2 Class Teacher Announcements (Kwaku Mensah - T250811012)
                [
                    'title' => 'JHS 2 Parent Meeting - Progress Review',
                    'content' => 'Important: JHS 2 parents meeting scheduled for Tuesday, October 22nd at 4:00 PM. We will review your child\'s academic progress and discuss strategies for improvement. Your attendance is crucial.',
                    'announcement_type' => 'academic',
                    'priority' => 'high',
                    'target_audience' => 'specific_class',
                    'target_class_id' => $this->getJHS2ClassId(),
                    'is_pinned' => 1,
                    'created_by' => $this->getTeacherUserId('kojo.hammond@school.com')
                ],
                [
                    'title' => 'JHS 2 Science Project Due Date',
                    'content' => 'JHS 2 students: Your science project presentations are scheduled for November 15th. Please ensure all projects are completed and ready for demonstration. Contact your science teacher for any questions.',
                    'announcement_type' => 'academic',
                    'priority' => 'normal',
                    'target_audience' => 'specific_class',
                    'target_class_id' => $this->getJHS2ClassId(),
                    'is_pinned' => 0,
                    'created_by' => $this->getTeacherUserId('kojo.hammond@school.com')
                ],
                
                // JHS 3 Class Teacher Announcements (Aba Johnson - T250811013)
                [
                    'title' => 'JHS 3 Final Exam Preparation',
                    'content' => 'JHS 3 students: Your final exams are approaching. Please ensure you are attending all revision classes and completing your study guides. Contact me if you need any additional support.',
                    'announcement_type' => 'academic',
                    'priority' => 'high',
                    'target_audience' => 'specific_class',
                    'target_class_id' => $this->getJHS3ClassId(),
                    'is_pinned' => 1,
                    'created_by' => $this->getTeacherUserId('aba.johnson@school.com')
                ],
                [
                    'title' => 'JHS 3 Field Trip to Science Museum',
                    'content' => 'JHS 3 students will have an educational field trip to the Science Museum on November 10th. Permission slips must be returned by October 25th. Cost: $5 per student. Contact your class teacher for details.',
                    'announcement_type' => 'event',
                    'priority' => 'normal',
                    'target_audience' => 'specific_class',
                    'target_class_id' => $this->getJHS3ClassId(),
                    'is_pinned' => 0,
                    'created_by' => $this->getTeacherUserId('aba.johnson@school.com')
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
    
    /**
     * Get teacher user ID by email
     */
    private function getTeacherUserId($email) {
        try {
            $stmt = $this->pdo->prepare('SELECT id FROM users WHERE email = ?');
            $stmt->execute([$email]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($user) {
                return $user['id'];
            }
            
            // If teacher user doesn't exist, return admin user ID as fallback
            echo "⚠️  Teacher user with email '{$email}' not found, using admin user as fallback\n";
            return $this->ensureAdminUserExists();
            
        } catch (Exception $e) {
            echo "Error getting teacher user ID: " . $e->getMessage() . "\n";
            // Return admin user ID as fallback
            return $this->ensureAdminUserExists();
        }
    }
    
    /**
     * Get JHS 1 class ID dynamically
     */
    private function getJHS1ClassId() {
        try {
            $stmt = $this->pdo->prepare('SELECT id FROM classes WHERE name LIKE ? LIMIT 1');
            $stmt->execute(['%JHS 1%']);
            $class = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($class) {
                return $class['id'];
            }
            
            // If JHS 1 class doesn't exist, return null (will be filtered out)
            echo "⚠️  JHS 1 class not found, announcements will be created without class reference\n";
            return null;
            
        } catch (Exception $e) {
            echo "Error getting JHS 1 class ID: " . $e->getMessage() . "\n";
            return null;
        }
    }
    
    /**
     * Get JHS 2 class ID dynamically
     */
    private function getJHS2ClassId() {
        try {
            $stmt = $this->pdo->prepare('SELECT id FROM classes WHERE name LIKE ? LIMIT 1');
            $stmt->execute(['%JHS 2%']);
            $class = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($class) {
                return $class['id'];
            }
            
            // If JHS 2 class doesn't exist, return null (will be filtered out)
            echo "⚠️  JHS 2 class not found, announcements will be created without class reference\n";
            return null;
            
        } catch (Exception $e) {
            echo "Error getting JHS 2 class ID: " . $e->getMessage() . "\n";
            return null;
        }
    }
    
    /**
     * Get JHS 3 class ID dynamically
     */
    private function getJHS3ClassId() {
        try {
            $stmt = $this->pdo->prepare('SELECT id FROM classes WHERE name LIKE ? LIMIT 1');
            $stmt->execute(['%JHS 3%']);
            $class = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($class) {
                return $class['id'];
            }
            
            // If JHS 3 class doesn't exist, return null (will be filtered out)
            echo "⚠️  JHS 3 class not found, announcements will be created without class reference\n";
            return null;
            
        } catch (Exception $e) {
            echo "Error getting JHS 3 class ID: " . $e->getMessage() . "\n";
            return null;
        }
    }
}

// This seeder is designed to be run through the main Seeder class
// Example usage: $seeder = new AnnouncementSeeder($pdo); $seeder->run();
?>
