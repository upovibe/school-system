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
            // Algebra Chapter 5 Practice Problems - JHS 1A
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
            [
                'assignment_title' => 'Algebra Chapter 5 Practice Problems',
                'student_code' => 'S002',
                'class_name' => 'JHS 1',
                'section' => 'A',
                'submission_text' => 'I found this assignment challenging but completed it. I struggled with problem 15 but got help from my study group. I double-checked all my calculations.',
                'submission_file' => null,
                'submitted_at' => '2025-01-14 16:45:00',
                'grade' => 92.50,
                'feedback' => 'Excellent work! Your analysis shows deep understanding of the concepts. Well done on problems 1-20. Minor calculation errors in problems 8 and 15. Great collaboration with study group.',
                'status' => 'graded'
            ],
            [
                'assignment_title' => 'Algebra Chapter 5 Practice Problems',
                'student_code' => 'S003',
                'class_name' => 'JHS 1',
                'section' => 'A',
                'submission_text' => 'I completed most of the problems but had difficulty with the word problems. I need more practice with real-world applications.',
                'submission_file' => null,
                'submitted_at' => '2025-01-15 10:20:00',
                'grade' => 75.00,
                'feedback' => 'Good effort! You completed the basic problems well. Focus on understanding word problems and real-world applications. Consider extra practice with similar problems.',
                'status' => 'graded'
            ],
            
            // Laboratory Report - Acid-Base Titration - JHS 1A
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
            [
                'assignment_title' => 'Laboratory Report - Acid-Base Titration',
                'student_code' => 'S002',
                'class_name' => 'JHS 1',
                'section' => 'A',
                'submission_text' => 'I completed the titration experiment. The endpoint was at 24.8mL. I included all safety precautions and wore proper protective equipment.',
                'submission_file' => null,
                'submitted_at' => '2025-01-17 16:30:00',
                'grade' => 90.00,
                'feedback' => 'Excellent lab report! Good attention to safety protocols. Accurate measurements and clear methodology. Well done on the experimental procedure.',
                'status' => 'graded'
            ],
            
            // Essay Writing - Shakespeare Analysis - JHS 1A
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
            ],
            [
                'assignment_title' => 'Essay Writing - Shakespeare Analysis',
                'student_code' => 'S003',
                'class_name' => 'JHS 1',
                'section' => 'A',
                'submission_text' => 'I analyzed the character development in Macbeth, focusing on how his ambition transforms him from a loyal soldier to a ruthless tyrant.',
                'submission_file' => null,
                'submitted_at' => '2025-01-21 09:15:00',
                'grade' => 78.00,
                'feedback' => 'Good analysis of character development. Include more textual evidence and deeper exploration of themes. Well-structured essay with clear arguments.',
                'status' => 'graded'
            ],
            
            // Programming Project - Simple Calculator - JHS 1A
            [
                'assignment_title' => 'Programming Project - Simple Calculator',
                'student_code' => 'S002',
                'class_name' => 'JHS 1',
                'section' => 'A',
                'submission_text' => 'I created a calculator program in Python with basic arithmetic operations. The program includes input validation and error handling for division by zero.',
                'submission_file' => null,
                'submitted_at' => '2025-01-28 16:15:00',
                'grade' => 95.00,
                'feedback' => 'Excellent programming work! Your calculator is well-structured with good error handling. Consider adding more advanced operations like square root and power functions.',
                'status' => 'graded'
            ],
            [
                'assignment_title' => 'Programming Project - Simple Calculator',
                'student_code' => 'S003',
                'class_name' => 'JHS 1',
                'section' => 'A',
                'submission_text' => 'I built a calculator using Python. It can perform addition, subtraction, multiplication, and division. I added a simple user interface.',
                'submission_file' => null,
                'submitted_at' => '2025-01-29 14:45:00',
                'grade' => 82.00,
                'feedback' => 'Good basic implementation! The calculator works correctly. Consider adding input validation and better error handling. Nice user interface design.',
                'status' => 'graded'
            ],
            
            // Science Quiz - Matter and Energy - JHS 1B
            [
                'assignment_title' => 'Science Quiz - Matter and Energy',
                'student_code' => 'S004',
                'class_name' => 'JHS 1',
                'section' => 'B',
                'submission_text' => 'I completed the quiz on matter and energy. I found the questions about energy transformations challenging but managed to answer most correctly.',
                'submission_file' => null,
                'submitted_at' => '2025-01-24 13:20:00',
                'grade' => 85.00,
                'feedback' => 'Good performance on the quiz! You showed good understanding of states of matter. Review energy conservation laws for better understanding.',
                'status' => 'graded'
            ],
            [
                'assignment_title' => 'Science Quiz - Matter and Energy',
                'student_code' => 'S005',
                'class_name' => 'JHS 1',
                'section' => 'B',
                'submission_text' => 'I answered all the quiz questions. The questions about energy transformations were interesting and helped me understand the concepts better.',
                'submission_file' => null,
                'submitted_at' => '2025-01-24 15:10:00',
                'grade' => 92.00,
                'feedback' => 'Excellent work! You demonstrated strong understanding of both matter and energy concepts. Great performance on energy transformation questions.',
                'status' => 'graded'
            ],
            
            // Research Paper - Ghanaian History - JHS 1A
            [
                'assignment_title' => 'Research Paper - Ghanaian History',
                'student_code' => 'S003',
                'class_name' => 'JHS 1',
                'section' => 'A',
                'submission_text' => 'I researched the independence movement in Ghana and wrote about the role of Kwame Nkrumah in achieving independence. I included primary and secondary sources.',
                'submission_file' => null,
                'submitted_at' => '2025-02-08 19:45:00',
                'grade' => null,
                'feedback' => null,
                'status' => 'submitted'
            ],
            
            // Creative Writing - Short Story - JHS 1B
            [
                'assignment_title' => 'Creative Writing - Short Story',
                'student_code' => 'S004',
                'class_name' => 'JHS 1',
                'section' => 'B',
                'submission_text' => 'I wrote a short story about a young student who discovers a magical library. The story explores themes of knowledge, friendship, and adventure.',
                'submission_file' => null,
                'submitted_at' => '2025-01-27 11:30:00',
                'grade' => 88.00,
                'feedback' => 'Creative and engaging story! Good character development and plot structure. The magical elements were well integrated. Consider expanding the ending.',
                'status' => 'graded'
            ],
            
            // Mathematics Project - Real-world Applications - JHS 1B
            [
                'assignment_title' => 'Mathematics Project - Real-world Applications',
                'student_code' => 'S005',
                'class_name' => 'JHS 1',
                'section' => 'B',
                'submission_text' => 'I created a project showing how mathematics is used in architecture. I included examples of geometric shapes, measurements, and calculations used in building design.',
                'submission_file' => null,
                'submitted_at' => '2025-01-30 16:45:00',
                'grade' => 94.00,
                'feedback' => 'Outstanding project! Excellent choice of topic and thorough research. The architectural examples clearly demonstrate mathematical applications. Well-presented and informative.',
                'status' => 'graded'
            ],
            
            // ICT Quiz - Computer Hardware - JHS 1B
            [
                'assignment_title' => 'ICT Quiz - Computer Hardware',
                'student_code' => 'S004',
                'class_name' => 'JHS 1',
                'section' => 'B',
                'submission_text' => 'I completed the computer hardware quiz. I was able to identify most components correctly, including CPU, RAM, motherboard, and storage devices.',
                'submission_file' => null,
                'submitted_at' => '2025-02-07 14:20:00',
                'grade' => 78.00,
                'feedback' => 'Good understanding of basic hardware components. Review the functions of each component for better comprehension. Practice identifying components in real systems.',
                'status' => 'graded'
            ],
            
            // Late submission example
            [
                'assignment_title' => 'Grammar Quiz - Parts of Speech',
                'student_code' => 'S006',
                'class_name' => 'JHS 2',
                'section' => 'A',
                'submission_text' => 'I completed the grammar quiz late due to technical issues. I apologize for the delay and have included all my answers.',
                'submission_file' => null,
                'submitted_at' => '2025-02-03 10:30:00', // Late submission
                'grade' => 65.00,
                'feedback' => 'Good work on the quiz content. However, late submission affects the grade. Please submit assignments on time in the future.',
                'status' => 'late'
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