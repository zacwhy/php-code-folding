export function getRanges(lineCount: number, lineAt: (i: number) => string) {
    let blockCommentStart = null;
    const startLineIndexStack = [];
    const ranges = [];

    for (let i = 0; i < lineCount; i++) {
        const chars = lineAt(i);

        for (let j = 0; j < chars.length; j++) {
            // detect line comment
            if (blockCommentStart === null && chars[j] === '/' && chars[j + 1] === '/') {
                break;
                // if a line comment is found, stop checking for the line
                // continue checking next line
                // this is so that braces in the comment are ignored
            }

            // detect blockComment start
            if (blockCommentStart === null && chars[j] === '/' && chars[j + 1] === '*') {
                blockCommentStart = i;
            }

            // detect blockComment end
            if (blockCommentStart !== null && chars[j] === '*' && chars[j + 1] === '/') {
                const start = blockCommentStart;
                const end = i;
                if (end > start) {
                    ranges.push({ start, end, type: 'blockComment' });
                }
                blockCommentStart = null;
            }

            if (blockCommentStart !== null) {
                continue;
                // continue with next character until the blockComment closing is found
            }

            // detect opening brace
            if (chars[j] === '{') {
                startLineIndexStack.push(i);
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
            }

        }
    }

    return ranges;
}
