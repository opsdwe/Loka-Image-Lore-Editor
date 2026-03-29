const fileInput       = document.getElementById('fileInput');
const uploadBtn       = document.getElementById('uploadBtn');
const asciiCharInput  = document.getElementById('asciiChar');
const widthInput      = document.getElementById('widthInput');
const heightInput     = document.getElementById('heightInput');
const previewHeader   = document.getElementById('previewHeader');
const previewContent  = document.getElementById('previewContent');
const previewDivider  = document.getElementById('previewDivider');
const codeOutput      = document.getElementById('codeOutput');
const updatePreviewBtn = document.getElementById('updatePreviewBtn');
const hexModeBtn      = document.getElementById('hexModeBtn');
const normalModeBtn   = document.getElementById('normalModeBtn');
const copyBtn         = document.getElementById('copyBtn');
const canvas          = document.getElementById('canvas');
const ctx             = canvas.getContext('2d');

let isHexMode    = true;
let currentImage = null;

const minecraftColors = {
    '0': { code: '<black>',        color: '#000000' },
    '1': { code: '<dark_blue>',    color: '#0000AA' },
    '2': { code: '<dark_green>',   color: '#00AA00' },
    '3': { code: '<dark_aqua>',    color: '#00AAAA' },
    '4': { code: '<dark_red>',     color: '#AA0000' },
    '5': { code: '<dark_purple>',  color: '#AA00AA' },
    '6': { code: '<gold>',         color: '#FFAA00' },
    '7': { code: '<gray>',         color: '#AAAAAA' },
    '8': { code: '<dark_gray>',    color: '#555555' },
    '9': { code: '<blue>',         color: '#5555FF' },
    'a': { code: '<green>',        color: '#55FF55' },
    'b': { code: '<aqua>',         color: '#55FFFF' },
    'c': { code: '<red>',          color: '#FF5555' },
    'd': { code: '<light_purple>', color: '#FF55FF' },
    'e': { code: '<yellow>',       color: '#FFFF55' },
    'f': { code: '<white>',        color: '#FFFFFF' },
};

uploadBtn.addEventListener('click',  () => fileInput.click());
fileInput.addEventListener('change', handleFileSelect);
asciiCharInput.addEventListener('input', updatePreview);
widthInput.addEventListener('input',  updatePreview);
heightInput.addEventListener('input', updatePreview);
updatePreviewBtn.addEventListener('click', updatePreviewFromCode);
hexModeBtn.addEventListener('click',    () => switchMode(true));
normalModeBtn.addEventListener('click', () => switchMode(false));
copyBtn.addEventListener('click', copyToClipboard);

hexModeBtn.classList.add('active');

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            currentImage = img;
            processImage(img);
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

function switchMode(hexMode) {
    isHexMode = hexMode;
    hexModeBtn.classList.toggle('active', hexMode);
    normalModeBtn.classList.toggle('active', !hexMode);
    if (currentImage) processImage(currentImage);
}

function updatePreview() {
    if (currentImage) processImage(currentImage);
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
    } : null;
}

function rgbToHex(r, g, b) {
    const toHex = (n) => n.toString(16).toUpperCase().padStart(2, '0');
    return '#' + toHex(r) + toHex(g) + toHex(b);
}

function getClosestMinecraftColor(r, g, b) {
    let closestKey = 'f';
    let minDistance = Infinity;

    for (const [key, value] of Object.entries(minecraftColors)) {
        const mc = hexToRgb(value.color);
        const distance = Math.sqrt(
            2 * (r - mc.r) ** 2 +
            4 * (g - mc.g) ** 2 +
            3 * (b - mc.b) ** 2
        );
        if (distance < minDistance) {
            minDistance = distance;
            closestKey = key;
        }
    }

    return minecraftColors[closestKey];
}

function processImage(img) {
    // Clamp dimensions
    let width  = Math.min(Math.max(parseInt(widthInput.value)  || 30, 1), 30);
    let height = Math.min(Math.max(parseInt(heightInput.value) || 15, 1), 15);
    widthInput.value  = width;
    heightInput.value = height;

    canvas.width  = width;
    canvas.height = height;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    const pixels = ctx.getImageData(0, 0, width, height).data;
    const char   = asciiCharInput.value || '█';
    let codeText = '';

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const a = pixels[i + 3];

            if (a < 128) {
                codeText += isHexMode ? `<#000000>${char}` : `<black>${char}`;
            } else if (isHexMode) {
                codeText += `<${rgbToHex(r, g, b)}>${char}`;
            } else {
                codeText += `${getClosestMinecraftColor(r, g, b).code}${char}`;
            }
        }
        codeText += '\n';
    }

    codeOutput.value = codeText;
    renderPreview(codeText.trim());
}

function appendColoredLine(container, line, isHex) {
    const pattern = isHex ? /<#[A-F0-9]{6}>./gi : /<[a-z_]+>./gi;
    const parts   = line.match(pattern) || [];

    parts.forEach(part => {
        const span = document.createElement('span');

        if (isHex) {
            const m = part.match(/<(#[A-F0-9]{6})>(.)/i);
            if (!m) return;
            span.style.color = m[1];
            span.textContent = m[2];
        } else {
            const m = part.match(/<([a-z_]+)>(.)/i);
            if (!m) return;
            const mc = Object.values(minecraftColors).find(c => c.code === `<${m[1].toLowerCase()}>`);
            if (!mc) return;
            span.style.color = mc.color;
            span.textContent = m[2];
        }

        container.appendChild(span);
    });
}

function renderPreview(codeText) {
    const lines = codeText.split('\n');
    const isHex = /<#[A-F0-9]{6}>/i.test(codeText);

    previewHeader.textContent = '';
    if (lines[0]) {
        appendColoredLine(previewHeader, lines[0], isHex);
    } else {
        previewHeader.textContent = 'Header';
    }

    previewContent.textContent = '';
    if (lines.length > 1) {
        lines.slice(1).forEach((line, index, arr) => {
            appendColoredLine(previewContent, line, isHex);
            if (index < arr.length - 1) {
                previewContent.appendChild(document.createElement('br'));
            }
        });
    } else {
        previewContent.textContent = 'Content';
    }
}

function updatePreviewFromCode() {
    const codeText = codeOutput.value.trim();
    if (!codeText) return;
    renderPreview(codeText);

    if (!previewHeader.textContent.trim())  previewHeader.textContent  = 'Header';
    if (!previewContent.textContent.trim()) previewContent.textContent = 'Content';
}

function copyToClipboard() {
    const text = codeOutput.value;

    const reset = (msg) => {
        copyBtn.textContent = msg;
        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
    };

    if (!text) { reset('Copied!'); return; }

    navigator.clipboard.writeText(text)
        .then(() => reset('Copied!'))
        .catch(() => reset('Error!'));
}
