import { useConfig } from "@dhis2/app-runtime";
import { useSnackbar } from "@eyeseetea/d2-ui-components";
import React, { useCallback } from "react";
import { getModuleLaunchUrl } from "../../../domain/entities/TrainingModule";
import i18n from "../../../utils/i18n";
import { MainButton } from "../../components/main-button/MainButton";
import { MarkdownViewer } from "../../components/markdown-viewer/MarkdownViewer";
import { CenteredModal, ModalContent, ModalFooter } from "../../components/modal";
import { useAppContext } from "../../contexts/app-context";

export const ExitPage = () => {
    const { baseUrl } = useConfig();
    const { setAppState, module } = useAppContext();
    const snackbar = useSnackbar();

    const continueTutorial = useCallback(() => {
        setAppState(appState => ({ ...appState, exit: false }));
    }, [setAppState]);

    const exitTutorial = useCallback(() => {
        const launchUrl = getModuleLaunchUrl(baseUrl, module);

        if (launchUrl) {
            window.location.href = launchUrl;
        } else {
            snackbar.error(i18n.t("This module does not exist or you do not have access to it."));
        }
    }, [baseUrl, module, snackbar]);

    const goHome = useCallback(() => {
        setAppState({ type: "HOME" });
    }, [setAppState]);

    return (
        <CenteredModal onGoHome={goHome} centerChildren={true}>
            <ExitPageContent />
            <ModalFooter>
                <MainButton color="primary" onClick={continueTutorial}>
                    {i18n.t("Continue Tutorial")}
                </MainButton>
                <MainButton color="secondary" onClick={exitTutorial}>
                    {i18n.t("Exit Tutorial")}
                </MainButton>
            </ModalFooter>
        </CenteredModal>
    );
};

export const ExitPageContent: React.FC = () => {
    const title = i18n.t("Are you sure you want to exit?");
    const source = [
        `# ${title}`,
        i18n.t(
            "If you are sure you want to exit, select 'Exit tutorial'. You can relaunch the training tutorial again at any time from the applications menu."
        ),
        i18n.t(
            "If you would like to continue with training, select 'Continue tutorial' below or if you would like to select a different tutorial, click on the 'Home' button."
        ),
    ].join("\n\n");

    return (
        <ModalContent>
            <MarkdownViewer source={source} center={true} />
        </ModalContent>
    );
};
