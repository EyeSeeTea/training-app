import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import i18n from "../../../utils/i18n";
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
import { useLandingNodeDialog } from "./useLandingNodeDialog";

export const SettingsPage: React.FC = () => {
    const { modules, landings, reload, setAppState, isLoading } = useAppContext();

    const { appConfig, save } = useAppConfigContext();
    const { landingNodeDetailsDialog, onAddLandingPage, ...actionsDialog } = useLandingNodeDialog({ nodes: landings });

    const [permissionsType, setPermissionsType] = useState<"settings">();

    const openTraining = useCallback(() => {
        setAppState({ type: "HOME" });
    }, [setAppState]);

    const updateSettingsPermissions = useCallback(
        async ({ userAccesses, userGroupAccesses }: SharedUpdate) => {
            return save({
                settingsPermissions: {
                    users: userAccesses?.map(({ id, name }) => ({ id, name })),
                    userGroups: userGroupAccesses?.map(({ id, name }) => ({ id, name })),
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
            {landingNodeDetailsDialog && <LandingPageEditDialog isOpen={true} {...landingNodeDetailsDialog} />}

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

            <SettingsConfig setPermissionsType={setPermissionsType} modules={modules} landings={landings} />

            <Container>
                <Title>{i18n.t("General Settings")}</Title>

                <Title>{i18n.t("Landing page")}</Title>

                <LandingPageListTable nodes={landings} isLoading={isLoading} {...actionsDialog} />

                <Title>{i18n.t("Training modules")}</Title>

                <ModuleListTable rows={buildListModules(modules)} refreshRows={refreshModules} isLoading={isLoading} />

                <CreateButton onAddLandingPage={onAddLandingPage} />
            </Container>
        </DhisPage>
    );
};

const Title = styled.h3`
    margin-top: 25px;
`;

const Container = styled.div`
    margin: 1.5rem;
`;

const Header = styled(PageHeader)`
    margin-top: 1rem;
`;
