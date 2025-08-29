<?php
// api/models/AnnouncementModel.php - Model for announcements table

require_once __DIR__ . '/../core/BaseModel.php';

class AnnouncementModel extends BaseModel {
    protected static $table = 'announcements';
    
    // Fields that can be mass assigned
    protected static $fillable = [
        'title',
        'content',
        'announcement_type',
        'priority',
        'target_audience',
        'target_class_id',
        'is_active',
        'is_pinned',
        'expires_at',
        'created_by'
    ];
    
    // Fields that should be cast to specific types
    protected static $casts = [
        'target_class_id' => 'integer',
        'created_by' => 'integer',
        'is_active' => 'boolean',
        'is_pinned' => 'boolean',
        'expires_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];
    
    // Whether the model uses timestamps
    protected static $timestamps = true;

    public function __construct($pdo) {
        parent::__construct($pdo);
    }
    
    /**
     * Get active announcements for a specific audience
     */
    public function getActiveAnnouncements($audience = 'all', $classId = null, $limit = null) {
        try {
            $sql = "
                SELECT 
                    a.*,
                    u.name as creator_name,
                    r.name as creator_role,
                    c.name as class_name,
                    c.section as class_section
                FROM announcements a
                LEFT JOIN users u ON a.created_by = u.id
                LEFT JOIN roles r ON u.role_id = r.id
                LEFT JOIN classes c ON a.target_class_id = c.id
                WHERE a.is_active = 1 
                AND (a.expires_at IS NULL OR a.expires_at > NOW())
            ";
            
            $params = [];
            
            // Filter by target audience
            if ($audience !== 'all') {
                if ($audience === 'specific_class' && $classId) {
                    $sql .= " AND (a.target_audience = 'specific_class' AND a.target_class_id = ?)";
                    $params[] = $classId;
                } elseif ($audience === 'specific_class') {
                    $sql .= " AND a.target_audience = 'specific_class'";
                } else {
                    $sql .= " AND (a.target_audience = ? OR a.target_audience = 'all')";
                    $params[] = $audience;
                }
            }
            
            $sql .= " ORDER BY a.is_pinned DESC, a.priority DESC, a.created_at DESC";
            
            if ($limit) {
                $sql .= " LIMIT " . (int)$limit;
            }
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching active announcements: ' . $e->getMessage());
        }
    }
    
    /**
     * Get announcements by creator (user)
     */
    public function getAnnouncementsByCreator($userId, $limit = null) {
        try {
            $sql = "
                SELECT 
                    a.*,
                    c.name as class_name,
                    c.section as class_section
                FROM announcements a
                LEFT JOIN classes c ON a.target_class_id = c.id
                WHERE a.created_by = ?
                ORDER BY a.created_at DESC
            ";
            
            if ($limit) {
                $sql .= " LIMIT " . (int)$limit;
            }
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$userId]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching announcements by creator: ' . $e->getMessage());
        }
    }
    
