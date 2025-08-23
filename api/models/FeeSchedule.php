<?php

require_once __DIR__ . '/../core/BaseModel.php';

class FeeSchedule extends BaseModel {
    protected static $table = 'fee_schedules';

    protected static $fillable = [
        'class_id', 'academic_year', 'grading_period', 'student_type', 'total_fee', 'notes', 'is_active'
    ];

    protected static $casts = [
        'total_fee' => 'decimal',
        'is_active' => 'bool'
    ];

    protected static $timestamps = true;

    /**
     * Get all fee schedules with class and academic year information
     */
    public function getAllWithDetails() {
        $sql = "
            SELECT 
                fs.*,
                c.name as class_name,
                c.section as class_section,
                c.academic_year_id,
                ay.year_code AS academic_year_code,
                ay.display_name as academic_year_display_name
            FROM fee_schedules fs
            LEFT JOIN classes c ON fs.class_id = c.id
            LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
            ORDER BY ay.start_date DESC, fs.grading_period ASC, fs.id DESC
        ";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get fee schedules by academic year
     */
    public function getByAcademicYear($academicYear) {
        $sql = "
            SELECT 
                fs.*,
                c.name as class_name,
                c.section as class_section,
                c.academic_year_id,
                ay.year_code AS academic_year_code,
                ay.display_name as academic_year_display_name
            FROM fee_schedules fs
            LEFT JOIN classes c ON fs.class_id = c.id
            LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
            WHERE fs.academic_year = ?
            ORDER BY fs.grading_period ASC, fs.id DESC
        ";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$academicYear]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get the academic year for a specific class
     */
    public function getClassAcademicYear($classId) {
        $sql = "SELECT ay.year_code, ay.display_name 
                FROM classes c 
                LEFT JOIN academic_years ay ON c.academic_year_id = ay.id 
                WHERE c.id = ? 
                LIMIT 1";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$classId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$result) {
            return null; // Class doesn't exist
        }
        
        // Return both the year code and display name
        return [
            'year_code' => $result['year_code'],
            'display_name' => $result['display_name']
        ];
    }

    /**
     * Validate that the academic year matches the class's academic year
     */
    public function validateAcademicYear($classId, $academicYear) {
        $classAcademicYear = $this->getClassAcademicYear($classId);
        
        if (!$classAcademicYear) {
            return false; // Class doesn't exist
        }

        // Check if the provided academic year matches the class's academic year
        return $academicYear === $classAcademicYear['year_code'] || 
               $academicYear === $classAcademicYear['display_name'];
    }

    /**
     * Get all classes with their academic year information for fee schedule creation
     */
    public function getClassesWithAcademicYear() {
        $sql = "SELECT 
                    c.id,
                    c.name,
                    c.section,
                    c.academic_year_id,
                    ay.year_code,
                    ay.display_name
                FROM classes c
                LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
                WHERE c.is_active = 1
                ORDER BY ay.start_date DESC, c.name ASC, c.section ASC";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}


