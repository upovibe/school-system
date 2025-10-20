<?php
// api/models/AcademicYearRecordModel.php - Model for academic_year_records table

require_once __DIR__ . '/../core/BaseModel.php';

class AcademicYearRecordModel extends BaseModel {
    protected static $table = 'academic_year_records';
    
    // Fields that can be mass assigned
    protected static $fillable = [
        'academic_year_id',
        'year_code',
        'record_type',
        'record_data',
        'total_records',
        'archived_by',
        'notes'
    ];
    
    // Fields that should be cast to specific types
    protected static $casts = [
        'academic_year_id' => 'integer',
        'total_records' => 'integer',
        'archived_by' => 'integer',
        'record_data' => 'json',
        'archive_date' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];
    
    // Whether to use timestamps
    protected static $timestamps = true;
    
    /**
     * Archive complete academic year data
     */
    public function archiveCompleteYear($academicYearId, $yearCode, $archivedBy = null, $notes = '') {
        try {
            // Debug database structure first
            $this->debugDatabaseStructure($academicYearId);
            
            // Get all data for the academic year
            $yearData = $this->getCompleteYearData($academicYearId);
            
            // Debug: Log the data counts
            error_log("Archive Debug - Academic Year ID: $academicYearId");
            error_log("Classes: " . count($yearData['classes']));
            error_log("Students: " . $yearData['students']); // Now a count, not array
            error_log("Teachers: " . $yearData['teachers']); // Now a count, not array
            error_log("Subjects: " . count($yearData['subjects']));
            error_log("Grades: " . $yearData['grades']); // Now a count, not array
            error_log("Fees: " . count($yearData['fees']));
            error_log("Grading Periods: " . count($yearData['grading_periods']));
            error_log("Teacher Assignments: " . count($yearData['teacher_assignments']));
            error_log("Class-Subject Relationships: " . count($yearData['class_subject_relationships']));
            
            // Debug: Log sample data for verification
            if (!empty($yearData['classes'])) {
                error_log("Sample Class: " . json_encode($yearData['classes'][0]));
            }
            // Skip student/grade samples since they're now counts
            if (!empty($yearData['fees'])) {
                error_log("Sample Fee: " . json_encode($yearData['fees'][0]));
            }
            
            // Additional debugging for empty arrays
            if (empty($yearData['fees'])) {
                error_log("⚠️  FEES ARRAY IS EMPTY - Checking why...");
                $this->debugFeesIssue($academicYearId);
            }
            
            if ($yearData['students'] <= 1) {
                error_log("⚠️  STUDENTS COUNT IS LOW - Checking why...");
                $this->debugStudentsIssue($academicYearId);
            }
            
            // Get grades data for print functionality
            $gradesData = $this->getGradesByYear($academicYearId);
            
            // Create ultra-lightweight year snapshot (summary only)
            $recordData = [
                'classes_summary' => $this->createClassesSummary($yearData, $academicYearId),
                'teacher_assignments' => $yearData['teacher_assignments'], // Include teacher assignments for print
                'grades' => $gradesData, // Include grades for print
                'grading_periods' => $yearData['grading_periods'], // Include grading periods for print
                'summary' => [
                    'total_classes' => count($yearData['classes']),
                    'total_students' => $yearData['students'], // Now a count
                    'total_teachers' => $yearData['teachers'], // Now a count
                    'total_subjects' => count($yearData['subjects']),
                    'total_grades' => $yearData['grades'], // Now a count
                    'total_fees' => count($yearData['fees']),
                    'total_grading_periods' => count($yearData['grading_periods']),
                    'total_teacher_assignments' => count($yearData['teacher_assignments']),
                    'total_class_subject_relationships' => count($yearData['class_subject_relationships'])
                ],
                'archive_timestamp' => date('Y-m-d H:i:s')
            ];
            
            // Calculate accurate totals from summary
            $totalRecords = $recordData['summary']['total_classes'] + 
                           $recordData['summary']['total_students'] + 
                           $recordData['summary']['total_teachers'] + 
                           $recordData['summary']['total_subjects'] + 
                           $recordData['summary']['total_grades'] + 
                           $recordData['summary']['total_fees'] + 
                           $recordData['summary']['total_grading_periods'] + 
                           $recordData['summary']['total_teacher_assignments'] +
                           $recordData['summary']['total_class_subject_relationships'];
            
            // Add total records to summary
            $recordData['summary']['total_records'] = $totalRecords;
            
            $data = [
                'academic_year_id' => $academicYearId,
                'year_code' => $yearCode,
                'record_type' => 'complete_year_snapshot',
                'record_data' => json_encode($recordData),
                'total_records' => $totalRecords,
                'archived_by' => $archivedBy,
                'notes' => $notes
            ];
            
            $result = $this->create($data);
            
            return $result;
        } catch (Exception $e) {
            throw new Exception('Error archiving complete year: ' . $e->getMessage());
        }
    }
    
