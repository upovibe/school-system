<?php
// api/routes/routes.php - Define all API routes here

require_once __DIR__ . '/../core/Router.php';

// Example route (developers add more here)
// Router::get('/users', 'UserController@index');
// Router::post('/users', 'UserController@store');

// Add your routes below...
Router::get('/users', 'UserController@index');
Router::post('/users', 'UserController@store');
?> 