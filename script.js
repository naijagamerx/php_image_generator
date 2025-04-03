document.addEventListener('DOMContentLoaded', () => {
    const aspectRatioSelect = document.getElementById('aspectRatio');
    const widthInput = document.getElementById('width');
    const heightInput = document.getElementById('height');
    const generateBtn = document.getElementById('generateBtn');
    const gallery = document.getElementById('gallery');
    const emptyGallery = document.getElementById('emptyGallery');
    const errorDiv = document.getElementById('error');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressStatus = document.getElementById('progressStatus');
    const progressPercent = document.getElementById('progressPercent');
    const imageModal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const closeModal = document.getElementById('closeModal');
    const previewGrid = document.getElementById('previewGrid');
    const numImagesInput = document.getElementById('numImages');
    const generationAnimation = document.getElementById('generationAnimation');
    
    // Current active image data for modal operations
    let currentImageData = null;

    // Calculate dimensions based on aspect ratio
    function calculateDimensions(aspectRatio) {
        const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number);
        let width = 1024;
        let height = Math.round((width * heightRatio) / widthRatio);

        if (height > 1024) {
            height = 1024;
            width = Math.round((height * widthRatio) / heightRatio);
        }

        // Ensure dimensions are within valid range and multiples of 64
        width = Math.max(512, Math.min(1024, Math.floor(width / 64) * 64));
        height = Math.max(512, Math.min(1024, Math.floor(height / 64) * 64));

        return [width, height];
    }

    // Update preview grid for aspect ratio
    function updatePreviewGrid() {
        // Clear existing previews
        previewGrid.innerHTML = '';
        
        // Get current values
        const aspectRatio = aspectRatioSelect.value;
        const numImages = parseInt(numImagesInput.value);
        const ratioClass = 'ratio-' + aspectRatio.replace(':', '-');
        
        // Set grid class based on number of images
        if (numImages === 1) {
            previewGrid.className = 'preview-grid-1';
        } else {
            previewGrid.className = 'preview-grid';
        }
        
        // Create preview elements
        for (let i = 0; i < numImages; i++) {
            const previewElement = document.createElement('div');
            previewElement.className = `ratio-preview ${ratioClass}`;
            previewElement.innerHTML = `<span class="ratio-count">${i+1}</span>`;
            previewGrid.appendChild(previewElement);
        }
    }

    // Update dimensions when aspect ratio changes
    aspectRatioSelect.addEventListener('change', () => {
        const [width, height] = calculateDimensions(aspectRatioSelect.value);
        widthInput.value = width;
        heightInput.value = height;
        updatePreviewGrid();
    });
    
    // Update preview when number of images changes
    numImagesInput.addEventListener('change', () => {
        updatePreviewGrid();
    });
    
    // Initialize dimensions and preview
    const [initialWidth, initialHeight] = calculateDimensions(aspectRatioSelect.value);
    widthInput.value = initialWidth;
    heightInput.value = initialHeight;
    updatePreviewGrid();

    // Handle image generation
    generateBtn.addEventListener('click', async () => {
        const prompt = document.getElementById('prompt').value.trim();
        if (!prompt) {
            showError('Please enter a prompt');
            return;
        }

        try {
            // Store original button content and update UI
            const originalBtnContent = generateBtn.innerHTML;
            generateBtn.disabled = true;
            generateBtn.setAttribute('data-original-content', originalBtnContent);
            generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span class="ml-2">Generating...</span>';
            errorDiv.classList.add('hidden');
            progressContainer.classList.remove('hidden');
            progressBar.style.width = '5%';
            progressStatus.textContent = 'Preparing request...';
            progressPercent.textContent = '5%';
            
            // Clear existing gallery and show generation animation
            gallery.innerHTML = '';
            emptyGallery.style.display = 'none';
            generationAnimation.classList.add('active');
            
            // Position particles randomly
            positionParticlesRandomly();

            const requestData = {
                prompt: prompt,
                width: parseInt(widthInput.value),
                height: parseInt(heightInput.value),
                steps: parseInt(document.getElementById('steps').value),
                n: parseInt(document.getElementById('numImages').value),
                enhanceQuality: document.getElementById('enhanceQuality').checked
            };

            // Update progress to show request is being sent
            updateProgress(15, 'Sending request to AI...');
            updateGenerationText('Crafting your vision...', 'Analyzing your prompt and preparing the canvas');
            
            const data = await generateImage(requestData);
            
            // Update progress to show images are being processed
            updateProgress(70, 'Processing generated images...');
            updateGenerationText('Almost there!', 'Putting on the finishing touches');
            
            // Display generated images in a grid
            const numImages = data.data.length;
            
            if (numImages === 0) {
                // Show empty gallery message if no images were generated
                emptyGallery.style.display = 'block';
                updatePreviewGrid(); // Re-show the previews
                generationAnimation.classList.remove('active');
            } else {
                // Hide empty gallery message and animation
                emptyGallery.style.display = 'none';
            }
            
            // Display images with slight delay between each for visual effect
            for (let i = 0; i < data.data.length; i++) {
                const item = data.data[i];
                
                // Create and add image with a slight delay
                setTimeout(() => {
                    // Create image card
                    const imgCard = document.createElement('div');
                    imgCard.className = 'image-card';
                    imgCard.style.opacity = '0';
                    imgCard.style.transform = 'translateY(20px)';
                    imgCard.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                    
                    // Create image container with proper aspect ratio
                    const imgContainer = document.createElement('div');
                    imgContainer.className = 'aspect-w-16 aspect-h-9 relative';
                    if (requestData.width === requestData.height) {
                        imgContainer.className = 'aspect-square relative';
                    }
                    
                    // Create and set up image
                    const img = document.createElement('img');
                    img.src = `data:image/png;base64,${item.b64_json}`;
                    img.className = 'w-full h-full object-cover';
                    img.alt = `Generated image ${i + 1}`;
                    
                    // Store the base64 data with the image
                    img.dataset.imageData = item.b64_json;
                    
                    // Add click event to open modal
                    img.addEventListener('click', () => {
                        openImageModal(item.b64_json);
                    });
                    
                    // Create action buttons container
                    const actionsDiv = document.createElement('div');
                    actionsDiv.className = 'image-actions';
                    
                    // View button
                    const viewBtn = document.createElement('span');
                    viewBtn.className = 'action-btn';
                    viewBtn.innerHTML = '<i class="fas fa-eye"></i>';
                    viewBtn.title = 'View Image';
                    viewBtn.addEventListener('click', () => {
                        openImageModal(item.b64_json);
                    });
                    
                    // Download button
                    const downloadBtn = document.createElement('span');
                    downloadBtn.className = 'action-btn';
                    downloadBtn.innerHTML = '<i class="fas fa-download"></i>';
                    downloadBtn.title = 'Download Image';
                    downloadBtn.addEventListener('click', () => {
                        downloadImage(item.b64_json, 'png');
                    });
                    
                    // Add buttons to actions container
                    actionsDiv.appendChild(viewBtn);
                    actionsDiv.appendChild(downloadBtn);
                    
                    // Assemble the card
                    imgContainer.appendChild(img);
                    imgContainer.appendChild(actionsDiv);
                    imgCard.appendChild(imgContainer);
                    gallery.appendChild(imgCard);
                    
                    // Fade in the card
                    setTimeout(() => {
                        imgCard.style.opacity = '1';
                        imgCard.style.transform = 'translateY(0)';
                    }, 50);
                    
                    // Hide animation once all images are added
                    if (i === data.data.length - 1) {
                        setTimeout(() => {
                            generationAnimation.classList.remove('active');
                        }, 300);
                    }
                    
                    // Update progress for each image
                    const progress = 70 + (30 * (i + 1) / numImages);
                    updateProgress(progress, `Processing image ${i + 1}/${numImages}...`);
                }, i * 300); // Stagger the appearance of images
            }
            
            // Complete the progress
            updateProgress(100, 'Generation complete!');
            setTimeout(() => {
                progressContainer.classList.add('hidden');
                generateBtn.disabled = false;
                generateBtn.innerHTML = generateBtn.getAttribute('data-original-content');
                
                // If no images were generated, show the empty gallery message
                if (gallery.children.length === 0) {
                    emptyGallery.style.display = 'block';
                }
            }, 1500);
            
        } catch (error) {
            showError('Error generating images: ' + error.message);
            progressContainer.classList.add('hidden');
            generateBtn.disabled = false;
            generateBtn.innerHTML = generateBtn.getAttribute('data-original-content');
            generationAnimation.classList.remove('active');
            
            // If no images were generated, show the empty gallery message with preview
            if (gallery.children.length === 0) {
                emptyGallery.style.display = 'block';
                updatePreviewGrid(); // Re-show the previews
            }
        }
    });

    // Position particles randomly
    function positionParticlesRandomly() {
        const particles = document.querySelectorAll('.particle');
        particles.forEach((particle) => {
            const randomX = Math.floor(Math.random() * 100);
            const randomY = Math.floor(Math.random() * 100);
            const size = Math.floor(Math.random() * 8) + 4; // 4-12px size
            const duration = Math.floor(Math.random() * 8) + 6; // 6-14s animation
            
            particle.style.left = `${randomX}%`;
            particle.style.top = `${randomY}%`;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.animationDuration = `${duration}s`;
            
            // Add random hue variation
            const hue = Math.floor(Math.random() * 60) - 30; // -30 to +30 from base color
            particle.style.backgroundColor = `hsl(${216 + hue}, 90%, 60%)`;
        });
    }
    
    // Update generation animation text
    function updateGenerationText(mainText, subText) {
        const generatingText = document.querySelector('.generating-text');
        const generatingSubtext = document.querySelector('.generating-subtext');
        
        if (generatingText) generatingText.textContent = mainText;
        if (generatingSubtext) generatingSubtext.textContent = subText;
    }

    function showError(message) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center';
        toast.innerHTML = `
            <i class="fas fa-exclamation-circle mr-2"></i>
            <span>${message}</span>
            <button class="ml-4 hover:text-red-200" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        document.body.appendChild(toast);
        
        // Auto-remove after 5 seconds
        setTimeout(() => toast.remove(), 5000);
        
        // Also update the error div for persistent display
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle mr-2"></i>${message}`;
        errorDiv.classList.remove('hidden');
    }
    
    // Update progress bar
    function updateProgress(percent, statusText) {
        progressBar.style.width = `${percent}%`;
        progressStatus.textContent = statusText;
        progressPercent.textContent = `${Math.round(percent)}%`;
    }
    
    // Expose updateProgress globally for use in api.js
    window.updateProgress = updateProgress;
    
    // Open image modal
    function openImageModal(imageData) {
        currentImageData = imageData;
        modalImage.src = `data:image/png;base64,${imageData}`;
        imageModal.style.display = 'flex';
    }
    
    // Close modal when clicking the close button
    closeModal.addEventListener('click', () => {
        imageModal.style.display = 'none';
    });
    
    // Close modal when clicking outside the content
    imageModal.addEventListener('click', (e) => {
        if (e.target === imageModal) {
            imageModal.style.display = 'none';
        }
    });
    
    // Download image in specified format
    function downloadImage(base64Data, format) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            let mimeType;
            let quality = 0.9;
            let fileName;
            
            switch(format) {
                case 'webp':
                    mimeType = 'image/webp';
                    fileName = 'generated-image.webp';
                    break;
                case 'jpeg':
                    mimeType = 'image/jpeg';
                    fileName = 'generated-image.jpg';
                    break;
                case 'png':
                default:
                    mimeType = 'image/png';
                    fileName = 'generated-image.png';
                    break;
            }
            
            const dataURL = canvas.toDataURL(mimeType, quality);
            
            const link = document.createElement('a');
            link.href = dataURL;
            link.download = fileName;
            link.click();
        };
        
        img.src = `data:image/png;base64,${base64Data}`;
    }
    
    // Handle download button clicks in modal
    document.querySelectorAll('.download-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentImageData) {
                downloadImage(currentImageData, btn.dataset.format);
            }
        });
    });

    // Copy prompt functionality
    function copyPrompt() {
        const promptTextarea = document.getElementById('prompt');
        promptTextarea.select();
        document.execCommand('copy');
        
        // Show feedback
        const copyBtn = document.querySelector('.copy-btn');
        const originalIcon = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
            copyBtn.innerHTML = originalIcon;
        }, 2000);
    }

    // Add copyPrompt to window object so it can be called from HTML
    window.copyPrompt = copyPrompt;

    // Prompt Enhancement Elements
    const enhancePromptBtn = document.getElementById('enhancePromptBtn');
    const enhancedPromptContainer = document.getElementById('enhancedPromptContainer');
    const enhancedPrompt = document.getElementById('enhancedPrompt');
    const enhancedPromptLoading = document.getElementById('enhancedPromptLoading');
    const copyEnhancedBtn = document.getElementById('copyEnhancedBtn');
    const applyEnhancedBtn = document.getElementById('applyEnhancedBtn');
    const cancelEnhancedBtn = document.getElementById('cancelEnhancedBtn');
    const enhancementTags = document.getElementById('enhancementTags');
    const promptTextarea = document.getElementById('prompt');
    
    // Together API Key - This should be stored securely and retrieved from backend
    // For demo purposes, we'll use a placeholder - the actual key should come from config
    let TOGETHER_API_KEY = '';
    
    // Fetch the API key from config.php
    async function fetchApiKey() {
        try {
            const response = await fetch('config.php?key=together_api_key');
            const data = await response.json();
            if (data.key) {
                TOGETHER_API_KEY = data.key;
            }
        } catch (error) {
            console.error('Error fetching Together API key:', error);
        }
    }
    
    // Call fetchApiKey when the page loads
    fetchApiKey();
    
    // Style preset definitions
    const stylePresets = {
        photorealistic: {
            keywords: 'ultra-realistic, photographic quality, high resolution, sharp detail, professional photography',
            prompt: 'Create a photorealistic image with stunning details, professional lighting, and crisp clarity. Use HDR techniques and photographic composition.',
        },
        artistic: {
            keywords: 'digital painting, artistic style, brush strokes, creative interpretation, fine art',
            prompt: 'Create a digital painting with expressive brush strokes, artistic composition, and creative color palette. Focus on artistic interpretation.',
        },
        cyberpunk: {
            keywords: 'neon lights, futuristic, cyberpunk aesthetic, high-tech, dystopian',
            prompt: 'Create a cyberpunk scene with vibrant neon lighting, futuristic elements, and a high-tech dystopian atmosphere. Include dramatic contrast.',
        },
        fantasy: {
            keywords: 'magical, mystical, fantasy world, ethereal, enchanted',
            prompt: 'Create a fantastical scene with magical elements, ethereal lighting, and enchanted atmosphere. Include mystical details.',
        },
        anime: {
            keywords: 'anime style, manga-inspired, cel shaded, Japanese animation',
            prompt: 'Create an anime-style illustration with clean lines, expressive features, and dynamic composition. Use cel-shaded techniques.',
        },
        vintage: {
            keywords: 'retro, vintage aesthetic, old film, nostalgic, classic',
            prompt: 'Create a vintage-style image with retro aesthetics, classic composition, and nostalgic color grading. Include period-appropriate details.',
        },
        abstract: {
            keywords: 'abstract art, non-representational, geometric shapes, modern art',
            prompt: 'Create an abstract composition with bold shapes, dynamic forms, and innovative use of color. Focus on non-representational elements.',
        },
        '3d': {
            keywords: '3D rendering, volumetric lighting, ray tracing, computer graphics',
            prompt: 'Create a 3D rendered scene with realistic materials, volumetric lighting, and proper depth. Include ray-traced reflections.',
        }
    };

    // Get style preset elements
    const stylePresetSelect = document.getElementById('stylePreset');
    
    // Handle style preset selection
    stylePresetSelect.addEventListener('change', () => {
        const selectedStyle = stylePresetSelect.value;
        if (selectedStyle && stylePresets[selectedStyle]) {
            const currentPrompt = promptTextarea.value.trim();
            if (currentPrompt) {
                enhanceWithStyle(currentPrompt, selectedStyle);
            }
        }
    });
    
    // Enhance prompt with selected style
    async function enhanceWithStyle(userPrompt, style) {
        const stylePreset = stylePresets[style];
        if (!stylePreset) return;

        try {
            // Show loading state
            enhancedPromptLoading.classList.remove('hidden');
            enhancementTags.classList.add('hidden');
            enhancedPrompt.classList.add('hidden');
            enhancedPromptContainer.classList.remove('hidden');
            enhancedPromptContainer.classList.add('fade-in');
            promptTextarea.classList.add('dimmed-prompt');
            enhancePromptBtn.disabled = true;
            
            // Instead of sending style separately, incorporate it directly into the prompt
            const enhancedPromptWithStyle = `${userPrompt} ${stylePreset.keywords}`;
            
            // Get enhanced prompt
            const enhanced = await enhancePrompt(enhancedPromptWithStyle);
            
            // Hide loading state
            enhancedPromptLoading.classList.add('hidden');
            enhancementTags.classList.remove('hidden');
            enhancedPrompt.classList.remove('hidden');
            
            // Update the enhanced prompt textarea
            enhancedPrompt.value = enhanced.prompt;
            
            // Add style tag to the beginning of tags
            enhanced.tags.unshift({ text: style, type: 'style' });
            
            // Update tags
            updateEnhancementTags(enhanced.tags);
            
            // Enable buttons
            enhancePromptBtn.disabled = false;
            
        } catch (error) {
            console.error('Error enhancing prompt with style:', error);
            showError('Failed to enhance prompt with style: ' + error.message);
            enhancedPromptLoading.classList.add('hidden');
            enhancedPromptContainer.classList.add('hidden');
            promptTextarea.classList.remove('dimmed-prompt');
            enhancePromptBtn.disabled = false;
        }
    }

    // Enhance prompt using Together API
    async function enhancePrompt(userPrompt) {
        try {
            const response = await fetch('https://api.together.xyz/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${TOGETHER_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: "deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free",
                    messages: [
                        {
                            role: "system",
                            content: "You are an AI tool for enhancing image generation prompts. Your job is to improve descriptive elements while keeping quality tags (like (best quality:1.4)) intact. Output only the enhanced prompt with no explanations, no thinking, no system messages, no prefixes."
                        },
                        {
                            role: "user", 
                            content: `Enhance this image prompt: ${userPrompt}`
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 400
                })
            });
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('Invalid response structure from API');
            }
            
            // Clean up the response even more aggressively
            let enhancedText = data.choices[0].message.content
                .trim()
                .replace(/<think>[\s\S]*?<\/think>/g, '') // Remove thinking blocks with any content
                .replace(/^(prompt preset:|enhanced prompt:|system prompt:|final prompt:)/gi, '') // Remove any prefixes
                .replace(/^["']|["']$/g, '') // Remove quotes if they exist
                .replace(/^I would enhance this prompt to:|Here is the enhanced prompt:|Enhanced prompt:/i, '') // Remove more prefixes
                .trim();
            
            // Analyze the enhanced prompt for tags
            const tags = analyzePromptForTags(enhancedText);
            
            return {
                prompt: enhancedText,
                tags: tags
            };
            
        } catch (error) {
            console.error('Error in enhancePrompt:', error);
            throw error;
        }
    }
    
    // Analyze prompt for tags
    function analyzePromptForTags(prompt) {
        const tags = [];
        const promptLower = prompt.toLowerCase();
        
        // Style detection
        const styles = {
            'photorealistic': ['photorealistic', 'realistic', 'photo', 'photograph', 'high resolution'],
            'artistic': ['artistic', 'illustration', 'painting', 'digital art', 'concept art'],
            'cyberpunk': ['cyberpunk', 'neon', 'futuristic', 'cyber', 'tech'],
            'fantasy': ['fantasy', 'magical', 'mystical', 'fairy tale', 'dragon'],
            'anime': ['anime', 'manga', 'japanese', 'cartoon'],
            'vintage': ['vintage', 'retro', 'old', 'film', 'classic'],
            'abstract': ['abstract', 'surreal', 'surrealist', 'geometric'],
            '3D': ['3d', 'render', 'octane', 'blender', 'cinema 4d']
        };
        
        // Feature detection
        const features = {
            'detailed': ['detailed', 'intricate', 'complex', 'fine details'],
            'vivid': ['vivid', 'vibrant', 'colorful', 'saturated'],
            'dramatic': ['dramatic', 'cinematic', 'epic', 'intense'],
            'moody': ['moody', 'atmospheric', 'ambiance', 'ambient'],
            'portrait': ['portrait', 'headshot', 'face', 'close-up'],
            'landscape': ['landscape', 'scenery', 'vista', 'panoramic']
        };
        
        // Check for styles
        for (const [style, keywords] of Object.entries(styles)) {
            if (keywords.some(keyword => promptLower.includes(keyword))) {
                tags.push({ text: style, type: 'style' });
            }
        }
        
        // Check for features
        for (const [feature, keywords] of Object.entries(features)) {
            if (keywords.some(keyword => promptLower.includes(keyword))) {
                tags.push({ text: feature, type: 'feature' });
            }
        }
        
        // If no tags found, add default tags
        if (tags.length === 0) {
            tags.push({ text: 'enhanced', type: 'feature' });
        }
        
        // Limit to 5 tags
        return tags.slice(0, 5);
    }
    
    // Update enhancement tags in UI
    function updateEnhancementTags(tags) {
        enhancementTags.innerHTML = '';
        
        const bgColors = {
            'style': {
                bg: 'bg-purple-100',
                text: 'text-purple-800'
            },
            'feature': {
                bg: 'bg-blue-100',
                text: 'text-blue-800'
            }
        };
        
        // Add quality indicator
        const qualityIndicator = document.querySelector('.quality-indicator');
        if (tags.length >= 3) {
            qualityIndicator.className = 'quality-indicator ml-2 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800';
            qualityIndicator.textContent = 'High Quality';
        } else {
            qualityIndicator.className = 'quality-indicator ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800';
            qualityIndicator.textContent = 'Enhanced';
        }
        
        // Create tag elements
        tags.forEach(tag => {
            const { bg, text } = bgColors[tag.type] || bgColors.feature;
            
            const tagElement = document.createElement('span');
            tagElement.className = `px-2 py-0.5 text-xs rounded-full ${bg} ${text}`;
            tagElement.textContent = tag.text;
            enhancementTags.appendChild(tagElement);
        });
    }
    
    // Show a toast notification
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        let bgColor = 'bg-blue-500';
        let icon = 'fa-info-circle';
        
        if (type === 'success') {
            bgColor = 'bg-green-500';
            icon = 'fa-check-circle';
        } else if (type === 'error') {
            bgColor = 'bg-red-500';
            icon = 'fa-exclamation-circle';
        }
        
        toast.className = `fixed bottom-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center`;
        toast.innerHTML = `
            <i class="fas ${icon} mr-2"></i>
            <span>${message}</span>
            <button class="ml-4 hover:text-gray-200" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 5000);
    }

    // Handle enhance button click
    enhancePromptBtn.addEventListener('click', async () => {
        const currentPrompt = promptTextarea.value.trim();
        if (!currentPrompt) {
            showError('Please enter a prompt to enhance');
            return;
        }

        try {
            // Show loading state
            enhancedPromptLoading.classList.remove('hidden');
            enhancementTags.classList.add('hidden');
            enhancedPrompt.classList.add('hidden');
            enhancedPromptContainer.classList.remove('hidden');
            enhancedPromptContainer.classList.add('fade-in');
            promptTextarea.classList.add('dimmed-prompt');
            enhancePromptBtn.disabled = true;

            // Perform the enhancement
            const enhanced = await enhancePrompt(currentPrompt);

            // Hide loading state
            enhancedPromptLoading.classList.add('hidden');
            enhancementTags.classList.remove('hidden');
            enhancedPrompt.classList.remove('hidden');

            // Update the enhanced prompt textarea
            enhancedPrompt.value = enhanced.prompt;

            // Update tags
            updateEnhancementTags(enhanced.tags);

        } catch (error) {
            console.error('Error enhancing prompt:', error);
            showError('Failed to enhance prompt: ' + error.message);
            enhancedPromptLoading.classList.add('hidden');
            enhancedPromptContainer.classList.add('hidden');
            promptTextarea.classList.remove('dimmed-prompt');
        } finally {
            enhancePromptBtn.disabled = false;
        }
    });

    // Add event listeners for enhanced prompt actions
    copyEnhancedBtn.addEventListener('click', () => {
        enhancedPrompt.select();
        document.execCommand('copy');
        showToast('Enhanced prompt copied to clipboard', 'success');
    });

    applyEnhancedBtn.addEventListener('click', () => {
        promptTextarea.value = enhancedPrompt.value;
        enhancedPromptContainer.classList.add('hidden');
        promptTextarea.classList.remove('dimmed-prompt');
        showToast('Enhanced prompt applied', 'success');
    });

    cancelEnhancedBtn.addEventListener('click', () => {
        enhancedPromptContainer.classList.add('hidden');
        promptTextarea.classList.remove('dimmed-prompt');
    });
});