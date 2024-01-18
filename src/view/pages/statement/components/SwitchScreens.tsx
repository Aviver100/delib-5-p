import { Screen, Statement, User } from "delib-npm";
import Map from "./map/Map";
import StatementChat from "./chat/StatementChat";
import StatementEvaluation from "./evaluations/StatementEvaluation";
import StatementVote from "./vote/StatementVote";
import MassQuestions from "./massQuestions/MassQuestions";
import StatmentRooms from "./rooms/Rooms";
import StatementSettings from "./settings/StatementSettings";

// Custom components

interface SwitchScreensProps {
    screen: string | undefined;
    statement: Statement | undefined;
    subStatements: Statement[];
    handleShowTalker: (statement: User | null) => void;
    setShowAskPermission: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function SwitchScreens({
    screen,
    statement,
    subStatements,
    handleShowTalker,
    setShowAskPermission,
}: SwitchScreensProps) {
    if (!statement) return null;

    switch (screen) {
        case Screen.DOC:
            return <Map statement={statement} />;

        case Screen.CHAT:
            return (
                <StatementChat
                    statement={statement}
                    subStatements={subStatements}
                    handleShowTalker={handleShowTalker}
                    setShowAskPermission={setShowAskPermission}
                />
            );
        case Screen.OPTIONS:
            return (
                <StatementEvaluation
                    statement={statement}
                    subStatements={subStatements}
                    handleShowTalker={handleShowTalker}
                />
            );
        case Screen.VOTE:
            return (
                <StatementVote
                    statement={statement}
                    subStatements={subStatements}
                />
            );
        case Screen.MASS_QUESTIONS:
            return (
                <MassQuestions
                    statement={statement}
                    subStatements={subStatements}
                />
            );
        case Screen.GROUPS:
            return (
                <StatmentRooms
                    statement={statement}
                    subStatements={subStatements}
                />
            );
        case Screen.SETTINGS:
            return <StatementSettings />;
        case Screen.QUESTIONS:
            return (
                <StatementEvaluation
                    statement={statement}
                    subStatements={subStatements}
                    handleShowTalker={handleShowTalker}
                    questions={true}
                />
            );

        default:
            return (
                <StatementChat
                    statement={statement}
                    subStatements={subStatements}
                    handleShowTalker={handleShowTalker}
                    setShowAskPermission={setShowAskPermission}
                />
            );
    }
}
