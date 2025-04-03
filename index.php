<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set appropriate content type for HTML
header('Content-Type: text/html; charset=UTF-8');

// Serve the main application page
readfile('index.html');