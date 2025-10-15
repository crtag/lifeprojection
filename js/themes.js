/**
 * Theme Manager
 * Defines and manages light/dark themes
 */

class ThemeManager {
    constructor() {
        this.themes = {
            dark: {
                name: 'dark',
                background: 0x000510,
                gridColor: 0x444444,
                cellColors: {
                    young: 0x00ff88,
                    mature: 0xffaa00,
                    old: 0x8888ff
                },
                particleColors: [
                    0xff00ff,
                    0x00ffff,
                    0xffff00,
                    0xff0088,
                    0x00ff88,
                    0x8800ff
                ],
                lights: {
                    ambientIntensity: 0.4,
                    directionalIntensity: 0.8,
                    directionalColor: 0xffffff
                }
            },
            light: {
                name: 'light',
                background: 0xf0f0f0,
                gridColor: 0x333333,
                cellColors: {
                    young: 0x00cc66,
                    mature: 0xff8800,
                    old: 0x6666dd
                },
                particleColors: [
                    0xcc00cc,
                    0x00aaaa,
                    0xcccc00,
                    0xcc0066,
                    0x00cc66,
                    0x6600cc
                ],
                lights: {
                    ambientIntensity: 0.6,
                    directionalIntensity: 0.5,
                    directionalColor: 0xffffee
                }
            }
        };

        this.currentTheme = 'dark';
    }

    getTheme(name) {
        return this.themes[name] || this.themes.dark;
    }

    getCurrentTheme() {
        return this.getTheme(this.currentTheme);
    }

    setCurrentTheme(name) {
        if (this.themes[name]) {
            this.currentTheme = name;
            return true;
        }
        return false;
    }

    getThemeNames() {
        return Object.keys(this.themes);
    }
}
