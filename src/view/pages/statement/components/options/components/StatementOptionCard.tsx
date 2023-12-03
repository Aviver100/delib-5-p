import { FC, useEffect, useState, useRef } from "react";
import { Statement } from "delib-npm";
import {
    useAppDispatch,
    useAppSelector,
} from "../../../../../../functions/hooks/reduxHooks";
// import ThumbsUpDownIcon from '@mui/icons-material/ThumbsUpDown';
import {
    setStatementElementHight,
    statementSubscriptionSelector,
} from "../../../../../../model/statements/statementsSlice";

import StatementChatSetOption from "../../chat/components/StatementChatSetOption";
import Text from "../../../../../components/text/Text";

//images

import EditTitle from "../../../../../components/edit/EditTitle";
import Evaluation from "../../../../../components/evaluation/Evaluation";
import StatementChatSetEdit from "../../chat/components/StatementChatSetEdit";
import {
    isAuthorized,
} from "../../../../../../functions/general/helpers";
import StatementChatMore from "../../chat/StatementChatMore";
import AddSubQuestion from "../../chat/components/addSubQuestion/AddSubQuestion";

interface Props {
    statement: Statement;
    showImage: Function;
    top: number;

}

const StatementOptionCard: FC<Props> = ({ statement, top }) => {
    const dispatch = useAppDispatch();

    const statementSubscription = useAppSelector(
        statementSubscriptionSelector(statement.statementId)
    );
    const _isAuthrized = isAuthorized(statement, statementSubscription);
    const elementRef = useRef<HTMLDivElement>(null);

    const [show, setShow] = useState(false);
    const [newTop, setNewTop] = useState(top);
    const [edit, setEdit] = useState(false);

    useEffect(() => {
        setNewTop(top);
    }, [top]);

    useEffect(() => {
        dispatch(
            setStatementElementHight({
                statementId: statement.statementId,
                height: elementRef.current?.clientHeight,
            })
        );
    }, []);


    return (
        <div
            className="options__card"
            style={{ top: `${newTop}px` }}
            ref={elementRef}
        >
            <div className="options__card__main">
                <div
                    className="options__card__text text"
                    onClick={() => setShow(!show)}
                >
                    <span></span>
                    {!edit ? (
                        <div>
                            <Text text={statement.statement} />
                        </div>
                    ) : (
                        <EditTitle
                            statement={statement}
                            setEdit={setEdit}
                            isTextArea={true}
                        />
                    )}
                </div>

                <Evaluation statement={statement} />
            </div>
            <AddSubQuestion statement={statement} />
            <div className="options__card__chat">
                <StatementChatMore statement={statement} />
                <div className="options__card__chat__settings">
                    <StatementChatSetEdit
                        isAuthrized={_isAuthrized}
                        edit={edit}
                        setEdit={setEdit}
                    />
                    <StatementChatSetOption statement={statement} />
                </div>
            </div>
        </div>
    );
};

export default StatementOptionCard;