    /**
     * Create ultra-lightweight classes summary (no detailed data)
     */
    private function createClassesSummary($yearData, $academicYearId) {
        $classesSummary = [];
        
        // Get actual student data for counting by class (we need this for the summary)
        $students = $this->getStudentEnrollmentsByYear($academicYearId);
        
        // Group students by class (count only)
        $studentsByClass = [];
        foreach ($students as $student) {
            $classId = $student['current_class_id'];
            if (!isset($studentsByClass[$classId])) {
                $studentsByClass[$classId] = 0;
            }
            $studentsByClass[$classId]++;
        }
        
        // Group teachers by class (count only)
        $teachersByClass = [];
        foreach ($yearData['teacher_assignments'] as $assignment) {
            $classId = $assignment['class_id'];
            if (!isset($teachersByClass[$classId])) {
                $teachersByClass[$classId] = [];
            }
            $teachersByClass[$classId][$assignment['teacher_id']] = true;
        }
        
        // Create minimal class summary
        foreach ($yearData['classes'] as $class) {
            $classId = $class['id'];
            $studentCount = $studentsByClass[$classId] ?? 0;
            $teacherCount = isset($teachersByClass[$classId]) ? count($teachersByClass[$classId]) : 0;
            
            $classesSummary[] = [
                'class_id' => $class['id'],
                'class_name' => $class['name'],
                'class_section' => $class['section'],
                'student_count' => $studentCount,
                'teacher_count' => $teacherCount
            ];
        }
        
        return $classesSummary;
    }
    
    /**
     * Get complete year data for archiving
     */
    private function getCompleteYearData($academicYearId) {
        $data = [];
        
        // Get classes and their related data
        $data['classes'] = $this->getClassesWithRelations($academicYearId);
        
        // Get students count only (lightweight)
        $data['students'] = $this->getStudentsCountByYear($academicYearId);
        
        // Get teachers count only (lightweight)
        $data['teachers'] = $this->getTeachersCountByYear($academicYearId);
        
        // Get unique subjects (avoid duplicates)
        $data['subjects'] = $this->getUniqueSubjectsByYear($academicYearId);
        
        // Skip detailed grades to save memory - only get count
        $data['grades'] = $this->getGradesCountByYear($academicYearId);
        
        // Get fees
        $data['fees'] = $this->getFeesByYear($academicYearId);
        
        // Get grading periods
        $data['grading_periods'] = $this->getGradingPeriodsByYear($academicYearId);
        
        // Get teacher assignments
        $data['teacher_assignments'] = $this->getTeacherAssignmentsByYear($academicYearId);
        
        // Get class-subject relationships
        $data['class_subject_relationships'] = $this->getClassSubjectRelationships($academicYearId);
        
        return $data;
    }
    
