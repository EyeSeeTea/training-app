import { Document } from "../../domain/entities/Document";
import { DocumentRepository } from "../../domain/repositories/DocumentRepository";
import { D2Api } from "../../types/d2-api";
import { getD2APiFromInstance } from "../utils/d2-api";
import { Instance } from "../entities/Instance";
import { getUid } from "../utils/uid";

export class Dhis2DocumentRepository implements DocumentRepository {
    constructor(private api: D2Api) {}

    public async get(): Promise<Document[]> {
        return this.api.models.documents
            .get({
                filter: { name: { $like: "[Training App]" } },
                fields: { id: true, name: true },
                paging: false,
            })
            .getData()
            .then(data => data.objects.map(({ id, name }) => ({ id, name })));
    }

    public async delete(ids: string[]): Promise<void> {
        await this.api.metadata.post({ documents: ids.map(id => ({ id })) }, { importStrategy: "DELETE" }).getData();
    }
}