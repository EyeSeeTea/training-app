import _ from "lodash";
import { BaseMetadata, NamedRef } from "../../domain/entities/Ref";

export interface User {
    id: string;
    name: string;
    username: string;
    isSuperAdmin: boolean;
    /** `/api/me` returns empty `userRoles` on DHIS2 v43. */
    authorities: string[];
    userGroups: NamedRef[];
}

type ValidateUserPermissionItem = Pick<BaseMetadata, "publicAccess" | "userAccesses" | "userGroupAccesses"> & {
    user?: NamedRef;
};

export const validateUserPermission = (
    item: ValidateUserPermissionItem,
    permission: "read" | "write",
    currentUser: User
) => {
    const { user, publicAccess = "--------", userAccesses = [], userGroupAccesses = [] } = item;
    const token = permission === "read" ? "r" : "w";

    const isUserOwner = user?.id && user?.id === currentUser.id;
    const isPublic = publicAccess.substring(0, 2).includes(token);

    const hasUserAccess = !!_(userAccesses)
        .filter(({ access }) => access.substring(0, 2).includes(token))
        .find(({ id }) => id === currentUser?.id);

    const hasGroupAccess =
        _(userGroupAccesses)
            .filter(({ access }) => access.substring(0, 2).includes(token))
            .intersectionBy(currentUser?.userGroups || [], "id")
            .value().length > 0;

    return currentUser.isSuperAdmin || isUserOwner || isPublic || hasUserAccess || hasGroupAccess;
};
