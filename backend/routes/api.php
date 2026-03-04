<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Broadcast;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\EmailVerificationController;
use App\Http\Controllers\Api\PropertyController;
use App\Http\Controllers\Api\PropertyImageController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\FavoriteController;
use App\Http\Controllers\Api\SavedSearchController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\AgentController;
use App\Http\Controllers\Api\AgentDashboardController;
use App\Http\Controllers\Api\LeadController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PaymentConfigController;
use App\Http\Controllers\Api\RolePermissionController;
use App\Http\Controllers\Api\SubscriptionController;
use App\Http\Controllers\Api\StripeWebhookController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// Public property routes
Route::get('/properties', [PropertyController::class, 'index']);
Route::get('/properties/{id}', [PropertyController::class, 'show']);
Route::get('/agents/{id}', [AgentController::class, 'show']);

// Search routes
Route::get('/search', [SearchController::class, 'search']);
Route::get('/search/bounds', [SearchController::class, 'searchByBounds']);
Route::get('/search/suggestions', [SearchController::class, 'suggestions']);
Route::get('/search/filter-options', [SearchController::class, 'filterOptions']);

// Public reviews route (to view reviews)
Route::get('/reviews', [ReviewController::class, 'index']);

// Public payment configs
Route::get('/subscription-plans', [PaymentConfigController::class, 'plans']);
Route::get('/featured-packages', [PaymentConfigController::class, 'featuredPackages']);

// Stripe Webhook (must be public, no auth middleware)
Route::post('/webhooks/stripe', [StripeWebhookController::class, 'handleWebhook']);

// Email verification
Route::get('/email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify'])
    ->middleware(['auth:sanctum', 'signed'])
    ->name('verification.verify');

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Broadcast::routes(['middleware' => ['auth:sanctum']]);

    // Authentication
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'getUser']);

    // Email verification
    Route::post('/email/verification-notification', [EmailVerificationController::class, 'sendVerificationEmail']);

    // Profile
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::post('/profile/change-password', [ProfileController::class, 'changePassword']);

    // Properties (create, update, delete)
    Route::post('/properties', [PropertyController::class, 'store']);
    Route::put('/properties/{id}', [PropertyController::class, 'update']);
    Route::delete('/properties/{id}', [PropertyController::class, 'destroy']);

    // Property Images
    Route::post('/properties/{propertyId}/images', [PropertyImageController::class, 'upload']);
    Route::delete('/properties/{propertyId}/images/{imageId}', [PropertyImageController::class, 'destroy']);
    Route::post('/properties/{propertyId}/images/reorder', [PropertyImageController::class, 'reorder']);

    // Favorites
    Route::post('/properties/{propertyId}/favorite/toggle', [FavoriteController::class, 'toggle']);
    Route::get('/properties/{propertyId}/favorite/check', [FavoriteController::class, 'check']);
    Route::get('/favorites', [FavoriteController::class, 'index']);
    Route::delete('/favorites/{propertyId}', [FavoriteController::class, 'destroy']);

    // Saved Searches
    Route::apiResource('saved-searches', SavedSearchController::class);

    // Reviews (create, update, delete require auth)
    Route::post('/reviews', [ReviewController::class, 'store']);
    Route::put('/reviews/{id}', [ReviewController::class, 'update']);
    Route::delete('/reviews/{id}', [ReviewController::class, 'destroy']);

    // Messages
    Route::post('/messages', [MessageController::class, 'store']);
    Route::get('/messages', [MessageController::class, 'index']);
    Route::get('/messages/{id}', [MessageController::class, 'show']);
    Route::post('/messages/{id}/reply', [MessageController::class, 'reply']);
    Route::post('/messages/{id}/read', [MessageController::class, 'markAsRead']);
    Route::post('/messages/tour-request', [MessageController::class, 'requestTour']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);

    // Payments
    Route::post('/payments', [PaymentController::class, 'createPayment']);
    Route::post('/payments/{id}/confirm', [PaymentController::class, 'confirmPayment']);
    Route::get('/payments/history', [PaymentController::class, 'paymentHistory']);
    Route::post('/payments/{id}/refund', [PaymentController::class, 'requestRefund']);
    Route::post('/properties/{id}/feature', [PaymentController::class, 'featureProperty']);

    // Subscriptions
    Route::post('/subscriptions', [SubscriptionController::class, 'createSubscription']);
    Route::post('/subscriptions/{id}/cancel', [SubscriptionController::class, 'cancelSubscription']);
    Route::get('/subscriptions/current', [SubscriptionController::class, 'getCurrentSubscription']);
    Route::get('/subscriptions/check', [SubscriptionController::class, 'checkSubscription']);
});

// Admin routes for reviews
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::post('/reviews/{id}/approve', [ReviewController::class, 'approve']);
    Route::post('/reviews/{id}/reject', [ReviewController::class, 'reject']);
});

