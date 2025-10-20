<?php
// api/database/seeders/run_admin_only.php - Standalone script to seed admin user only

// Include database connection
require_once __DIR__ . '/../../core/database/connection.php';

// Include the admin only seeder
require_once __DIR__ . '/admin_only_seeder.php';

// Check if we have a database connection
global $pdo;
if (!$pdo) {
    echo "❌ Database connection failed!\n";
    echo "Please check your database configuration.\n";
    exit(1);
}

echo "🚀 Starting Admin User Seeder...\n";
echo "================================\n\n";

try {
    // Create and run the admin seeder
    $adminSeeder = new AdminOnlySeeder($pdo);
    $adminSeeder->run();
    
    echo "\n================================\n";
    echo "🎉 Admin user seeding completed!\n";
    echo "\n📋 Login Credentials:\n";
    echo "📧 Email: admin@school.com\n";
    echo "🔑 Password: admin123\n";
    echo "👤 Name: System Administrator\n";
    echo "🎭 Role: Admin\n";
    echo "📊 Status: Active\n";
    echo "\n💡 You can now log in to the admin panel!\n";
    
} catch (Exception $e) {
    echo "\n❌ Error seeding admin user: " . $e->getMessage() . "\n";
    exit(1);
}
