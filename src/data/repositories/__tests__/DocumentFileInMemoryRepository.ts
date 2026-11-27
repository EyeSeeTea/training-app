import { DocumentFile } from "../../../domain/entities/DocumentFile";
import { DocumentFileRepository } from "../../../domain/repositories/DocumentFileRepository";

/** Files are stored as given; the "md5" of a file is simulated with its text content */
export class DocumentFileInMemoryRepository implements DocumentFileRepository {
    public saveError: Error | undefined;

    constructor(public documents: Array<{ document: DocumentFile; file?: Uint8Array }>) {}

    public async getByIds(ids: string[]): Promise<DocumentFile[]> {
        return this.documents.filter(({ document }) => ids.includes(document.id)).map(({ document }) => document);
    }

    public async getFile(id: string): Promise<Uint8Array> {
        const file = this.documents.find(({ document }) => document.id === id)?.file;
        if (!file) throw new Error(`No file for document ${id}`);
        return file;
    }

    public async save(document: DocumentFile, file: Uint8Array | undefined): Promise<void> {
        if (this.saveError) throw this.saveError;

        const content: DocumentFile["content"] =
            document.content.type === "file" && file
                ? { ...document.content, md5: new TextDecoder().decode(file) }
                : document.content;
        const others = this.documents.filter(other => other.document.id !== document.id);
        this.documents = [...others, { document: { ...document, content }, file }];
    }
}