// Role-based routes
Route::middleware(['auth:sanctum', 'role:agent,admin'])->group(function () {
    // Agent Dashboard
    Route::get('/agent/dashboard', [AgentDashboardController::class, 'dashboard']);

    // Agent Properties
    Route::get('/agent/properties', [PropertyController::class, 'myProperties']);
    Route::get('/properties/{id}/stats', [PropertyController::class, 'propertyStats']);
    Route::patch('/properties/{id}/availability', [PropertyController::class, 'updateAvailability']);

    // Leads/Inquiries
    Route::get('/agent/leads', [LeadController::class, 'index']);
    Route::get('/agent/leads/{id}', [LeadController::class, 'show']);
    Route::post('/agent/leads/{id}/read', [LeadController::class, 'markAsRead']);
    Route::post('/agent/leads/mark-read', [LeadController::class, 'markMultipleAsRead']);
    Route::post('/agent/leads/{id}/reply', [LeadController::class, 'reply']);
    Route::get('/agent/leads/export', [LeadController::class, 'export']);
    Route::patch('/agent/leads/{id}', [LeadController::class, 'update']);
});

Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    // Admin Dashboard
    Route::get('/admin/dashboard', [AdminController::class, 'dashboard']);
    Route::get('/admin/analytics', [AdminController::class, 'analytics']);
    Route::get('/admin/reports/advanced', [AdminController::class, 'advancedReport']);
    Route::get('/admin/reports/advanced/export', [AdminController::class, 'exportAdvancedReport']);

    // User Management
    Route::get('/admin/users', [AdminController::class, 'users']);
    Route::put('/admin/users/{id}', [AdminController::class, 'updateUser']);
    Route::delete('/admin/users/{id}', [AdminController::class, 'deleteUser']);

    // Property Management
    Route::get('/admin/properties', [AdminController::class, 'properties']);
    Route::post('/admin/properties/{id}/approve', [AdminController::class, 'approveProperty']);
    Route::post('/admin/properties/{id}/reject', [AdminController::class, 'rejectProperty']);
    Route::post('/admin/properties/{id}/feature', [AdminController::class, 'featureProperty']);

    // Review Moderation
    Route::get('/admin/reviews/pending', [AdminController::class, 'pendingReviews']);
    Route::post('/admin/reviews/{id}/approve', [AdminController::class, 'approveReview']);
    Route::post('/admin/reviews/{id}/reject', [AdminController::class, 'rejectReview']);

    // Location Management
    Route::get('/admin/locations', [AdminController::class, 'locations']);
    Route::post('/admin/locations', [AdminController::class, 'storeLocation']);
    Route::put('/admin/locations/{id}', [AdminController::class, 'updateLocation']);
    Route::delete('/admin/locations/{id}', [AdminController::class, 'deleteLocation']);
    Route::post('/admin/locations/sync', [AdminController::class, 'syncLocationsFromProperties']);

    // Site & Email Settings
    Route::get('/admin/settings', [AdminController::class, 'settings']);
    Route::put('/admin/settings/site', [AdminController::class, 'updateSiteSettings']);
    Route::put('/admin/settings/email', [AdminController::class, 'updateEmailSettings']);

    // Payment config management
    Route::get('/admin/payment-config/plans', [PaymentConfigController::class, 'adminPlans']);
    Route::post('/admin/payment-config/plans', [PaymentConfigController::class, 'storePlan']);
    Route::put('/admin/payment-config/plans/{id}', [PaymentConfigController::class, 'updatePlan']);
    Route::delete('/admin/payment-config/plans/{id}', [PaymentConfigController::class, 'deletePlan']);

    Route::get('/admin/payment-config/featured-packages', [PaymentConfigController::class, 'adminFeaturedPackages']);
    Route::post('/admin/payment-config/featured-packages', [PaymentConfigController::class, 'storeFeaturedPackage']);
    Route::put('/admin/payment-config/featured-packages/{id}', [PaymentConfigController::class, 'updateFeaturedPackage']);
    Route::delete('/admin/payment-config/featured-packages/{id}', [PaymentConfigController::class, 'deleteFeaturedPackage']);

    // Roles & Permissions Management
    Route::get('/admin/roles', [RolePermissionController::class, 'roles']);
    Route::post('/admin/roles', [RolePermissionController::class, 'storeRole']);
    Route::get('/admin/roles/{id}', [RolePermissionController::class, 'showRole']);
    Route::put('/admin/roles/{id}', [RolePermissionController::class, 'updateRole']);
    Route::delete('/admin/roles/{id}', [RolePermissionController::class, 'deleteRole']);
    Route::put('/admin/roles/{id}/permissions', [RolePermissionController::class, 'syncRolePermissions']);

    Route::get('/admin/permissions', [RolePermissionController::class, 'permissions']);
    Route::post('/admin/permissions', [RolePermissionController::class, 'storePermission']);
    Route::get('/admin/permissions/{id}', [RolePermissionController::class, 'showPermission']);
    Route::put('/admin/permissions/{id}', [RolePermissionController::class, 'updatePermission']);
    Route::delete('/admin/permissions/{id}', [RolePermissionController::class, 'deletePermission']);
});
