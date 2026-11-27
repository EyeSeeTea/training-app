/** A DHIS2 document with the information needed to copy it: its own file or an external URL */
export interface DocumentFile {
    id: string;
    name: string;
    attachment: boolean;
    publicAccess: string;
    content: DocumentContent;
}

export type DocumentContent =
    | { type: "external"; url: string }
    | { type: "file"; contentType: string; size: number; md5: string };

// DHIS2 2.42 rejects uploads bigger than the dhis.conf key max.file_upload_size, which defaults to this value
export const defaultMaxUploadSize = 10_000_000;

export function hasSameContent(document1: DocumentFile, document2: DocumentFile): boolean {
    const [content1, content2] = [document1.content, document2.content];

    if (content1.type === "external" && content2.type === "external") {
        return content1.url === content2.url;
    } else if (content1.type === "file" && content2.type === "file") {
        return content1.md5 === content2.md5;
    } else {
        return false;
    }
}

export function exceedsSize(document: DocumentFile, maxSize: number): boolean {
    return document.content.type === "file" && document.content.size > maxSize;
}

export function getDocumentDescription(document: DocumentFile): string {
    const { content } = document;
    const details =
        content.type === "file" ? `${content.contentType}, ${content.size} bytes` : `external: ${content.url}`;
    return `${document.name} (${details})`;
}
