import { UserSearch } from "../../data/entities/SearchUser";
import { InstalledApp } from "../entities/InstalledApp";
import { Permission } from "../entities/Permission";

export interface InstanceRepository {
    installApp(appId: string): Promise<boolean>;
    searchUsers(query: string): Promise<UserSearch>;
    listInstalledApps(): Promise<InstalledApp[]>;
    /** Users and user groups that exist, among the given IDs */
    getUsersAndGroups(ids: { userIds: string[]; userGroupIds: string[] }): Promise<Permission>;
}