    /**
     * Get announcements by type
     */
    public function getAnnouncementsByType($type, $limit = null) {
        try {
            $sql = "
                SELECT 
                    a.*,
                    u.name as creator_name,
                    r.name as creator_role,
                    c.name as class_name,
                    c.section as class_section
                FROM announcements a
                LEFT JOIN users u ON a.created_by = u.id
                LEFT JOIN roles r ON u.role_id = r.id
                LEFT JOIN classes c ON a.target_class_id = c.id
                WHERE a.announcement_type = ? 
                AND a.is_active = 1
                AND (a.expires_at IS NULL OR a.expires_at > NOW())
                ORDER BY a.is_pinned DESC, a.priority DESC, a.created_at DESC
            ";
            
            if ($limit) {
                $sql .= " LIMIT " . (int)$limit;
            }
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$type]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching announcements by type: ' . $e->getMessage());
        }
    }
    
    /**
     * Get pinned announcements
     */
    public function getPinnedAnnouncements($audience = 'all', $classId = null) {
        try {
            $sql = "
                SELECT 
                    a.*,
                    u.name as creator_name,
                    r.name as creator_role,
                    c.name as class_name,
                    c.section as class_section
                FROM announcements a
                LEFT JOIN users u ON a.created_by = u.id
                LEFT JOIN roles r ON u.role_id = r.id
                LEFT JOIN classes c ON a.target_class_id = c.id
                WHERE a.is_pinned = 1 
                AND a.is_active = 1
                AND (a.expires_at IS NULL OR a.expires_at > NOW())
            ";
            
            $params = [];
            
            // Filter by target audience
            if ($audience !== 'all') {
                if ($audience === 'specific_class' && $classId) {
                    $sql .= " AND (a.target_audience = 'specific_class' AND a.target_class_id = ?)";
                    $params[] = $classId;
                } elseif ($audience === 'specific_class') {
                    $sql .= " AND a.target_audience = 'specific_class'";
                } else {
                    $sql .= " AND (a.target_audience = ? OR a.target_audience = 'all')";
                    $params[] = $audience;
                }
            }
            
            $sql .= " ORDER BY a.priority DESC, a.created_at DESC";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching pinned announcements: ' . $e->getMessage());
        }
    }
    
    /**
     * Search announcements
     */
    public function searchAnnouncements($query, $filters = [], $limit = null) {
        try {
            $sql = "
                SELECT 
                    a.*,
                    u.name as creator_name,
                    r.name as creator_role,
                    c.name as class_name,
                    c.section as class_section
                FROM announcements a
                LEFT JOIN users u ON a.created_by = u.id
                LEFT JOIN roles r ON u.role_id = r.id
                LEFT JOIN classes c ON a.target_class_id = c.id
                WHERE a.is_active = 1
            ";
            
            $params = [];
            $conditions = [];
            
            // Search query
            if (!empty($query)) {
                $conditions[] = "(a.title LIKE ? OR a.content LIKE ?)";
                $params[] = "%{$query}%";
                $params[] = "%{$query}%";
            }
            
            // Apply filters
            if (!empty($filters['announcement_type'])) {
                $conditions[] = "a.announcement_type = ?";
                $params[] = $filters['announcement_type'];
            }
            
            if (!empty($filters['priority'])) {
                $conditions[] = "a.priority = ?";
                $params[] = $filters['priority'];
            }
            
            if (!empty($filters['target_audience'])) {
                $conditions[] = "a.target_audience = ?";
                $params[] = $filters['target_audience'];
            }
            
            if (!empty($filters['created_by'])) {
                $conditions[] = "a.created_by = ?";
                $params[] = $filters['created_by'];
            }
            
            if (!empty($filters['is_pinned'])) {
                $conditions[] = "a.is_pinned = ?";
                $params[] = $filters['is_pinned'];
            }
            
            // Add conditions to SQL
            if (!empty($conditions)) {
                $sql .= " AND " . implode(' AND ', $conditions);
            }
            
            $sql .= " ORDER BY a.is_pinned DESC, a.priority DESC, a.created_at DESC";
            
            if ($limit) {
                $sql .= " LIMIT " . (int)$limit;
            }
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error searching announcements: ' . $e->getMessage());
        }
    }
    
    /**
     * Get announcement with creator details
     */
    public function getAnnouncementWithCreator($id) {
        try {
            $sql = "
                SELECT 
                    a.*,
                    u.name as creator_name,
                    r.name as creator_role,
                    u.email as creator_email,
                    c.name as class_name,
                    c.section as class_section
                FROM announcements a
                LEFT JOIN users u ON a.created_by = u.id
                LEFT JOIN roles r ON u.role_id = r.id
                LEFT JOIN classes c ON a.target_class_id = c.id
                WHERE a.id = ?
            ";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result) {
                $result = $this->applyCasts($result);
            }
            
            return $result;
        } catch (PDOException $e) {
            throw new Exception('Error fetching announcement with creator: ' . $e->getMessage());
        }
    }
    
    /**
     * Toggle pin status
     */
    public function togglePin($id) {
        try {
            $current = $this->findById($id);
            if (!$current) {
                throw new Exception('Announcement not found');
            }
            
            $newPinStatus = $current['is_pinned'] ? 0 : 1;
            $this->update($id, ['is_pinned' => $newPinStatus]);
            
            return $newPinStatus;
        } catch (Exception $e) {
            throw new Exception('Error toggling pin status: ' . $e->getMessage());
        }
    }
    
    /**
     * Get expired announcements
     */
    public function getExpiredAnnouncements() {
        try {
            $sql = "
                SELECT * FROM announcements 
                WHERE expires_at IS NOT NULL 
                AND expires_at <= NOW() 
                AND is_active = 1
            ";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching expired announcements: ' . $e->getMessage());
        }
    }
    
    /**
     * Deactivate expired announcements
     */
    public function deactivateExpiredAnnouncements() {
        try {
            $sql = "
                UPDATE announcements 
                SET is_active = 0, updated_at = NOW()
                WHERE expires_at IS NOT NULL 
                AND expires_at <= NOW() 
                AND is_active = 1
            ";
            
            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute();
        } catch (PDOException $e) {
            throw new Exception('Error deactivating expired announcements: ' . $e->getMessage());
        }
    }

    /**
     * Get all announcements with enhanced details (for admin)
     */
    public function getAllWithDetails($where = '', $params = []) {
        try {
            $sql = "
                SELECT 
                    a.*,
                    u.name as creator_name,
                    r.name as creator_role,
                    u.email as creator_email,
                    c.name as class_name,
                    c.section as class_section
                FROM announcements a
                LEFT JOIN users u ON a.created_by = u.id
                LEFT JOIN roles r ON u.role_id = r.id
                LEFT JOIN classes c ON a.target_class_id = c.id
            ";
            
            if ($where) {
                $sql .= " " . $where;
            }
            
            $sql .= " ORDER BY a.is_pinned DESC, a.priority DESC, a.created_at DESC";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching announcements with details: ' . $e->getMessage());
        }
    }

    /**
     * Get announcement with details by ID (for admin)
     */
    public function getWithDetails($id) {
        try {
            $sql = "
                SELECT 
                    a.*,
                    u.name as creator_name,
                    r.name as creator_role,
                    u.email as creator_email,
                    c.name as class_name,
                    c.section as class_section
                FROM announcements a
                LEFT JOIN users u ON a.created_by = u.id
                LEFT JOIN roles r ON u.role_id = r.id
                LEFT JOIN classes c ON a.target_class_id = c.id
                WHERE a.id = ?
            ";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result) {
                $result = $this->applyCasts($result);
            }
            
            return $result;
        } catch (PDOException $e) {
            throw new Exception('Error fetching announcement with details: ' . $e->getMessage());
        }
    }

    /**
     * Get announcement statistics (for admin)
     */
    public function getStats() {
        try {
            $sql = "
                SELECT 
                    COUNT(*) as total_announcements,
                    SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_announcements,
                    SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_announcements,
                    SUM(CASE WHEN is_pinned = 1 THEN 1 ELSE 0 END) as pinned_announcements,
                    SUM(CASE WHEN expires_at IS NOT NULL AND expires_at <= NOW() THEN 1 ELSE 0 END) as expired_announcements,
                    COUNT(DISTINCT announcement_type) as unique_types,
                    COUNT(DISTINCT target_audience) as unique_audiences
                FROM announcements
            ";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Get counts by type
            $typeSql = "
                SELECT 
                    announcement_type,
                    COUNT(*) as count
                FROM announcements 
                WHERE is_active = 1
                GROUP BY announcement_type
            ";
            $typeStmt = $this->pdo->prepare($typeSql);
            $typeStmt->execute();
            $typeCounts = $typeStmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get counts by priority
            $prioritySql = "
                SELECT 
                    priority,
                    COUNT(*) as count
                FROM announcements 
                WHERE is_active = 1
                GROUP BY priority
            ";
            $priorityStmt = $this->pdo->prepare($prioritySql);
            $priorityStmt->execute();
            $priorityCounts = $priorityStmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get counts by target audience
            $audienceSql = "
                SELECT 
                    target_audience,
                    COUNT(*) as count
                FROM announcements 
                WHERE is_active = 1
                GROUP BY target_audience
            ";
            $audienceStmt = $this->pdo->prepare($audienceSql);
            $audienceStmt->execute();
            $audienceCounts = $audienceStmt->fetchAll(PDO::FETCH_ASSOC);
            
            return [
                'overview' => $result,
                'by_type' => $typeCounts,
                'by_priority' => $priorityCounts,
                'by_audience' => $audienceCounts
            ];
        } catch (PDOException $e) {
            throw new Exception('Error fetching announcement statistics: ' . $e->getMessage());
        }
    }
}
?>
