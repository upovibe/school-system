<?php
// api/controllers/AdmissionConfigController.php - Controller for admission configuration management

require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';
require_once __DIR__ . '/../models/AdmissionConfigModel.php';
require_once __DIR__ . '/../models/AcademicYearModel.php';
require_once __DIR__ . '/../models/UserLogModel.php';

class AdmissionConfigController {
    private $pdo;
    private $admissionConfigModel;
    private $academicYearModel;
    private $userLogModel;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->admissionConfigModel = new AdmissionConfigModel($pdo);
        $this->academicYearModel = new AcademicYearModel($pdo);
        $this->userLogModel = new UserLogModel($pdo);
    }

    /**
     * Get current admission configuration (public for form display)
     */
    public function getCurrent() {
        try {
            $config = $this->admissionConfigModel->getCurrentConfig();
            
            if (!$config) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'No admission configuration found'
                ]);
                return;
            }

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $config,
                'message' => 'Admission configuration retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving admission configuration: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get admission configuration by academic year (admin only)
     */
    public function getByYear($yearId) {
        try {
            RoleMiddleware::requireAdmin($this->pdo);
            
            $config = $this->admissionConfigModel->getConfigByYear($yearId);
            
            if (!$config) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'No admission configuration found for this academic year'
                ]);
                return;
            }

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $config,
                'message' => 'Admission configuration retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving admission configuration: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get all admission configurations (admin only)
     */
    public function index() {
        try {
            RoleMiddleware::requireAdmin($this->pdo);
            
            $configs = $this->admissionConfigModel->findAll();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $configs,
                'message' => 'Admission configurations retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving admission configurations: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Create new admission configuration (admin only)
     */
    public function store() {
        try {
            RoleMiddleware::requireAdmin($this->pdo);
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validate required fields
            $required = ['academic_year_id'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => "Missing required field: $field"
                    ]);
                    return;
                }
            }

            // Check if academic year exists
            $academicYear = $this->academicYearModel->findById($data['academic_year_id']);
            if (!$academicYear) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Academic year not found'
                ]);
                return;
            }

            // Check if config already exists for this academic year
            $existingConfig = $this->admissionConfigModel->getConfigByYear($data['academic_year_id']);
            if ($existingConfig) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Admission configuration already exists for this academic year'
                ]);
                return;
            }

            // Set default values if not provided
            $defaultData = [
                'admission_status' => 'open',
                'enabled_levels' => ['primary', 'jhs', 'shs'],
                'level_classes' => [
                    'primary' => ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'],
                    'jhs' => ['JHS1', 'JHS2', 'JHS3'],
                    'shs' => ['SHS1', 'SHS2', 'SHS3']
                ],
                'shs_programmes' => ['Science', 'Business', 'Arts', 'General Arts'],
                'school_types' => ['day', 'boarding'],
                'required_documents' => ['birth_certificate', 'passport_photo', 'report_card'],
                'student_info_fields' => $this->getDefaultStudentInfoFields(),
                'parent_guardian_fields' => $this->getDefaultParentGuardianFields(),
                'academic_background_fields' => $this->getDefaultAcademicBackgroundFields(),
                'health_info_fields' => $this->getDefaultHealthInfoFields()
            ];

            $configData = array_merge($defaultData, $data);
            
            $id = $this->admissionConfigModel->create($configData);
            
            // Log the action
            $this->userLogModel->create([
                'user_id' => $_SESSION['user_id'] ?? null,
                'action' => 'create_admission_config',
                'description' => "Created admission configuration for academic year {$academicYear['year_code']}",
                'ip_address' => $_SERVER['REMOTE_ADDR'] ?? null,
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null
            ]);

            http_response_code(201);
            echo json_encode([
                'success' => true,
                'data' => ['id' => $id],
                'message' => 'Admission configuration created successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error creating admission configuration: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Update admission configuration (admin only)
     */
    public function update($id) {
        try {
            RoleMiddleware::requireAdmin($this->pdo);
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Check if config exists
            $existingConfig = $this->admissionConfigModel->findById($id);
            if (!$existingConfig) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Admission configuration not found'
                ]);
                return;
            }

            // Validate field configurations if provided
            if (isset($data['student_info_fields'])) {
                if (!$this->admissionConfigModel->validateFieldConfig($data['student_info_fields'])) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Invalid student info fields configuration'
                    ]);
                    return;
                }
            }

            $this->admissionConfigModel->update($id, $data);
            
            // Log the action
            $this->userLogModel->create([
                'user_id' => $_SESSION['user_id'] ?? null,
                'action' => 'update_admission_config',
                'description' => "Updated admission configuration ID: $id",
                'ip_address' => $_SERVER['REMOTE_ADDR'] ?? null,
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null
            ]);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Admission configuration updated successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error updating admission configuration: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Update form fields configuration (admin only)
     */
    public function updateFormFields($id) {
        try {
            RoleMiddleware::requireAdmin($this->pdo);
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validate required fields
            $required = ['section', 'fields'];
            foreach ($required as $field) {
                if (!isset($data[$field])) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => "Missing required field: $field"
                    ]);
                    return;
                }
            }

            $validSections = ['student_info', 'parent_guardian', 'academic_background', 'health_info', 'document_upload'];
            if (!in_array($data['section'], $validSections)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Invalid section. Must be one of: ' . implode(', ', $validSections)
                ]);
                return;
            }

            // Validate field configuration
            if (!$this->admissionConfigModel->validateFieldConfig($data['fields'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Invalid field configuration'
                ]);
                return;
            }

            $this->admissionConfigModel->updateFormFields($id, $data['section'], $data['fields']);
            
            // Log the action
            $this->userLogModel->create([
                'user_id' => $_SESSION['user_id'] ?? null,
                'action' => 'update_form_fields',
                'description' => "Updated {$data['section']} form fields for admission configuration ID: $id",
                'ip_address' => $_SERVER['REMOTE_ADDR'] ?? null,
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null
            ]);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Form fields updated successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error updating form fields: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Toggle admission status (admin only)
     */
    public function toggleStatus($id) {
        try {
            RoleMiddleware::requireAdmin($this->pdo);
            
            $config = $this->admissionConfigModel->findById($id);
            if (!$config) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Admission configuration not found'
                ]);
                return;
            }

            $newStatus = $config['admission_status'] === 'open' ? 'closed' : 'open';
            $this->admissionConfigModel->update($id, ['admission_status' => $newStatus]);
            
            // Log the action
            $this->userLogModel->create([
                'user_id' => $_SESSION['user_id'] ?? null,
                'action' => 'toggle_admission_status',
                'description' => "Changed admission status to $newStatus for configuration ID: $id",
                'ip_address' => $_SERVER['REMOTE_ADDR'] ?? null,
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null
            ]);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => ['admission_status' => $newStatus],
                'message' => "Admission status changed to $newStatus"
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error toggling admission status: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Delete admission configuration (admin only)
     */
    public function destroy($id) {
        try {
            RoleMiddleware::requireAdmin($this->pdo);
            
            $config = $this->admissionConfigModel->findById($id);
            if (!$config) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Admission configuration not found'
                ]);
                return;
            }

            $this->admissionConfigModel->delete($id);
            
            // Log the action
            $this->userLogModel->create([
                'user_id' => $_SESSION['user_id'] ?? null,
                'action' => 'delete_admission_config',
                'description' => "Deleted admission configuration ID: $id",
                'ip_address' => $_SERVER['REMOTE_ADDR'] ?? null,
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null
            ]);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Admission configuration deleted successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error deleting admission configuration: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get admission statistics (admin only)
     */
    public function getStatistics() {
        try {
            RoleMiddleware::requireAdmin($this->pdo);
            
            $stats = $this->admissionConfigModel->getStatistics();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $stats,
                'message' => 'Admission statistics retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving admission statistics: ' . $e->getMessage()
            ]);
        }
    }

    // Default field configurations
    private function getDefaultStudentInfoFields() {
        return [
            [
                'name' => 'first_name',
                'label' => 'First Name',
                'type' => 'text',
                'required' => true,
                'enabled' => true,
                'for_levels' => ['all']
            ],
            [
                'name' => 'middle_name',
                'label' => 'Middle Name',
                'type' => 'text',
                'required' => false,
                'enabled' => true,
                'for_levels' => ['all']
            ],
            [
                'name' => 'last_name',
                'label' => 'Last Name',
                'type' => 'text',
                'required' => true,
                'enabled' => true,
                'for_levels' => ['all']
            ],
            [
                'name' => 'gender',
                'label' => 'Gender',
                'type' => 'select',
                'required' => true,
                'enabled' => true,
                'options' => ['Male', 'Female'],
                'for_levels' => ['all']
            ],
            [
                'name' => 'date_of_birth',
                'label' => 'Date of Birth',
                'type' => 'date',
                'required' => true,
                'enabled' => true,
                'for_levels' => ['all']
            ],
            [
                'name' => 'place_of_birth',
                'label' => 'Place of Birth',
                'type' => 'text',
                'required' => false,
                'enabled' => true,
                'for_levels' => ['all']
            ],
            [
                'name' => 'nationality',
                'label' => 'Nationality',
                'type' => 'text',
                'required' => true,
                'enabled' => true,
                'for_levels' => ['all']
            ],
            [
                'name' => 'religion',
                'label' => 'Religion/Denomination',
                'type' => 'text',
                'required' => false,
                'enabled' => true,
                'for_levels' => ['all']
            ],
            [
                'name' => 'passport_photo',
                'label' => 'Passport Photo',
                'type' => 'file',
                'required' => true,
                'enabled' => true,
                'for_levels' => ['all']
            ],
            [
                'name' => 'birth_certificate',
                'label' => 'Birth Certificate',
                'type' => 'file',
                'required' => true,
                'enabled' => true,
                'for_levels' => ['all']
            ]
        ];
    }

    private function getDefaultParentGuardianFields() {
        return [
            [
                'name' => 'parent_full_name',
                'label' => 'Parent/Guardian Full Name',
                'type' => 'text',
                'required' => true,
                'enabled' => true,
                'for_levels' => ['all']
            ],
            [
                'name' => 'relationship',
                'label' => 'Relationship to Student',
                'type' => 'select',
                'required' => true,
                'enabled' => true,
                'options' => ['Father', 'Mother', 'Guardian', 'Other'],
                'allow_other' => true,
                'for_levels' => ['all']
            ],
            [
                'name' => 'phone_number',
                'label' => 'Phone Number',
                'type' => 'tel',
                'required' => true,
                'enabled' => true,
                'for_levels' => ['all']
            ],
            [
                'name' => 'email',
                'label' => 'Email Address',
                'type' => 'email',
                'required' => false,
                'enabled' => true,
                'for_levels' => ['all']
            ],
            [
                'name' => 'occupation',
                'label' => 'Occupation',
                'type' => 'text',
                'required' => false,
                'enabled' => true,
                'for_levels' => ['all']
            ],
            [
                'name' => 'emergency_contact',
                'label' => 'Emergency Contact',
                'type' => 'text',
                'required' => false,
                'enabled' => true,
                'for_levels' => ['all']
            ],
            [
                'name' => 'residential_address',
                'label' => 'Residential Address',
                'type' => 'textarea',
                'required' => true,
                'enabled' => true,
                'for_levels' => ['all']
            ]
        ];
    }

    private function getDefaultAcademicBackgroundFields() {
        return [
            [
                'name' => 'previous_school',
                'label' => 'Previous School Attended',
                'type' => 'text',
                'required' => false,
                'enabled' => true,
                'for_levels' => ['primary', 'jhs', 'shs']
            ],
            [
                'name' => 'last_class_completed',
                'label' => 'Last Class Completed',
                'type' => 'text',
                'required' => false,
                'enabled' => true,
                'for_levels' => ['primary', 'jhs', 'shs']
            ],
            [
                'name' => 'report_card',
                'label' => 'Report Card Upload',
                'type' => 'file',
                'required' => false,
                'enabled' => true,
                'for_levels' => ['primary', 'jhs', 'shs']
            ],
            [
                'name' => 'bece_results',
                'label' => 'BECE Results',
                'type' => 'file',
                'required' => false,
                'enabled' => true,
                'for_levels' => ['shs']
            ],
            [
                'name' => 'transfer_letter',
                'label' => 'Transfer Letter',
                'type' => 'file',
                'required' => false,
                'enabled' => true,
                'for_levels' => ['primary', 'jhs', 'shs']
            ]
        ];
    }

    private function getDefaultAdmissionDetailsFields() {
        return [
            [
                'name' => 'level_applying',
                'label' => 'Level Applying For',
                'type' => 'select',
                'required' => true,
                'enabled' => true,
                'options' => ['Creche', 'Nursery', 'KG', 'Primary', 'JHS', 'SHS'],
                'for_levels' => ['all']
            ],
            [
                'name' => 'class_applying',
                'label' => 'Class Applying For',
                'type' => 'select',
                'required' => true,
                'enabled' => true,
                'options' => [], // Will be populated dynamically based on level
                'for_levels' => ['all']
            ],
            [
                'name' => 'academic_program',
                'label' => 'Academic Program',
                'type' => 'select',
                'required' => false,
                'enabled' => true,
                'options' => ['Science', 'Business', 'Arts', 'General Arts'],
                'for_levels' => ['shs']
            ],
            [
                'name' => 'school_type',
                'label' => 'School Type Preference',
                'type' => 'select',
                'required' => true,
                'enabled' => true,
                'options' => ['day', 'boarding'],
                'for_levels' => ['all']
            ]
        ];
    }

    private function getDefaultHealthInfoFields() {
        return [
            [
                'name' => 'blood_group',
                'label' => 'Blood Group',
                'type' => 'select',
                'required' => false,
                'enabled' => true,
                'options' => ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
                'for_levels' => ['all']
            ],
            [
                'name' => 'allergies',
                'label' => 'Allergies',
                'type' => 'select_multiple',
                'required' => false,
                'enabled' => true,
                'options' => ['None', 'Food', 'Medication', 'Environmental', 'Other'],
                'allow_other' => true,
                'for_levels' => ['all']
            ],
            [
                'name' => 'medical_conditions',
                'label' => 'Medical Conditions',
                'type' => 'select_multiple',
                'required' => false,
                'enabled' => true,
                'options' => ['None', 'Asthma', 'Diabetes', 'Epilepsy', 'Heart Condition', 'Other'],
                'allow_other' => true,
                'for_levels' => ['all']
            ],
            [
                'name' => 'immunization_card',
                'label' => 'Immunization Card Upload',
                'type' => 'file',
                'required' => false,
                'enabled' => false,
                'for_levels' => ['all']
            ]
        ];
    }

}
?>
