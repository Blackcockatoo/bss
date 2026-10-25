/* Rendered geometry skin only. Game rules, player bounds and saves are untouched. */
(function (global) {
    'use strict';
    const key = 'metapet:geometry-pilot:v1';
    function read(storage) {
        try {
            const packet = JSON.parse(storage.getItem(key));
            return packet && packet.version === 1 && typeof packet.image === 'string'
                && packet.image.length <= 500000 && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(packet.image)
                ? packet.image : null;
        } catch (_) { return null; }
    }
    function create(options) {
        const button = options.button;
        let image = null;
        let enabled = false;
        const update = () => {
            if (!button) return;
            button.disabled = !image;
            button.textContent = image ? (enabled ? 'Pilot: Geometry' : 'Pilot: Monkey') : 'Geometry unavailable';
            button.setAttribute('aria-pressed', String(enabled));
        };
        update();
        if (button) button.addEventListener('click', () => { if (image) { enabled = !enabled; update(); } });
        try {
            const pixels = read(options.storage || global.sessionStorage);
            if (pixels) {
                const candidate = new (options.ImageClass || global.Image)();
                candidate.onload = () => {
                    if (candidate.naturalWidth !== 256 || candidate.naturalHeight !== 256) return;
                    image = candidate; enabled = true; update();
                };
                candidate.onerror = () => { image = null; enabled = false; update(); };
                candidate.src = pixels;
            }
        } catch (_) { /* Local storage or image decoding unavailable: keep the monkey. */ }
        return {
            draw(context, x, y, width, height) {
                if (!enabled || !image) return false;
                context.drawImage(image, x, y, width, height);
                return true;
            },
        };
    }
    global.MetaPetGeometryPilot = { key, read, create };
})(window);
