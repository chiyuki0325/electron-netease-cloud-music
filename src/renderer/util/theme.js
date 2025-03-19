import MuseUI from 'muse-ui';

const overrides = {
    divider: 'rgba(0,0,0,.1)'
};

/**
 * add app specific theme variable, then set theme color
 * @param {any} theme theme option
 * @param {string} variety theme variety (dark or light)
 * @param {Function} setTrayIcon method to set tray icon color
 */
export function initTheme(theme, variety, setTrayIcon) {
    MuseUI.theme.addCreateTheme((theme) => {
        return `body{
--primary-color:${theme.primary};
--accent-color:${theme.secondary};
--text-color:${theme.text.primary};
--secondary-text-color:${theme.text.secondary};
--hint-text-color:${theme.text.hint};
--disabled-text-color:${theme.text.disabled};
--background-color:${theme.background.default};
}`;
    });
    setTheme(theme, variety, setTrayIcon);
}

/**
 * set MuseUI theme color
 * @param {any} theme theme option
 * @param {string} variety theme variety (dark or light)
 * @param {Function} setTrayIcon method to set tray icon color
 */
export function setTheme(theme, variety, setTrayIcon) {
    const id = 'ncm';
    MuseUI.theme.add(id, { ...overrides, ...theme }, variety).use(id);
    setTrayIcon(variety === 'dark' ? 'light' : 'dark');  // reversed
}
