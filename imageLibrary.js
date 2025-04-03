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
    
    // Show toast notification
    showToast('Prompt copied to clipboard', 'success');
}

// Add copyPrompt to window object so it can be called from HTML
window.copyPrompt = copyPrompt;