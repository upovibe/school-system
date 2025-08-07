<?php
/**
 * Setup Grading System
 * 
 * This script runs the migrations for the grading system and seeds the database
 * with sample data using existing teachers, students, subjects, and classes.
 * 
 * Usage: php setup_grading_system.php
 */

// Set error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "🚀 Setting up Grading System...\n\n";

// Load database connection
require_once __DIR__ . '/api/database/connection.php';

if (!$pdo) {
    echo "❌ Database connection failed!\n";
    exit(1);
}

echo "✅ Database connected successfully!\n\n";

// Step 1: Run migrations
echo "📋 Step 1: Running migrations...\n";

try {
    // Create migrations table if it doesn't exist
    $pdo->exec('CREATE TABLE IF NOT EXISTS migrations (id INT AUTO_INCREMENT PRIMARY KEY, migration VARCHAR(255) UNIQUE, batch INT, executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');
    
    // Migration files for grading system
    $migrations = [
        '20241001_000040_create_grading_policies_table.php',
        '20241001_000041_create_student_grades_table.php',
        '20241001_000042_create_grading_periods_table.php'
    ];
    
    $batch = (int) $pdo->query('SELECT COALESCE(MAX(batch), 0) FROM migrations')->fetchColumn() + 1;
    
    foreach ($migrations as $migrationFile) {
        $migrationPath = __DIR__ . '/api/database/migrations/' . $migrationFile;
        
        if (!file_exists($migrationPath)) {
            echo "⚠️  Migration file not found: {$migrationFile}\n";
            continue;
        }
        
        $migrationName = basename($migrationFile, '.php');
        
        // Check if already migrated
        $stmt = $pdo->prepare('SELECT * FROM migrations WHERE migration = ?');
        $stmt->execute([$migrationName]);
        if ($stmt->fetch()) {
            echo "⏭️  Skipping already migrated: {$migrationName}\n";
            continue;
        }
        
        // Run migration
        require_once $migrationPath;
        $class = 'Migration_' . str_replace(['_', '.php'], ['', ''], $migrationName);
        
        if (class_exists($class)) {
            $migration = new $class($pdo);
            $migration->up();
            
            // Track migration
            $trackStmt = $pdo->prepare('INSERT INTO migrations (migration, batch) VALUES (?, ?)');
            $trackStmt->execute([$migrationName, $batch]);
            
            echo "✅ Migration completed: {$migrationName}\n";
        } else {
            echo "❌ Migration class not found: {$class}\n";
        }
    }
    
    echo "✅ All migrations completed!\n\n";
    
} catch (Exception $e) {
    echo "❌ Migration error: " . $e->getMessage() . "\n";
    exit(1);
}

// Step 2: Seed the database
echo "🌱 Step 2: Seeding grading system...\n";

try {
    // Include the grading period seeder
    require_once __DIR__ . '/api/database/seeders/grading_period_seeder.php';
    $gradingPeriodSeeder = new GradingPeriodSeeder($pdo);
    $gradingPeriodSeeder->run();
    
    // Include the grading policy seeder
    require_once __DIR__ . '/api/database/seeders/grading_policy_seeder.php';
    $gradingPolicySeeder = new GradingPolicySeeder($pdo);
    $gradingPolicySeeder->run();
    
    // Include the student grade seeder
    require_once __DIR__ . '/api/database/seeders/student_grade_seeder.php';
    $studentGradeSeeder = new StudentGradeSeeder($pdo);
    $studentGradeSeeder->run();
    
    echo "✅ Grading system seeded successfully!\n\n";
    
} catch (Exception $e) {
    echo "❌ Seeding error: " . $e->getMessage() . "\n";
    exit(1);
}

// Step 3: Verify setup
echo "🔍 Step 3: Verifying setup...\n";

try {
    // Check if tables exist
    $tables = ['grading_policies', 'student_grades', 'grading_periods'];
    
    foreach ($tables as $table) {
        $stmt = $pdo->query("SHOW TABLES LIKE '{$table}'");
        if ($stmt->rowCount() > 0) {
            echo "✅ Table '{$table}' exists\n";
        } else {
            echo "❌ Table '{$table}' not found\n";
        }
    }
    
    // Check if data was seeded
    $policyCount = $pdo->query("SELECT COUNT(*) FROM grading_policies")->fetchColumn();
    $periodCount = $pdo->query("SELECT COUNT(*) FROM grading_periods")->fetchColumn();
    $gradeCount = $pdo->query("SELECT COUNT(*) FROM student_grades")->fetchColumn();
    
    echo "📊 Grading policies: {$policyCount}\n";
    echo "📊 Grading periods: {$periodCount}\n";
    echo "📊 Sample grades: {$gradeCount}\n";
    
    echo "✅ Setup verification completed!\n\n";
    
} catch (Exception $e) {
    echo "❌ Verification error: " . $e->getMessage() . "\n";
    exit(1);
}

echo "🎉 Grading System Setup Complete!\n\n";
echo "📋 What was created:\n";
echo "   • 3 grading periods (First, Second, Third Term)\n";
echo "   • 5 subject-specific grading policies\n";
echo "   • Sample grades for existing students\n";
echo "   • Automatic grade calculation system\n\n";

echo "🚀 Next steps:\n";
echo "   1. Teachers can now enter raw scores\n";
echo "   2. System automatically calculates final grades\n";
echo "   3. Students can view their grades\n";
echo "   4. Admins can manage grading policies\n\n";

echo "💡 To run this setup again, use: php setup_grading_system.php\n";
?>
