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
            // Get all data for the academic year
            $yearData = $this->getCompleteYearData($academicYearId);
            
            // Create complete year snapshot
            $recordData = [
                'classes' => $yearData['classes'],
                'students' => $yearData['students'],
                'teachers' => $yearData['teachers'],
                'subjects' => $yearData['subjects'],
                'grades' => $yearData['grades'],
                'fees' => $yearData['fees'],
                'grading_periods' => $yearData['grading_periods'],
                'archive_timestamp' => date('Y-m-d H:i:s')
            ];
            
            $totalRecords = count($yearData['classes']) + count($yearData['students']) + 
                           count($yearData['teachers']) + count($yearData['subjects']) + 
                           count($yearData['grades']) + count($yearData['fees']) + 
                           count($yearData['grading_periods']);
            
            $data = [
                'academic_year_id' => $academicYearId,
                'year_code' => $yearCode,
                'record_type' => 'complete_year_snapshot',
                'record_data' => json_encode($recordData),
                'total_records' => $totalRecords,
                'archived_by' => $archivedBy,
                'notes' => $notes
            ];
            
            return $this->create($data);
        } catch (Exception $e) {
            throw new Exception('Error archiving complete year: ' . $e->getMessage());
        }
    }
    
    /**
     * Get complete year data for archiving
     */
    private function getCompleteYearData($academicYearId) {
        $data = [];
        
        // Get classes and their related data
        $data['classes'] = $this->getClassesWithRelations($academicYearId);
        
        // Get students
        $data['students'] = $this->getStudentsByYear($academicYearId);
        
        // Get teachers and assignments
        $data['teachers'] = $this->getTeachersByYear($academicYearId);
        
        // Get subjects
        $data['subjects'] = $this->getSubjectsByYear($academicYearId);
        
        // Get grades
        $data['grades'] = $this->getGradesByYear($academicYearId);
        
        // Get fees
        $data['fees'] = $this->getFeesByYear($academicYearId);
        
        // Get grading periods
        $data['grading_periods'] = $this->getGradingPeriodsByYear($academicYearId);
        
        return $data;
    }
    
    /**
     * Get classes with all related data
     */
    private function getClassesWithRelations($academicYearId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT c.*, 
                       COUNT(DISTINCT s.id) as student_count,
                       COUNT(DISTINCT ta.teacher_id) as teacher_count,
                       COUNT(DISTINCT cs.subject_id) as subject_count
                FROM classes c
                LEFT JOIN students s ON c.id = s.class_id
                LEFT JOIN teacher_assignments ta ON c.id = ta.class_id
                LEFT JOIN class_subjects cs ON c.id = cs.class_id
                WHERE c.academic_year_id = ?
                GROUP BY c.id
            ");
            $stmt->execute([$academicYearId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            return [];
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
                SELECT DISTINCT t.*, ta.class_id, ta.subject_id
                FROM teachers t
                JOIN teacher_assignments ta ON t.id = ta.teacher_id
                JOIN classes c ON ta.class_id = c.id
                WHERE c.academic_year_id = ?
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
                SELECT DISTINCT sub.*, cs.class_id
                FROM subjects sub
                JOIN class_subjects cs ON sub.id = cs.subject_id
                JOIN classes c ON cs.class_id = c.id
                WHERE c.academic_year_id = ?
            ");
            $stmt->execute([$academicYearId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            return [];
        }
    }
    
    /**
     * Get grades by academic year
     */
    private function getGradesByYear($academicYearId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT sg.*, gp.name as period_name
                FROM student_grades sg
                JOIN grading_periods gp ON sg.grading_period_id = gp.id
                WHERE gp.academic_year_id = ?
            ");
            $stmt->execute([$academicYearId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            return [];
        }
    }
    
    /**
     * Get fees by academic year
     */
    private function getFeesByYear($academicYearId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT fs.*, c.name as class_name
                FROM fee_schedules fs
                JOIN classes c ON fs.class_id = c.id
                WHERE c.academic_year_id = ?
            ");
            $stmt->execute([$academicYearId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
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
}
?>
