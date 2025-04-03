# PHP Image Generator

A modern web application for AI-powered image generation using text prompts. This application integrates with the Together API to create images from descriptive text and provides a sleek, user-friendly interface for the image generation process.

![PHP Image Generator Screenshot](images/logo.png)

## Features

- **AI Image Generation**: Create images from text prompts using the Together API
- **Prompt Enhancement**: Automatically improve your text prompts to get better results
- **Multiple Style Presets**: Choose from various style options like photorealistic, artistic, cyberpunk, etc.
- **Aspect Ratio Control**: Select different aspect ratios for your generated images
- **Batch Generation**: Generate multiple images at once
- **Image Library**: Save and manage your generated images locally
- **Download Options**: Download images in different formats (PNG, JPEG, WebP)
- **Responsive Design**: Works on both desktop and mobile devices
- **Image Upscaling**: Enhance image resolution using TensorFlow.js

## Technologies Used

- **Frontend**: HTML5, CSS3 (TailwindCSS), JavaScript
- **Backend**: PHP
- **APIs**: Together API for image generation
- **Libraries**: TensorFlow.js for image upscaling
- **Storage**: LocalStorage for image library management

## Installation

1. Clone this repository to your local machine:
   ```
   git clone https://github.com/yourusername/php_image_generator.git
   ```

2. Place the files in your web server directory (e.g., MAMP, XAMPP, etc.)

3. Update the API keys in `config.php` with your own Together API key:
   ```php
   $config = [
       'together_api_key' => 'YOUR_API_KEY',
       // Other settings...
   ];
   ```

4. Access the application through your web server, typically at:
   ```
   http://localhost/php_image_generator/
   ```

## Usage

1. **Enter a Prompt**: Type a descriptive text prompt for the image you want to generate
2. **Enhance Prompt (Optional)**: Click the "Enhance Prompt" button to improve your text description
3. **Select Settings**: Choose aspect ratio, number of images, and other generation settings
4. **Generate Images**: Click the "Generate Images" button and wait for the AI to create your images
5. **Save or Download**: Images are automatically saved to your library, or you can download them directly

## Project Structure

- `index.php` - Entry point for the application
- `index.html` - Main application interface
- `api.js` - Handles API communication with Together
- `script.js` - Main application logic
- `upscaler.js` - TensorFlow.js implementation for image upscaling
- `library.html` - Image library interface
- `imageLibrary.js` - Library management functions
- `config.php` - Configuration settings and API key management

## API Configuration

The application uses the Together API for image generation. You need to:

1. Sign up for an account at [Together](https://www.together.xyz/)
2. Obtain an API key
3. Add your API key to the `config.php` file

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [TailwindCSS](https://tailwindcss.com/) for the UI framework
- [Font Awesome](https://fontawesome.com/) for icons
- [Together API](https://www.together.xyz/) for AI image generation
- [TensorFlow.js](https://www.tensorflow.org/js) for image upscaling capabilities