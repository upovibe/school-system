<?php
// Central app configuration for database and email
return [
    'db' => [
        'host' => 'localhost', // Change to your DB host
        'name' => '4555497_school_db', // Change to your DB name
        'user' => 'root',      // Change to your DB user
        'pass' => '',          // Change to your DB password
    ],
    'mail' => [
        'host' => 'mboxhosting.com',
        'port' => 465,
        'encryption' => 'ssl',
        'username' => 'info@piwcfranklincitytn.org',
        'password' => 'Piwc@FC2025',
        'from_address' => 'info@piwcfranklincitytn.org',
        'from_name' => 'School System',
    ],
    'client_url' => 'http://localhost:8000',
    'api_url' => 'http://localhost:8000/api',
    'app_url' => 'http://localhost:8000',
]; 

// cd school-system; php -S localhost:8000           # Run server

// cd school-system; php api/index.php --help       # Show help

// cd school-system; php api/index.php --fresh    # Drop tables, create tables, add default data

// cd school-system; php api/index.php --migrate    # Create tables

// cd school-system; php api/index.php --seed       # Add default data

// cd school-system; php api/index.php --email:test@example.com   # Test email
