<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WebSetting;
use Illuminate\Support\Facades\Storage;

class WebSettingsController extends Controller
{
    /**
     * Get public web settings (site name, logo, favicon) for frontend display.
     */
    public function publicSettings()
    {
        $web = WebSetting::get();

        return response()->json([
            'site_name' => $web->site_name,
            'site_description' => $web->site_description,
            'logo' => $web->logo ? url(Storage::url($web->logo)) : null,
            'favicon' => $web->favicon ? url(Storage::url($web->favicon)) : null,
        ]);
    }
}
