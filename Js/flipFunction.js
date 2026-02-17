export function horizontalFlip(editor, selected, start, end) {
    let result = '';
    let inParen = 0, inBrace = 0, inBrack = 0;
    // mapping for D/E tokens (1..8)
    const deMap = { 1: 1, 2: 8, 3: 7, 4: 6, 5: 5, 6: 4, 7: 3, 8: 2 };
    for (let i = 0; i < selected.length; i++) {
        const ch = selected[i];
        if (ch === '(') inParen++; if (ch === ')') inParen--;
        if (ch === '{') inBrace++; if (ch === '}') inBrace--;
        if (ch === '[') inBrack++; if (ch === ']') inBrack--;

        // only transform when not inside any brackets
        if (inParen === 0 && inBrack === 0 && inBrace === 0) {
            const up = ch.toUpperCase();
            // Handle C / C1 (leave unchanged)
            if (up === 'C') {
                const next = selected[i + 1];
                if (next === '1') {
                    result += ch + next; // preserve original case of letter
                    i++; // consume digit
                    continue;
                } else {
                    result += ch;
                    continue;
                }
            }

            // Handle D/E tokens with special mapping
            if (up === 'D' || up === 'E') {
                const next = selected[i + 1];
                if (next && /\d/.test(next)) {
                    const d = parseInt(next, 10);
                    if (d >= 1 && d <= 8) {
                        const mapped = deMap[d];
                        result += ch + mapped.toString();
                        i++; // consume digit
                        continue;
                    }
                }
                // fallback: just append the letter if no valid digit
                result += ch;
                continue;
            }

            // Default behavior for standalone digits (keep original numeric flip)
            if (/\d/.test(ch)) {
                result += ((8 - parseInt(ch, 10)) % 8 + 1).toString();
                continue;
            }

            if (/>/.test(ch)) {
                result += '<';
                continue;
            }

            if (/</.test(ch)) {
                result += '>';
                continue;
            }

            if (/\p/.test(ch)) {
                result += 'q';
                continue;
            }

            if (/\q/.test(ch)) {
                result += 'p';
                continue;
            }

            if (/s/.test(ch)) {
                result += 'z';
                continue;
            }

            if (/\z/.test(ch)) {
                result += 's';
                continue;
            }
        }

        // by default, copy character unchanged
        result += ch;
    }
    editor.setRangeText(result, start, end, "end");
}

export function verticalFlip(editor, selected, start, end) {
    let result = '';
    let inParen = 0, inBrace = 0, inBrack = 0;
    // mapping for D/E tokens (1..8)
    const deMap = { 1: 5, 2: 4, 3: 3, 4: 2, 5: 1, 6: 8, 7: 7, 8: 6 };

    for (let i = 0; i < selected.length; i++) {
        const ch = selected[i];
        if (ch === '(') inParen++; if (ch === ')') inParen--;
        if (ch === '{') inBrace++; if (ch === '}') inBrace--;
        if (ch === '[') inBrack++; if (ch === ']') inBrack--;

        // only transform when not inside any brackets
        if (inParen === 0 && inBrack === 0 && inBrace === 0) {
            const up = ch.toUpperCase();
            // Handle C / C1 (leave unchanged)
            if (up === 'C') {
                const next = selected[i + 1];
                if (next === '1') {
                    result += ch + next; // preserve original case of letter
                    i++; // consume digit
                    continue;
                } else {
                    result += ch;
                    continue;
                }
            }

            // Handle D/E tokens with special mapping
            if (up === 'D' || up === 'E') {
                const next = selected[i + 1];
                if (next && /\d/.test(next)) {
                    const d = parseInt(next, 10);
                    if (d >= 1 && d <= 8) {
                        const mapped = deMap[d];
                        result += ch + mapped.toString();
                        i++; // consume digit
                        continue;
                    }
                }
                // fallback: just append the letter if no valid digit
                result += ch;
                continue;
            }

            // Default behavior for standalone digits (keep original numeric flip)
            if (/\d/.test(ch)) {
                // 1 - 4
                // 2 - 3
                // 3 - 2
                result += ((12 - parseInt(ch, 10)) % 8 + 1).toString();
                continue;
            }

            if (/\p/.test(ch)) {
                result += 'q';
                continue;
            }

            if (/\q/.test(ch)) {
                result += 'p';
                continue;
            }
        }

        // by default, copy character unchanged
        result += ch;
    }
    editor.setRangeText(result, start, end, "end");
}

