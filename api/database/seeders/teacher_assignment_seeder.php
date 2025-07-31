<?php
// api/database/seeders/teacher_assignment_seeder.php - Seeder for teacher assignments

class TeacherAssignmentSeeder
{
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function run() {
        echo "🌱 Seeding teacher assignments...\n";
        
        $this->seedTeacherAssignments();
        
        echo "✅ Teacher assignments seeded successfully!\n";
    }
    
    private function seedTeacherAssignments() {
        echo "📝 Seeding teacher assignments to classes and subjects...\n";
        
        // Get all teachers
        $stmt = $this->pdo->prepare('SELECT id, employee_id, first_name, last_name, specialization FROM teachers WHERE status = "active"');
        $stmt->execute();
        $teachers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get all classes
        $stmt = $this->pdo->prepare('SELECT id, name, section FROM classes WHERE status = "active"');
        $stmt->execute();
        $classes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get all subjects
        $stmt = $this->pdo->prepare('SELECT id, code, name FROM subjects WHERE status = "active"');
        $stmt->execute();
        $subjects = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get all class-subject assignments
        $stmt = $this->pdo->prepare('SELECT class_id, subject_id FROM class_subjects');
        $stmt->execute();
        $classSubjects = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Teacher specialization mapping
        $teacherSpecializations = [
            'T001' => ['MATH_JHS'], // Sarah Johnson - Mathematics
            'T002' => ['SCI_JHS'],  // Michael Chen - Science
            'T003' => ['ENG_JHS'],  // Emily Rodriguez - English
            'T004' => ['ICT'],      // David Osei - ICT
            'T005' => ['SOC_JHS']   // Grace Mensah - Social Studies
        ];
        
        $assignments = [
            // JHS 1 Assignments
            [
                'class_name' => 'JHS 1',
                'section' => 'A',
                'subject_code' => 'MATH_JHS',
                'teacher_id' => 'T001'
            ],
            [
                'class_name' => 'JHS 1',
                'section' => 'A',
                'subject_code' => 'SCI_JHS',
                'teacher_id' => 'T002'
            ],
            [
                'class_name' => 'JHS 1',
                'section' => 'A',
                'subject_code' => 'ENG_JHS',
                'teacher_id' => 'T003'
            ],
            [
                'class_name' => 'JHS 1',
                'section' => 'A',
                'subject_code' => 'ICT',
                'teacher_id' => 'T004'
            ],
            [
                'class_name' => 'JHS 1',
                'section' => 'A',
                'subject_code' => 'SOC_JHS',
                'teacher_id' => 'T005'
            ],
            
            // JHS 1 Section B Assignments
            [
                'class_name' => 'JHS 1',
                'section' => 'B',
                'subject_code' => 'MATH_JHS',
                'teacher_id' => 'T001'
            ],
            [
                'class_name' => 'JHS 1',
                'section' => 'B',
                'subject_code' => 'SCI_JHS',
                'teacher_id' => 'T002'
            ],
            [
                'class_name' => 'JHS 1',
                'section' => 'B',
                'subject_code' => 'ENG_JHS',
                'teacher_id' => 'T003'
            ],
            [
                'class_name' => 'JHS 1',
                'section' => 'B',
                'subject_code' => 'ICT',
                'teacher_id' => 'T004'
            ],
            [
                'class_name' => 'JHS 1',
                'section' => 'B',
                'subject_code' => 'SOC_JHS',
                'teacher_id' => 'T005'
            ],
            
            // JHS 2 Assignments
            [
                'class_name' => 'JHS 2',
                'section' => 'A',
                'subject_code' => 'MATH_JHS',
                'teacher_id' => 'T001'
            ],
            [
                'class_name' => 'JHS 2',
                'section' => 'A',
                'subject_code' => 'SCI_JHS',
                'teacher_id' => 'T002'
            ],
            [
                'class_name' => 'JHS 2',
                'section' => 'A',
                'subject_code' => 'ENG_JHS',
                'teacher_id' => 'T003'
            ],
            [
                'class_name' => 'JHS 2',
                'section' => 'A',
                'subject_code' => 'ICT',
                'teacher_id' => 'T004'
            ],
            [
                'class_name' => 'JHS 2',
                'section' => 'A',
                'subject_code' => 'SOC_JHS',
                'teacher_id' => 'T005'
            ],
            
            // JHS 2 Section B Assignments
            [
                'class_name' => 'JHS 2',
                'section' => 'B',
                'subject_code' => 'MATH_JHS',
                'teacher_id' => 'T001'
            ],
            [
                'class_name' => 'JHS 2',
                'section' => 'B',
                'subject_code' => 'SCI_JHS',
                'teacher_id' => 'T002'
            ],
            [
                'class_name' => 'JHS 2',
                'section' => 'B',
                'subject_code' => 'ENG_JHS',
                'teacher_id' => 'T003'
            ],
            [
                'class_name' => 'JHS 2',
                'section' => 'B',
                'subject_code' => 'ICT',
                'teacher_id' => 'T004'
            ],
            [
                'class_name' => 'JHS 2',
                'section' => 'B',
                'subject_code' => 'SOC_JHS',
                'teacher_id' => 'T005'
            ],
            
            // JHS 3 Assignments
            [
                'class_name' => 'JHS 3',
                'section' => 'A',
                'subject_code' => 'MATH_JHS',
                'teacher_id' => 'T001'
            ],
            [
                'class_name' => 'JHS 3',
                'section' => 'A',
                'subject_code' => 'SCI_JHS',
                'teacher_id' => 'T002'
            ],
            [
                'class_name' => 'JHS 3',
                'section' => 'A',
                'subject_code' => 'ENG_JHS',
                'teacher_id' => 'T003'
            ],
            [
                'class_name' => 'JHS 3',
                'section' => 'A',
                'subject_code' => 'ICT',
                'teacher_id' => 'T004'
            ],
            [
                'class_name' => 'JHS 3',
                'section' => 'A',
                'subject_code' => 'SOC_JHS',
                'teacher_id' => 'T005'
            ],
            
            // JHS 3 Section B Assignments
            [
                'class_name' => 'JHS 3',
                'section' => 'B',
                'subject_code' => 'MATH_JHS',
                'teacher_id' => 'T001'
            ],
            [
                'class_name' => 'JHS 3',
                'section' => 'B',
                'subject_code' => 'SCI_JHS',
                'teacher_id' => 'T002'
            ],
            [
                'class_name' => 'JHS 3',
                'section' => 'B',
                'subject_code' => 'ENG_JHS',
                'teacher_id' => 'T003'
            ],
            [
                'class_name' => 'JHS 3',
                'section' => 'B',
                'subject_code' => 'ICT',
                'teacher_id' => 'T004'
            ],
            [
                'class_name' => 'JHS 3',
                'section' => 'B',
                'subject_code' => 'SOC_JHS',
                'teacher_id' => 'T005'
            ]
        ];
        
        $totalAssignments = 0;
        
        foreach ($assignments as $assignment) {
            $this->assignTeacherToClassSubject($assignment, $classes, $subjects, $teachers);
            $totalAssignments++;
        }
        
        echo "📊 Total teacher assignments: {$totalAssignments}\n";
    }
    
