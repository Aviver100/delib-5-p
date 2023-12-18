import { logger } from "firebase-functions/v1";
import { db } from "./index";

// import { logBase } from "./helpers";
import {
    Collections,
    Evaluation,
    EvaluationSchema,
    ResultsBy,
    SimpleStatement,
    Statement,
    StatementSchema,
    StatementType,
    statementToSimpleStatement,
} from "delib-npm";

//update evaluation of a statement
export async function updateEvaluation(event: any) {
    try {
        const {
            statementId,
            parentId,
            evaluationDeferneces,
            evaluation,
            previousEvaluation,
            error,
        } = getEvaluationInfo();

        if (error || !statementId) throw error;

        const statementRef = db.collection("statements").doc(statementId);

        const { newPro, newCon } = await setNewEvaluation(
            statementRef,
            evaluationDeferneces,
            evaluation,
            previousEvaluation
        );

        // Fairness calculations (social choice theory)
        // The aim of the consesus calulation is to give statement with more positive evaluation and less vegative evaluations,
        // while letting small groups with heigher consesus an uper hand, over large groups with alot of negative evaluations.

        const sumEvaluation = newPro - newCon;
        const n = newPro + Math.abs(newCon);
        const consensusScore = sumEvaluation / n;
        const consensus =
            Math.abs(consensusScore) *
            Math.sign(newPro - newCon) *
            Math.log2(n);

        //set consensus to statement in DB
        await statementRef.update({ consensus });

        //update parent statement?
        //get parent statement
        updateParentStatementWithChildResults(parentId);
    } catch (error) {
        logger.error(error);
        return;
    }

    //inner functions

    function getEvaluationInfo() {
        try {
            const statementEvaluation = event.data.after.data() as Evaluation;
            EvaluationSchema.parse(statementEvaluation);
            const { evaluation, statementId, parentId } = statementEvaluation;

            const dataBefore = event.data.before.data();
            let previousEvaluation = 0;
            if (dataBefore) previousEvaluation = dataBefore.evaluation || 0;
            if (isNaN(previousEvaluation))
                throw new Error("previousEvaluation is not a number");
            if (isNaN(evaluation))
                throw new Error("evaluation is not a number");

            const evaluationDeferneces: number =
                evaluation - previousEvaluation || 0;
            if (!evaluationDeferneces)
                throw new Error("evaluationDeferneces is not defined");

            return {
                parentId,
                statementId,
                evaluationDeferneces,
                evaluation,
                previousEvaluation,
            };
        } catch (error: any) {
            logger.error(error);
            return { error: error.message };
        }
    }

    async function setNewEvaluation(
        statementRef: any,
        evaluationDeferneces: number | undefined,
        evaluation: number = 0,
        previousEvaluation: number | undefined
    ): Promise<{ newCon: number; newPro: number; totalEvaluators: number }> {
        const results = { newCon: 0, newPro: 0, totalEvaluators: 0 };
        await db.runTransaction(async (t: any) => {
            try {
                if (!evaluationDeferneces)
                    throw new Error("evaluationDeferneces is not defined");
                if (evaluation === undefined)
                    throw new Error("evaluation is not defined");
                if (previousEvaluation === undefined)
                    throw new Error("previousEvaluation is not defined error");

                const statementDB = await t.get(statementRef);

                if (!statementDB.exists) {
                    throw new Error("statement does not exist");
                }

                const oldPro = statementDB.data().pro || 0;
                const oldCon = statementDB.data().con || 0;

                const { newCon, newPro, totalEvaluators } = updateProCon(
                    oldPro,
                    oldCon,
                    evaluation,
                    previousEvaluation
                );
                results.newCon = newCon;
                results.newPro = newPro;
                results.totalEvaluators = totalEvaluators;

                t.update(statementRef, {
                    totalEvaluations: newCon + newPro,
                    con: newCon,
                    pro: newPro,
                });

                return results;
            } catch (error) {
                logger.error(error);
                return results;
            }
        });

        return results;

        function updateProCon(
            oldPro: number,
            oldCon: number,
            evaluation: number,
            previousEvaluation: number
        ): { newPro: number; newCon: number; totalEvaluators: number } {
            try {
                let newPro = oldPro;
                let newCon = oldCon;

                const { pro, con } = clacProCon(previousEvaluation, evaluation);

                newPro += pro;
                newCon += con;
                const totalEvaluators: number = newPro + newCon;

                return { newPro, newCon, totalEvaluators };
            } catch (error) {
                logger.error(error);
                return { newPro: oldPro, newCon: oldCon, totalEvaluators: 0 };
            }
        }
    }
}

