import { ConfirmationDialog, ConfirmationDialogProps, useLoading, useSnackbar } from "@eyeseetea/d2-ui-components";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { NamedRef } from "../../../domain/entities/Ref";
import {
    addPage,
    addStep,
    removePage,
    removeStep,
    updateOrder,
    updateTranslation,
} from "../../../domain/helpers/TrainingModuleHelpers";
import i18n from "../../../utils/i18n";
import { ComponentParameter, Maybe } from "../../../types/utils";
import { LandingPageListTable } from "../../components/landing-page-list-table/LandingPageListTable";
import { buildListModules, ModuleListTable } from "../../components/module-list-table/ModuleListTable";
import { PageHeader } from "../../components/page-header/PageHeader";
import { PermissionsDialog, SharedUpdate } from "../../components/permissions-dialog/PermissionsDialog";
import { useAppContext } from "../../contexts/app-context";
import { DhisPage } from "../dhis/DhisPage";
import { useAppConfigContext } from "../../contexts/AppConfigProvider";
import { CreateButton } from "./CreateButton";
import { LandingPageEditDialog } from "../../components/landing-page-edit-dialog/LandingPageEditDialog";
import { SettingsConfig } from "./SettingsConfig";

export const SettingsPage: React.FC = () => {
    const { modules, landings, reload, usecases, setAppState, isLoading } = useAppContext();

    const { appConfig, save } = useAppConfigContext();

    const snackbar = useSnackbar();

    const [permissionsType, setPermissionsType] = useState<"settings">();

    const openTraining = useCallback(() => {
        setAppState({ type: "HOME" });
    }, [setAppState]);

    const updateSettingsPermissions = useCallback(
        async ({ userAccesses = [], userGroupAccesses = [] }: SharedUpdate) => {
            return save({
                settingsPermissions: {
                    users: userAccesses.map(({ id, name }) => ({ id, name })),
                    userGroups: userGroupAccesses.map(({ id, name }) => ({ id, name })),
                },
            });
        },
        [save]
    );

    const refreshModules = useCallback(async () => {
        await reload();
    }, [reload]);

    useEffect(() => {
        reload();
    }, [reload]);

    return (
        <DhisPage>
            {landingPageDetailsDialog && <LandingPageEditDialog isOpen={true} {...landingPageDetailsDialog} />}

            {!!permissionsType && (
                <PermissionsDialog
                    object={{
                        name: "Access to settings",
                        publicAccess: "--------",
                        userAccesses:
                            appConfig.settingsPermissions.users.map(ref => ({
                                ...ref,
                                access: "rw----",
                            })) ?? [],
                        userGroupAccesses:
                            appConfig.settingsPermissions.userGroups.map(ref => ({
                                ...ref,
                                access: "rw----",
                            })) ?? [],
                    }}
                    onChange={updateSettingsPermissions}
                    onClose={() => setPermissionsType(undefined)}
                />
            )}

            <Header title={i18n.t("Settings")} onBackClick={openTraining} />

            <SettingsConfig
                setPermissionsType={setPermissionsType}
                buildSharingDescription={buildSharingDescription}
                modules={modules}
                landings={landings}
            />

            <Container>
                <Title>{i18n.t("General Settings")}</Title>

                <Title>{i18n.t("Landing page")}</Title>

                <LandingPageListTable nodes={landings} isLoading={isLoading} />

                <Title>{i18n.t("Training modules")}</Title>

                <ModuleListTable
                    rows={buildListModules(modules)}
                    refreshRows={refreshModules}
                    tableActions={tableActions}
                    isLoading={isLoading}
                />

                <CreateButton onAddLandingPage={} />
            </Container>
        </DhisPage>
    );
};

function buildSharingDescription(props: Maybe<{ users?: NamedRef[]; userGroups?: NamedRef[] }>) {
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

const Title = styled.h3`
    margin-top: 25px;
`;

const Container = styled.div`
    margin: 1.5rem;
`;

const Header = styled(PageHeader)`
    margin-top: 1rem;
`;
