import _ from "lodash";
import { User } from "../../data/entities/User";
import { UseCase } from "../../webapp/CompositionRoot";
import { NamedRef } from "../entities/Ref";
import { ConfigRepository } from "../repositories/ConfigRepository";
import { TrainingModule } from "../entities/TrainingModule";
export class CheckSettingsPermissionsUseCase implements UseCase {
    constructor(private configRepository: ConfigRepository) {}

    public async execute(permission?: "read" | "write", module?: TrainingModule): Promise<boolean> {
        const user = await this.configRepository.getUser();
        const permissions = await this.configRepository.getSettingsPermissions();
        //this is always true bc it's a superuser
        const isAdmin = !!user.userRoles.find(role => role.authorities.find(authority => authority === "ALL"));
        const sharedByUser = this.findCurrentUser(user, permissions.users ?? []);
        const sharedByGroup = this.findCurrentUser(user, permissions.userGroups ?? []);
        const hasPermission = module && permission ? this.hasPermissions(permission, user, module) : false;
        return isAdmin || sharedByUser || sharedByGroup || hasPermission;
    }

    
    private hasPermissions = (permission: "read" | "write", user: User, module: TrainingModule) => {
        const { publicAccess = "--------", userAccesses = [], userGroupAccesses = [] } = module;
        const token = permission === "read" ? "r" : "w";
        const isUserOwner = module.user.id === user?.id;
        const isPublic = publicAccess.substring(0, 2).includes(token);
        const hasUserAccess = !!_(userAccesses)
            .filter(({ access }) => access.substring(0, 2).includes(token))
            .find(({ id }) => id === user?.id);
        const hasGroupAccess =
            _(userGroupAccesses)
                .filter(({ access }) => access.substring(0, 2).includes(token))
                .intersectionBy(user?.userGroups || [], "id")
                .value().length > 0;
        return isUserOwner || isPublic || hasUserAccess || hasGroupAccess;
    }


    private findCurrentUser(user: User, collection: NamedRef[]): boolean {
        return !_([user, ...user.userGroups])
            .intersectionBy(collection, userGroup => userGroup.id)
            .isEmpty();
    }
}
