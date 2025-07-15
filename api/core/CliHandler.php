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

            case (preg_match('/^--email(:\S+)?$/', $argv[1]) ? $argv[1] : false):
                self::handleEmailCommand($argv[1]);
                exit();

            default:
                require_once __DIR__ . '/../helpers/HelpSystem.php';
                HelpSystem::showError("Unknown command: {$argv[1]}");
                exit(1);
        }
    }

    private static function clearDatabase()
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

    private static function freshDatabase()
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
