<?php

namespace Database\Seeders;

use App\Models\Property;
use App\Models\PropertyImage;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;

class PropertyImageLinkSeeder extends Seeder
{
    /**
     * Copy images from project Image folder to Laravel storage and link to properties.
     * Run: php artisan db:seed --class=PropertyImageLinkSeeder
     *
     * Image folder path: project root / Image (e.g. Zillow/Image/)
     * Expects files named image_1.jpeg, image_2.jpg, ... (or any image_*.*)
     */
    public function run(): void
    {
        $imageDir = base_path('../Image');

        if (! is_dir($imageDir)) {
            $this->command->error("Image folder not found: {$imageDir}");
            $this->command->info('Create an "Image" folder in the project root and add image files (e.g. image_1.jpeg).');
            return;
        }

        $extensions = ['jpeg', 'jpg', 'png', 'gif', 'webp'];
        $imageFiles = [];
        foreach (scandir($imageDir) as $file) {
            if ($file === '.' || $file === '..') {
                continue;
            }
            $path = $imageDir . DIRECTORY_SEPARATOR . $file;
            if (! is_file($path)) {
                continue;
            }
            $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
            if (in_array($ext, $extensions, true)) {
                $imageFiles[] = $file;
            }
        }

        sort($imageFiles, SORT_NATURAL);

        if (empty($imageFiles)) {
            $this->command->warn('No image files found in ' . $imageDir);
            return;
        }

        $this->command->info('Found ' . count($imageFiles) . ' images in Image folder.');

        $properties = Property::where('is_approved', true)->orderBy('id')->get();
        if ($properties->isEmpty()) {
            $this->command->warn('No approved properties found. Run PropertySeeder first.');
            return;
        }

        $storagePropertiesDir = storage_path('app/public/properties');
        if (! File::isDirectory($storagePropertiesDir)) {
            File::makeDirectory($storagePropertiesDir, 0755, true);
        }

        $linked = 0;
        $imageIndex = 0;

        foreach ($properties as $property) {
            // Remove existing placeholder/sample images (optional: keeps real uploads if you skip this)
            $property->images()->delete();

            $numImages = min(rand(3, 6), count($imageFiles));
            $chosen = $this->pickRandomFiles($imageFiles, $numImages);

            foreach ($chosen as $order => $sourceFile) {
                $ext = pathinfo($sourceFile, PATHINFO_EXTENSION);
                $storageFileName = "p-{$property->id}-{$order}.{$ext}";
                $destPath = $storagePropertiesDir . DIRECTORY_SEPARATOR . $storageFileName;
                $srcPath = $imageDir . DIRECTORY_SEPARATOR . $sourceFile;

                if (! File::exists($srcPath)) {
                    continue;
                }

                File::copy($srcPath, $destPath);

                $imagePath = 'properties/' . $storageFileName;

                PropertyImage::create([
                    'property_id' => $property->id,
                    'image_path' => $imagePath,
                    'thumbnail_path' => null,
                    'order' => $order,
                    'is_primary' => $order === 0,
                    'alt_text' => $property->title . ' - Image ' . ($order + 1),
                ]);

                $linked++;
            }
        }

        $this->command->info("Linked {$linked} images to {$properties->count()} properties.");
    }

    /**
     * Pick n random files from the list (without repeating in same property).
     */
    private function pickRandomFiles(array $files, int $n): array
    {
        $count = count($files);
        if ($n >= $count) {
            return array_slice($files, 0, $n);
        }
        $indices = array_keys($files);
        shuffle($indices);
        $picked = array_slice($indices, 0, $n);
        $result = [];
        foreach ($picked as $i) {
            $result[] = $files[$i];
        }
        return $result;
    }
}
