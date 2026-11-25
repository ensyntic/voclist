const THEME_KEY = 'voclist_theme';
const SUN_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
const MOON_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

function updateThemeIcon() {
    const btn = document.getElementById('themeBtn');
    if (!btn) return;
    const isLight = document.body.classList.contains('light-theme');
    btn.innerHTML = isLight ? MOON_ICON : SUN_ICON;
}

function toggleTheme() {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    try {
        localStorage.setItem(THEME_KEY, isLight ? 'light' : 'dark');
    } catch (e) {}
    updateThemeIcon();
}

function initTheme() {
    let savedTheme = null;
    try {
        savedTheme = localStorage.getItem(THEME_KEY) || localStorage.getItem('theme');
    } catch (e) {}

    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;

    if (savedTheme === 'light' || (!savedTheme && prefersLight)) {
        document.body.classList.add('light-theme');
    } else {
        document.body.classList.remove('light-theme');
    }
    updateThemeIcon();
}

function decodeBarcode(code) {
    const raw = String(code).trim().replace(/\..+$/, '');
    if (!raw || raw.length < 5) return null;

    const s1 = parseInt(raw[0], 10);
    const mode = (s1 <= 4) ? 'VOCLIST' : 'QUIZZER';
    const isPlus = [3, 4, 7, 8].includes(s1);
    const term = [0, 9].includes(s1) ? 'General' : (s1 % 2 === 1 ? 'Term 1' : 'Term 2');
    const termShort = [0, 9].includes(s1) ? '' : (s1 % 2 === 1 ? 'T1' : 'T2');

    let idx = 1;
    let stage = '', stageShort = '', grade = '';
    const s2Char = raw[idx];

    if (s2Char === '0') {
        const s2Val = parseInt(raw.substring(idx, idx + 2), 10);
        stage = 'Secondary';
        stageShort = 'Sec';
        grade = s2Val;
        idx += 2;
    } else {
        const s2Val = parseInt(raw[idx], 10);
        if (s2Val >= 1 && s2Val <= 6) {
            stage = 'Primary';
            stageShort = 'Pri';
            grade = s2Val;
        } else if (s2Val >= 7 && s2Val <= 9) {
            stage = 'Preparatory';
            stageShort = 'Prep';
            grade = s2Val - 6;
        }
        idx += 1;
    }

    const s3 = parseInt(raw[idx], 10);
    idx += 1;

    const types = {
        1: 'Unit', 2: 'Chapter', 3: 'Review', 4: 'Unit Range',
        5: 'Chapter Range', 6: 'Review (Unit)', 7: 'Review (Unit Range)',
        8: 'Review (Chapter)', 9: 'Review (Chapter Range)', 0: '#'
    };
    const typeName = types[s3] || '';
    const isChapter = [2, 5, 8, 9].includes(s3);
    const isRange = [4, 5, 7, 9].includes(s3);

    const s4Len = isRange ? 4 : 2;
    const s4Str = raw.substring(idx, idx + s4Len);
    idx += s4Len;

    let mainText = '';
    if (isRange) {
        const start = parseInt(s4Str.substring(0, 2), 10);
        const end = parseInt(s4Str.substring(2, 4), 10);
        mainText = `${start}-${end}`;
    } else {
        mainText = `${parseInt(s4Str, 10)}`;
    }

    const s5Str = raw.substring(idx);
    let subText = '';
    const subLabel = isChapter ? 'Part' : 'Lesson';

    if (!s5Str || s5Str.length === 0) {
        subText = `Whole ${isChapter ? 'Chapter' : 'Unit'}`;
    } else if (s5Str.length >= 4) {
        if (s5Str.startsWith('00')) {
            const num = parseInt(s5Str.substring(2, 4), 10);
            subText = `${subLabel} ${num}`;
        } else {
            const start = parseInt(s5Str.substring(0, 2), 10);
            const end = parseInt(s5Str.substring(2, 4), 10);
            subText = `${subLabel}s ${start}-${end}`;
        }
    }

    let labelPart = '';
    if (s3 === 1) labelPart = `Unit ${mainText}`;
    else if (s3 === 2) labelPart = `Chapter ${mainText}`;
    else if (s3 === 3) labelPart = `Review ${mainText}`;
    else if (s3 === 4) labelPart = `Units ${mainText}`;
    else if (s3 === 5) labelPart = `Chapters ${mainText}`;
    else if (s3 === 6) labelPart = `Unit ${mainText} - Review`;
    else if (s3 === 7) labelPart = `Units ${mainText} - Review`;
    else if (s3 === 8) labelPart = `Chapter ${mainText} - Review`;
    else if (s3 === 9) labelPart = `Chapters ${mainText} - Review`;
    else if (s3 === 0) labelPart = `#${mainText}`;

    if (subText && !subText.startsWith('Whole')) {
        labelPart += ` ${subText}`;
    }

    let prefix = (stageShort && grade) ? `${stageShort} ${grade}` : '';
    if (termShort) prefix += prefix ? ` - ${termShort}` : termShort;
    if (isPlus) prefix += prefix ? ' (Plus)' : '(Plus)';

    const formatted = prefix ? `${prefix} - ${labelPart}` : labelPart;

    return {
        raw,
        mode,
        isPlus,
        term,
        termShort,
        stage,
        stageShort,
        grade,
        type: typeName,
        mainText,
        subText,
        formatted
    };
}

if (typeof window !== 'undefined') {
    window.toggleTheme = toggleTheme;
    window.decodeBarcode = decodeBarcode;
    window.addEventListener('DOMContentLoaded', initTheme);
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        initTheme();
    }
}
