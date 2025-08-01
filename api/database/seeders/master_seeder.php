<?php
// api/database/seeders/master_seeder.php - Master seeder for the school system

class MasterSeeder
{
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function run() {
        echo "🚀 Starting master seeder for school system...\n\n";
        
        // Run seeders in order
        $this->runSubjectSeeder();
        $this->runUserSeeder();
        $this->runTeacherSeeder();
        $this->runStudentSeeder();
        $this->runClassSeeder();
        $this->runClassSubjectSeeder();
        $this->runTeacherAssignmentSeeder();
        $this->runClassAssignmentSeeder();
        
        // Assign students to classes
        $this->assignStudentsToClasses();
        
        echo "\n🎉 Master seeder completed successfully!\n";
        echo "📊 Summary:\n";
        echo "- Subjects with categories\n";
        echo "- Users (Admin, Teachers, Students, Parents, Staff)\n";
        echo "- Teachers with specializations\n";
        echo "- Students with complete profiles\n";
        echo "- Classes for different grade levels\n";
        echo "- Class-subject assignments\n";
        echo "- Teacher-subject-class assignments\n";
        echo "- Student-class assignments\n";
        echo "- Class assignments with student submissions\n";
    }
    
    private function runSubjectSeeder() {
        echo "📚 Running subject seeder...\n";
        require_once __DIR__ . '/subject_seeder.php';
        $seeder = new SubjectSeeder($this->pdo);
        $seeder->run();
        echo "\n";
    }
    
    private function runUserSeeder() {
        echo "👥 Running user seeder...\n";
        require_once __DIR__ . '/user_seeder.php';
        $seeder = new UserSeeder($this->pdo);
        $seeder->run();
        echo "\n";
    }
    
    private function runTeacherSeeder() {
        echo "👨‍🏫 Running teacher seeder...\n";
        require_once __DIR__ . '/teacher_seeder.php';
        $seeder = new TeacherSeeder($this->pdo);
        $seeder->run();
        echo "\n";
    }
    
    private function runStudentSeeder() {
        echo "👨‍🎓 Running student seeder...\n";
        require_once __DIR__ . '/student_seeder.php';
        $seeder = new StudentSeeder($this->pdo);
        $seeder->run();
        echo "\n";
    }
    
    private function runClassSeeder() {
        echo "🏫 Running class seeder...\n";
        require_once __DIR__ . '/class_seeder.php';
        $seeder = new ClassSeeder($this->pdo);
        $seeder->run();
        echo "\n";
    }
    
    private function runClassSubjectSeeder() {
        echo "📖 Running class subject seeder...\n";
        require_once __DIR__ . '/class_subject_seeder.php';
        $seeder = new ClassSubjectSeeder($this->pdo);
        $seeder->run();
        echo "\n";
    }
    
    private function runTeacherAssignmentSeeder() {
        echo "👨‍🏫 Running teacher assignment seeder...\n";
        require_once __DIR__ . '/teacher_assignment_seeder.php';
        $seeder = new TeacherAssignmentSeeder($this->pdo);
        $seeder->run();
        echo "\n";
    }
    
    private function runClassAssignmentSeeder() {
        echo "📝 Running class assignment seeder...\n";
        require_once __DIR__ . '/class_assignment_seeder.php';
        $seeder = new ClassAssignmentSeeder($this->pdo);
        $seeder->run();
        echo "\n";
    }
    
    private function assignStudentsToClasses() {
        echo "👨‍🎓 Assigning students to classes...\n";
        
        // Get all students
        $stmt = $this->pdo->prepare('SELECT id, student_id, first_name, last_name FROM students WHERE status = "active"');
        $stmt->execute();
        $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get JHS 1 classes
        $stmt = $this->pdo->prepare('SELECT id, name, section FROM classes WHERE name = "JHS 1" AND status = "active"');
        $stmt->execute();
        $classes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (empty($classes)) {
            echo "⚠️  No JHS 1 classes found for student assignment\n";
            return;
        }
        
        $classIndex = 0;
        foreach ($students as $student) {
            $class = $classes[$classIndex % count($classes)];
            
            // Update student's current class
            $stmt = $this->pdo->prepare('UPDATE students SET current_class_id = ? WHERE id = ?');
            $stmt->execute([$class['id'], $student['id']]);
            
            echo "✅ Assigned {$student['first_name']} {$student['last_name']} ({$student['student_id']}) to {$class['name']} Section {$class['section']}\n";
            
            $classIndex++;
        }
        
        echo "📊 Total students assigned to classes: " . count($students) . "\n";
    }
}
?> 