export function clockwiseFlip(editor, selected, start, end) {
    let result = '';
    let inParen = 0, inBrace = 0, inBrack = 0;

    for (let i = 0; i < selected.length; i++) {
        const ch = selected[i];
        if (ch === '(') inParen++; if (ch === ')') inParen--;
        if (ch === '{') inBrace++; if (ch === '}') inBrace--;
        if (ch === '[') inBrack++; if (ch === ']') inBrack--;

        // only transform when not inside any brackets
        if (inParen === 0 && inBrack === 0 && inBrace === 0) {
            const up = ch.toUpperCase();
            // Handle C / C1 (leave unchanged)
            if (up === 'C') {
                const next = selected[i + 1];
                if (next === '1') {
                    result += ch + next; // preserve original case of letter
                    i++; // consume digit
                    continue;
                } else {
                    result += ch;
                    continue;
                }
            }

            // Default behavior for standalone digits (keep original numeric flip)
            if (/\d/.test(ch)) {
                result += (parseInt(ch, 10) % 8 + 1).toString();
                continue;
            }
        }

        // by default, copy character unchanged
        result += ch;
    }
    editor.setRangeText(result, start, end, "end");
}

export function anticlockwiseFlip(editor, selected, start, end) {
    let result = '';
    let inParen = 0, inBrace = 0, inBrack = 0;

    for (let i = 0; i < selected.length; i++) {
        const ch = selected[i];
        if (ch === '(') inParen++; if (ch === ')') inParen--;
        if (ch === '{') inBrace++; if (ch === '}') inBrace--;
        if (ch === '[') inBrack++; if (ch === ']') inBrack--;

        // only transform when not inside any brackets
        if (inParen === 0 && inBrack === 0 && inBrace === 0) {
            const up = ch.toUpperCase();
            // Handle C / C1 (leave unchanged)
            if (up === 'C') {
                const next = selected[i + 1];
                if (next === '1') {
                    result += ch + next; // preserve original case of letter
                    i++; // consume digit
                    continue;
                } else {
                    result += ch;
                    continue;
                }
            }

            // Default behavior for standalone digits (keep original numeric flip)
            if (/\d/.test(ch)) {
                result += ((parseInt(ch, 10) + 6) % 8 + 1).toString();
                continue;
            }
        }

        // by default, copy character unchanged
        result += ch;
    }
    editor.setRangeText(result, start, end, "end");
}

export function mirrorFlip(editor, selected, start, end) {
    let result = '';
    let inParen = 0, inBrace = 0, inBrack = 0;

    for (let i = 0; i < selected.length; i++) {
        const ch = selected[i];
        if (ch === '(') inParen++; if (ch === ')') inParen--;
        if (ch === '{') inBrace++; if (ch === '}') inBrace--;
        if (ch === '[') inBrack++; if (ch === ']') inBrack--;

        // only transform when not inside any brackets
        if (inParen === 0 && inBrack === 0 && inBrace === 0) {
            const up = ch.toUpperCase();
            // Handle C / C1 (leave unchanged)
            if (up === 'C') {
                const next = selected[i + 1];
                if (next === '1') {
                    result += ch + next; // preserve original case of letter
                    i++; // consume digit
                    continue;
                } else {
                    result += ch;
                    continue;
                }
            }

            // Default behavior for standalone digits (keep original numeric flip)
            if (/\d/.test(ch)) {
                result += ((parseInt(ch, 10) + 3) % 8 + 1).toString();
                continue;
            }
        }

        // by default, copy character unchanged
        result += ch;
    }
    editor.setRangeText(result, start, end, "end");
}


