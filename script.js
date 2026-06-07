(function () {
    const text = document.getElementById('text');
    const size = document.getElementById('size');
    const letterSpacingInput = document.getElementById('letterSpacing');
    const stretchXInput = document.getElementById('stretchX');
    const stretchYInput = document.getElementById('stretchY');
    const color = document.getElementById('color');
    const fillType = document.getElementById('fillType');
    const color1 = document.getElementById('color1');
    const color2 = document.getElementById('color2');
    const angle = document.getElementById('angle');

    // fixed default padding (pixels)
    const DEFAULT_PADDING = 20;
    const downloadBtn = document.getElementById('download');
    let canvas = document.getElementById('canvas');
    let ctx = null;

    if (canvas && canvas.getContext) {
        ctx = canvas.getContext('2d');
    } else {
        canvas = document.createElement('canvas');
        ctx = canvas.getContext('2d');
    }

    const textGradPanel = document.getElementById('textGradientControls');

    const font = new FontFace('TlosTitle', "url('tlos_title_font.ttf')");
    document.fonts.add(font);
    font.load().catch(() => { }).then(() => {
        try { render(); } catch (e) { /* ignore render errors during load */ }
    });

    function makeLinearGradientForRect(x, y, w, h, angleDeg, c1, c2) {
        const rad = (angleDeg || 0) * Math.PI / 180;
        const cx = x + w / 2;
        const cy = y + h / 2;
        const half = Math.hypot(w, h) / 2;
        const dx = Math.cos(rad) * half;
        const dy = Math.sin(rad) * half;
        const x0 = cx - dx;
        const y0 = cy - dy;
        const x1 = cx + dx;
        const y1 = cy + dy;
        const g = ctx.createLinearGradient(x0, y0, x1, y1);
        g.addColorStop(0, c1);
        g.addColorStop(1, c2);
        return g;
    }

    function render() {
        const textVal = text.value || '';
        const fontSize = parseInt(size.value, 10) || 72;
        const padding = DEFAULT_PADDING;

        const dpr = Math.max(1, window.devicePixelRatio || 1);
        ctx.font = `${fontSize}px TlosTitle`;

        // get stretch and spacing values
        const rawLetterSpacing = letterSpacingInput ? parseFloat(letterSpacingInput.value) || 0 : 0; // px
        const letterSpacing = Math.max(0, rawLetterSpacing);
        const stretchX = stretchXInput ? (parseInt(stretchXInput.value, 10) || 100) / 100 : 1;
        const stretchY = stretchYInput ? (parseInt(stretchYInput.value, 10) || 100) / 100 : 1;

        // measurement context (unmodified) to get base glyph widths
        const measureCanvas = document.createElement('canvas');
        const mctx = measureCanvas.getContext('2d');
        mctx.font = `${fontSize}px TlosTitle`;

        const lines = textVal.split('\n');
        let maxWidth = 0;
        const measuredLines = []; // arrays of widths per char
        for (const line of lines) {
            const chars = Array.from(line);
            const widths = chars.map(ch => mctx.measureText(ch).width || 0);
            let total = 0;
            for (let i = 0; i < widths.length; i++) {
                total += widths[i] * stretchX;
                if (i < widths.length - 1) total += letterSpacing;
            }
            measuredLines.push({ chars, widths, totalWidth: total });
            if (total > maxWidth) maxWidth = total;
        }

        const lineHeight = Math.ceil(fontSize * 1.12);
        const textWidth = maxWidth;
        const textHeight = lines.length * lineHeight * stretchY;
        const width = textWidth + padding * 2;
        const height = textHeight + padding * 2;

        canvas.width = Math.max(1, Math.ceil(width * dpr));
        canvas.height = Math.max(1, Math.ceil(height * dpr));
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        ctx.clearRect(0, 0, width, height);

        ctx.textBaseline = 'top';
        ctx.font = `${fontSize}px TlosTitle`;
        let y = padding;

        if (fillType && fillType.value === 'linear') {
            const g = makeLinearGradientForRect(padding, padding, textWidth, textHeight, parseInt(angle.value, 10) || 0, color1.value, color2.value);
            ctx.fillStyle = g;
        } else {
            ctx.fillStyle = color.value;
        }

        // draw each line and glyph applying stretch and letter-spacing
        for (const lineInfo of measuredLines) {
            let x = padding;
            for (let i = 0; i < lineInfo.chars.length; i++) {
                const ch = lineInfo.chars[i];
                const w = lineInfo.widths[i] || 0;
                // draw glyph scaled around its origin
                ctx.save();
                ctx.translate(x, y);
                ctx.scale(stretchX, stretchY);
                ctx.fillText(ch, 0, 0);
                ctx.restore();

                // advance by measured width scaled plus letterSpacing (which is in px)
                x += w * stretchX + letterSpacing;
            }
            y += lineHeight * stretchY;
        }
    }

    function download() {
        render();
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tlos-text.png';
        document.body.appendChild(a);
        a.click();
        a.remove();
    }

    function updatePanels() {
        if (fillType && textGradPanel) textGradPanel.classList.toggle('hidden', fillType.value !== 'linear');
        if (typeof color !== 'undefined' && fillType) color.classList.toggle('hidden', fillType.value === 'linear');
    }

    updatePanels();

    if (downloadBtn) downloadBtn.addEventListener('click', (e) => { e.preventDefault(); try { download(); } catch (err) { console.error(err); } });

    const inputs = [text, size, color, fillType, color1, color2, angle, letterSpacingInput, stretchXInput, stretchYInput];
    inputs.forEach(el => { if (el) el.addEventListener('input', () => { updatePanels(); render(); }); });
})();
