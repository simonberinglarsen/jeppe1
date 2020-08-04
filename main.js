
const fs = require('fs');
const whitelist = fs.readFileSync('whitelist.txt', 'utf-8').split('\n').map(x => x.trim().toLowerCase()).filter(x => x && x.length > 0);
const blacklist = fs.readFileSync('blacklist.txt', 'utf-8').split('\n').map(x => x.trim().toLowerCase()).filter(x => x && x.length > 0);


class Grid {
    constructor(w, h) {
        this.width = w;
        this.height = h;
        this.alphabet = 'abcdefghijklmnopqrstuvwxyz';
        this.solution = [];
        this.clear();
        this.directions = [
            { x: 0, y: 1 },
            { x: 0, y: -1 },
            { x: 1, y: 0 },
            { x: -1, y: 0 },
            { x: 1, y: 1 },
            { x: -1, y: 1 },
            { x: 1, y: -1 },
            { x: -1, y: -1 },
        ];

    }

    clear() {
        this.letters = new Array(this.width * this.height).fill(' ');
    }

    createWithRetry(whitelisted, wordCount, retryCount) {
        while (retryCount-- > 0) {
            let words = whitelisted.select(wordCount);
            if (this.create(words)) {
                return true;
            }
        }
        return false;
    }

    create(words) {
        this.clear();
        const solution = [];
        for (let i = 0; i < words.length; i++) {
            let retry = 0;
            let failedToInsert = true;
            while (retry < 1000) {
                const randomIndex = Math.floor(Math.random() * this.directions.length);
                const randomDirection = this.directions[randomIndex];
                let word = words[i];
                const start = {
                    x: Math.floor(Math.random() * this.width),
                    y: Math.floor(Math.random() * this.height),
                };
                if (this.letterAt(start) !== ' ' && this.letterAt(start) !== word[0]) {
                    continue;
                }
                const end = {
                    x: start.x + (word.length - 1) * randomDirection.x,
                    y: start.y + (word.length - 1) * randomDirection.y
                };
                if (this.outOfBounds(start) || this.outOfBounds(end)) {
                    retry++;
                    continue;
                }
                const tryInsert = (w, letters) => {
                    const p = { ...start };
                    while (w.length > 0) {
                        const index = p.x + p.y * this.width;
                        const isFree = letters[index] === ' ' || letters[index] === w[0];
                        if (!isFree) return false;
                        letters[index] = w[0];
                        p.x += randomDirection.x;
                        p.y += randomDirection.y;
                        w = w.substring(1);
                    };
                    return true;
                }
                if (!tryInsert(word, [...this.letters])) {
                    retry++;
                    continue;
                }
                tryInsert(word, this.letters);
                solution.push({ word, start, end });
                failedToInsert = false;
                break;
            }
            if (failedToInsert) {
                return false;
            }
        }
        const backup = [...this.letters];
        while (true) {
            for (let i = 0; i < this.letters.length; i++) {
                if (this.letters[i] === ' ') {
                    this.letters[i] = this.alphabet[Math.floor(Math.random() * this.alphabet.length)];
                }
            }
            if (!this.findBadWords()) {
                break;
            }
            this.letters = [...backup];
        }
        this.solution = solution;
        return true;

    }

    findBadWords() {
        let alltext = this.letters.join('');
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                alltext += this.letterAt({x,y});
            }
        }
        for (let i = 0; i < blacklist.length; i++) {
            const word = blacklist[i];
            if (alltext.indexOf(word) >= 0) {
                return true;
            }
        }
        return false;
    }

    outOfBounds(p) {
        return p.x < 0 || p.x >= this.width || p.y < 0 || p.y >= this.height;
    }

    letterAt(p) {
        return this.letters[p.x + p.y * this.width];
    }

    display() {
        for (let y = 0; y < this.height; y++) {
            let line = ''
            for (let x = 0; x < this.width; x++) {
                line += this.letterAt({ x, y });
            }
            console.log(line);
        }
        console.log('------------');
        this.solution.forEach(s => {
            console.log(`${s.word} (${s.start.x},${s.start.y}) to (${s.end.x},${s.end.y})`);
        });
    }

    saveAs(filename, scale) {
        const svgLines = [];
        const svgText = [];

        this.solution.forEach(s => {
            const x1 = 20 + s.start.x * scale;
            const y1 = 20 + s.start.y * scale;
            const x2 = 20 + s.end.x * scale;
            const y2 = 20 + s.end.y * scale;
            svgLines.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#ff8080" stroke-width="${scale*0.75}" stroke-linecap="round" />`)
        });

        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                const letter = this.letterAt({ x, y });
                const posx = 20 + x * scale;
                const posy = 20 + y * scale;
                svgText.push(`<text x="${posx}" y="${posy}" font-family="Courier New" font-size="${scale/5}mm" font-weight="bold" dominant-baseline="middle" text-anchor="middle">${letter}</text>`)
            }
        }


        const content = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
        <svg xmlns="http://www.w3.org/2000/svg" width="210mm" height="297mm" viewBox="0 0 210 297">
           ${svgLines.join('\n')}
           ${svgText.join('\n')}
        </svg>`;
        fs.writeFileSync(filename, content, 'utf-8');
    }
}

class WordList {
    constructor(words) {
        this.words = [...words];

    }

    select(count) {
        let temp = [...this.words];
        let selected = [];
        for (let i = 0; i < count; i++) {
            let rnd = Math.floor(Math.random() * temp.length);
            selected.push(temp[rnd]);
            temp.splice(rnd, 1);
        }
        return selected;

    }
}

let g = new Grid(15, 15);

const whitelisted = new WordList(whitelist);


g.createWithRetry(whitelisted, 14, 100);
g.display();
g.saveAs('output.svg', 10);


console.log('done.');

