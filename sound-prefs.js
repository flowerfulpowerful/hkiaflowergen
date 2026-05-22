// Persists the sound effects toggle without modifying script.js
(function () {
    const STORAGE_KEY = 'hkia-sound-enabled';

    function getSavedSoundEnabled() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === null) return null;
        return saved === 'true';
    }

    function saveSoundEnabled(enabled) {
        localStorage.setItem(STORAGE_KEY, String(enabled));
    }

    function applySoundEnabled(enabled) {
        const toggle = document.getElementById('soundToggle');
        if (toggle) toggle.checked = enabled;
        if (window.flowerSimulator) {
            window.flowerSimulator.soundEnabled = enabled;
        }
    }

    function bindSoundToggle() {
        const toggle = document.getElementById('soundToggle');
        if (!toggle || toggle.dataset.soundPrefsBound) return;

        toggle.dataset.soundPrefsBound = 'true';
        toggle.addEventListener('change', () => {
            const enabled = toggle.checked;
            if (window.flowerSimulator) {
                window.flowerSimulator.soundEnabled = enabled;
            }
            saveSoundEnabled(enabled);
        });
    }

    function initSoundPrefs() {
        const saved = getSavedSoundEnabled();
        if (saved !== null) {
            applySoundEnabled(saved);
        }
        bindSoundToggle();
    }

    function waitForSimulator() {
        if (!window.flowerSimulator) {
            requestAnimationFrame(waitForSimulator);
            return;
        }
        initSoundPrefs();
        // Re-apply after script.js init in case it reset the toggle
        setTimeout(() => {
            const saved = getSavedSoundEnabled();
            if (saved !== null) applySoundEnabled(saved);
        }, 0);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForSimulator);
    } else {
        waitForSimulator();
    }
})();
