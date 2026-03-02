<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePropertyRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Authorization handled in controller
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'string', 'min:50'],
            'property_type' => ['sometimes', 'in:house,apartment,condo,land,commercial'],
            'status' => ['sometimes', 'in:for_sale,for_rent,sold,pending'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'address' => ['sometimes', 'string', 'max:255'],
            'city' => ['sometimes', 'string', 'max:100'],
            'state' => ['sometimes', 'string', 'max:100'],
            'zip_code' => ['sometimes', 'string', 'max:20'],
            'country' => ['sometimes', 'string', 'max:100'],
            'latitude' => ['sometimes', 'numeric', 'between:-90,90'],
            'longitude' => ['sometimes', 'numeric', 'between:-180,180'],
            'bedrooms' => ['nullable', 'integer', 'min:0'],
            'bathrooms' => ['nullable', 'integer', 'min:0'],
            'square_feet' => ['nullable', 'integer', 'min:0'],
            'year_built' => ['nullable', 'integer', 'min:1800', 'max:' . date('Y')],
            'lot_size' => ['nullable', 'integer', 'min:0'],
            'amenities' => ['nullable', 'array'],
            'amenities.*' => ['exists:amenities,id'],
            'images' => ['nullable', 'array', 'max:20'],
            'images.*' => ['image', 'mimes:jpeg,jpg,png,gif', 'max:5120'], // 5MB max
            'virtual_tour_url' => ['nullable', 'url', 'max:2048'],
            'video_tour_url' => ['nullable', 'url', 'max:2048'],
        ];
    }
}
