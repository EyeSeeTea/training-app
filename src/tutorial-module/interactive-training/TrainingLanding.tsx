import React from "react";
import styled from "styled-components";

import { TrainingModule } from "../../domain/entities/TrainingModule";
import { LandingNode } from "../../domain/entities/LandingPage";
import { Config } from "../../domain/entities/Config";
import { TranslateMethod } from "../../domain/entities/TranslatableText";
import { LogoInfo } from "../../webapp/hooks/useAppConfig";
import { useUpdateModuleStep } from "../training-module/useTutorial";
import { HomePageContentComponent } from "../../webapp/components/home/HomePageContent";
import { Maybe } from "../../types/utils";

type TrainingLandingProps = {
    modules: TrainingModule[];
    landings: LandingNode[];
    appConfig?: Config;
    logoInfo?: LogoInfo;
    translate: TranslateMethod;
    currentPage?: LandingNode;
    isRoot: boolean;
    openPage: (page: LandingNode) => void;
    loadModule: (moduleId: string) => void;
    loadedModule: Maybe<TrainingModule>;
};
export const TrainingLanding: React.FC<TrainingLandingProps> = props => {
    const { modules, appConfig, translate, currentPage, isRoot, openPage, logoInfo, loadModule, loadedModule } = props;

    return (
        <>
            {!loadedModule && currentPage && appConfig && logoInfo && (
                <Container>
                    <HomePageContentComponent
                        currentPage={currentPage}
                        isRoot={isRoot}
                        openPage={openPage}
                        loadModule={loadModule}
                        modules={modules}
                        appConfig={appConfig}
                        translate={translate}
                        logoInfo={logoInfo}
                    />
                </Container>
            )}
        </>
    );
};

type TrainingModuleProps = {
    module: TrainingModule;
};
const TutorialModule: React.FC<TrainingModuleProps> = props => {
    const { module } = props;
    const { moduleStep, setModuleStep, setTutorialProgress, tutorialProgress, updateModuleStep } = useUpdateModuleStep({
        module,
    });
    return <></>;
};

const Container = styled.div`
    color: white;
    flex: 1;
    display: flex;
    flex-direction: column;

    & > div:first-child {
        text-align: center;
    }

    & > span {
        text-align: center;
    }

    [data-component="modalContent"] {
        max-height: unset;
    }

    [data-component="cardboard"] {
        grid-template-columns: repeat(2, minmax(0, 1fr));

        & > div {
        }

        span {
            padding: 0;
            font-size: 16px;
            overflow-wrap: break-word;
            word-break: break-word;
        }
        img {
            width: 100%;
            max-width: 120px;
        }
    }
`;
