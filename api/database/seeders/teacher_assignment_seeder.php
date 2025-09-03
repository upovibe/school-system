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
        
        // Teacher assignment structure
        $assignments = [
            // KG 1 Assignments - Class Teacher (T250811001) teaches core subjects only
            [
                'class_name' => 'KG 1',
                'section' => 'A',
                'subject_code' => 'NUMERACY',
                'teacher_id' => 'T250811001'
            ],
            [
                'class_name' => 'KG 1',
                'section' => 'A',
                'subject_code' => 'ENV_STUDIES',
                'teacher_id' => 'T250811001'
            ],
            [
                'class_name' => 'KG 1',
                'section' => 'A',
                'subject_code' => 'CREATIVE_ARTS',
                'teacher_id' => 'T250811001'
            ],
            [
                'class_name' => 'KG 1',
                'section' => 'A',
                'subject_code' => 'PHYS_DEV',
                'teacher_id' => 'T250811001'
            ],
            [
                'class_name' => 'KG 1',
                'section' => 'A',
                'subject_code' => 'RME',
                'teacher_id' => 'T250811001'
            ],
            [
                'class_name' => 'KG 1',
                'section' => 'A',
                'subject_code' => 'ICT',
                'teacher_id' => 'T250811001'
            ],
            
            // KG 2 Assignments - Class Teacher (T250811003) teaches core subjects only
            [
                'class_name' => 'KG 2',
                'section' => 'A',
                'subject_code' => 'NUMERACY',
                'teacher_id' => 'T250811003'
            ],
            [
                'class_name' => 'KG 2',
                'section' => 'A',
                'subject_code' => 'ENV_STUDIES',
                'teacher_id' => 'T250811003'
            ],
            [
                'class_name' => 'KG 2',
                'section' => 'A',
                'subject_code' => 'CREATIVE_ARTS',
                'teacher_id' => 'T250811003'
            ],
            [
                'class_name' => 'KG 2',
                'section' => 'A',
                'subject_code' => 'PHYS_DEV',
                'teacher_id' => 'T250811003'
            ],
            [
                'class_name' => 'KG 2',
                'section' => 'A',
                'subject_code' => 'RME',
                'teacher_id' => 'T250811003'
            ],
            [
                'class_name' => 'KG 2',
                'section' => 'A',
                'subject_code' => 'ICT',
                'teacher_id' => 'T250811003'
            ],
            
            // P 1 Assignments - Class Teacher (T250811005) teaches core subjects only
            [
                'class_name' => 'P 1',
                'section' => 'A',
                'subject_code' => 'MATH',
                'teacher_id' => 'T250811005'
            ],
            [
                'class_name' => 'P 1',
                'section' => 'A',
                'subject_code' => 'OWOP',
                'teacher_id' => 'T250811005'
            ],
            [
                'class_name' => 'P 1',
                'section' => 'A',
                'subject_code' => 'RME',
                'teacher_id' => 'T250811005'
            ],
            [
                'class_name' => 'P 1',
                'section' => 'A',
                'subject_code' => 'CREATIVE_ARTS',
                'teacher_id' => 'T250811005'
            ],
            [
                'class_name' => 'P 1',
                'section' => 'A',
                'subject_code' => 'PE',
                'teacher_id' => 'T250811005'
            ],
            [
                'class_name' => 'P 1',
                'section' => 'A',
                'subject_code' => 'COMPUTING',
                'teacher_id' => 'T250811005'
            ],
            
            // P 2 Assignments - Class Teacher (T250811006) teaches core subjects only
            [
                'class_name' => 'P 2',
                'section' => 'A',
                'subject_code' => 'MATH',
                'teacher_id' => 'T250811006'
            ],
            [
                'class_name' => 'P 2',
                'section' => 'A',
                'subject_code' => 'OWOP',
                'teacher_id' => 'T250811006'
            ],
            [
                'class_name' => 'P 2',
                'section' => 'A',
                'subject_code' => 'RME',
                'teacher_id' => 'T250811006'
            ],
            [
                'class_name' => 'P 2',
                'section' => 'A',
                'subject_code' => 'CREATIVE_ARTS',
                'teacher_id' => 'T250811006'
            ],
            [
                'class_name' => 'P 2',
                'section' => 'A',
                'subject_code' => 'PE',
                'teacher_id' => 'T250811006'
            ],
            [
                'class_name' => 'P 2',
                'section' => 'A',
                'subject_code' => 'COMPUTING',
                'teacher_id' => 'T250811006'
            ],
            
            // P 3 Assignments - Class Teacher (T250811007) teaches core subjects only
            [
                'class_name' => 'P 3',
                'section' => 'A',
                'subject_code' => 'MATH',
                'teacher_id' => 'T250811007'
            ],
            [
                'class_name' => 'P 3',
                'section' => 'A',
                'subject_code' => 'OWOP',
                'teacher_id' => 'T250811007'
            ],
            [
                'class_name' => 'P 3',
                'section' => 'A',
                'subject_code' => 'RME',
                'teacher_id' => 'T250811007'
            ],
            [
                'class_name' => 'P 3',
                'section' => 'A',
                'subject_code' => 'CREATIVE_ARTS',
                'teacher_id' => 'T250811007'
            ],
            [
                'class_name' => 'P 3',
                'section' => 'A',
                'subject_code' => 'PE',
                'teacher_id' => 'T250811007'
            ],
            [
                'class_name' => 'P 3',
                'section' => 'A',
                'subject_code' => 'COMPUTING',
                'teacher_id' => 'T250811007'
            ],
            
            // P 4 Assignments - Class Teacher (T250811008) teaches all subjects except French and Ghanaian Language
            [
                'class_name' => 'P 4',
                'section' => 'A',
                'subject_code' => 'ENG',
                'teacher_id' => 'T250811008'
            ],
            [
                'class_name' => 'P 4',
                'section' => 'A',
                'subject_code' => 'MATH',
                'teacher_id' => 'T250811008'
            ],
            [
                'class_name' => 'P 4',
                'section' => 'A',
                'subject_code' => 'SCIENCE',
                'teacher_id' => 'T250811008'
            ],
            [
                'class_name' => 'P 4',
                'section' => 'A',
                'subject_code' => 'OWOP',
                'teacher_id' => 'T250811008'
            ],
            [
                'class_name' => 'P 4',
                'section' => 'A',
                'subject_code' => 'RME',
                'teacher_id' => 'T250811008'
            ],
            [
                'class_name' => 'P 4',
                'section' => 'A',
                'subject_code' => 'CREATIVE_ARTS',
                'teacher_id' => 'T250811008'
            ],
            [
                'class_name' => 'P 4',
                'section' => 'A',
                'subject_code' => 'PE',
                'teacher_id' => 'T250811008'
            ],
            [
                'class_name' => 'P 4',
                'section' => 'A',
                'subject_code' => 'COMPUTING',
                'teacher_id' => 'T250811008'
            ],
            
            // P 5 Assignments - Class Teacher (T250811009) teaches all subjects except French and Ghanaian Language
            [
                'class_name' => 'P 5',
                'section' => 'A',
                'subject_code' => 'ENG',
                'teacher_id' => 'T250811009'
            ],
            [
                'class_name' => 'P 5',
                'section' => 'A',
                'subject_code' => 'MATH',
                'teacher_id' => 'T250811009'
            ],
            [
                'class_name' => 'P 5',
                'section' => 'A',
                'subject_code' => 'SCIENCE',
                'teacher_id' => 'T250811009'
            ],
            [
                'class_name' => 'P 5',
                'section' => 'A',
                'subject_code' => 'OWOP',
                'teacher_id' => 'T250811009'
            ],
            [
                'class_name' => 'P 5',
                'section' => 'A',
                'subject_code' => 'RME',
                'teacher_id' => 'T250811009'
            ],
            [
                'class_name' => 'P 5',
                'section' => 'A',
                'subject_code' => 'CREATIVE_ARTS',
                'teacher_id' => 'T250811009'
            ],
            [
                'class_name' => 'P 5',
                'section' => 'A',
                'subject_code' => 'PE',
                'teacher_id' => 'T250811009'
            ],
            [
                'class_name' => 'P 5',
                'section' => 'A',
                'subject_code' => 'COMPUTING',
                'teacher_id' => 'T250811009'
            ],
            
            // P 6 Assignments - Class Teacher (T250811010) teaches all subjects except French and Ghanaian Language
            [
                'class_name' => 'P 6',
                'section' => 'A',
                'subject_code' => 'ENG',
                'teacher_id' => 'T250811010'
            ],
            [
                'class_name' => 'P 6',
                'section' => 'A',
                'subject_code' => 'MATH',
                'teacher_id' => 'T250811010'
            ],
            [
                'class_name' => 'P 6',
                'section' => 'A',
                'subject_code' => 'SCIENCE',
                'teacher_id' => 'T250811010'
            ],
            [
                'class_name' => 'P 6',
                'section' => 'A',
                'subject_code' => 'OWOP',
                'teacher_id' => 'T250811010'
            ],
            [
                'class_name' => 'P 6',
                'section' => 'A',
                'subject_code' => 'RME',
                'teacher_id' => 'T250811010'
            ],
            [
                'class_name' => 'P 6',
                'section' => 'A',
                'subject_code' => 'CREATIVE_ARTS',
                'teacher_id' => 'T250811010'
            ],
            [
                'class_name' => 'P 6',
                'section' => 'A',
                'subject_code' => 'PE',
                'teacher_id' => 'T250811010'
            ],
            [
                'class_name' => 'P 6',
                'section' => 'A',
                'subject_code' => 'COMPUTING',
                'teacher_id' => 'T250811010'
            ],
            
            // JHS 1 Assignments - Class Teacher (T250811011) teaches all subjects except French and Ghanaian Language
            [
                'class_name' => 'JHS 1',
                'section' => 'A',
                'subject_code' => 'ENG',
                'teacher_id' => 'T250811011'
            ],
            [
                'class_name' => 'JHS 1',
                'section' => 'A',
                'subject_code' => 'MATH',
                'teacher_id' => 'T250811011'
            ],
            [
                'class_name' => 'JHS 1',
                'section' => 'A',
                'subject_code' => 'INTEGRATED_SCI',
                'teacher_id' => 'T250811011'
            ],
            [
                'class_name' => 'JHS 1',
                'section' => 'A',
                'subject_code' => 'SOC_STUDIES',
                'teacher_id' => 'T250811011'
            ],
            [
                'class_name' => 'JHS 1',
                'section' => 'A',
                'subject_code' => 'RME',
                'teacher_id' => 'T250811011'
            ],
            [
                'class_name' => 'JHS 1',
                'section' => 'A',
                'subject_code' => 'CAREER_TECH',
                'teacher_id' => 'T250811011'
            ],
            [
                'class_name' => 'JHS 1',
                'section' => 'A',
                'subject_code' => 'CREATIVE_ARTS',
                'teacher_id' => 'T250811011'
            ],
            [
                'class_name' => 'JHS 1',
                'section' => 'A',
                'subject_code' => 'COMPUTING',
                'teacher_id' => 'T250811011'
            ],
            [
                'class_name' => 'JHS 1',
                'section' => 'A',
                'subject_code' => 'PE',
                'teacher_id' => 'T250811011'
            ],
            
            // JHS 2 Assignments - Class Teacher (T250811012) teaches all subjects except French and Ghanaian Language
            [
                'class_name' => 'JHS 2',
                'section' => 'A',
                'subject_code' => 'ENG',
                'teacher_id' => 'T250811012'
            ],
            [
                'class_name' => 'JHS 2',
                'section' => 'A',
                'subject_code' => 'MATH',
                'teacher_id' => 'T250811012'
            ],
            [
                'class_name' => 'JHS 2',
                'section' => 'A',
                'subject_code' => 'INTEGRATED_SCI',
                'teacher_id' => 'T250811012'
            ],
            [
                'class_name' => 'JHS 2',
                'section' => 'A',
                'subject_code' => 'SOC_STUDIES',
                'teacher_id' => 'T250811012'
            ],
            [
                'class_name' => 'JHS 2',
                'section' => 'A',
                'subject_code' => 'RME',
                'teacher_id' => 'T250811012'
            ],
            [
                'class_name' => 'JHS 2',
                'section' => 'A',
                'subject_code' => 'CAREER_TECH',
                'teacher_id' => 'T250811012'
            ],
            [
                'class_name' => 'JHS 2',
                'section' => 'A',
                'subject_code' => 'CREATIVE_ARTS',
                'teacher_id' => 'T250811012'
            ],
            [
                'class_name' => 'JHS 2',
                'section' => 'A',
                'subject_code' => 'COMPUTING',
                'teacher_id' => 'T250811012'
            ],
            [
                'class_name' => 'JHS 2',
                'section' => 'A',
                'subject_code' => 'PE',
                'teacher_id' => 'T250811012'
            ],
            
            // JHS 3 Assignments - Class Teacher (T250811013) teaches all subjects except French and Ghanaian Language
            [
                'class_name' => 'JHS 3',
                'section' => 'A',
                'subject_code' => 'ENG',
                'teacher_id' => 'T250811013'
            ],
            [
                'class_name' => 'JHS 3',
                'section' => 'A',
                'subject_code' => 'MATH',
                'teacher_id' => 'T250811013'
            ],
            [
                'class_name' => 'JHS 3',
                'section' => 'A',
                'subject_code' => 'INTEGRATED_SCI',
                'teacher_id' => 'T250811013'
            ],
            [
                'class_name' => 'JHS 3',
                'section' => 'A',
                'subject_code' => 'SOC_STUDIES',
                'teacher_id' => 'T250811013'
            ],
            [
                'class_name' => 'JHS 3',
                'section' => 'A',
                'subject_code' => 'RME',
                'teacher_id' => 'T250811013'
            ],
            [
                'class_name' => 'JHS 3',
                'section' => 'A',
                'subject_code' => 'CAREER_TECH',
                'teacher_id' => 'T250811013'
            ],
            [
                'class_name' => 'JHS 3',
                'section' => 'A',
                'subject_code' => 'CREATIVE_ARTS',
                'teacher_id' => 'T250811013'
            ],
            [
                'class_name' => 'JHS 3',
                'section' => 'A',
                'subject_code' => 'COMPUTING',
                'teacher_id' => 'T250811013'
            ],
            [
                'class_name' => 'JHS 3',
                'section' => 'A',
                'subject_code' => 'PE',
                'teacher_id' => 'T250811013'
            ],
            
            // Language & Literacy Assignments for KG1-KG2 - T250811020 (Kwame Mensah) teaches English
            [
                'class_name' => 'KG 1',
                'section' => 'A',
                'subject_code' => 'LANG_LIT',
                'teacher_id' => 'T250811020'
            ],
            [
                'class_name' => 'KG 2',
                'section' => 'A',
                'subject_code' => 'LANG_LIT',
                'teacher_id' => 'T250811020'
            ],
            
            // English Language Assignments for P1-P3 - T250811020 (Kwame Mensah) teaches English
            [
                'class_name' => 'P 1',
                'section' => 'A',
                'subject_code' => 'ENG',
                'teacher_id' => 'T250811020'
            ],
            [
                'class_name' => 'P 2',
                'section' => 'A',
                'subject_code' => 'ENG',
                'teacher_id' => 'T250811020'
            ],
            [
                'class_name' => 'P 3',
                'section' => 'A',
                'subject_code' => 'ENG',
                'teacher_id' => 'T250811020'
            ],
            
            // French Language Assignments for KG1-P3 - T250811019 (Ama Osei) teaches French
            [
                'class_name' => 'KG 1',
                'section' => 'A',
                'subject_code' => 'FRENCH',
                'teacher_id' => 'T250811019'
            ],
            [
                'class_name' => 'KG 2',
                'section' => 'A',
                'subject_code' => 'FRENCH',
                'teacher_id' => 'T250811019'
            ],
            [
                'class_name' => 'P 1',
                'section' => 'A',
                'subject_code' => 'FRENCH',
                'teacher_id' => 'T250811019'
            ],
            [
                'class_name' => 'P 2',
                'section' => 'A',
                'subject_code' => 'FRENCH',
                'teacher_id' => 'T250811019'
            ],
            [
                'class_name' => 'P 3',
                'section' => 'A',
                'subject_code' => 'FRENCH',
                'teacher_id' => 'T250811019'
            ],
            
            // French Language Assignments for P4-JHS3 - T250811015 (Yaa Lartey) teaches French
            [
                'class_name' => 'P 4',
                'section' => 'A',
                'subject_code' => 'FRENCH',
                'teacher_id' => 'T250811015'
            ],
            [
                'class_name' => 'P 5',
                'section' => 'A',
                'subject_code' => 'FRENCH',
                'teacher_id' => 'T250811015'
            ],
            [
                'class_name' => 'P 6',
                'section' => 'A',
                'subject_code' => 'FRENCH',
                'teacher_id' => 'T250811015'
            ],
            [
                'class_name' => 'JHS 1',
                'section' => 'A',
                'subject_code' => 'FRENCH',
                'teacher_id' => 'T250811015'
            ],
            [
                'class_name' => 'JHS 2',
                'section' => 'A',
                'subject_code' => 'FRENCH',
                'teacher_id' => 'T250811015'
            ],
            [
                'class_name' => 'JHS 3',
                'section' => 'A',
                'subject_code' => 'FRENCH',
                'teacher_id' => 'T250811015'
            ],
            
            // Ghanaian Language (Twi) Assignments for KG1-P3 - T250811021 (Efua Gyasi) teaches Twi
            [
                'class_name' => 'KG 1',
                'section' => 'A',
                'subject_code' => 'GHA_LANG',
                'teacher_id' => 'T250811021'
            ],
            [
                'class_name' => 'KG 2',
                'section' => 'A',
                'subject_code' => 'GHA_LANG',
                'teacher_id' => 'T250811021'
            ],
            [
                'class_name' => 'P 1',
                'section' => 'A',
                'subject_code' => 'GHA_LANG',
                'teacher_id' => 'T250811021'
            ],
            [
                'class_name' => 'P 2',
                'section' => 'A',
                'subject_code' => 'GHA_LANG',
                'teacher_id' => 'T250811021'
            ],
            [
                'class_name' => 'P 3',
                'section' => 'A',
                'subject_code' => 'GHA_LANG',
                'teacher_id' => 'T250811021'
            ],
            
            // Ghanaian Language Assignments for P4-JHS3 - T250811014 (Kweku Kwarteng) teaches Ghanaian Language
            [
                'class_name' => 'P 4',
                'section' => 'A',
                'subject_code' => 'GHA_LANG',
                'teacher_id' => 'T250811014'
            ],
            [
                'class_name' => 'P 5',
                'section' => 'A',
                'subject_code' => 'GHA_LANG',
                'teacher_id' => 'T250811014'
            ],
            [
                'class_name' => 'P 6',
                'section' => 'A',
                'subject_code' => 'GHA_LANG',
                'teacher_id' => 'T250811014'
            ],
            [
                'class_name' => 'JHS 1',
                'section' => 'A',
                'subject_code' => 'GHA_LANG',
                'teacher_id' => 'T250811014'
            ],
            [
                'class_name' => 'JHS 2',
                'section' => 'A',
                'subject_code' => 'GHA_LANG',
                'teacher_id' => 'T250811014'
            ],
            [
                'class_name' => 'JHS 3',
                'section' => 'A',
                'subject_code' => 'GHA_LANG',
                'teacher_id' => 'T250811014'
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