<?php
// api/core/CliHandler.php - CLI command handler

class CliHandler {
    public static function handle() {
        global $argv;
        
        if (!isset($argv[1])) {
            return false; // Not a CLI command
        }
        
        // Load database connection first
        require_once __DIR__ . '/../database/connection.php';
        
        // Ensure $pdo is available globally
        global $pdo;
        if (!$pdo) {
            die("Database connection failed\n");
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
        }
        
        return false; // Not a recognized CLI command
    }
    
    private static function clearDatabase() {
        global $pdo;
        
        echo "🗑️  Clearing database...\n";
        
        try {
            // Get all table names
            $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
            
            if (empty($tables)) {
                echo "✅ Database is already empty\n";
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
            
            echo "✅ Database cleared successfully!\n";
            
        } catch (Exception $e) {
            echo "❌ Error clearing database: " . $e->getMessage() . "\n";
        }
    }
    
    private static function freshDatabase() {
        echo "🔄 Creating fresh database...\n";
        
        // Clear first
        self::clearDatabase();
        
        // Then migrate and seed
        require_once __DIR__ . '/Migrator.php';
        require_once __DIR__ . '/Seeder.php';
        
        echo "\n📦 Running migrations...\n";
        Migrator::run();
        
        echo "\n🌱 Running seeders...\n";
        Seeder::run();
        
        echo "\n✅ Fresh database created successfully!\n";
    }
}
?> 