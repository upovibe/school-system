<?php
// api/core/CliHandler.php - CLI command handler

class CliHandler
{
    public static function handle()
    {
        global $argv;

        if (!isset($argv[1])) {
            return false; // Not a CLI command
        }

        // Show help if requested
        if ($argv[1] === '--help' || $argv[1] === '-h') {
            require_once __DIR__ . '/../helpers/HelpSystem.php';
            
            // Check if specific command help is requested
            if (isset($argv[2])) {
                HelpSystem::showCommandHelp($argv[2]);
            } else {
                HelpSystem::showHelp();
            }
            exit();
        }

        // Load database connection first
        require_once __DIR__ . '/../database/connection.php';

        // Ensure $pdo is available globally
        global $pdo;
        if (!$pdo) {
            require_once __DIR__ . '/../helpers/HelpSystem.php';
            HelpSystem::showError("Database connection failed");
            exit(1);
        }

        // Add database connection check command
        if ($argv[1] === '--db:check') {
            require_once __DIR__ . '/../helpers/HelpSystem.php';
            try {
                $stmt = $pdo->query("SELECT 1");
                if ($stmt) {
                    HelpSystem::showSuccess("Database connection successful!");
                } else {
                    HelpSystem::showError("Database connection failed (query error)");
                }
            } catch (Exception $e) {
                HelpSystem::showError("Database connection failed: " . $e->getMessage());
            }
            exit();
        }

        switch ($argv[1]) {
            case '--migrate':
                require_once __DIR__ . '/Migrator.php';
                Migrator::run();
                exit();

            case '--seed':
                require_once __DIR__ . '/Seeder.php';
                Seeder::run();
                exit();

            case '--migrate:seed':
                require_once __DIR__ . '/Migrator.php';
                require_once __DIR__ . '/Seeder.php';
                Migrator::run();
                Seeder::run();
                exit();

            case '--clear':
                self::clearDatabase();
                exit();

            case '--fresh':
                self::freshDatabase();
                exit();

            case '--clear:data':
                self::clearAllData();
                exit();

            case '--seed:essential':
                self::seedEssentialSystem();
                exit();

            case '--seed:admin':
                self::seedAdminOnly();
                exit();

            case (preg_match('/^--email(:\S+)?$/', $argv[1]) ? $argv[1] : false):
                self::handleEmailCommand($argv[1]);
                exit();

            default:
                require_once __DIR__ . '/../helpers/HelpSystem.php';
                HelpSystem::showError("Unknown command: {$argv[1]}");
                exit(1);
        }
    }

    public static function clearAllData()
    {
        global $pdo;
        require_once __DIR__ . '/../helpers/HelpSystem.php';

        HelpSystem::showWarning("Clearing all data from database tables...");
        echo "⚠️  This will delete ALL records but keep table structure!\n";
        echo "⚠️  This action cannot be undone!\n\n";

        try {
            // Get all table names
            $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
            
            if (empty($tables)) {
                HelpSystem::showError("No tables found in database");
                return;
            }

            echo "Found " . count($tables) . " tables to clear:\n";
            foreach ($tables as $table) {
                echo "  - $table\n";
            }
            echo "\n";

            // Disable foreign key checks temporarily
            $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");

            $clearedCount = 0;
            foreach ($tables as $table) {
                try {
                    // Use TRUNCATE for better performance, fallback to DELETE if TRUNCATE fails
                    $stmt = $pdo->prepare("TRUNCATE TABLE `$table`");
                    $stmt->execute();
                    echo "✅ Cleared table: $table\n";
                    $clearedCount++;
                } catch (Exception $e) {
                    // If TRUNCATE fails (e.g., due to foreign key constraints), use DELETE
                    try {
                        $stmt = $pdo->prepare("DELETE FROM `$table`");
                        $stmt->execute();
                        echo "✅ Cleared table: $table (using DELETE)\n";
                        $clearedCount++;
                    } catch (Exception $e2) {
                        echo "❌ Failed to clear table: $table - " . $e2->getMessage() . "\n";
                    }
                }
            }

            // Re-enable foreign key checks
            $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

            echo "\n";
            HelpSystem::showSuccess("Data clearing completed!");
            echo "📊 Cleared $clearedCount out of " . count($tables) . " tables\n";
            echo "💡 Table structure preserved - you can now run migrations or seeders\n";

        } catch (Exception $e) {
            // Re-enable foreign key checks in case of error
            $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
            HelpSystem::showError("Error clearing data: " . $e->getMessage());
        }
    }

