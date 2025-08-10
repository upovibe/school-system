<?php
// api/database/seeders/student_assignment_seeder.php - Seeder for student assignments

class StudentAssignmentSeeder
{
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function run() {
        echo "🌱 Seeding student assignments...\n";
        
        $this->seedStudentSubmissions();
        
        echo "✅ Student assignments seeded successfully!\n";
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
            // Just a few assignments for the single student (S001)
            
            // Mathematics Assignment
            [
                'assignment_title' => 'Algebra Chapter 5 Practice Problems',
                'student_code' => 'S001',
                'class_name' => 'JHS 1',
                'section' => 'A',
                'submission_text' => 'I completed all the problems. Here are my answers for exercises 1-20. I found problems 7 and 12 challenging but managed to solve them using the quadratic formula.',
                'submission_file' => null,
                'submitted_at' => '2025-01-14 15:30:00',
                'grade' => 88.00,
                'feedback' => 'Excellent work on problems 1-15! Minor calculation errors in problems 7 and 12. Overall good understanding of algebraic concepts. Keep practicing the quadratic formula.',
                'status' => 'graded'
            ],
            
            // Science Assignment
            [
                'assignment_title' => 'Laboratory Report - Acid-Base Titration',
                'student_code' => 'S001',
                'class_name' => 'JHS 1',
                'section' => 'A',
                'submission_text' => 'I conducted the acid-base titration experiment and recorded all observations. The endpoint was reached at 25.3mL of NaOH. The color change was very clear.',
                'submission_file' => null,
                'submitted_at' => '2025-01-17 14:20:00',
                'grade' => 85.00,
                'feedback' => 'Good lab report with clear methodology. Include more detailed observations and discuss potential sources of error. The endpoint detection was accurate.',
                'status' => 'graded'
            ],
            
            // English Assignment
            [
                'assignment_title' => 'Essay Writing - Shakespeare Analysis',
                'student_code' => 'S001',
                'class_name' => 'JHS 1',
                'section' => 'A',
                'submission_text' => 'I wrote a comprehensive essay analyzing the themes of ambition and power in Macbeth. The essay explores how unchecked ambition leads to destruction and the consequences of power.',
                'submission_file' => null,
                'submitted_at' => '2025-01-20 18:30:00',
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
        
        // Check if submission already exists
        $stmt = $this->pdo->prepare('
            SELECT id FROM student_assignments 
            WHERE student_id = ? AND assignment_id = ?
        ');
        $stmt->execute([$student['student_id'], $assignment['assignment_id']]);
        if ($stmt->fetch()) {
            echo "⚠️  Submission already exists for {$student['first_name']} {$student['last_name']} - {$assignment['title']}\n";
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