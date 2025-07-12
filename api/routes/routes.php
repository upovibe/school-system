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

// People Management Routes
// Departments (admin only)
Router::get('/departments', 'DepartmentController@index');
Router::post('/departments', 'DepartmentController@store');
Router::get('/departments/{id}', 'DepartmentController@show');
Router::put('/departments/{id}', 'DepartmentController@update');
Router::delete('/departments/{id}', 'DepartmentController@destroy');
Router::get('/departments/{id}/teachers', 'DepartmentController@getTeachers');

// Teachers (admin only for create/update/delete, authenticated for view)
Router::get('/teachers', 'TeacherController@index');
Router::post('/teachers', 'TeacherController@store');
Router::get('/teachers/{id}', 'TeacherController@show');
Router::put('/teachers/{id}', 'TeacherController@update');
Router::delete('/teachers/{id}', 'TeacherController@destroy');
Router::get('/teachers/department/{departmentId}', 'TeacherController@getByDepartment');
Router::get('/teachers/{id}/profile', 'TeacherController@profile');

// Students (admin only for create/update/delete, authenticated for view)
Router::get('/students', 'StudentController@index');
Router::post('/students', 'StudentController@store');
Router::get('/students/{id}', 'StudentController@show');
Router::put('/students/{id}', 'StudentController@update');
Router::delete('/students/{id}', 'StudentController@destroy');
Router::get('/students/{id}/parents', 'StudentController@getParents');
Router::get('/students/{id}/profile', 'StudentController@profile');

// Parents (admin only for create/update/delete, authenticated for view)
Router::get('/parents', 'ParentController@index');
Router::post('/parents', 'ParentController@store');
Router::get('/parents/{id}', 'ParentController@show');
Router::put('/parents/{id}', 'ParentController@update');
Router::delete('/parents/{id}', 'ParentController@destroy');
Router::get('/parents/{id}/students', 'ParentController@getStudents');
Router::post('/parents/{id}/link-student', 'ParentController@linkToStudent');
Router::post('/parents/{id}/unlink-student', 'ParentController@unlinkFromStudent');
Router::get('/parents/{id}/profile', 'ParentController@profile');

// Staff (admin only for create/update/delete, authenticated for view)
Router::get('/staff', 'StaffController@index');
Router::post('/staff', 'StaffController@store');
Router::get('/staff/{id}', 'StaffController@show');
Router::put('/staff/{id}', 'StaffController@update');
Router::delete('/staff/{id}', 'StaffController@destroy');
Router::get('/staff/department/{department}', 'StaffController@getByDepartment');
Router::get('/staff/position/{position}', 'StaffController@getByPosition');
Router::get('/staff/{id}/profile', 'StaffController@profile');

// Example of how to add new protected routes:
// Router::get('/assignments', 'AssignmentController@index'); // Teachers and admins
// Router::post('/assignments', 'AssignmentController@store'); // Teachers and admins
// Router::get('/assignments/{id}', 'AssignmentController@show'); // All authenticated users
?> 