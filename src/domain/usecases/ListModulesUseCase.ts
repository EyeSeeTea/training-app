import { UseCase } from "../../webapp/CompositionRoot";
import { TrainingModule } from "../entities/TrainingModule";
import { InstanceRepository } from "../repositories/InstanceRepository";
import { TrainingModuleRepository } from "../repositories/TrainingModuleRepository";

export class ListModulesUseCase implements UseCase {
    constructor(
        private trainingModuleRepository: TrainingModuleRepository,
        private instanceRepository: InstanceRepository
    ) {}

    public async execute(): Promise<TrainingModule[]> {
        return this.trainingModuleRepository.list();
    }
}
