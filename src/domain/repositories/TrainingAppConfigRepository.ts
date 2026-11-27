import { TrainingAppConfig, TrainingAppConfigEntry } from "../entities/TrainingAppConfig";

export interface TrainingAppConfigRepository {
    get(): Promise<TrainingAppConfig>;
    /** Create the entry, or overwrite it if it already exists */
    saveEntry(entry: TrainingAppConfigEntry): Promise<void>;
}
