<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Property;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FavoriteController extends Controller
{
    /**
     * Toggle favorite status for a property.
     */
    public function toggle(Request $request, $propertyId)
    {
        $user = $request->user();
        $property = Property::findByIdOrUuidOrFail($propertyId);

        $favorite = $user->favorites()->where('property_id', $property->id)->first();

        if ($favorite) {
            // Remove from favorites
            $user->favorites()->detach($property->id);
            $property->decrement('saves');
            $isFavorite = false;
        } else {
            // Add to favorites
            $user->favorites()->attach($property->id);
            $property->increment('saves');
            $isFavorite = true;
        }

        return response()->json([
            'is_favorite' => $isFavorite,
            'saves_count' => $property->fresh()->saves,
        ]);
    }

    /**
     * Get user's favorite properties.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        $favorites = $user->favorites()
            ->with(['user', 'images', 'amenities'])
            ->orderBy('pivot_created_at', 'desc')
            ->paginate(15);

        return response()->json($favorites);
    }

    /**
     * Check if property is favorited by user.
     */
    public function check(Request $request, $propertyId)
    {
        $user = $request->user();
        $property = Property::findByIdOrUuid($propertyId);
        if (!$property) {
            return response()->json(['is_favorite' => false]);
        }
        $isFavorite = $user->favorites()->where('property_id', $property->id)->exists();

        return response()->json([
            'is_favorite' => $isFavorite,
        ]);
    }

    /**
     * Remove property from favorites.
     */
    public function destroy(Request $request, $propertyId)
    {
        $user = $request->user();
        $property = Property::findByIdOrUuidOrFail($propertyId);

        $user->favorites()->detach($property->id);
        $property->decrement('saves');

        return response()->json([
            'message' => 'Property removed from favorites',
        ]);
    }
}