    /**
     * Get classes with all related data
     */
    private function getClassesWithRelations($academicYearId) {
        try {
            // Get classes that have teacher assignments or class subjects for this academic year
            $stmt = $this->pdo->prepare("
                SELECT DISTINCT c.*, 
                       (SELECT COUNT(DISTINCT s.id) FROM students s WHERE s.current_class_id = c.id) as student_count,
                       (SELECT COUNT(DISTINCT ta.teacher_id) FROM teacher_assignments ta WHERE ta.class_id = c.id) as teacher_count,
                       (SELECT COUNT(DISTINCT cs.subject_id) FROM class_subjects cs WHERE cs.class_id = c.id) as subject_count
                FROM classes c
                WHERE c.id IN (
                    -- Classes that have teacher assignments for this academic year
                    SELECT DISTINCT ta.class_id 
                    FROM teacher_assignments ta
                    JOIN classes c2 ON ta.class_id = c2.id
                    WHERE c2.academic_year_id = ?
                    UNION
                    -- Classes that have class subjects for this academic year
                    SELECT DISTINCT cs.class_id 
                    FROM class_subjects cs
                    JOIN classes c3 ON cs.class_id = c3.id
                    WHERE c3.academic_year_id = ?
                )
                ORDER BY c.name, c.section
            ");
            $stmt->execute([$academicYearId, $academicYearId]);
            $classes = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            error_log("Found " . count($classes) . " classes for academic year $academicYearId");
            if (!empty($classes)) {
                error_log("Sample class: " . json_encode($classes[0]));
            }
            
            return $classes;
        } catch (PDOException $e) {
            error_log("Error getting classes: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Get students count by academic year (lightweight - count only)
     */
    private function getStudentsCountByYear($academicYearId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT COUNT(*) as count
                FROM students s
                JOIN classes c ON s.current_class_id = c.id
                WHERE c.academic_year_id = ?
            ");
            $stmt->execute([$academicYearId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            error_log("Found " . $result['count'] . " students for academic year $academicYearId");
            return $result['count'];
        } catch (PDOException $e) {
            error_log("Error getting students count: " . $e->getMessage());
            return 0;
        }
    }
    
    /**
     * Get teachers count by academic year (lightweight - count only)
     */
    private function getTeachersCountByYear($academicYearId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT COUNT(DISTINCT t.id) as count
                FROM teachers t
                JOIN teacher_assignments ta ON t.id = ta.teacher_id
                JOIN classes c ON ta.class_id = c.id
                WHERE c.academic_year_id = ?
            ");
            $stmt->execute([$academicYearId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            error_log("Found " . $result['count'] . " teachers for academic year $academicYearId");
            return $result['count'];
        } catch (PDOException $e) {
            error_log("Error getting teachers count: " . $e->getMessage());
            return 0;
        }
    }
    
    /**
     * Get students by academic year
     */
    private function getStudentsByYear($academicYearId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT s.*, c.name as class_name, c.section as class_section
                FROM students s
                JOIN classes c ON s.class_id = c.id
                WHERE c.academic_year_id = ?
            ");
            $stmt->execute([$academicYearId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            return [];
        }
    }
    
    /**
     * Get teachers by academic year
     */
    private function getTeachersByYear($academicYearId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT DISTINCT t.*, ta.class_id, ta.subject_id, c.name as class_name
                FROM teachers t
                JOIN teacher_assignments ta ON t.id = ta.teacher_id
                JOIN classes c ON ta.class_id = c.id
                WHERE c.academic_year_id = ?
                GROUP BY t.id, ta.class_id, ta.subject_id
            ");
            $stmt->execute([$academicYearId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            return [];
        }
    }
    
    /**
     * Get subjects by academic year
     */
    private function getSubjectsByYear($academicYearId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT DISTINCT sub.*, cs.class_id, c.name as class_name
                FROM subjects sub
                JOIN class_subjects cs ON sub.id = cs.subject_id
                JOIN classes c ON cs.class_id = c.id
                WHERE c.academic_year_id = ?
                GROUP BY sub.id, cs.class_id
            ");
            $stmt->execute([$academicYearId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            return [];
        }
    }
    
    /**
     * Get grades count by academic year (lightweight - count only)
     */
    private function getGradesCountByYear($academicYearId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT COUNT(*) as count
                FROM student_grades sg
                JOIN grading_periods gp ON sg.grading_period_id = gp.id
                JOIN students s ON sg.student_id = s.id
                JOIN classes c ON s.current_class_id = c.id
                WHERE gp.academic_year_id = ? 
                AND c.academic_year_id = ?
            ");
            $stmt->execute([$academicYearId, $academicYearId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            error_log("Found " . $result['count'] . " grades for academic year $academicYearId");
            return $result['count'];
        } catch (PDOException $e) {
            error_log("Error getting grades count: " . $e->getMessage());
            return 0;
        }
    }
    
    /**
     * Get comprehensive grades by academic year - includes ALL students for ALL subjects and periods
     */
    private function getComprehensiveGradesByYear($academicYearId) {
        try {
            // Get all students in classes for this academic year
            $students = $this->getStudentEnrollmentsByYear($academicYearId);
            
            // Get all grading periods for this academic year
            $gradingPeriods = $this->getGradingPeriodsByYear($academicYearId);
            
            // Get all class-subject relationships for this academic year
            $classSubjects = $this->getClassSubjectRelationships($academicYearId);
            
            // Get existing grades for this academic year
            $existingGrades = $this->getGradesByYear($academicYearId);
            
            // Create a lookup for existing grades
            $gradeLookup = [];
            foreach ($existingGrades as $grade) {
                $key = $grade['student_id'] . '_' . $grade['subject_id'] . '_' . $grade['grading_period_id'];
                $gradeLookup[$key] = $grade;
            }
            
            $comprehensiveGrades = [];
            
            // Generate comprehensive grade records for all students, subjects, and periods
            foreach ($students as $student) {
                $classId = $student['current_class_id'];
                
                // Get subjects for this student's class
                $studentClassSubjects = array_filter($classSubjects, function($cs) use ($classId) {
                    return $cs['class_id'] == $classId;
                });
                
                foreach ($studentClassSubjects as $classSubject) {
                    foreach ($gradingPeriods as $period) {
                        $key = $student['id'] . '_' . $classSubject['subject_id'] . '_' . $period['id'];
                        
                        if (isset($gradeLookup[$key])) {
                            // Use existing grade data
                            $comprehensiveGrades[] = $gradeLookup[$key];
                        } else {
                            // Create empty grade record
                            $comprehensiveGrades[] = [
                                'id' => null,
                                'student_id' => $student['id'],
                                'class_id' => $classId,
                                'subject_id' => $classSubject['subject_id'],
                                'grading_period_id' => $period['id'],
                                'assignment_total' => null,
                                'exam_total' => null,
                                'final_percentage' => null,
                                'final_letter_grade' => null,
                                'remarks' => null,
                                'created_at' => null,
                                'updated_at' => null,
                                'created_by' => null,
                                'updated_by' => null,
                                'grading_policy_id' => null,
                                'period_name' => $period['name'],
                                'period_start' => $period['start_date'],
                                'period_end' => $period['end_date'],
                                'class_name' => $student['class_name'],
                                'class_section' => $student['class_section'],
                                'student_name' => $student['full_name'],
                                'student_first_name' => $student['first_name'],
                                'student_last_name' => $student['last_name'],
                                'admission_number' => $student['admission_number'],
                                'subject_name' => $classSubject['subject_name'],
                                'subject_code' => $classSubject['subject_code'],
                                'grading_period_name' => $period['name']
                            ];
                        }
                    }
                }
            }
            
            error_log("Generated " . count($comprehensiveGrades) . " comprehensive grade records for academic year $academicYearId");
            if (!empty($comprehensiveGrades)) {
                error_log("Sample comprehensive grade: " . json_encode($comprehensiveGrades[0]));
            }
            
            return $comprehensiveGrades;
        } catch (PDOException $e) {
            error_log("Error getting comprehensive grades: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Get grades by academic year (existing grades only)
     */
    private function getGradesByYear($academicYearId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT sg.*, gp.name as period_name, gp.start_date as period_start, gp.end_date as period_end,
                       c.name as class_name, c.section as class_section,
                       CONCAT(s.first_name, ' ', s.last_name) as student_name, s.student_id as admission_number,
                       sub.name as subject_name, sub.code as subject_code,
                       s.first_name as student_first_name, s.last_name as student_last_name,
                       gp.name as grading_period_name
                FROM student_grades sg
                JOIN grading_periods gp ON sg.grading_period_id = gp.id
                JOIN students s ON sg.student_id = s.id
                JOIN classes c ON s.current_class_id = c.id
                JOIN subjects sub ON sg.subject_id = sub.id
                WHERE gp.academic_year_id = ? 
                AND c.academic_year_id = ?
                ORDER BY c.name, s.last_name, s.first_name, sub.name
            ");
            $stmt->execute([$academicYearId, $academicYearId]);
            $grades = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            error_log("Found " . count($grades) . " existing grades for academic year $academicYearId");
            if (!empty($grades)) {
                error_log("Sample grade: " . json_encode($grades[0]));
            }
            
            return $grades;
        } catch (PDOException $e) {
            error_log("Error getting grades: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Get fees by academic year
     */
    private function getFeesByYear($academicYearId) {
        try {
            // First get the academic year code to match the fee_schedules.academic_year field
            $stmt = $this->pdo->prepare("SELECT year_code FROM academic_years WHERE id = ?");
            $stmt->execute([$academicYearId]);
            $academicYear = $stmt->fetchColumn();
            
            if (!$academicYear) {
                error_log("No academic year found with ID: $academicYearId");
                return [];
            }
            
            // Now get fees using the academic year code
            $stmt = $this->pdo->prepare("
                SELECT fs.*, c.name as class_name, c.section as class_section,
                       fs.grading_period as grading_period_name
                FROM fee_schedules fs
                JOIN classes c ON fs.class_id = c.id
                WHERE fs.academic_year = ?
                ORDER BY c.name, fs.grading_period
            ");
            $stmt->execute([$academicYear]);
            $fees = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            error_log("Found " . count($fees) . " fees for academic year $academicYear (ID: $academicYearId)");
            if (!empty($fees)) {
                error_log("Sample fee: " . json_encode($fees[0]));
            }
            
            return $fees;
        } catch (PDOException $e) {
            error_log("Error getting fees: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Get grading periods by academic year
     */
    private function getGradingPeriodsByYear($academicYearId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT * FROM grading_periods 
                WHERE academic_year_id = ?
                ORDER BY start_date ASC
            ");
            $stmt->execute([$academicYearId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            return [];
        }
    }
    
    /**
     * Get unique subjects by academic year (avoid duplicates)
     */
    private function getUniqueSubjectsByYear($academicYearId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT DISTINCT sub.*
                FROM subjects sub
                JOIN class_subjects cs ON sub.id = cs.subject_id
                JOIN classes c ON cs.class_id = c.id
                WHERE c.academic_year_id = ?
                GROUP BY sub.id
            ");
            $stmt->execute([$academicYearId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            return [];
        }
    }
    
    /**
     * Get unique teachers by academic year (avoid duplicates)
     */
    private function getUniqueTeachersByYear($academicYearId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT DISTINCT t.*
                FROM teachers t
                JOIN teacher_assignments ta ON t.id = ta.teacher_id
                JOIN classes c ON ta.class_id = c.id
                WHERE c.academic_year_id = ?
                GROUP BY t.id
            ");
            $stmt->execute([$academicYearId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            return [];
        }
    }
    
    /**
     * Get teacher assignments by academic year
     */
    private function getTeacherAssignmentsByYear($academicYearId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT ta.*, t.first_name, t.last_name, t.employee_id, 
                       c.name as class_name, sub.name as subject_name
                FROM teacher_assignments ta
                JOIN teachers t ON ta.teacher_id = t.id
                JOIN classes c ON ta.class_id = c.id
                JOIN subjects sub ON ta.subject_id = sub.id
                WHERE c.academic_year_id = ?
                ORDER BY c.name, sub.name
            ");
            $stmt->execute([$academicYearId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            return [];
        }
    }
    
    
    /**
     * Get class-subject relationships by academic year
     */
    private function getClassSubjectRelationships($academicYearId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT cs.*, c.name as class_name, c.section as class_section,
                       sub.name as subject_name, sub.code as subject_code
                FROM class_subjects cs
                JOIN classes c ON cs.class_id = c.id
                JOIN subjects sub ON cs.subject_id = sub.id
                WHERE c.academic_year_id = ?
                ORDER BY c.name, sub.name
            ");
            $stmt->execute([$academicYearId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            return [];
        }
    }
    
    /**
     * Get student enrollments by class for academic year
     */
    private function getStudentEnrollmentsByYear($academicYearId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT s.*, c.name as class_name, c.section as class_section,
                       CONCAT(s.first_name, ' ', s.last_name) as full_name,
                       s.student_id as admission_number
                FROM students s
                JOIN classes c ON s.current_class_id = c.id
                WHERE c.academic_year_id = ?
                ORDER BY c.name, s.last_name, s.first_name
            ");
            $stmt->execute([$academicYearId]);
            $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            error_log("Found " . count($students) . " students for academic year $academicYearId");
            if (!empty($students)) {
                error_log("Sample student: " . json_encode($students[0]));
            }
            
            return $students;
        } catch (PDOException $e) {
            error_log("Error getting students: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Debug method to check database structure
     */
    private function debugDatabaseStructure($academicYearId) {
        try {
            error_log("=== DATABASE STRUCTURE DEBUG ===");
            
            // Check classes table
            $stmt = $this->pdo->prepare("SELECT COUNT(*) as count FROM classes");
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            error_log("Total classes in database: " . $result['count']);
            
            // Check classes with academic_year_id
            $stmt = $this->pdo->prepare("SELECT COUNT(*) as count FROM classes WHERE academic_year_id = ?");
            $stmt->execute([$academicYearId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            error_log("Classes with academic_year_id = $academicYearId: " . $result['count']);
            
            // Check teacher assignments
            $stmt = $this->pdo->prepare("SELECT COUNT(*) as count FROM teacher_assignments");
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            error_log("Total teacher assignments: " . $result['count']);
            
            // Check class subjects
            $stmt = $this->pdo->prepare("SELECT COUNT(*) as count FROM class_subjects");
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            error_log("Total class-subject relationships: " . $result['count']);
            
            // Check students
            $stmt = $this->pdo->prepare("SELECT COUNT(*) as count FROM students");
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            error_log("Total students: " . $result['count']);
            
            // Check students with current_class_id
            $stmt = $this->pdo->prepare("SELECT COUNT(*) as count FROM students WHERE current_class_id IS NOT NULL");
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            error_log("Students with current_class_id: " . $result['count']);
            
            // Check students without current_class_id
            $stmt = $this->pdo->prepare("SELECT COUNT(*) as count FROM students WHERE current_class_id IS NULL");
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            error_log("Students without current_class_id: " . $result['count']);
            
            // Check grades
            $stmt = $this->pdo->prepare("SELECT COUNT(*) as count FROM student_grades");
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            error_log("Total grades: " . $result['count']);
            
            // Check fees
            $stmt = $this->pdo->prepare("SELECT COUNT(*) as count FROM fee_schedules");
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            error_log("Total fees: " . $result['count']);
            
            // Check academic year code
            $stmt = $this->pdo->prepare("SELECT year_code FROM academic_years WHERE id = ?");
            $stmt->execute([$academicYearId]);
            $yearCode = $stmt->fetchColumn();
            error_log("Academic year code for ID $academicYearId: " . ($yearCode ?: 'NOT FOUND'));
            
            // Check fees for this academic year code
            if ($yearCode) {
                $stmt = $this->pdo->prepare("SELECT COUNT(*) as count FROM fee_schedules WHERE academic_year = ?");
                $stmt->execute([$yearCode]);
                $result = $stmt->fetch(PDO::FETCH_ASSOC);
                error_log("Fees for academic year '$yearCode': " . $result['count']);
                
                // Show sample fee schedules
                $stmt = $this->pdo->prepare("SELECT id, class_id, academic_year, grading_period FROM fee_schedules LIMIT 5");
                $stmt->execute();
                $sampleFees = $stmt->fetchAll(PDO::FETCH_ASSOC);
                if (!empty($sampleFees)) {
                    error_log("Sample fee schedules: " . json_encode($sampleFees));
                }
            }
            
            error_log("=== END DEBUG ===");
        } catch (PDOException $e) {
            error_log("Debug error: " . $e->getMessage());
        }
    }
    
    /**
     * Debug method to check why fees array is empty
     */
    private function debugFeesIssue($academicYearId) {
        try {
            error_log("=== FEES ISSUE DEBUG ===");
            
            // Get the academic year code
            $stmt = $this->pdo->prepare("SELECT year_code FROM academic_years WHERE id = ?");
            $stmt->execute([$academicYearId]);
            $yearCode = $stmt->fetchColumn();

            if (!$yearCode) {
                error_log("Academic year with ID $academicYearId not found. Cannot debug fees.");
                return;
            }

            // Get fee schedules for the academic year
            $stmt = $this->pdo->prepare("
                SELECT COUNT(*) as count, c.name as class_name, fs.grading_period
                FROM fee_schedules fs
                JOIN classes c ON fs.class_id = c.id
                WHERE fs.academic_year = ?
                GROUP BY c.name, fs.grading_period
            ");
            $stmt->execute([$yearCode]);
            $feesByClassPeriod = $stmt->fetchAll(PDO::FETCH_ASSOC);

            error_log("Fees by Class/Period for Academic Year $yearCode:");
            foreach ($feesByClassPeriod as $item) {
                error_log("Class: " . $item['class_name'] . ", Period: " . $item['grading_period'] . ", Count: " . $item['count']);
            }

            // Get all classes for the academic year
            $stmt = $this->pdo->prepare("SELECT id, name FROM classes WHERE academic_year_id = ?");
            $stmt->execute([$academicYearId]);
            $classes = $stmt->fetchAll(PDO::FETCH_ASSOC);

            error_log("Classes for Academic Year $academicYearId:");
            foreach ($classes as $class) {
                error_log("Class ID: " . $class['id'] . ", Name: " . $class['name']);
            }

            // Get all fee schedules for the academic year
            $stmt = $this->pdo->prepare("SELECT id, class_id, grading_period FROM fee_schedules WHERE academic_year = ?");
            $stmt->execute([$yearCode]);
            $allFees = $stmt->fetchAll(PDO::FETCH_ASSOC);

            error_log("All Fee Schedules for Academic Year $yearCode:");
            if (!empty($allFees)) {
                error_log("Sample: " . json_encode($allFees[0]));
            }

            error_log("=== END FEES ISSUE DEBUG ===");
        } catch (PDOException $e) {
            error_log("Debug error: " . $e->getMessage());
        }
    }

    /**
     * Debug method to check why students count is low
     */
    private function debugStudentsIssue($academicYearId) {
        try {
            error_log("=== STUDENTS ISSUE DEBUG ===");
            
            // Get the academic year code
            $stmt = $this->pdo->prepare("SELECT year_code FROM academic_years WHERE id = ?");
            $stmt->execute([$academicYearId]);
            $yearCode = $stmt->fetchColumn();

            if (!$yearCode) {
                error_log("Academic year with ID $academicYearId not found. Cannot debug students.");
                return;
            }

            // Get student enrollments for the academic year
            $stmt = $this->pdo->prepare("
                SELECT COUNT(*) as count, c.name as class_name
                FROM students s
                JOIN classes c ON s.current_class_id = c.id
                WHERE c.academic_year_id = ?
                GROUP BY c.name
            ");
            $stmt->execute([$academicYearId]);
            $studentsByClass = $stmt->fetchAll(PDO::FETCH_ASSOC);

            error_log("Student Enrollments by Class for Academic Year $academicYearId:");
            foreach ($studentsByClass as $item) {
                error_log("Class: " . $item['class_name'] . ", Count: " . $item['count']);
            }

            // Get all classes for the academic year
            $stmt = $this->pdo->prepare("SELECT id, name FROM classes WHERE academic_year_id = ?");
            $stmt->execute([$academicYearId]);
            $classes = $stmt->fetchAll(PDO::FETCH_ASSOC);

            error_log("Classes for Academic Year $academicYearId:");
            foreach ($classes as $class) {
                error_log("Class ID: " . $class['id'] . ", Name: " . $class['name']);
            }

            // Get all students with their current class info
            $stmt = $this->pdo->prepare("
                SELECT s.id, s.first_name, s.last_name, s.current_class_id, c.name as class_name, c.academic_year_id
                FROM students s
                LEFT JOIN classes c ON s.current_class_id = c.id
                ORDER BY s.current_class_id, s.first_name
            ");
            $stmt->execute();
            $allStudents = $stmt->fetchAll(PDO::FETCH_ASSOC);

            error_log("All Students with Current Class Info:");
            foreach ($allStudents as $student) {
                $classInfo = $student['current_class_id'] ? "Class: {$student['class_name']} (ID: {$student['current_class_id']})" : "No class assigned";
                $academicYear = $student['academic_year_id'] ? "Academic Year: {$student['academic_year_id']}" : "No academic year";
                error_log("Student: {$student['first_name']} {$student['last_name']} - {$classInfo} - {$academicYear}");
            }

            error_log("=== END STUDENTS ISSUE DEBUG ===");
        } catch (PDOException $e) {
            error_log("Debug error: " . $e->getMessage());
        }
    }
    
    /**
     * Get archived records by academic year
     */
    public function getByAcademicYear($academicYearId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT * FROM {$this->getTableName()} 
                WHERE academic_year_id = ?
                ORDER BY archive_date DESC
            ");
            $stmt->execute([$academicYearId]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching records by academic year: ' . $e->getMessage());
        }
    }
    
    /**
     * Get archived records by year code
     */
    public function getByYearCode($yearCode) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT * FROM {$this->getTableName()} 
                WHERE year_code = ?
                ORDER BY archive_date DESC
            ");
            $stmt->execute([$yearCode]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching records by year code: ' . $e->getMessage());
        }
    }

    /**
     * Get all records with user information
     */
    public function findAllWithUserInfo() {
        try {
            $stmt = $this->pdo->prepare("
                SELECT ar.*, 
                       u.name as archived_by_name
                FROM {$this->getTableName()} ar
                LEFT JOIN users u ON ar.archived_by = u.id
                ORDER BY ar.archive_date DESC
            ");
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching records with user info: ' . $e->getMessage());
        }
    }
}
?>
