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
Router::post('/users/{id}/change-password', 'UserController@changePassword');
Router::post('/users/{id}/upload-profile-image', 'UserController@uploadProfileImage');

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

// Page Management Routes (admin only for create/update/delete, public for view)
Router::get('/pages', 'PageController@index');
Router::post('/pages', 'PageController@store');
Router::get('/pages/active', 'PageController@getActive');
Router::get('/pages/slug/{slug}', 'PageController@showBySlug');
Router::get('/pages/{id}', 'PageController@show');
Router::put('/pages/{id}', 'PageController@update');
Router::delete('/pages/{id}', 'PageController@destroy');

// Settings Management Routes (admin only for create/update/delete, public for view)
Router::get('/settings', 'SettingController@index');
Router::post('/settings', 'SettingController@store');
Router::get('/settings/theme', 'SettingController@getThemeSettings');
Router::get('/settings/contact', 'SettingController@getContactSettings');
Router::get('/settings/social', 'SettingController@getSocialSettings');
Router::get('/settings/map', 'SettingController@getMapSettings');
Router::get('/settings/all', 'SettingController@getAllAsArray');
Router::get('/settings/upload-stats', 'SettingController@getUploadStats');
Router::get('/settings/key/{key}', 'SettingController@showByKey');
Router::get('/settings/category/{category}', 'SettingController@getByCategory');
Router::get('/settings/{id}', 'SettingController@show');
Router::put('/settings/{id}', 'SettingController@update');
Router::delete('/settings/{id}', 'SettingController@destroy');

// Event Management Routes (admin only for create/update/delete, public for view)
Router::get('/events', 'EventController@index');
Router::post('/events', 'EventController@store');
Router::get('/events/active', 'EventController@getActive');
Router::get('/events/upcoming', 'EventController@getUpcoming');
Router::get('/events/category', 'EventController@getByCategory');
Router::get('/events/search', 'EventController@search');
Router::get('/events/slug/{slug}', 'EventController@showBySlug');
Router::get('/events/{id}', 'EventController@show');
Router::put('/events/{id}', 'EventController@update');
Router::delete('/events/{id}', 'EventController@destroy');
Router::put('/events/{id}/toggle-active', 'EventController@toggleActive');
Router::put('/events/{id}/status', 'EventController@updateStatus');

// News Management Routes (admin only for create/update/delete, public for view)
Router::get('/news', 'NewsController@index');
Router::post('/news', 'NewsController@store');
Router::get('/news/active', 'NewsController@getActive');
Router::get('/news/recent', 'NewsController@getRecent');
Router::get('/news/search', 'NewsController@search');
Router::get('/news/slug/{slug}', 'NewsController@showBySlug');
Router::get('/news/{id}', 'NewsController@show');
Router::put('/news/{id}', 'NewsController@update');
Router::delete('/news/{id}', 'NewsController@destroy');

// Gallery Management Routes (admin only for create/update/delete, public for view)
Router::get('/galleries', 'GalleryController@index');
Router::post('/galleries', 'GalleryController@store');
Router::get('/galleries/active', 'GalleryController@getActive');
Router::get('/galleries/recent', 'GalleryController@getRecent');
Router::get('/galleries/search', 'GalleryController@search');
Router::get('/galleries/slug/{slug}', 'GalleryController@showBySlug');
Router::get('/galleries/{id}', 'GalleryController@show');
Router::put('/galleries/{id}', 'GalleryController@update');
Router::delete('/galleries/{id}', 'GalleryController@destroy');
Router::delete('/galleries/{id}/images/{imageIndex}', 'GalleryController@removeImage');