    private function assignTeacherToClassSubject($assignment, $classes, $subjects, $teachers) {
        $className = $assignment['class_name'];
        $section = $assignment['section'];
        $subjectCode = $assignment['subject_code'];
        $teacherId = $assignment['teacher_id'];
        
        // Find class
        $classId = null;
        foreach ($classes as $class) {
            if ($class['name'] === $className && $class['section'] === $section) {
                $classId = $class['id'];
                break;
            }
        }
        
        // Find subject
        $subjectId = null;
        foreach ($subjects as $subject) {
            if ($subject['code'] === $subjectCode) {
                $subjectId = $subject['id'];
                break;
            }
        }
        
        // Find teacher
        $teacherDbId = null;
        foreach ($teachers as $teacher) {
            if ($teacher['employee_id'] === $teacherId) {
                $teacherDbId = $teacher['id'];
                break;
            }
        }
        
        if (!$classId) {
            echo "⚠️  Class '{$className}' Section '{$section}' not found\n";
            return;
        }
        
        if (!$subjectId) {
            echo "⚠️  Subject with code '{$subjectCode}' not found\n";
            return;
        }
        
        if (!$teacherDbId) {
            echo "⚠️  Teacher with ID '{$teacherId}' not found\n";
            return;
        }
        
        // Check if assignment already exists
        $stmt = $this->pdo->prepare('SELECT id FROM teacher_assignments WHERE class_id = ? AND subject_id = ? AND teacher_id = ?');
        $stmt->execute([$classId, $subjectId, $teacherDbId]);
        $existingAssignment = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existingAssignment) {
            echo "⚠️  Teacher assignment already exists for {$className} Section {$section} - {$subjectCode}\n";
            return;
        }
        
        // Insert teacher assignment
        $stmt = $this->pdo->prepare('
            INSERT INTO teacher_assignments (class_id, subject_id, teacher_id, created_at, updated_at) 
            VALUES (?, ?, ?, NOW(), NOW())
        ');
        
        $stmt->execute([$classId, $subjectId, $teacherDbId]);
        
        echo "✅ Assigned teacher {$teacherId} to {$className} Section {$section} - {$subjectCode}\n";
    }
}
?> 