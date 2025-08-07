<?php
// Central app configuration for database and email
return [
    'db' => [
        'host' => 'localhost', // Change to your DB host
        'name' => '4555497_school', // Change to your DB name
        'user' => 'root',      // Change to your DB user
        'pass' => '',          // Change to your DB password
    ],
    'mail' => [
        'host' => 'smtp.gmail.com',
        'port' => 465,
        'encryption' => 'ssl',
        'username' => 'uzorpromise11@gmail.com',
        'password' => 'yuwr xfnm bqrg fjof',
        'from_address' => 'noreply@schoolsystem.com',
        'from_name' => 'School System',
    ],
    'client_url' => 'http://localhost:8000',
    'api_url' => 'http://localhost:8000/api',
    'app_url' => 'http://localhost:8000',
]; 

// cd school-system; php -S localhost:8000

// cd school-system; php api/index.php --help

// cd school-system; php api/index.php --fresh