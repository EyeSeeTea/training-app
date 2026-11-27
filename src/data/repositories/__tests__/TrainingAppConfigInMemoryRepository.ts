import _ from "lodash";
import { TrainingAppConfig, TrainingAppConfigEntry } from "../../../domain/entities/TrainingAppConfig";
import { TrainingAppConfigRepository } from "../../../domain/repositories/TrainingAppConfigRepository";

export class TrainingAppConfigInMemoryRepository implements TrainingAppConfigRepository {
    constructor(public config: TrainingAppConfig) {}

    public async get(): Promise<TrainingAppConfig> {
        return _.cloneDeep(this.config);
    }

    public async saveEntry(entry: TrainingAppConfigEntry): Promise<void> {
        const entries = this.config.entries.filter(existing => existing.key !== entry.key);
        this.config = { ...this.config, entries: [...entries, _.cloneDeep(entry)] };
    }
}
