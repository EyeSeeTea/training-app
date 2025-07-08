import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";

import { FormGroup, Icon, ListItem, ListItemIcon, ListItemText } from "@material-ui/core";
import i18n from "../../../utils/i18n";
import { useAppConfigContext } from "../../contexts/AppConfigProvider";
import { Maybe } from "../../../types/utils";
import { NamedRef } from "../../../domain/entities/Ref";
import { useAppContext } from "../../contexts/app-context";
import { ConfirmationDialog, ConfirmationDialogProps, useLoading, useSnackbar } from "@eyeseetea/d2-ui-components";
import { TrainingModule } from "../../../domain/entities/TrainingModule";
import { LandingNode } from "../../../domain/entities/LandingPage";
import { CustomizeSettingsDialog } from "../../components/customize-settings-dialog/CustomizeSettingsDialog";
import { buildSharingDescription } from "../../utils/sharing-settings";

type SettingsConfigProps = {
    setPermissionsType: (type: Maybe<"settings">) => void;
    modules: TrainingModule[];
    landings: LandingNode[];
};

export const SettingsConfig: React.FC<SettingsConfigProps> = props => {
    const { setPermissionsType, modules, landings } = props;
    const { usecases, isAdmin, isLoading } = useAppContext();
    const { appConfig, save, hasLoaded, logoInfo } = useAppConfigContext();
    const snackbar = useSnackbar();
    const loading = useLoading();

    const [danglingDocuments, setDanglingDocuments] = useState<NamedRef[]>([]);
    const [dialogProps, updateDialog] = useState<ConfirmationDialogProps | null>(null);
    const [showCustomSettings, setShowCustomSettings] = useState(false);

    const toggleShowAllModules = useCallback(() => {
        return save({
            showAllModules: !appConfig.showAllModules,
        });
    }, [appConfig, save]);

    const openSettingsPermission = useCallback(() => {
        console.log("openSettingsPermission");
        setPermissionsType("settings");
    }, [setPermissionsType]);

    const openCustomizeSettingsDialog = useCallback(() => setShowCustomSettings(true), []);

    const closeCustomSettingsDialog = useCallback(() => {
        setShowCustomSettings(false);
    }, []);

    const saveCustomSettings = useCallback(
        async data => {
            await save(data);
            closeCustomSettingsDialog();
        },
        [save, closeCustomSettingsDialog]
    );

    const cleanUpDanglingDocuments = useCallback(async () => {
        updateDialog({
            title: i18n.t("Clean-up unused documents"),
            description: (
                <ul>
                    {danglingDocuments.map(item => (
                        <li key={item.id}>{`${item.id} ${item.name}`}</li>
                    ))}
                </ul>
            ),
            onCancel: () => updateDialog(null),
            onSave: async () => {
                loading.show(true, i18n.t("Deleting dangling documents"));

                await usecases.document.delete(danglingDocuments.map(({ id }) => id));
                setDanglingDocuments([]);

                snackbar.success(i18n.t("Deleted dangling documents"));
                loading.reset();
                updateDialog(null);
            },
            saveText: i18n.t("Proceed"),
        });
    }, [danglingDocuments, loading, snackbar, usecases]);

    useEffect(() => {
        if (!hasLoaded || isLoading) return;
        const data = [...modules, ...landings, appConfig];
        usecases.document.listDangling(data).then(setDanglingDocuments);
    }, [usecases, modules, landings, appConfig, isLoading, hasLoaded]);

    return (
        <>
            {dialogProps && <ConfirmationDialog isOpen={true} maxWidth={"lg"} fullWidth={true} {...dialogProps} />}
            {showCustomSettings && (
                <CustomizeSettingsDialog
                    onSave={saveCustomSettings}
                    customText={appConfig?.customText ?? emptyObject}
                    onClose={closeCustomSettingsDialog}
                    logo={logoInfo.logoPath}
                />
            )}

            <Group row={true}>
                <ListItem button onClick={openSettingsPermission}>
                    <ListItemIcon>
                        <Icon>settings</Icon>
                    </ListItemIcon>
                    <ListItemText
                        primary={i18n.t("Access to Settings")}
                        secondary={buildSharingDescription(appConfig.settingsPermissions)}
                    />
                </ListItem>

                <ListItem button onClick={toggleShowAllModules}>
                    {appConfig.showAllModules}

                    <ListItemIcon>
                        <Icon>{appConfig.showAllModules ? "visibility" : "visibility_off"}</Icon>
                    </ListItemIcon>
                    <ListItemText
                        primary={i18n.t("Show list with modules on main landing page")}
                        secondary={
                            appConfig.showAllModules
                                ? i18n.t("A list with all the existing modules is visible")
                                : i18n.t("The list with all the existing  modules is hidden")
                        }
                    />
                </ListItem>

                <ListItem button onClick={openCustomizeSettingsDialog}>
                    <ListItemIcon>
                        <Icon>format_shapes</Icon>
                    </ListItemIcon>
                    <ListItemText
                        primary={i18n.t("Customize the landing page")}
                        secondary={i18n.t("Update the logo or content")}
                    />
                </ListItem>

                {isAdmin && (
                    <ListItem button disabled={danglingDocuments.length === 0} onClick={cleanUpDanglingDocuments}>
                        <ListItemIcon>
                            <Icon>delete_forever</Icon>
                        </ListItemIcon>
                        <ListItemText
                            primary={i18n.t("Clean-up unused documents")}
                            secondary={
                                danglingDocuments.length === 0
                                    ? i18n.t("There are no unused documents to clean")
                                    : i18n.t("There are {{total}} documents available to clean", {
                                          total: danglingDocuments.length,
                                      })
                            }
                        />
                    </ListItem>
                )}
            </Group>
        </>
    );
};

const emptyObject = {};

const Group = styled(FormGroup)`
    margin-bottom: 35px;
    margin-left: 0;
`;
