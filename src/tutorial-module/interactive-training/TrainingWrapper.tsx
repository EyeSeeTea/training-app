import React from "react";

export const TrainingWrapper: React.FC<{
    trainingId: string;
    children: React.ReactNode;
}> = props => {
    const { children, trainingId: id } = props;
    if (!id) return <>{children}</>;

    return (
        <div data-training-id={id} style={{ display: "contents" }}>
            {children}
        </div>
    );
};