// Video Gallery Management Routes (admin only for create/update/delete, public for view)
Router::get('/video-galleries', 'VideoGalleryController@index');
Router::post('/video-galleries', 'VideoGalleryController@store');
Router::get('/video-galleries/active', 'VideoGalleryController@getActive');
Router::get('/video-galleries/recent', 'VideoGalleryController@getRecent');
Router::get('/video-galleries/search', 'VideoGalleryController@search');
Router::get('/video-galleries/slug/{slug}', 'VideoGalleryController@showBySlug');
Router::get('/video-galleries/{id}', 'VideoGalleryController@show');
Router::put('/video-galleries/{id}', 'VideoGalleryController@update');
Router::delete('/video-galleries/{id}', 'VideoGalleryController@destroy');
Router::delete('/video-galleries/{id}/videos/{videoIndex}', 'VideoGalleryController@removeVideoLink');

// Team Management Routes (admin only for create/update/delete, public for view)
Router::get('/teams', 'TeamController@index');
Router::get('/teams/public', 'TeamController@getPublic');
Router::post('/teams', 'TeamController@store');
Router::get('/teams/department/{department}', 'TeamController@getByDepartment');
Router::get('/teams/{id}', 'TeamController@show');
Router::put('/teams/{id}', 'TeamController@update');
Router::delete('/teams/{id}', 'TeamController@destroy');

// Guest Applications
Router::get('/applications', 'ApplicationController@index');
Router::get('/applications/{id}', 'ApplicationController@show');
Router::post('/applications', 'ApplicationController@store');

// Subject Management Routes (admin only for create/update/delete, public for getActive)
Router::get('/subjects', 'SubjectController@index');
Router::post('/subjects', 'SubjectController@store');
Router::get('/subjects/active', 'SubjectController@getActive');
Router::get('/subjects/search', 'SubjectController@search');
Router::get('/subjects/with-class-counts', 'SubjectController@getWithClassCounts');
Router::get('/subjects/{id}', 'SubjectController@show');
Router::put('/subjects/{id}', 'SubjectController@update');
Router::delete('/subjects/{id}', 'SubjectController@destroy');

// Class Management Routes (admin only for create/update/delete, public for getActive)
Router::get('/classes', 'ClassController@index');
Router::post('/classes', 'ClassController@store');
Router::get('/classes/active', 'ClassController@getActive');
Router::get('/classes/search', 'ClassController@search');
Router::get('/classes/with-student-counts', 'ClassController@getWithStudentCounts');
Router::get('/classes/by-academic-year', 'ClassController@getByAcademicYear');
Router::get('/classes/academic-years', 'ClassController@getAcademicYears');
Router::get('/classes/sections', 'ClassController@getSections');
Router::get('/classes/{id}', 'ClassController@show');
Router::put('/classes/{id}', 'ClassController@update');
Router::delete('/classes/{id}', 'ClassController@destroy');

// Teacher Management Routes (admin only)
Router::get('/teachers', 'TeacherController@index');
Router::post('/teachers', 'TeacherController@store');
Router::get('/teachers/active', 'TeacherController@getActive');
Router::get('/teachers/search', 'TeacherController@search');
Router::get('/teachers/with-assignment-counts', 'TeacherController@getWithAssignmentCounts');
Router::get('/teachers/specializations', 'TeacherController@getSpecializations');
Router::get('/teachers/by-specialization', 'TeacherController@getBySpecialization');
Router::get('/teachers/statistics', 'TeacherController@getStatistics');
Router::get('/teachers/class-teachers', 'TeacherController@getClassTeachers');
Router::get('/teachers/available-classes', 'TeacherController@getAvailableClasses');
Router::get('/teachers/my-class', 'TeacherController@getMyClass');
Router::get('/teachers/my-assignments', 'TeacherController@getMyAssignments');
Router::get('/teachers/my-class-assignments', 'TeacherController@getMyClassAssignments');
Router::post('/teachers/assignments', 'TeacherController@createAssignment');
Router::get('/teachers/assignments/{id}', 'TeacherController@getAssignment');
Router::put('/teachers/assignments/{id}', 'TeacherController@updateAssignment');
Router::delete('/teachers/assignments/{id}', 'TeacherController@deleteAssignment');
Router::get('/teachers/assignments/{id}/submissions', 'TeacherController@getAssignmentSubmissions');
Router::post('/teachers/assignments/{assignmentId}/grade/{studentId}', 'TeacherController@gradeSubmission');
Router::get('/teachers/students/{studentId}/assignments', 'TeacherController@getStudentAssignments');
Router::get('/teachers/{id}', 'TeacherController@show');
Router::put('/teachers/{id}', 'TeacherController@update');
Router::delete('/teachers/{id}', 'TeacherController@destroy');

