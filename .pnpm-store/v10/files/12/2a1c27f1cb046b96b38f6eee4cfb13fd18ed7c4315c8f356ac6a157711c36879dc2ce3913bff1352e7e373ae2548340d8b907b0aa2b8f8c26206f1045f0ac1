import { Range, OffsetRange, Position, DocumentEditData } from './types.js';
/** Document Catalogue */
export declare class Document {
    /** Actual document content. */
    private _text;
    /** Get the displacement of the file position in the text. */
    positionAt: (offset: number) => Position | undefined;
    /** Get the position of the displacement point in the file. */
    offsetAt: (position: Position) => number | undefined;
    constructor(content: string);
    /** Generate location search */
    private createFinder;
    getText(range?: Range | OffsetRange): string;
    /** Edit document data */
    edit(data: DocumentEditData): string | undefined;
}
