import { AxiosInstance } from "axios";
import FormData from "form-data";
import _ from "lodash";
import { DocumentFile } from "../../domain/entities/DocumentFile";
import { DocumentFileRepository } from "../../domain/repositories/DocumentFileRepository";
import { D2Api } from "../../types/d2-api";

/**
 * Documents and their files for Node scripts. The binary transfers use a raw HTTP client
 * (base URL: <DHIS2>/api), as d2-api file methods do not handle binary data under Node.
 */
export class DocumentFileD2Repository implements DocumentFileRepository {
    constructor(private api: D2Api, private httpClient: AxiosInstance) {}

    public async getByIds(ids: string[]): Promise<DocumentFile[]> {
        const documents: DocumentFile[] = [];

        for (const idsGroup of _.chunk(ids, maxIdsPerRequest)) {
            const d2Documents = await this.getList<D2Document>("documents", idsGroup, documentFields);
            const fileResourceIds = d2Documents.filter(doc => !doc.external).map(doc => doc.url);
            const fileResources = await this.getList<D2FileResource>("fileResources", fileResourceIds, fileFields);
            const fileResourcesById = _.keyBy(fileResources, fileResource => fileResource.id);

            const groupDocuments = _.compact(
                d2Documents.map(d2Document => buildDocument(d2Document, fileResourcesById[d2Document.url]))
            );
            documents.push(...groupDocuments);
        }

        return documents;
    }

    public async getFile(id: string): Promise<Uint8Array> {
        return withErrorDetails(async () => {
            const response = await this.httpClient.get<ArrayBuffer>(`/documents/${id}/data`, {
                responseType: "arraybuffer",
            });
            return new Uint8Array(response.data);
        });
    }

    public async save(document: DocumentFile, file: Uint8Array | undefined): Promise<void> {
        const url = await this.getDocumentUrl(document, file);
        // Save the document promptly after the upload: unreferenced fileResources are purged by a job
        const [existing] = await this.getList<D2DocumentWithOwnerFields>("documents", [document.id], ":owner");

        const d2Document = existing
            ? { ...existing, name: document.name, url, external: isExternal(document), attachment: document.attachment }
            : {
                  id: document.id,
                  name: document.name,
                  url,
                  external: isExternal(document),
                  attachment: document.attachment,
                  sharing: { public: document.publicAccess, users: {}, userGroups: {} },
              };

        const response = await this.api.metadata.post({ documents: [d2Document] }).getData();
        if (response.status !== "OK") throw new Error(`Document save failed: ${JSON.stringify(response)}`);
    }

    private async getDocumentUrl(document: DocumentFile, file: Uint8Array | undefined): Promise<string> {
        const { content } = document;
        if (content.type === "external") return content.url;
        if (!file) throw new Error(`Document ${document.id} has content of type file, but no file was given`);

        return withErrorDetails(async () => {
            const form = new FormData();
            form.append("file", Buffer.from(file), { filename: document.name, contentType: content.contentType });
            form.append("domain", "DOCUMENT");

            const response = await this.httpClient.post<D2FileResourceResponse>("/fileResources", form, {
                headers: form.getHeaders(),
                maxBodyLength: Infinity,
            });
            const fileResourceId = response.data.response?.fileResource?.id;
            if (!fileResourceId) throw new Error(`Upload returned no ID: ${JSON.stringify(response.data)}`);
            return fileResourceId;
        });
    }

    private async getList<T>(model: "documents" | "fileResources", ids: string[], fields: string): Promise<T[]> {
        if (_.isEmpty(ids)) return [];

        const response = await this.api
            .get<Record<string, T[] | undefined>>(`/${model}`, {
                paging: false,
                fields,
                filter: `id:in:[${ids.join(",")}]`,
            })
            .getData();

        return response[model] ?? [];
    }
}

// Keep the request URL length bounded
const maxIdsPerRequest = 100;

const documentFields = "id,name,url,external,attachment,sharing[public]";
const fileFields = "id,contentType,contentLength,contentMd5";

interface D2Document {
    id: string;
    name: string;
    url: string;
    external: boolean;
    attachment: boolean;
    sharing?: { public?: string };
}

type D2DocumentWithOwnerFields = D2Document & Record<string, unknown>;

interface D2FileResource {
    id: string;
    contentType: string;
    contentLength: number;
    contentMd5: string;
}

interface D2FileResourceResponse {
    response?: { fileResource?: { id?: string } };
}

function buildDocument(d2Document: D2Document, fileResource: D2FileResource | undefined): DocumentFile | undefined {
    const base = {
        id: d2Document.id,
        name: d2Document.name,
        attachment: d2Document.attachment,
        publicAccess: d2Document.sharing?.public ?? "rw------",
    };

    if (d2Document.external) {
        return { ...base, content: { type: "external", url: d2Document.url } };
    } else if (fileResource) {
        const { contentType, contentLength, contentMd5 } = fileResource;
        return { ...base, content: { type: "file", contentType, size: contentLength, md5: contentMd5 } };
    } else {
        // A document whose file is gone cannot be copied: treat it as non-existing
        return undefined;
    }
}

function isExternal(document: DocumentFile): boolean {
    return document.content.type === "external";
}

/** Raw HTTP errors only say the status code: add the DHIS2 message from the response body */
async function withErrorDetails<T>(fn: () => Promise<T>): Promise<T> {
    try {
        return await fn();
    } catch (err: any) {
        const body = err?.response?.data;
        const details = body instanceof ArrayBuffer ? Buffer.from(body).toString() : body?.message;
        throw details ? new Error(details) : err;
    }
}
