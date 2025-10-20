<?php
// api/database/seeders/run_essential_system.php - Standalone script to seed essential system components

// Include database connection
require_once __DIR__ . '/../../core/database/connection.php';

// Include the essential system seeder
require_once __DIR__ . '/essential_system_seeder.php';

// Check if we have a database connection
global $pdo;
if (!$pdo) {
    echo "❌ Database connection failed!\n";
    echo "Please check your database configuration.\n";
    exit(1);
}

echo "🚀 Starting Essential System Seeder...\n";
echo "=====================================\n\n";

try {
    // Create and run the essential system seeder
    $essentialSeeder = new EssentialSystemSeeder($pdo);
    $essentialSeeder->run();
    
    echo "\n=====================================\n";
    echo "🎉 Essential system seeding completed!\n";
    echo "\n📋 What was seeded:\n";
    echo "🔐 Roles (admin, teacher, student, cashier)\n";
    echo "👤 Admin user account\n";
    echo "📅 Academic years\n";
    echo "📄 System pages\n";
    echo "⚙️  System settings\n";
    echo "\n📋 Admin Login Credentials:\n";
    echo "📧 Email: admin@school.com\n";
    echo "🔑 Password: admin123\n";
    echo "👤 Name: System Administrator\n";
    echo "🎭 Role: Admin\n";
    echo "📊 Status: Active\n";
    echo "\n💡 You can now log in and configure the system!\n";
    
} catch (Exception $e) {
    echo "\n❌ Error seeding essential system: " . $e->getMessage() . "\n";
    exit(1);
}
