import React, { useCallback } from "react";
import i18n from "../../../utils/i18n";
import { SpeedDial, SpeedDialAction, SpeedDialIcon } from "@material-ui/lab";
import { useAppContext } from "../../contexts/app-context";
import { Description, OpenInBrowser } from "@material-ui/icons";

export interface CreateButtonProps {
    onAddLandingPage: () => void;
}

export const CreateButton: React.FC<CreateButtonProps> = props => {
    const { onAddLandingPage } = props;

    const { setAppState } = useAppContext();
    const onAddModule = useCallback(() => {
        setAppState({ type: "CREATE_MODULE" });
    }, [setAppState]);

    const [isOpen, open] = useOpenAction();

    return (
        <>
            <SpeedDial
                open={isOpen}
                onClick={open}
                style={styles.speedDial}
                ariaLabel={i18n.t("Create")}
                icon={<SpeedDialIcon />}
            >
                <SpeedDialAction
                    onClick={onAddModule}
                    tooltipOpen
                    icon={<OpenInBrowser />}
                    tooltipTitle={i18n.t("Module")}
                />

                <SpeedDialAction
                    onClick={onAddLandingPage}
                    tooltipOpen
                    icon={<Description />}
                    tooltipTitle={i18n.t("Landing Page")}
                />
            </SpeedDial>
        </>
    );
};

const styles = {
    speedDial: { position: "fixed" as const, bottom: 16, right: 16 },
};

function useOpenAction() {
    const [isOpen, setOpen] = React.useState(false);
    const open = React.useCallback(() => setOpen(prev => !prev), []);
    return [isOpen, open] as const;
}
