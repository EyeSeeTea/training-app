import React from "react";
import { LandingNode } from "../../../domain/entities/LandingPage";
import styled from "styled-components";
import { useAppConfigContext } from "../../contexts/AppConfigProvider";
import { ModalContent, ModalParagraph, ModalTitle } from "../modal";
import { useAppContext } from "../../contexts/app-context";
import { Cardboard } from "../card-board/Cardboard";
import { BigCard } from "../card-board/BigCard";
import i18n from "../../../utils/i18n";

type TrainingAreaProps = {
    landingNodes: LandingNode[];
    openPage: (page: LandingNode) => void;
};

export const MainLandingPage: React.FC<TrainingAreaProps> = (props: TrainingAreaProps) => {
    const { landingNodes, openPage } = props;
    const { translate } = useAppContext();
    const { appConfig, logoInfo } = useAppConfigContext();
    const { logoPath, logoText } = logoInfo;

    return (
        <React.Fragment>
            <LogoContainer>
                <img src={logoPath} alt={logoText} />
            </LogoContainer>
            <ModalTitle bold={true} big={true}>
                {translate(appConfig.customText.rootTitle)}
            </ModalTitle>
            <ModalContent>
                <ModalParagraph size={28} align={"left"}>
                    {translate(appConfig.customText.rootSubtitle)}
                </ModalParagraph>

                <Cardboard rowSize={3}>
                    {landingNodes.map((item, idx) => (
                        <BigCard
                            key={`card-${idx}`}
                            label={translate(item.name)}
                            onClick={() => openPage(item)}
                            icon={
                                item.icon ? (
                                    <img
                                        src={item.icon}
                                        alt={i18n.t("Icon for {{name}}", { name: translate(item.name) })}
                                    />
                                ) : undefined
                            }
                        />
                    ))}
                </Cardboard>
            </ModalContent>
        </React.Fragment>
    );
};

const LogoContainer = styled.div`
    margin-top: 15px;

    img {
        margin: 0 30px;
        user-drag: none;
        max-height: 100px;
    }
`;
