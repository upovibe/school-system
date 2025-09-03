<?php
// api/database/seeders/class_assignment_seeder.php - Seeder for class assignments

class ClassAssignmentSeeder
{
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function run() {
        echo "🌱 Seeding class assignments...\n";
        
        $this->seedClassAssignments();
        $this->seedStudentSubmissions();
        
        echo "✅ Class assignments seeded successfully!\n";
    }
    
    private function seedClassAssignments() {
        echo "📝 Seeding class assignments...\n";
        
        // Get teachers with their specializations
        $stmt = $this->pdo->prepare('
            SELECT t.id as teacher_id, t.first_name, t.last_name, t.employee_id, t.specialization
            FROM teachers t
            WHERE t.status = "active"
        ');
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
        
        // Get class-subject assignments
        $stmt = $this->pdo->prepare('SELECT class_id, subject_id FROM class_subjects');
        $stmt->execute();
        $classSubjects = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Teacher specialization mapping
        $teacherSpecializations = [
            'T250811017' => ['INTEGRATED_SCI'], // Dr. Kwame Osei - Integrated Science
            'T250811018' => ['MATH'],           // Dr. Abena Kwarteng - Mathematics
            'T250811019' => ['FRENCH'],         // Ama Osei - French
            'T250811020' => ['ENG'],            // Kwame Mensah - English
            'T250811021' => ['GHA_LANG'],       // Efua Gyasi - Ghanaian Language
            'T250811013' => ['COMPUTING', 'SOC_STUDIES'], // Aba Johnson - Computing & Social Studies (JHS 3)
            'T250811011' => ['SOC_STUDIES'],    // Ama Serwaa - Social Studies (JHS 1)
            'T250811012' => ['SOC_STUDIES']     // Kwaku Mensah - Social Studies (JHS 2)
        ];
        
        $assignments = [
            // Mathematics Assignments (Dr. Abena Kwarteng - T250811018)
            [
                'title' => 'Algebra Chapter 5 Practice Problems',
                'description' => 'Complete exercises 1-20 from textbook pages 45-50. Show all your work and calculations.',
                'due_date' => '2025-01-15 23:59:00',
                'total_points' => 100.00,
                'assignment_type' => 'homework',
                'status' => 'published',
                'attachment_file' => null,
                'teacher_employee_id' => 'T250811018',
                'class_name' => 'JHS 1',
                'section' => 'A',
                'subject_code' => 'MATH'
            ],
            [
                'title' => 'Geometry Quiz - Triangles and Circles',
                'description' => 'Complete the quiz on triangles and circles. You have 45 minutes to finish.',
                'due_date' => '2025-01-20 23:59:00',
                'total_points' => 50.00,
                'assignment_type' => 'quiz',
                'status' => 'published',
                'attachment_file' => null,
                'teacher_employee_id' => 'T250811018',
                'class_name' => 'JHS 2',
                'section' => 'A',
                'subject_code' => 'MATH'
            ],
            [
                'title' => 'Mathematics Project - Real-world Applications',
                'description' => 'Create a project showing how mathematics is used in real life. Include examples from business, science, and daily activities.',
                'due_date' => '2025-02-01 23:59:00',
                'total_points' => 150.00,
                'assignment_type' => 'project',
                'status' => 'published',
                'attachment_file' => null,
                'teacher_employee_id' => 'T250811018',
                'class_name' => 'JHS 3',
                'section' => 'A',
                'subject_code' => 'MATH'
            ],
            
            // Integrated Science Assignments (Dr. Kwame Osei - T250811017)
            [
                'title' => 'Laboratory Report - Acid-Base Titration',
                'description' => 'Write a comprehensive lab report on the acid-base titration experiment conducted in class. Include methodology, results, and conclusion.',
                'due_date' => '2025-01-18 23:59:00',
                'total_points' => 80.00,
                'assignment_type' => 'other',
                'status' => 'published',
                'attachment_file' => null,
                'teacher_employee_id' => 'T250811017',
                'class_name' => 'JHS 1',
                'section' => 'A',
                'subject_code' => 'INTEGRATED_SCI'
            ],
            [
                'title' => 'Science Quiz - Matter and Energy',
                'description' => 'Complete the quiz on matter and energy. Focus on states of matter, energy transformations, and conservation laws.',
                'due_date' => '2025-01-25 23:59:00',
                'total_points' => 60.00,
                'assignment_type' => 'quiz',
                'status' => 'published',
                'attachment_file' => null,
                'teacher_employee_id' => 'T250811017',
                'class_name' => 'JHS 2',
                'section' => 'A',
                'subject_code' => 'INTEGRATED_SCI'
            ],
            [
                'title' => 'Science Project - Environmental Impact',
                'description' => 'Research and present on an environmental issue affecting Ghana. Include causes, effects, and possible solutions.',
                'due_date' => '2025-02-05 23:59:00',
                'total_points' => 120.00,
                'assignment_type' => 'project',
                'status' => 'published',
                'attachment_file' => null,
                'teacher_employee_id' => 'T250811017',
                'class_name' => 'JHS 3',
                'section' => 'A',
                'subject_code' => 'INTEGRATED_SCI'
            ],
            
            // English Assignments (Kwame Mensah - T250811020)
            [
                'title' => 'Essay Writing - Shakespeare Analysis',
                'description' => 'Write a 1000-word essay analyzing the themes in Macbeth. Focus on ambition and its consequences.',
                'due_date' => '2025-01-22 23:59:00',
                'total_points' => 100.00,
                'assignment_type' => 'other',
                'status' => 'published',
                'attachment_file' => null,
                'teacher_employee_id' => 'T250811020',
                'class_name' => 'JHS 1',
                'section' => 'A',
                'subject_code' => 'ENG'
            ],
            [
                'title' => 'Creative Writing - Short Story',
                'description' => 'Write a short story (500-800 words) with a clear plot, characters, and setting. Be creative and original.',
                'due_date' => '2025-01-28 23:59:00',
                'total_points' => 75.00,
                'assignment_type' => 'other',
                'status' => 'published',
                'attachment_file' => null,
                'teacher_employee_id' => 'T250811020',
                'class_name' => 'JHS 2',
                'section' => 'A',
                'subject_code' => 'ENG'
            ],
            [
                'title' => 'Grammar Quiz - Parts of Speech',
                'description' => 'Complete the grammar quiz on parts of speech. Identify nouns, verbs, adjectives, and adverbs in sentences.',
                'due_date' => '2025-02-02 23:59:00',
                'total_points' => 50.00,
                'assignment_type' => 'quiz',
                'status' => 'published',
                'attachment_file' => null,
                'teacher_employee_id' => 'T250811020',
                'class_name' => 'JHS 3',
                'section' => 'A',
                'subject_code' => 'ENG'
            ],
            
            // Computing Assignments (Aba Johnson - T250811013)
            [
                'title' => 'Programming Project - Simple Calculator',
                'description' => 'Create a simple calculator program using Python. Include basic arithmetic operations and error handling.',
                'due_date' => '2025-01-30 23:59:00',
                'total_points' => 100.00,
                'assignment_type' => 'project',
                'status' => 'published',
                'attachment_file' => null,
                'teacher_employee_id' => 'T250811013',
                'class_name' => 'JHS 1',
                'section' => 'A',
                'subject_code' => 'COMPUTING'
            ],
            [
                'title' => 'Computing Quiz - Computer Hardware',
                'description' => 'Complete the quiz on computer hardware components. Identify parts and their functions.',
                'due_date' => '2025-02-08 23:59:00',
                'total_points' => 40.00,
                'assignment_type' => 'quiz',
                'status' => 'published',
                'attachment_file' => null,
                'teacher_employee_id' => 'T250811013',
                'class_name' => 'JHS 2',
                'section' => 'A',
                'subject_code' => 'COMPUTING'
            ],
            
            // Social Studies Assignments (Class Teachers)
            [
                'title' => 'Research Paper - Ghanaian History',
                'description' => 'Write a research paper on a significant event in Ghanaian history. Include primary and secondary sources.',
                'due_date' => '2025-02-10 23:59:00',
                'total_points' => 120.00,
                'assignment_type' => 'other',
                'status' => 'published',
                'attachment_file' => null,
                'teacher_employee_id' => 'T250811011',
                'class_name' => 'JHS 1',
                'section' => 'A',
                'subject_code' => 'SOC_STUDIES'
            ],
            [
                'title' => 'Social Studies Quiz - Government Structure',
                'description' => 'Complete the quiz on Ghana\'s government structure. Focus on the three branches of government.',
                'due_date' => '2025-02-15 23:59:00',
                'total_points' => 60.00,
                'assignment_type' => 'quiz',
                'status' => 'published',
                'attachment_file' => null,
                'teacher_employee_id' => 'T250811012',
                'class_name' => 'JHS 2',
                'section' => 'A',
                'subject_code' => 'SOC_STUDIES'
            ]
        ];
        
        foreach ($assignments as $assignmentData) {
            $this->createAssignment($assignmentData, $teachers, $classes, $subjects, $classSubjects, $teacherSpecializations);
        }
    }
    
    private function createAssignment($assignmentData, $teachers, $classes, $subjects, $classSubjects, $teacherSpecializations) {
        // Find the teacher
        $teacher = null;
        foreach ($teachers as $t) {
            if ($t['employee_id'] === $assignmentData['teacher_employee_id']) {
                $teacher = $t;
                break;
            }
        }
        
        if (!$teacher) {
            echo "⚠️  Teacher not found: {$assignmentData['teacher_employee_id']}\n";
            return;
        }
        
        // Find the class
        $class = null;
        foreach ($classes as $c) {
            if ($c['name'] === $assignmentData['class_name'] && $c['section'] === $assignmentData['section']) {
                $class = $c;
                break;
            }
        }
        
        if (!$class) {
            echo "⚠️  Class not found: {$assignmentData['class_name']} {$assignmentData['section']}\n";
            return;
        }
        
        // Find the subject
        $subject = null;
        foreach ($subjects as $s) {
            if ($s['code'] === $assignmentData['subject_code']) {
                $subject = $s;
                break;
            }
        }
        
        if (!$subject) {
            echo "⚠️  Subject not found: {$assignmentData['subject_code']}\n";
            return;
        }
        
        // Verify teacher specialization matches subject
        $teacherSpecialization = $teacherSpecializations[$assignmentData['teacher_employee_id']] ?? [];
        if (!in_array($assignmentData['subject_code'], $teacherSpecialization)) {
            echo "⚠️  Teacher {$assignmentData['teacher_employee_id']} is not specialized in {$assignmentData['subject_code']}\n";
            return;
        }
        
        // Verify class-subject assignment exists
        $classSubjectExists = false;
        foreach ($classSubjects as $cs) {
            if ($cs['class_id'] == $class['id'] && $cs['subject_id'] == $subject['id']) {
                $classSubjectExists = true;
                break;
            }
        }
        
        if (!$classSubjectExists) {
            echo "⚠️  Class-subject assignment not found: {$assignmentData['class_name']} {$assignmentData['section']} - {$assignmentData['subject_code']}\n";
            return;
        }
        
        try {
            $stmt = $this->pdo->prepare('
                INSERT INTO class_assignments (
                    title, description, due_date, total_points, assignment_type, 
                    status, attachment_file, teacher_id, class_id, subject_id, 
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ');
            
            $stmt->execute([
                $assignmentData['title'],
                $assignmentData['description'],
                $assignmentData['due_date'],
                $assignmentData['total_points'],
                $assignmentData['assignment_type'],
                $assignmentData['status'],
                $assignmentData['attachment_file'],
                $teacher['teacher_id'],
                $class['id'],
                $subject['id']
            ]);
            
            echo "✅ Created assignment: {$assignmentData['title']} for {$assignmentData['class_name']} {$assignmentData['section']}\n";
            
        } catch (Exception $e) {
            echo "❌ Error creating assignment: {$e->getMessage()}\n";
        }
    }
    
    private function seedStudentSubmissions() {
        echo "📝 Seeding student submissions...\n";
        
        // Get all class assignments
        $stmt = $this->pdo->prepare('
            SELECT ca.id as assignment_id, ca.title, ca.due_date, ca.total_points,
                   c.name as class_name, c.section,
                   s.name as subject_name
            FROM class_assignments ca
            JOIN classes c ON ca.class_id = c.id
            JOIN subjects s ON ca.subject_id = s.id
            WHERE ca.status = "published"
        ');
        $stmt->execute();
        $assignments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get students in each class
        $stmt = $this->pdo->prepare('
            SELECT s.id as student_id, s.first_name, s.last_name, s.student_id as student_code,
                   c.name as class_name, c.section
            FROM students s
            JOIN classes c ON s.current_class_id = c.id
            WHERE s.status = "active"
        ');
        $stmt->execute();
        $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $submissions = [
            // Sample submissions for different assignments
            [
                'assignment_title' => 'Algebra Chapter 5 Practice Problems',
                'student_code' => 'STU250811134',
                'class_name' => 'JHS 1',
                'section' => 'A',
                'submission_text' => 'I completed all the problems. Here are my answers for exercises 1-20. I found problems 7 and 12 challenging but managed to solve them.',
                'submission_file' => null,
                'submitted_at' => '2025-01-14 15:30:00',
                'grade' => 88.00,
                'feedback' => 'Excellent work on problems 1-15! Minor calculation errors in problems 7 and 12. Overall good understanding of algebraic concepts.',
                'status' => 'graded'
            ],
            [
                'assignment_title' => 'Algebra Chapter 5 Practice Problems',
                'student_code' => 'STU250811135',
                'class_name' => 'JHS 1',
                'section' => 'A',
                'submission_text' => 'I found this assignment challenging but completed it. I struggled with problem 15 but got help from my study group.',
                'submission_file' => null,
                'submitted_at' => '2025-01-14 16:45:00',
                'grade' => 92.50,
                'feedback' => 'Excellent work! Your analysis shows deep understanding of the concepts. Well done on problems 1-20. Minor calculation errors in problems 8 and 15.',
                'status' => 'graded'
            ],
            [
                'assignment_title' => 'Laboratory Report - Acid-Base Titration',
                'student_code' => 'STU250811136',
                'class_name' => 'JHS 1',
                'section' => 'A',
                'submission_text' => 'I conducted the acid-base titration experiment and recorded all observations. The endpoint was reached at 25.3mL of NaOH.',
                'submission_file' => null,
                'submitted_at' => '2025-01-17 14:20:00',
                'grade' => 85.00,
                'feedback' => 'Good lab report with clear methodology. Include more detailed observations and discuss potential sources of error.',
                'status' => 'graded'
            ],
            [
                'assignment_title' => 'Essay Writing - Shakespeare Analysis',
                'student_code' => 'STU250811137',
                'class_name' => 'JHS 1',
                'section' => 'A',
                'submission_text' => 'I wrote a comprehensive essay analyzing the themes of ambition and power in Macbeth. The essay explores how unchecked ambition leads to destruction.',
                'submission_file' => null,
                'submitted_at' => '2025-01-20 18:30:00',
                'grade' => null,
                'feedback' => null,
                'status' => 'submitted'
            ],
            [
                'assignment_title' => 'Programming Project - Simple Calculator',
                'student_code' => 'STU250811138',
                'class_name' => 'JHS 1',
                'section' => 'A',
                'submission_text' => 'I created a calculator program in Python with basic arithmetic operations. The program includes input validation and error handling.',
                'submission_file' => null,
                'submitted_at' => '2025-01-28 16:15:00',
                'grade' => 95.00,
                'feedback' => 'Excellent programming work! Your calculator is well-structured with good error handling. Consider adding more advanced operations.',
                'status' => 'graded'
            ],
            [
                'assignment_title' => 'Research Paper - Ghanaian History',
                'student_code' => 'STU250811139',
                'class_name' => 'JHS 1',
                'section' => 'A',
                'submission_text' => 'I researched the independence movement in Ghana and wrote about the role of Kwame Nkrumah in achieving independence.',
                'submission_file' => null,
                'submitted_at' => '2025-02-08 19:45:00',
                'grade' => null,
                'feedback' => null,
                'status' => 'submitted'
            ]
        ];
        
        foreach ($submissions as $submissionData) {
            $this->createSubmission($submissionData, $assignments, $students);
        }
    }
    
    private function createSubmission($submissionData, $assignments, $students) {
        // Find the assignment
        $assignment = null;
        foreach ($assignments as $a) {
            if ($a['title'] === $submissionData['assignment_title']) {
                $assignment = $a;
                break;
            }
        }
        
        if (!$assignment) {
            echo "⚠️  Assignment not found: {$submissionData['assignment_title']}\n";
            return;
        }
        
        // Find the student
        $student = null;
        foreach ($students as $s) {
            if ($s['student_code'] === $submissionData['student_code'] &&
                $s['class_name'] === $submissionData['class_name'] &&
                $s['section'] === $submissionData['section']) {
                $student = $s;
                break;
            }
        }
        
        if (!$student) {
            echo "⚠️  Student not found: {$submissionData['student_code']} in {$submissionData['class_name']} {$submissionData['section']}\n";
            return;
        }
        
        try {
            $stmt = $this->pdo->prepare('
                INSERT INTO student_assignments (
                    student_id, assignment_id, submission_text, submission_file,
                    submitted_at, grade, feedback, status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ');
            
            $stmt->execute([
                $student['student_id'],
                $assignment['assignment_id'],
                $submissionData['submission_text'],
                $submissionData['submission_file'],
                $submissionData['submitted_at'],
                $submissionData['grade'],
                $submissionData['feedback'],
                $submissionData['status']
            ]);
            
            echo "✅ Created submission for {$student['first_name']} {$student['last_name']} - {$assignment['title']}\n";
            
        } catch (Exception $e) {
            echo "❌ Error creating submission: {$e->getMessage()}\n";
        }
    }
}
?> 