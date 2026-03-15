<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Property;
use App\Models\PropertyImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class PropertyImageController extends Controller
{
    /**
     * Upload image for a property.
     */
    public function upload(Request $request, string $propertyId)
    {
        $property = Property::findByIdOrUuidOrFail($propertyId);

        // Check ownership or admin
        if ($property->user_id !== $request->user()->id && !$request->user()->isAdmin()) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'image' => ['required', 'image', 'mimes:jpeg,jpg,png,gif', 'max:5120'],
            'is_primary' => ['sometimes', 'boolean'],
            'alt_text' => ['nullable', 'string', 'max:255'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $image = $request->file('image');
            $path = $image->store('properties', 'public');

            // Create thumbnail
            $thumbnailPath = $this->createThumbnail($path);

            $isPrimary = $request->boolean('is_primary', false);

            // If setting as primary, unset other primary images
            if ($isPrimary) {
                $property->images()->update(['is_primary' => false]);
            }

            $propertyImage = $property->images()->create([
                'image_path' => $path,
                'thumbnail_path' => $thumbnailPath,
                'is_primary' => $isPrimary,
                'order' => $property->images()->count(),
                'alt_text' => $request->alt_text,
            ]);

            return response()->json([
                'message' => 'Image uploaded successfully',
                'image' => $propertyImage,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to upload image',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete an image.
     */
    public function destroy(Request $request, string $propertyId, string $imageId)
    {
        $property = Property::findByIdOrUuidOrFail($propertyId);
        $image = PropertyImage::where('property_id', $property->id)
            ->findOrFail($imageId);

        // Check ownership or admin
        if ($property->user_id !== $request->user()->id && !$request->user()->isAdmin()) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        try {
            // Delete from storage
            Storage::disk('public')->delete($image->image_path);
            if ($image->thumbnail_path) {
                Storage::disk('public')->delete($image->thumbnail_path);
            }

            // Delete from database
            $image->delete();

            return response()->json([
                'message' => 'Image deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete image',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Reorder images.
     */
    public function reorder(Request $request, string $propertyId)
    {
        $property = Property::findByIdOrUuidOrFail($propertyId);

        // Check ownership or admin
        if ($property->user_id !== $request->user()->id && !$request->user()->isAdmin()) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'images' => ['required', 'array'],
            'images.*.id' => ['required', 'exists:property_images,id'],
            'images.*.order' => ['required', 'integer', 'min:0'],
            'primary_id' => ['nullable', 'exists:property_images,id'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            // Update order
            foreach ($request->images as $imageData) {
                PropertyImage::where('id', $imageData['id'])
                    ->where('property_id', $property->id)
                    ->update(['order' => $imageData['order']]);
            }

            // Set primary image
            if ($request->has('primary_id')) {
                $property->images()->update(['is_primary' => false]);
                PropertyImage::where('id', $request->primary_id)
                    ->where('property_id', $property->id)
                    ->update(['is_primary' => true]);
            }

            return response()->json([
                'message' => 'Images reordered successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to reorder images',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create thumbnail from image.
     */
    protected function createThumbnail(string $imagePath): ?string
    {
        try {
            $fullPath = storage_path('app/public/' . $imagePath);
            $thumbnailPath = 'properties/thumbnails/' . basename($imagePath);
            $thumbnailFullPath = storage_path('app/public/' . $thumbnailPath);

            // Ensure thumbnail directory exists
            $thumbnailDir = dirname($thumbnailFullPath);
            if (!is_dir($thumbnailDir)) {
                mkdir($thumbnailDir, 0755, true);
            }

            // Use GD driver (more common than Imagick)
            $manager = new \Intervention\Image\ImageManager(
                new \Intervention\Image\Drivers\Gd\Driver()
            );
            
            $thumbnail = $manager->read($fullPath);
            $thumbnail->scale(width: 400, height: 300);
            $thumbnail->save($thumbnailFullPath);

            return $thumbnailPath;
        } catch (\Exception $e) {
            \Log::error('Thumbnail creation failed', [
                'image' => $imagePath,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }
}
