'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

class Element {
    constructor(id = null, tagName = 'div') {
        this.id = id;
        this.tagName = tagName.toUpperCase();
        this.value = '';
        this.innerHTML = '';
        this.textContent = '';
        this.style = {};
        this.children = [];
        this.parentNode = null;
        this.dataset = {};
        const classes = new Set();
        this.classList = {
            add: (...cls) => cls.forEach(c => classes.add(c)),
            remove: (...cls) => cls.forEach(c => classes.delete(c)),
            contains: (cls) => classes.has(cls),
            has: (cls) => classes.has(cls),
            toString: () => Array.from(classes).join(' ')
        };
    }

    appendChild(child) {
        child.parentNode = this;
        this.children.push(child);
        return child;
    }

    removeChild(child) {
        const idx = this.children.indexOf(child);
        if (idx >= 0) {
            this.children.splice(idx, 1);
            child.parentNode = null;
        }
        return child;
    }

    querySelectorAll() {
        return [];
    }

    remove() {
        if (this.parentNode) {
            this.parentNode.removeChild(this);
        }
    }
}

function createDocumentStub() {
    const elements = new Map();
    const document = {
        body: new Element('body', 'body'),
        createElement(tag) {
            return new Element(null, tag);
        },
        getElementById(id) {
            if (!elements.has(id)) {
                elements.set(id, new Element(id));
            }
            return elements.get(id);
        },
        querySelector() {
            return null;
        },
        querySelectorAll() {
            return [];
        },
        addEventListener() {
            // not needed for these unit tests
        }
    };

    return document;
}

function extractFunctionSource(html, functionName) {
    const signature = `function ${functionName}`;
    const start = html.indexOf(signature);
    if (start === -1) {
        throw new Error(`Unable to find function ${functionName} in index.html`);
    }

    const braceStart = html.indexOf('{', start);
    if (braceStart === -1) {
        throw new Error(`Unable to locate function body for ${functionName}`);
    }

    let index = braceStart + 1;
    let depth = 1;
    while (index < html.length && depth > 0) {
        const char = html[index];
        if (char === '{') {
            depth += 1;
        } else if (char === '}') {
            depth -= 1;
        } else if (char === '\\') {
            // Skip escaped characters to avoid miscounting braces in strings
            index += 1;
        }
        index += 1;
    }

    if (depth !== 0) {
        throw new Error(`Unbalanced braces while parsing ${functionName}`);
    }

    return html.slice(start, index);
}

const htmlPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const generateWordDisplaySource = extractFunctionSource(html, 'generateWordDisplay');
const normalizeGuessSource = extractFunctionSource(html, 'normalizeGuess');
const checkWordSource = extractFunctionSource(html, 'checkWord');

const documentStub = createDocumentStub();
const context = {
    console,
    setTimeout,
    clearTimeout,
    document: documentStub,
    localStorage: {
        _data: new Map(),
        getItem(key) {
            return this._data.has(key) ? this._data.get(key) : null;
        },
        setItem(key, value) {
            this._data.set(key, String(value));
        },
        removeItem(key) {
            this._data.delete(key);
        }
    },
    playSuccessSound: () => {},
    currentSynonyms: [],
    currentRoundPoints: 0,
    currentRoundCorrectWords: [],
    lastActivity: 0,
    inactivityCounter: 0
};
context.window = context;
context.global = context;

vm.createContext(context);
vm.runInContext(`${generateWordDisplaySource}\n${normalizeGuessSource}\n${checkWordSource}`, context);

const { checkWord, normalizeGuess } = context;

function resetState() {
    context.currentRoundPoints = 0;
    context.currentRoundCorrectWords = [];
    context.lastActivity = 0;
    context.inactivityCounter = 0;
    context.currentSynonyms = [
        {
            word: 'incredible',
            syllables: 'in-cred-i-ble',
            revealedLetters: [true, ...Array('incredible'.length - 1).fill(false)],
            toSwap: 1,
            revealed: false,
            points: 0
        },
        {
            word: 'astonishing',
            syllables: 'as-ton-ish-ing',
            revealedLetters: [true, ...Array('astonishing'.length - 1).fill(false)],
            toSwap: 1,
            revealed: false,
            points: 0
        }
    ];

    // Reset DOM nodes used by checkWord
    const wordInput = documentStub.getElementById('wordInput');
    wordInput.value = '';
    documentStub.getElementById('points').textContent = '';
    context.currentSynonyms.forEach((_, index) => {
        const cell = documentStub.getElementById(`synonym-${index}`);
        cell.innerHTML = '';
        cell.classList.remove('revealed');
    });
}

resetState();

// normalizeGuess should treat casing, punctuation, and spacing as equivalent
assert.strictEqual(normalizeGuess(" Incredible!!! "), 'incredible');
assert.strictEqual(normalizeGuess('self control'), 'self-control');
assert.strictEqual(normalizeGuess('self_control'), 'self-control');

// Auto-match via live typing value
const autoMatchResult = checkWord('incredible');
assert.strictEqual(autoMatchResult, true, 'Expected live input to match first synonym');
assert.strictEqual(context.currentSynonyms[0].revealed, true, 'First synonym should be marked revealed');
assert.strictEqual(documentStub.getElementById('wordInput').value, '', 'Input should be cleared after auto-match');

// Duplicate guesses should not award additional credit
const duplicateResult = checkWord('incredible');
assert.strictEqual(duplicateResult, false, 'Duplicate guesses should return false');

// Using the button (no provided value) should match and clear the field
const wordInput = documentStub.getElementById('wordInput');
wordInput.value = 'astonishing';
const buttonMatch = checkWord();
assert.strictEqual(buttonMatch, true, 'Button-driven check should match the second synonym');
assert.strictEqual(wordInput.value, '', 'Input should be cleared after button-driven match');

// Unmatched guesses leave the text for the Enter handler to clear
wordInput.value = 'wrong';
const noMatch = checkWord();
assert.strictEqual(noMatch, false, 'Unexpected word should return false');
assert.strictEqual(wordInput.value, 'wrong', 'Unmatched guess should remain for Enter handler to clear');

console.log('checkWord auto-matching tests passed');
