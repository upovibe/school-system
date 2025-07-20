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