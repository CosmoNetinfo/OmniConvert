const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const conversionControls = document.getElementById('conversion-controls');
const progressContainer = document.getElementById('progress-container');
const resultContainer = document.getElementById('result-container');
const convertBtn = document.getElementById('convert-btn');
const resetBtn = document.getElementById('reset-btn');
const fileNameDisplay = document.getElementById('file-name');
const fileSizeDisplay = document.getElementById('file-size');
const targetFormatSelect = document.getElementById('target-format');
const downloadLink = document.getElementById('download-link');
const progressFill = document.getElementById('progress-fill');
const statusText = document.getElementById('status-text');
const recentList = document.getElementById('recent-list');

let selectedFile = null;

// --- FORMAT DEFINITIONS ---
const FORMAT_DB = {
    image: [
        "jpg", "jpeg", "png", "webp", "gif", "tiff", "avif", "heic", "bmp", "ico", "svg"
    ],
    video: [
        "mp4", "webm", "avi", "mov", "mkv", "flv", "wmv", "3gp", "hevc"
    ],
    audio: [
        "mp3", "wav", "ogg", "flac", "aac", "m4a", "wma", "aiff"
    ],
    document: [
        "pdf", "docx", "txt", "html"
    ],
    archive: [
        "zip", "tar", "tar.gz", "tgz"
    ]
};

// Flatten for easy lookup
const ALL_EXTENSIONS = {};
for (const [category, exts] of Object.entries(FORMAT_DB)) {
    exts.forEach(ext => ALL_EXTENSIONS[ext] = category);
}

// Populate Select Options
function populateFormatSelector(category) {
    targetFormatSelect.innerHTML = ''; // Clear existing
    
    // Determine which categories to show. 
    // If specific category found, show that first/only. Otherwise show all.
    const categoriesToShow = category ? [category] : Object.keys(FORMAT_DB);

    categoriesToShow.forEach(cat => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = cat.charAt(0).toUpperCase() + cat.slice(1);
        
        FORMAT_DB[cat].forEach(fmt => {
            const option = document.createElement('option');
            option.value = fmt;
            option.textContent = fmt.toUpperCase();
            optgroup.appendChild(option);
        });
        
        targetFormatSelect.appendChild(optgroup);
    });

    // If no category match (unknown file), show everything
    if (!category) {
        Object.keys(FORMAT_DB).forEach(cat => {
            if (categoriesToShow.includes(cat)) return; // Already added
            const optgroup = document.createElement('optgroup');
            optgroup.label = cat.charAt(0).toUpperCase() + cat.slice(1);
            FORMAT_DB[cat].forEach(fmt => {
                const option = document.createElement('option');
                option.value = fmt;
                option.textContent = fmt.toUpperCase();
                optgroup.appendChild(option);
            });
            targetFormatSelect.appendChild(optgroup);
        });
    }
}

// Initialize with all
populateFormatSelector();


// Drag & Drop Handlers
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('active');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('active');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('active');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileSelect(files[0]);
    }
});

dropZone.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
    }
});

function handleFileSelect(file) {
    selectedFile = file;
    fileNameDisplay.textContent = file.name;
    fileSizeDisplay.textContent = formatBytes(file.size);
    
    // Identify Category
    const rawExt = file.name.split('.').slice(-1)[0].toLowerCase(); // Handle simple extensions
    // Check for double extension like tar.gz
    const doubleExt = file.name.split('.').slice(-2).join('.').toLowerCase();
    
    let ext = rawExt;
    if (ALL_EXTENSIONS[doubleExt]) ext = doubleExt;

    const category = ALL_EXTENSIONS[ext] || null;
    
    console.log(`Rilevato: ${ext} -> ${category}`);

    // Re-populate select based on possible conversions (Naive: allow same-category conversion)
    populateFormatSelector(category);

    // Smart Suggestion
    suggestTargetFormat(category, ext);

    dropZone.classList.add('hidden');
    conversionControls.classList.remove('hidden');
    resultContainer.classList.add('hidden');
    progressContainer.classList.add('hidden');
}

function suggestTargetFormat(category, currentExt) {
    let target = 'zip'; // Fallback
    
    if (category === 'image') target = (currentExt === 'png' ? 'jpg' : 'png');
    else if (category === 'video') target = 'mp4';
    else if (category === 'audio') target = 'mp3';
    else if (category === 'document') target = 'pdf';
    else if (category === 'archive') target = (currentExt === 'zip' ? 'tar' : 'zip');

    // Select it if it exists
    if (Array.from(targetFormatSelect.options).some(opt => opt.value === target)) {
        targetFormatSelect.value = target;
    }
}

