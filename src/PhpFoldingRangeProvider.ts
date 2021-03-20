import {
    CancellationToken,
    FoldingContext,
    FoldingRange,
    FoldingRangeKind,
    FoldingRangeProvider,
    ProviderResult,
    TextDocument,
} from 'vscode';
import { getRanges } from './ranges';

export class PhpFoldingRangeProvider implements FoldingRangeProvider {
    provideFoldingRanges(document: TextDocument, context: FoldingContext, token: CancellationToken): ProviderResult<FoldingRange[]> {

        const ranges = getRanges(document.lineCount, (i: number) => document.lineAt(i).text);

        return ranges.map(({ start, end, type }) => new FoldingRange(
            start,
            end - 1, // exclude the closing brace line, so it is excluded from folding
            toFoldingRangeKind(type)
        ));
    }
}

function toFoldingRangeKind(type: string | undefined): FoldingRangeKind | undefined {
    switch (type) {
        case 'blockComment':
            return FoldingRangeKind.Comment;
    }
}
