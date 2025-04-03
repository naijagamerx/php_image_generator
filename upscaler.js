// TensorFlow.js Upscaler Implementation

class ImageUpscaler {
    constructor() {
        this.model = null;
        this.isModelLoaded = false;
        this.modelPath = 'https://tfhub.dev/captain-pool/esrgan-tf2/1';
        this.progressCallback = null;
    }

    setProgressCallback(callback) {
        this.progressCallback = callback;
    }

    updateProgress(message, progress = 0) {
        if (this.progressCallback) {
            this.progressCallback(message, progress);
        }
    }

    async loadModel() {
        try {
            this.updateProgress('Loading AI upscaling model...', 10);
            this.model = await tf.loadGraphModel(this.modelPath, {
                fromTFHub: true,
                onProgress: (fraction) => {
                    this.updateProgress('Loading AI model...', Math.round(fraction * 50));
                }
            });
            this.isModelLoaded = true;
            this.updateProgress('Model loaded successfully', 100);
            return true;
        } catch (error) {
            console.error('Error loading model:', error);
            this.updateProgress('Failed to load AI model', 0);
            return false;
        }
    }

    async upscale(imageData) {
        if (!this.isModelLoaded) {
            await this.loadModel();
        }

        let tensors = [];
        try {
            this.updateProgress('Preparing image for upscaling...', 20);

            // Convert base64 to image
            const img = await this.loadImage(imageData);
            this.updateProgress('Processing image...', 40);

            // Convert image to tensor and track it
            const tensor = tf.browser.fromPixels(img);
            tensors.push(tensor);

            // Prepare input
            const floatTensor = tensor.toFloat();
            tensors.push(floatTensor);
            const expandedTensor = floatTensor.expandDims(0);
            tensors.push(expandedTensor);
            const normalized = expandedTensor.div(255.0);
            tensors.push(normalized);

            this.updateProgress('Applying AI upscaling...', 60);

            // Perform upscaling
            const result = this.model.predict(normalized);
            tensors.push(result);

            // Post-process the result
            const squeezed = result.squeeze();
            tensors.push(squeezed);
            const scaled = squeezed.mul(255);
            tensors.push(scaled);
            const clipped = scaled.clipByValue(0, 255);
            tensors.push(clipped);
            const upscaled = clipped.cast('int32');
            tensors.push(upscaled);

            this.updateProgress('Finalizing upscaled image...', 80);

            // Convert to canvas
            const [height, width] = upscaled.shape;
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            // Get pixel data
            const imageData = new ImageData(
                new Uint8ClampedArray(await upscaled.data()),
                width,
                height
            );
            ctx.putImageData(imageData, 0, 0);

            this.updateProgress('Completing upscale process...', 90);

            // Convert to base64
            const upscaledBase64 = canvas.toDataURL('image/png')
                .replace('data:image/png;base64,', '');

            this.updateProgress('Upscaling completed!', 100);
            return upscaledBase64;

        } catch (error) {
            console.error('Error during upscaling:', error);
            this.updateProgress('Error occurred during upscaling', 0);
            throw error;
        } finally {
            // Cleanup all tensors
            tensors.forEach(tensor => {
                if (tensor && tensor.dispose) {
                    tensor.dispose();
                }
            });
            // Force garbage collection
            if (tf.memory().numTensors > 0) {
                tf.disposeVariables();
            }
        }
    }

    async loadImage(base64Data) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = `data:image/png;base64,${base64Data}`;
        });
    }
}

// Create a singleton instance
const upscaler = new ImageUpscaler();

// Initialize the model when the script loads
upscaler.loadModel().then(() => {
    console.log('Upscaler model loaded successfully');
}).catch(error => {
    console.error('Failed to load upscaler model:', error);
});