convertBtn.addEventListener('click', async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('targetFormat', targetFormatSelect.value);
    
    const customNameInput = document.getElementById('custom-filename');
    if (customNameInput && customNameInput.value.trim()) {
        formData.append('customName', customNameInput.value.trim());
    }

    conversionControls.classList.add('hidden');
    progressContainer.classList.remove('hidden');
    progressFill.style.width = '0%';
    statusText.textContent = 'Caricamento ed elaborazione in corso...';
    
    // Simulate initial progress to look responsive
    let progress = 5;
    const interval = setInterval(() => {
        if(progress < 90) progress += Math.random() * 5;
        progressFill.style.width = `${Math.min(progress, 90)}%`;
    }, 500);

    try {
        const response = await fetch('/api/convert', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        clearInterval(interval);
        
        if (result.success) {
            progressFill.style.width = '100%';
            statusText.textContent = 'Conversione Completa!';
            setTimeout(() => {
                showResult(result);
            }, 600);
        } else {
            alert('Errore: ' + (result.error || 'Errore Sconosciuto'));
            resetUI();
        }
    } catch (error) {
        clearInterval(interval);
        alert('Caricamento fallito. Il server è attivo?');
        resetUI();
    }
});

function showResult(result) {
    progressContainer.classList.add('hidden');
    resultContainer.classList.remove('hidden');
    downloadLink.href = result.downloadUrl;
    downloadLink.textContent = 'Scarica';
    
    addRecentTask(selectedFile.name, targetFormatSelect.value);
}

function resetUI() {
    selectedFile = null;
    dropZone.classList.remove('hidden');
    conversionControls.classList.add('hidden');
    progressContainer.classList.add('hidden');
    resultContainer.classList.add('hidden');
    progressFill.style.width = '0%';
    fileInput.value = '';
    
    // Reset selector to show everything
    populateFormatSelector();
}

resetBtn.addEventListener('click', resetUI);

function addRecentTask(name, to) {
    const item = document.createElement('div');
    item.className = 'recent-item';
    item.style.background = 'rgba(255,255,255,0.05)';
    item.style.padding = '0.75rem';
    item.style.borderRadius = '12px';
    item.style.fontSize = '0.85rem';
    item.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 4px;">
            <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:140px;">${name}</span>
            <span style="font-weight:700; color:#818cf8;">${to.toUpperCase()}</span>
        </div>
        <div style="height:4px; background:rgba(255,255,255,0.1); border-radius:2px; overflow:hidden;">
            <div style="height:100%; width:100%; background:#10b981;"></div>
        </div>
    `;
    
    if (recentList.querySelector('.empty-state')) {
        recentList.innerHTML = '';
    }
    recentList.prepend(item);
}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// --- MODAL & LOGIC ---

// Elements
const formatsModal = document.getElementById('formats-modal');
const guideModal = document.getElementById('guide-modal');
const formatsGrid = document.getElementById('formats-grid');
const navFormats = document.querySelector('.nav-formats');
const navGuide = document.querySelector('.nav-guide');
const closeButtons = document.querySelectorAll('.close-modal');

// Populate Formats Modal
function populateFormatsLibrary() {
    if (!formatsGrid) return; // Guard clause
    formatsGrid.innerHTML = '';
    
    Object.keys(FORMAT_DB).forEach(category => {
        const section = document.createElement('div');
        section.className = 'category-section';
        
        const title = document.createElement('h3');
        title.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        
        const cloud = document.createElement('div');
        cloud.className = 'tag-cloud';
        
        FORMAT_DB[category].forEach(fmt => {
            const tag = document.createElement('span');
            tag.className = 'format-tag';
            tag.textContent = fmt.toUpperCase();
            cloud.appendChild(tag);
        });
        
        section.appendChild(title);
        section.appendChild(cloud);
        formatsGrid.appendChild(section);
    });
}

// Open Modals
if (navFormats) {
    navFormats.addEventListener('click', (e) => {
        e.preventDefault();
        populateFormatsLibrary(); // Refresh content
        formatsModal.classList.remove('hidden');
    });
}

if (navGuide) {
    navGuide.addEventListener('click', (e) => {
        e.preventDefault();
        guideModal.classList.remove('hidden');
    });
}

// Close Modals
closeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        console.log('Close clicked');
        formatsModal.classList.add('hidden');
        guideModal.classList.add('hidden');
    });
});

window.addEventListener('click', (e) => {
    if (e.target === formatsModal) formatsModal.classList.add('hidden');
    if (e.target === guideModal) guideModal.classList.add('hidden');
});

// Initial populate of library
document.addEventListener('DOMContentLoaded', populateFormatsLibrary);
