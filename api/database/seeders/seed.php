<?php
// api/database/seeders/seed.php - Main seed file (Express/Node.js style)

class Seed {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function run() {
        echo "🌱 Starting database seeding...\n\n";
        
        $this->seedRoles();
        $this->seedUsers();
        $this->seedPagesAndSettings();
        $this->seedEvents();
        $this->seedNews();
        $this->seedGalleries();
        $this->seedTeams();
        $this->seedAcademicYears();
        $this->seedSubjects();
        $this->seedTeachers();
        $this->seedStudents();
        $this->seedClasses();
        $this->seedClassSubjects();
        $this->seedTeacherAssignments();
        $this->seedClassAssignments();
        $this->seedStudentAssignments();
        $this->assignStudentsToClasses();
        $this->seedGradingSystem();
        $this->seedFeeSchedules();
        echo "\n✅ Database seeding completed!\n";
    }
    
    private function seedRoles() {
        echo "🔐 Seeding roles...\n";
        
        // Include the role seeder
        require_once __DIR__ . '/role_seeder.php';
        $roleSeeder = new RoleSeeder($this->pdo);
        $roleSeeder->run();
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
    
    private function seedTeams() {
        echo "👥 Seeding teams...\n";
        
        // Include the team seeder
        require_once __DIR__ . '/team_seeder.php';
        $teamSeeder = new TeamSeeder($this->pdo);
        $teamSeeder->run();
    }
    
    private function seedAcademicYears() {
        echo "📅 Seeding academic years...\n";
        
        // Include the academic year seeder
        require_once __DIR__ . '/academic_year_seeder.php';
        $academicYearSeeder = new AcademicYearSeeder($this->pdo);
        $academicYearSeeder->run();
    }
    
    private function seedSubjects() {
        echo "📚 Seeding subjects...\n";
        
        // Include the subject seeder
        require_once __DIR__ . '/subject_seeder.php';
        $subjectSeeder = new SubjectSeeder($this->pdo);
        $subjectSeeder->run();
    }
    
    private function seedTeachers() {
        echo "👨‍🏫 Seeding teachers...\n";
        
        // Include the teacher seeder
        require_once __DIR__ . '/teacher_seeder.php';
        $teacherSeeder = new TeacherSeeder($this->pdo);
        $teacherSeeder->run();
    }
    
    private function seedStudents() {
        echo "👨‍🎓 Seeding students...\n";
        
        // Include the student seeder
        require_once __DIR__ . '/student_seeder.php';
        $studentSeeder = new StudentSeeder($this->pdo);
        $studentSeeder->run();
    }
    
    private function seedClasses() {
        echo "🏫 Seeding classes...\n";
        
        // Include the class seeder
        require_once __DIR__ . '/class_seeder.php';
        $classSeeder = new ClassSeeder($this->pdo);
        $classSeeder->run();
    }
    
    private function seedFeeSchedules() {
        echo "💰 Seeding fee schedules...\n";
        
        // Include the fee schedule seeder
        require_once __DIR__ . '/fee_schedule_seeder.php';
        $feeScheduleSeeder = new FeeScheduleSeeder($this->pdo);
        $feeScheduleSeeder->run();
    }
    
    private function seedClassSubjects() {
        echo "📖 Seeding class subjects...\n";
        
        // Include the class subject seeder
        require_once __DIR__ . '/class_subject_seeder.php';
        $classSubjectSeeder = new ClassSubjectSeeder($this->pdo);
        $classSubjectSeeder->run();
    }
    
    private function seedTeacherAssignments() {
        echo "👨‍🏫 Seeding teacher assignments...\n";
        
        // Include the teacher assignment seeder
        require_once __DIR__ . '/teacher_assignment_seeder.php';
        $teacherAssignmentSeeder = new TeacherAssignmentSeeder($this->pdo);
        $teacherAssignmentSeeder->run();
    }
    
    private function seedClassAssignments() {
        echo "📝 Seeding class assignments...\n";
        
        // Include the class assignment seeder
        require_once __DIR__ . '/class_assignment_seeder.php';
        $classAssignmentSeeder = new ClassAssignmentSeeder($this->pdo);
        $classAssignmentSeeder->run();
    }
    
    private function seedStudentAssignments() {
        echo "📝 Seeding student assignments...\n";
        
        // Include the student assignment seeder
        require_once __DIR__ . '/student_assignment_seeder.php';
        $studentAssignmentSeeder = new StudentAssignmentSeeder($this->pdo);
        $studentAssignmentSeeder->run();
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
    
    private function seedGradingSystem() {
        echo "📊 Seeding grading system...\n";
        
        // Include the grading period seeder
        require_once __DIR__ . '/grading_period_seeder.php';
        $gradingPeriodSeeder = new GradingPeriodSeeder($this->pdo);
        $gradingPeriodSeeder->run();
        
        // Include the grading policy seeder
        require_once __DIR__ . '/grading_policy_seeder.php';
        $gradingPolicySeeder = new GradingPolicySeeder($this->pdo);
        $gradingPolicySeeder->run();
        
        // Include the student grade seeder
        require_once __DIR__ . '/student_grade_seeder.php';
        $studentGradeSeeder = new StudentGradeSeeder($this->pdo);
        $studentGradeSeeder->run();
    }
    
}
?> 