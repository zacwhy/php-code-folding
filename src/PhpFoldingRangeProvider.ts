import {
    CancellationToken,
    FoldingContext,
    FoldingRange,
    FoldingRangeKind,
    FoldingRangeProvider,
    ProviderResult,
    TextDocument,
} from 'vscode';
import * as phpParser from 'php-parser';

const parser = new phpParser.Engine({
    ast: {
        withPositions: true
    }
});

export class PhpFoldingRangeProvider implements FoldingRangeProvider {
    provideFoldingRanges(document: TextDocument, context: FoldingContext, token: CancellationToken): ProviderResult<FoldingRange[]> {

        const text = document.getText();
        const program = parser.parseCode(text, '');

        const ranges = tryWalk(program);

        return ranges.map(({ start, end, type }) => new FoldingRange(
            start - 1, // minus one to zero index
            end - 2, // exclude the closing brace line, so it is excluded from folding
            toFoldingRangeKind(type)
        ));
    }
}

function tryWalk(node: any): any[] {
    try {
        return walk(node);
    } catch (e) {
        throw e;
    }
}

function walk(node: phpParser.Node): Range[] {
    switch (node.kind) {
        case 'program':
        case 'namespace':
            return scanBlock(node as phpParser.Block);

        case 'class':
            return scanClass(node as Class);

        case 'function':
        case 'method':
            return scanFunction(node as Function);

        case 'if':
            return scanIf(node as phpParser.If);

        case 'try':
            return scanTry(node as Try);

        case 'do':
        case 'for':
        case 'foreach':
        case 'while':
            return scanLoop(node as Loop);

        case 'switch':
            return scanSwitch(node as Switch);

        // handled by returning empty Range[]
        case 'break':
        case 'block':
        case 'classconstant':
        case 'continue':
        case 'echo':
        case 'expressionstatement':
        case 'goto':
        case 'interface':
        case 'label':
        case 'propertystatement':
        case 'return':
        case 'throw':
        case 'unset':
        case 'usegroup':
            return [];

        default:
            console.log(node.kind, node);
            // throw Error('not handled');
            return [];
    }
}

function scanBlock(block: phpParser.Block): Range[] {
    return scanChildren(block.children);
}

function scanChildren(children: phpParser.Node[]): Range[] {
    const ranges: Range[] = [];

    for (const child of children) {
        ranges.push(...walk(child));
    }

    return ranges;
}

function scanClass(classNode: Class): Range[] {
    return [
        {
            start: classNode.loc.start.line,
            end: classNode.loc.end.line,
            kind: classNode.kind,
        },
        ...scanChildren(classNode.body)
    ];
}

function scanFunction(functionNode: Function): Range[] {
    if (!functionNode.body) {
        // e.g. abstract function
        return [];
    }

    return [
        {
            start: functionNode.body.loc.start.line,
            end: functionNode.body.loc.end.line,
            kind: functionNode.kind,
        },
        ...scanChildren(functionNode.body.children),
    ];
}

function scanLoop(loopNode: Loop): Range[] {
    return [
        {
            start: loopNode.body.loc.start.line,
            end: loopNode.body.loc.end.line,
            kind: loopNode.kind,
        },
        ...scanChildren(loopNode.body.children),
    ];
}

function scanSwitch(switchNode: Switch): Range[] {
    const ranges: Range[] = [];

    ranges.push({
        start: switchNode.body.loc.start.line,
        end: switchNode.body.loc.end.line,
        kind: switchNode.kind,
    });

    for (const node of switchNode.body.children) {
        const caseNode = node as Case;

        ranges.push({
            start: caseNode.loc.start.line,
            end: caseNode.loc.end.line,
            kind: caseNode.kind,
        });

        if (caseNode.body) {
            ranges.push(...scanChildren(caseNode.body.children));
        }
    }

    return ranges;
}

function scanIf(ifNode: phpParser.If): Range[] {
    const items: Range[] = [];

    let branch: phpParser.If | phpParser.Block | null = ifNode;

    while (branch) {
        if (branch.kind === 'if') { // 'if' and 'else if' branch
            const ifNode2 = branch as phpParser.If;

            if (ifNode2.body.loc) {
                items.push({
                    start: ifNode2.body.loc.start.line,
                    end: ifNode2.body.loc.end.line,
                    kind: ifNode2.kind,
                });
            }

            // single line statement will not have children
            if (ifNode2.body.children) {
                items.push(...scanChildren(ifNode2.body.children));
            }

            branch = ifNode2.alternate;

        } else { // 'else' branch
            if (branch.kind === 'block') {
                const blockNode = branch as phpParser.Block;

                if (blockNode.loc) {
                    items.push({
                        start: blockNode.loc.start.line,
                        end: blockNode.loc.end.line,
                        kind: blockNode.kind,
                    });
                }

                items.push(...scanChildren(blockNode.children));
            }

            break; // no more alternate branch
        }
    }

    return items;
}

function scanTry(tryNode: Try): Range[] {
    const items: Range[] = [];

    if (tryNode.body.loc) {
        items.push({
            start: tryNode.body.loc.start.line,
            end: tryNode.body.loc.end.line,
            kind: tryNode.kind,
        });
    }

    for (const child of tryNode.body.children) {
        items.push(...walk(child));
    }

    for (const catchNode of tryNode.catches) {
        if (catchNode.body.loc) {
            items.push({
                start: catchNode.body.loc.start.line,
                end: catchNode.body.loc.end.line,
                kind: catchNode.kind,
            });
        }

        const c = catchNode.body as phpParser.Block;

        for (const child of c.children) {
            items.push(...walk(child));
        }
    }

    const t = tryNode;

    if (t.always) {
        if (t.always.loc) {
            items.push({
                start: t.always.loc.start.line,
                end: t.always.loc.end.line,
                kind: t.always.kind,
            });
        }

        for (const child of t.always.children) {
            items.push(...walk(child));
        }
    }

    return items;
}

function toFoldingRangeKind(type: string | undefined): FoldingRangeKind | undefined {
    switch (type) {
        case 'blockComment':
            return FoldingRangeKind.Comment;
    }
}

interface Range {
    start: number;
    end: number;
    kind: string;
}

interface Block extends phpParser.Block {
    loc: phpParser.Location;
}

interface Class extends phpParser.Class {
    loc: phpParser.Location;
}

interface Function extends phpParser.Function {
    body: Block | null;
}

interface Loop extends phpParser.Node {
    body: Block;
}

interface Switch extends phpParser.Switch {
    body: Block;
}

interface Case extends phpParser.Case {
    loc: phpParser.Location;
}

interface Try extends phpParser.Try {
    always: phpParser.Block;
}