function clacProCon(prev: number, curr: number): { pro: number; con: number } {
    try {
        let pro = 0,
            con = 0;
        if (prev > 0) {
            pro = -prev;
        } else if (prev < 0) {
            con = prev;
        }

        if (curr > 0) {
            pro += curr;
        } else if (curr < 0) {
            con -= curr;
        }
        return { pro, con };
    } catch (error) {
        console.error(error);
        return { pro: 0, con: 0 };
    }
}

interface ResultsSettings {
    resultsBy: ResultsBy;
    numberOfResults?: number;
    deep?: number;
    minConsensus?: number;
    solutions?: SimpleStatement[];
}

function getResultsSettings(
    results: ResultsSettings | undefined
): ResultsSettings {
    if (!results) {
        return {
            resultsBy: ResultsBy.topOne,
        };
    } else {
        return results;
    }
}

async function updateParentStatementWithChildResults(
    parentId: string | undefined
) {
    try {
        if (!parentId) throw new Error("parentId is not defined");

        //get parent statement
        const parentStatementRef = db.collection("statements").doc(parentId);
        const parentStatementDB = await parentStatementRef.get();
        if (!parentStatementDB.exists)
            throw new Error("parentStatement does not exist");
        const parentStatement = parentStatementDB.data() as Statement;
        StatementSchema.parse(parentStatement);

        //get resutls settings
        const { resultsSettings } = parentStatement;
        const { resultsBy, numberOfResults } =
            getResultsSettings(resultsSettings);

        //this function is responsible for converting the results of evaluation of options

        if (resultsBy !== ResultsBy.topOptions || !numberOfResults) {
            return;
        }
        //update child statements if they are results or options
        const childStatementsRef = db
            .collection(Collections.statements)
            .where("parentId", "==", parentId)
            .orderBy("consensus", "desc")
            .limit(numberOfResults);

        const childStatementsDB = await childStatementsRef.get();
        const childStatements = childStatementsDB.docs.map(
            (doc: any) => doc.data() as Statement
        );

        const childStatementsSimple = childStatements.map((st: Statement) =>
            statementToSimpleStatement(st)
        );

        const childIds = childStatements.map((st: Statement) => st.statementId);

        //update parent with results
        await db.collection(Collections.statements).doc(parentId).update({
            totalResults: numberOfResults,
            results: childStatementsSimple,
        });

        //update previous results to be of type option
        const statementsDB = await db
            .collection(Collections.statements)
            .where("parentId", "==", parentId)
            .where("statementType", "!=", StatementType.statement)
            .get();

        await statementsDB.forEach(async (stDB: any) => {
            const st = stDB.data() as Statement;

            //update childstatment selectd to be of type result
            if (childIds.includes(st.statementId)) {
                db.collection(Collections.statements)
                    .doc(st.statementId)
                    .update({ statementType: StatementType.result });
            } else if (st.statementType === StatementType.result) {
                db.collection(Collections.statements)
                    .doc(st.statementId)
                    .update({ statementType: StatementType.option });
            }
        });

        //update childstatment selectd to be of type result
    } catch (error) {
        logger.error(error);
    }
}

// async function updateParentWithResults(parentId:string){

// }
