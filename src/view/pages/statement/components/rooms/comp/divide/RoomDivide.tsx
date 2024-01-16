import { FC } from "react";

// Third Party Libraries
import { RoomAskToJoin, Statement } from "delib-npm";

// Redux
import { useAppSelector } from "../../../../../../../functions/hooks/reduxHooks";
import { userSelectedTopicSelector } from "../../../../../../../model/statements/statementsSlice";

// Styles
import _styles from "./roomDivide.module.scss";

// Custom Components
import Text from "../../../../../../components/text/Text";

const styles = _styles as any;

interface Props {
    statement: Statement;
}

const RoomQuestions: FC<Props> = ({ statement }) => {
    const userTopic: RoomAskToJoin | undefined = useAppSelector(
        userSelectedTopicSelector(statement.statementId),
    );

    try {
        return (
            <>
                <h1>{("Room Allocation")}</h1>
                {/* {userTopic && userTopic.approved ? */}
                <div className={styles.message}>
                    {userTopic && userTopic.statement ? (
                        <>
                            <h2>
                                <Text
                                    text={`
                                        Discussion Topic: 
                                        ${userTopic.statement.statement}`}
                                    onlyTitle={true}
                                />
                            </h2>
                            <div className={styles.text}>
                                {"Welcome to Room Number"}{" "}
                                <span>{userTopic.roomNumber}</span>
                                {"In Zoom"}
                            </div>
                        </>
                    ) : (
                        <h2>{("No Topic Chosen by You")}</h2>
                    )}
                </div>
            </>
        );
    } catch (error: any) {
        return <div>error: {error.message}</div>;
    }
};

export default RoomQuestions;
