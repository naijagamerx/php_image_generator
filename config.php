<?php
// Configuration and API keys
$config = [
    // API keys
    'together_api_key' => 'a9b0c0e48b876fa6ea07c28eb95b2e7f6d8ad1b5ceb6dc3aa95a0ecc6bf78e1b', // Replace with your actual Together API key
    
    // Other configuration settings
    'max_image_size' => 1024,
    'allowed_formats' => ['png', 'jpg', 'webp'],
    'default_model' => 'stable-diffusion',
    'max_images_per_request' => 4
];

// Simple API Key retrieval endpoint
if (isset($_GET['key']) && array_key_exists($_GET['key'], $config)) {
    // Only allow retrieving specific keys that are safe to expose to frontend
    $allowed_frontend_keys = ['together_api_key'];
    
    if (in_array($_GET['key'], $allowed_frontend_keys)) {
        header('Content-Type: application/json');
        echo json_encode(['key' => $config[$_GET['key']]]);
        exit;
    }
}

// Function to get config value
function getConfig($key) {
    global $config;
    return isset($config[$key]) ? $config[$key] : null;
}
?>