// Student Management Routes (admin only for create/update/delete, student auth for profile)
Router::get('/students', 'StudentController@index');
Router::post('/students', 'StudentController@store');
Router::get('/students/active', 'StudentController@getActive');
Router::get('/students/search', 'StudentController@search');
Router::get('/students/by-class', 'StudentController@getByClass');
Router::get('/students/current-class', 'StudentController@getCurrentClass');
Router::get('/students/personal-info', 'StudentController@getPersonalInfo');

// Student Assignment Management Routes (student only) - Must come before /students/{id}
Router::get('/students/my-assignments', 'StudentController@getMyAssignments');
Router::get('/students/assignments/{id}', 'StudentController@getAssignment');
Router::post('/students/assignments/{id}/submit', 'StudentController@submitAssignment');
Router::put('/students/assignments/{id}/submission', 'StudentController@updateSubmission');
Router::get('/students/submission-history', 'StudentController@getSubmissionHistory');
Router::get('/students/grades', 'StudentController@getGrades');

// Student Authentication Routes (public for login, student auth for others)
Router::post('/students/login', 'StudentController@login');
Router::post('/students/change-password', 'StudentController@changePassword');
Router::get('/students/profile', 'StudentController@getProfile');
Router::put('/students/profile', 'StudentController@updateProfile');

// General student routes (admin only) - Must come after specific routes
Router::get('/students/{id}', 'StudentController@show');
Router::put('/students/{id}', 'StudentController@update');
Router::delete('/students/{id}', 'StudentController@destroy');

// Class Subject Management Routes (admin only for create/update/delete, public for view)
Router::get('/class-subjects', 'ClassSubjectController@index');
Router::post('/class-subjects', 'ClassSubjectController@store');
Router::get('/class-subjects/search', 'ClassSubjectController@search');
Router::get('/class-subjects/by-class', 'ClassSubjectController@getByClass');
Router::get('/class-subjects/by-subject', 'ClassSubjectController@getBySubject');
Router::get('/class-subjects/by-academic-year', 'ClassSubjectController@getByAcademicYear');
Router::get('/class-subjects/academic-years', 'ClassSubjectController@getAcademicYears');
Router::get('/class-subjects/terms', 'ClassSubjectController@getTerms');
Router::get('/class-subjects/statistics', 'ClassSubjectController@getStatistics');
Router::get('/class-subjects/{id}', 'ClassSubjectController@show');
Router::put('/class-subjects/{id}', 'ClassSubjectController@update');
Router::delete('/class-subjects/{id}', 'ClassSubjectController@destroy');
Router::delete('/class-subjects/class/{classId}/subject/{subjectId}', 'ClassSubjectController@deleteByClassAndSubject');

// Assignment Management Routes (admin only)
Router::get('/assignments', 'AssignmentController@index');
Router::post('/assignments', 'AssignmentController@store');
Router::get('/assignments/{id}', 'AssignmentController@show');
Router::put('/assignments/{id}', 'AssignmentController@update');
Router::delete('/assignments/{id}', 'AssignmentController@destroy');
Router::get('/assignments/{id}/submissions', 'AssignmentController@getSubmissions');
Router::post('/assignments/{assignmentId}/grade/{studentId}', 'AssignmentController@gradeSubmission');

// Teacher Assignment Management Routes (teacher only) - Moved to teacher management section above

// DB setup endpoints
Router::get('/db/test', 'DbController@test');
Router::get('/db/check', 'DbController@check');
Router::post('/db/fresh', 'DbController@fresh');