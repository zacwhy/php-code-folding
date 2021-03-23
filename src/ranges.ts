export function getRanges(lineCount: number, lineAt: (i: number) => string) {
    let blockCommentStart = null;
    const stringStart: { index: number | null, quote: string | null } = { index: null, quote: null };
    const startLineIndexStack = [];
    const ranges = [];

    for (let i = 0; i < lineCount; i++) {
        const chars = lineAt(i);

        for (let j = 0; j < chars.length; j++) {

            const nextTwoChars = chars[j] + chars[j + 1];

            // detect line comment
            if (blockCommentStart === null && stringStart.quote === null && nextTwoChars === '//') {
                break; // continue checking next line
                // if a line comment is found, stop checking for the line
                // this is so that braces in the comment are ignored
            }

            // detect blockComment start
            if (blockCommentStart === null && nextTwoChars === '/*') {
                blockCommentStart = i;
                j++; // skip second character
                continue;
            }

            // detect blockComment end
            if (blockCommentStart !== null) {
                if (nextTwoChars === '*/') {
                    const start = blockCommentStart;
                    const end = i;
                    if (end > start) {
                        ranges.push({ start, end, type: 'blockComment' });
                    }
                    blockCommentStart = null;
                    j++; // skip second character
                }
                continue;
            }

            if (stringStart.quote !== null && stringStart.index !== null) {
                // string end
                if (chars[j] === stringStart.quote && chars[j - 1] !== '\\') {
                    const start = stringStart.index;
                    const end = i;
                    if (end > start) {
                        ranges.push({ start, end });
                    }
                    stringStart.quote = null;
                    stringStart.index = null;
                }
                continue;
            }

            // string start, single quoted or double quoted
            if (["'", '"'].includes(chars[j])) {
                if (stringStart.quote === null) {
                    stringStart.quote = chars[j];
                    stringStart.index = i;
                }
                continue;
            }

            // detect opening brace
            if (chars[j] === '{') {
                startLineIndexStack.push(i);
                continue;
            }

            // detect closing brace
            if (chars[j] === '}') {
                const start = startLineIndexStack.pop();
                if (start !== undefined) {
                    const end = i;
                    if (end > start) {
                        ranges.push({ start, end });
                    }
                }
                continue;
            }

        }
    }

    return ranges;
}
