import i18n from "../../utils/i18n";
import { Maybe } from "../../types/utils";
import { NamedRef } from "../../domain/entities/Ref";

export function buildSharingDescription(props: Maybe<{ users?: NamedRef[]; userGroups?: NamedRef[] }>) {
    const { users, userGroups } = { users: [], userGroups: [], ...(props || {}) };
    const usersCount = users?.length ?? 0;
    const userGroupsCount = userGroups?.length ?? 0;

    if (usersCount > 0 && userGroupsCount > 0) {
        return i18n.t("Accessible to {{usersCount}} users and {{userGroupsCount}} user groups", {
            usersCount,
            userGroupsCount,
        });
    } else if (usersCount > 0) {
        return i18n.t("Accessible to {{usersCount}} users", { usersCount });
    } else if (userGroupsCount > 0) {
        return i18n.t("Accessible to {{userGroupsCount}} user groups", { userGroupsCount });
    } else {
        return i18n.t("Only accessible to system administrators");
    }
}
