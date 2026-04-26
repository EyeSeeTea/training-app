//@ts-ignore

import React from "react";
import i18n from "../../../utils/i18n";
import { HeaderBar } from "../../components/header-bar/HeaderBar";

export const DhisPage: React.FC = ({ children }) => {
    return (
        <React.Fragment>
            <HeaderBar appName={i18n.t("Training app")} />
            {children}
        </React.Fragment>
    );
};
