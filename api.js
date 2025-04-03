const API_KEY = 'a9b0c0e48b876fa6ea07c28eb95b2e7f6d8ad1b5ceb6dc3aa95a0ecc6bf78e1b';
const API_URL = 'https://api.together.xyz/v1/images/generations';

// Queue for managing concurrent requests
class RequestQueue {
    constructor(maxConcurrent = 1) { // Limit to 1 concurrent request
        this.queue = [];
        this.running = 0;
        this.maxConcurrent = maxConcurrent;
    }

    async add(fn) {
        if (this.running >= this.maxConcurrent) {
            await new Promise(resolve => this.queue.push(resolve));
        }
        this.running++;
        try {
            return await fn();
        } finally {
            this.running--;
            if (this.queue.length > 0) {
                // Add a delay before processing the next request
                setTimeout(() => {
                    const next = this.queue.shift();
                    next();
                }, 3000); // Wait 3 seconds between requests
            }
        }
    }
}

// Initialize request queue with more conservative limit
const requestQueue = new RequestQueue(1);

// Improved rate limiter configuration
const rateLimiter = {
    tokens: 3,
    lastRefill: Date.now(),
    refillRate: 0.05, // ~3 tokens per minute (much slower)
    maxTokens: 3,
    async refillTokens() {
        const now = Date.now();
        const timePassed = (now - this.lastRefill) / 1000;
        this.tokens = Math.min(this.maxTokens, this.tokens + timePassed * this.refillRate);
        this.lastRefill = now;
    },
    async waitForToken() {
        await this.refillTokens();
        if (this.tokens < 1) {
            const waitTime = Math.ceil((1 - this.tokens) / this.refillRate * 1000);
            console.log(`Rate limit reached. Waiting ${Math.round(waitTime/1000)} seconds...`);
            if (window.updateProgress) {
                window.updateProgress(15, `Rate limit reached. Waiting ${Math.round(waitTime/1000)} seconds...`);
            }
            await new Promise(resolve => setTimeout(resolve, waitTime));
            return this.waitForToken(); // Recursively check again
        }
        this.tokens -= 1;
        return true;
    }
};

async function generateImage(requestData) {
    try {
        const images = [];
        const totalImages = requestData.n;
        
        // Update progress if available
        if (window.updateProgress) {
            window.updateProgress(10, 'Initializing generation...');
        }
        
        // Generate images one by one for better progress tracking
        for (let i = 0; i < totalImages; i++) {
            if (window.updateProgress) {
                window.updateProgress(20 + (30 * i / totalImages), 
                    `Generating image ${i + 1}/${totalImages}...`);
            }

            // Wait for rate limiter token before proceeding
            await rateLimiter.waitForToken();

            // Wrap API call in request queue with retries
            const response = await requestQueue.add(async () => {
                const maxRetries = 3;
                let lastError;
                
                for (let attempt = 0; attempt < maxRetries; attempt++) {
                    try {
                        if (window.updateProgress) {
                            window.updateProgress(25 + (30 * i / totalImages), 
                                `Sending request for image ${i + 1}/${totalImages} (attempt ${attempt + 1})...`);
                        }

                        const response = await fetch(API_URL, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${API_KEY}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                model: 'black-forest-labs/FLUX.1-schnell-Free',
                                prompt: requestData.prompt,
                                width: requestData.width,
                                height: requestData.height,
                                steps: requestData.steps,
                                n: 1,
                                response_format: 'b64_json'
                            }),
                            // Add timeout to prevent hanging requests
                            signal: AbortSignal.timeout(30000)
                        });
                        
                        if (response.ok) return response;
                        
                        // Handle 429 errors with a longer backoff
                        if (response.status === 429) {
                            const retryAfter = response.headers.get('Retry-After') || 10;
                            const waitTime = parseInt(retryAfter) * 1000;
                            console.log(`Rate limited. Waiting ${waitTime/1000} seconds before retry...`);
                            if (window.updateProgress) {
                                window.updateProgress(25 + (30 * i / totalImages), 
                                    `Rate limited. Waiting ${Math.round(waitTime/1000)} seconds before retry...`);
                            }
                            await new Promise(resolve => setTimeout(resolve, waitTime));
                        }
                        
                        lastError = await response.text();
                    } catch (error) {
                        lastError = error;
                        if (error.name === 'AbortError') {
                            throw new Error('Request timeout');
                        }
                    }
                    
                    // Wait before retry with exponential backoff
                    if (attempt < maxRetries - 1) {
                        const backoffTime = Math.pow(2, attempt) * 2000; // Longer backoff times
                        if (window.updateProgress) {
                            window.updateProgress(25 + (30 * i / totalImages), 
                                `Retrying in ${backoffTime/1000} seconds...`);
                        }
                        await new Promise(resolve => setTimeout(resolve, backoffTime));
                    }
                }
                
                throw new Error(`Failed after ${maxRetries} attempts. Last error: ${lastError}`);
            });

            // Process successful response
            if (window.updateProgress) {
                window.updateProgress(50 + (30 * i / totalImages), `Processing image ${i + 1}/${totalImages}...`);
            }

            const data = await response.json();
            if (!data.data || !data.data[0]) {
                throw new Error('Unexpected API response format');
            }

            // Add the generated image to our collection
            images.push(data.data[0]);

            // Save image to library
            saveImageToLibrary(data.data[0].b64_json, requestData.prompt);
        }

        return { data: images };
    } catch (error) {
        // Parse error message for better display
        let errorMessage = error.message;
        try {
            const errorData = JSON.parse(error.message.match(/\{.*\}/)?.[0] || '{}');
            if (errorData.error?.message) {
                errorMessage = errorData.error.message;
                if (errorData.error.type === 'model_rate_limit') {
                    errorMessage = 'Rate limit reached. Please wait a minute before generating more images.';
                }
            }
        } catch (e) {
            // Keep original error message if parsing fails
        }
        throw new Error(errorMessage);
    }
}

/**
 * Save an image to the local library
 * @param {string} base64Image - Base64 encoded image data
 * @param {string} prompt - The prompt used to generate the image
 */
function saveImageToLibrary(base64Image, prompt) {
    try {
        // Get existing library or initialize new one
        let library = JSON.parse(localStorage.getItem('imageLibrary') || '[]');
        
        // Add new image with metadata
        library.push({
            id: Date.now(),
            date: new Date().toISOString(),
            prompt: prompt,
            image: base64Image
        });
        
        // Keep only the last 100 images to prevent storage issues
        if (library.length > 100) {
            library = library.slice(-100);
        }
        
        // Save back to localStorage
        localStorage.setItem('imageLibrary', JSON.stringify(library));
    } catch (error) {
        console.error('Error saving to image library:', error);
        // Non-critical function, continue even if it fails
    }
}

// Export the function for use in other modules
window.generateImage = generateImage;