    public static function seedEssentialSystem()
    {
        global $pdo;
        require_once __DIR__ . '/../helpers/HelpSystem.php';

        HelpSystem::showSuccess("Seeding essential system components...");

        try {
            // Include the essential system seeder
            require_once __DIR__ . '/../database/seeders/essential_system_seeder.php';
            
            $essentialSeeder = new EssentialSystemSeeder($pdo);
            $essentialSeeder->run();
            
            HelpSystem::showSuccess("Essential system components seeded successfully!");
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
            HelpSystem::showError("Error seeding essential system: " . $e->getMessage());
        }
    }

    public static function seedAdminOnly()
    {
        global $pdo;
        require_once __DIR__ . '/../helpers/HelpSystem.php';

        HelpSystem::showSuccess("Seeding admin user only...");

        try {
            // Include the admin only seeder
            require_once __DIR__ . '/../database/seeders/admin_only_seeder.php';
            
            $adminSeeder = new AdminOnlySeeder($pdo);
            $adminSeeder->run();
            
            HelpSystem::showSuccess("Admin user seeded successfully!");
            echo "\n📋 Login Credentials:\n";
            echo "📧 Email: admin@school.com\n";
            echo "🔑 Password: admin123\n";
            echo "👤 Name: System Administrator\n";
            echo "🎭 Role: Admin\n";
            echo "📊 Status: Active\n";
            echo "\n💡 You can now log in to the admin panel!\n";
            
        } catch (Exception $e) {
            HelpSystem::showError("Error seeding admin user: " . $e->getMessage());
        }
    }

    public static function clearDatabase()
    {
        global $pdo;
        require_once __DIR__ . '/../helpers/HelpSystem.php';

        HelpSystem::showWarning("Clearing database...");

        try {
            // Get all table names
            $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);

            if (empty($tables)) {
                HelpSystem::showSuccess("Database is already empty");
                return;
            }

            // Disable foreign key checks
            $pdo->exec('SET FOREIGN_KEY_CHECKS = 0');

            // Drop all tables
            foreach ($tables as $table) {
                $pdo->exec("DROP TABLE IF EXISTS `$table`");
                echo "🗑️  Dropped table: $table\n";
            }

            // Re-enable foreign key checks
            $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');

            HelpSystem::showSuccess("Database cleared successfully!");
        } catch (Exception $e) {
            HelpSystem::showError("Error clearing database: " . $e->getMessage());
        }
    }

    public static function freshDatabase()
    {
        require_once __DIR__ . '/../helpers/HelpSystem.php';
        
        HelpSystem::showSuccess("Creating fresh database...");

        // Clear first
        self::clearDatabase();

        // Then migrate and seed
        require_once __DIR__ . '/Migrator.php';
        require_once __DIR__ . '/Seeder.php';

        echo "\n📦 Running migrations...\n";
        Migrator::run();

        echo "\n🌱 Running seeders...\n";
        Seeder::run();

        HelpSystem::showSuccess("Fresh database created successfully!");
    }

    private static function handleEmailCommand($command) {
        // Load Emailer
        require_once __DIR__ . '/Emailer.php';
        require_once __DIR__ . '/../helpers/HelpSystem.php';
        
        // Parse email from command - REQUIRED
        if (!preg_match('/^--email:(.+)$/', $command, $matches)) {
            HelpSystem::showError("Email address is required!");
            echo "Usage: php api/index.php --email:user@example.com\n";
            echo "Example: php api/index.php --email:test@gmail.com\n";
            return;
        }
        
        $emailAddress = trim($matches[1]);
        
        // Test email sending
        Emailer::test($emailAddress);
    }
}
