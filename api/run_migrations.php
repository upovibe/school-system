<?php
// api/run_migrations.php - Run all database migrations

require_once __DIR__ . '/database/connection.php';

echo "Starting database migrations...\n";

// List of migrations in order
$migrations = [
    '20241001_000000_create_users_table',
    '20241001_000001_create_roles_table',
    '20241001_000002_update_users_table',
    '20241001_000003_create_user_sessions_table',
    '20241001_000004_create_password_resets_table',
    '20241001_000005_create_user_logs_table'
];

foreach ($migrations as $migration) {
    echo "Running migration: $migration\n";
    
    $className = 'Migration_' . $migration;
    $filePath = __DIR__ . '/database/migrations/' . $migration . '.php';
    
    if (file_exists($filePath)) {
        require_once $filePath;
        $migrationInstance = new $className($pdo);
        $migrationInstance->up();
        echo "✓ Completed: $migration\n";
    } else {
        echo "✗ Migration file not found: $filePath\n";
    }
}

echo "\nAll migrations completed!\n";
?> 