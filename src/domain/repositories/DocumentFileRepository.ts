import { DocumentFile } from "../entities/DocumentFile";

export interface DocumentFileRepository {
    /** Documents that exist, among the given IDs */
    getByIds(ids: string[]): Promise<DocumentFile[]>;

    getFile(id: string): Promise<Uint8Array>;

    /**
     * Create the document with the same ID, or update it if it already exists. A file (required for
     * documents with content of type "file") is uploaded and replaces the current one. On update, the
     * existing sharing is kept, as users and groups are instance-specific.
     */
    save(document: DocumentFile, file: Uint8Array | undefined): Promise<void>;
}
