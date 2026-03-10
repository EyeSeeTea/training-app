import { UseCase } from "../../webapp/CompositionRoot";
import { TrainingModule } from "../entities/TrainingModule";
import { InstanceRepository } from "../repositories/InstanceRepository";
import { GetModuleOptions, TrainingModuleRepository } from "../repositories/TrainingModuleRepository";

export class GetModuleUseCase implements UseCase {
    constructor(
        private trainingModuleRepository: TrainingModuleRepository,
        private instanceRepository: InstanceRepository
    ) {}

    public async execute(id: string, options: GetModuleOptions): Promise<TrainingModule | undefined> {
        const installedApps = await this.instanceRepository.listInstalledApps();
        return this.trainingModuleRepository.get(id, installedApps, options);
    }
}
