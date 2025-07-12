<?php
// api/routes/routes.php - Define all API routes here

require_once __DIR__ . '/../core/Router.php';

// Authentication routes (public - no middleware needed)
Router::post('/auth/login', 'AuthController@login');
Router::post('/auth/logout', 'AuthController@logout');
Router::post('/auth/refresh', 'AuthController@refresh');
Router::post('/auth/forgot-password', 'AuthController@forgotPassword');
Router::post('/auth/reset-password', 'AuthController@resetPassword');

// User management routes (protected - require authentication)
// Note: Middleware will be called inside controllers using:
// AuthMiddleware::requireAuth($pdo);
// RoleMiddleware::requireAdmin($pdo);
Router::get('/users', 'UserController@index');
Router::post('/users', 'UserController@store');
Router::get('/users/{id}', 'UserController@show');
Router::put('/users/{id}', 'UserController@update');
Router::delete('/users/{id}', 'UserController@destroy');
Router::get('/users/{id}/profile', 'UserController@profile');
Router::put('/users/{id}/profile', 'UserController@updateProfile');

// Role management routes (admin only)
// Note: Controllers will use RoleMiddleware::requireAdmin($pdo);
Router::get('/roles', 'RoleController@index');
Router::post('/roles', 'RoleController@store');
Router::get('/roles/{id}', 'RoleController@show');
Router::put('/roles/{id}', 'RoleController@update');
Router::delete('/roles/{id}', 'RoleController@destroy');

// Audit logs (admin only)
// Note: Controllers will use RoleMiddleware::requireAdmin($pdo);
Router::get('/logs', 'LogController@index');
Router::get('/logs/{id}', 'LogController@show');

// Academic Structure Routes
// Schools (admin only)
Router::get('/schools', 'SchoolController@index');
Router::post('/schools', 'SchoolController@store');
Router::get('/schools/{id}', 'SchoolController@show');
Router::put('/schools/{id}', 'SchoolController@update');
Router::delete('/schools/{id}', 'SchoolController@destroy');

// Levels (admin only)
Router::get('/levels', 'LevelController@index');
Router::post('/levels', 'LevelController@store');
Router::get('/levels/{id}', 'LevelController@show');
Router::put('/levels/{id}', 'LevelController@update');
Router::delete('/levels/{id}', 'LevelController@destroy');
Router::get('/levels/stage/{stage}', 'LevelController@getByStage');

// Academic Years (admin only)
Router::get('/academic-years', 'AcademicYearController@index');
Router::post('/academic-years', 'AcademicYearController@store');
Router::get('/academic-years/{id}', 'AcademicYearController@show');
Router::put('/academic-years/{id}', 'AcademicYearController@update');
Router::delete('/academic-years/{id}', 'AcademicYearController@destroy');
Router::get('/academic-years/active', 'AcademicYearController@getActive');
Router::post('/academic-years/{id}/activate', 'AcademicYearController@setActive');

// Terms (admin only)
Router::get('/terms', 'TermController@index');
Router::post('/terms', 'TermController@store');
Router::get('/terms/{id}', 'TermController@show');
Router::put('/terms/{id}', 'TermController@update');
Router::delete('/terms/{id}', 'TermController@destroy');
Router::get('/terms/academic-year/{academicYearId}', 'TermController@getByAcademicYear');
Router::get('/terms/active', 'TermController@getActive');
Router::get('/terms/current', 'TermController@getCurrent');
Router::post('/terms/{id}/activate', 'TermController@setActive');

// Tracks (admin only)
Router::get('/tracks', 'TrackController@index');
Router::post('/tracks', 'TrackController@store');
Router::get('/tracks/{id}', 'TrackController@show');
Router::put('/tracks/{id}', 'TrackController@update');
Router::delete('/tracks/{id}', 'TrackController@destroy');

// Example of how to add new protected routes:
// Router::get('/assignments', 'AssignmentController@index'); // Teachers and admins
// Router::post('/assignments', 'AssignmentController@store'); // Teachers and admins
// Router::get('/assignments/{id}', 'AssignmentController@show'); // All authenticated users
?> 