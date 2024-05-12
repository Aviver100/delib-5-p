import { logger } from "firebase-functions/v1";
import { db } from "./index";
import { FieldValue } from "firebase-admin/firestore";

// import { logBase } from "./helpers";
import {
    Collections,
    Evaluation,
    ResultsBy,
    SimpleStatement,
    Statement,
    StatementSchema,
    StatementType,
    statementToSimpleStatement,
} from "delib-npm";


export async function newEvaluation(event: any) {
    try {
        //add evaluator to statement
        console.log("new evaluation")
        const statementEvaluation = event.data.data() as Evaluation;
        const { statementId } = statementEvaluation;
        if (!statementId) throw new Error("statementId is not defined");

        //add one evaluator to statement
        const statementRef = db.collection(Collections.statements).doc(statementId);
        statementRef.update({ totalEvaluators: FieldValue.increment(1) });

    } catch (error) {
        logger.error(error);
    }
}

export async function deleteEvaluation(event: any) {
    try {
        //add evaluator to statement
        const statementEvaluation = event.data.data() as Evaluation;
        const { statementId } = statementEvaluation;
        if (!statementId) throw new Error("statementId is not defined");

        //add one evaluator to statement
        const statementRef = db.collection(Collections.statements).doc(statementId);
        statementRef.update({ totalEvaluators: FieldValue.increment(-1) });

    } catch (error) {
        logger.error(error);
    }
}


//update evaluation of a statement
export async function updateEvaluation(event: any) {
    try {
        const {
            statementId,
            parentId,
            evaluationDeference,
            evaluation,
            previousEvaluation,
            error,
        } = getEvaluationInfo();
        if (error) throw error;
        if (!statementId) throw new Error("statementId is not defined");

        const statementRef = db.collection(Collections.statements).doc(statementId);
        const { newPro, newCon } = await setNewEvaluation(
            statementRef,
            evaluationDeference,
            evaluation,
            previousEvaluation,
        );

        const statementDB = await statementRef.get();
        if (!statementDB.exists) throw new Error("Statement does not exist");
        const statement = statementDB.data() as Statement;
        StatementSchema.parse(statement);
        const totalEvaluators = statement.totalEvaluators || 0;


        // Fairness calculations (social choice theory)
        // The aim of the consensus calculation is to give statement with more positive evaluation and less negative evaluations,
        // while letting small groups with higher consensus an upper hand, over large groups with a lot of negative evaluations.

        const sumEvaluation = newPro - newCon;
        const averageEvaluation = totalEvaluators !== 0 ? sumEvaluation / totalEvaluators : 0; // average evaluation
        const consensus =
            totalEvaluators !== 0
                ? averageEvaluation * Math.sqrt(totalEvaluators)
                : 0;
console.log(statement.statement, 'consensus',consensus, 'totalEvaluators', totalEvaluators, 'averageEvaluation', averageEvaluation, 'sumEvaluation', sumEvaluation);
        //set consensus to statement in DB
        await statementRef.update({ consensus, totalEvaluators });

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

            const { evaluation, statementId, parentId } = statementEvaluation;

            const dataBefore = event.data.before.data();
            let previousEvaluation = 0;
            if (dataBefore) previousEvaluation = dataBefore.evaluation || 0;
            if (isNaN(previousEvaluation))
                throw new Error("previousEvaluation is not a number");
            if (isNaN(evaluation))
                throw new Error("evaluation is not a number");

            const evaluationDeference: number =
                evaluation - previousEvaluation || 0;
            if (!evaluationDeference)
                throw new Error("evaluationDeference is not defined");

            return {
                parentId,
                statementId,
                evaluationDeference,
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
        evaluationDeference: number | undefined,
        evaluation = 0,
        previousEvaluation: number | undefined,
    ): Promise<{ newCon: number; newPro: number; totalEvaluators: number }> {
        const results = { newCon: 0, newPro: 0, totalEvaluators: 0 };
        await db.runTransaction(async (t: any) => {
            try {
                if (!evaluationDeference)
                    throw new Error("evaluationDeference is not defined");
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
                    previousEvaluation,
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
            previousEvaluation: number,
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
    results: ResultsSettings | undefined,
): ResultsSettings {
    if (!results) {
        return {
            resultsBy: ResultsBy.topOptions,
        };
    } else {
        return results;
    }
}

async function updateParentStatementWithChildResults(
    parentId: string | undefined,
) {
    try {
        if (!parentId) throw new Error("parentId is not defined");

        //get parent statement
        const parentStatementRef = db.collection("statements").doc(parentId);
        const parentStatementDB = await parentStatementRef.get();
        if (!parentStatementDB.exists)
            throw new Error("parentStatement does not exist");
        const parentStatement = parentStatementDB.data() as Statement;

        //get results settings
        const { resultsSettings } = parentStatement;
        let { resultsBy, numberOfResults } =
            getResultsSettings(resultsSettings);

        if (numberOfResults === undefined) numberOfResults = 1;
        if (resultsBy === undefined) resultsBy = ResultsBy.topOptions;

        //this function is responsible for converting the results of evaluation of options

        if (resultsBy !== ResultsBy.topOptions) {
            //remove it when other evaluation methods will be added
            //topVote will be calculated in the votes function
            return;
        }

        const allOptionsStatementsRef = db
            .collection(Collections.statements)
            .where("parentId", "==", parentId)
            .where("statementType", "in", [
                StatementType.option,
                StatementType.result,
            ]);

        const topOptionsStatementsRef = allOptionsStatementsRef
            .orderBy("consensus", "desc")
            .limit(numberOfResults);


        //get all options of the parent statement and convert them to either result, or an option
        const topOptionsStatementsDB = await topOptionsStatementsRef.get();
        const topOptionsStatements = topOptionsStatementsDB.docs.map(
            (doc: any) => doc.data() as Statement,
        );

        const childIds = topOptionsStatements.map(
            (st: Statement) => st.statementId,
        );

        const optionsDB = await allOptionsStatementsRef.get();

        await optionsDB.forEach(async (stDB: any) => {
            const st = stDB.data() as Statement;

            //update child statement selected to be of type result
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

        await updateParentChildren(topOptionsStatements, numberOfResults);

        //update child statement selected to be of type result
    } catch (error) {
        logger.error(error);
    }

    async function updateParentChildren(
        topOptionsStatements: Statement[],
        numberOfResults: number | undefined,
    ) {
        const childStatementsSimple = topOptionsStatements.map(
            (st: Statement) => statementToSimpleStatement(st),
        );

        if (!parentId) throw new Error("parentId is not defined");

        //update parent with results
        await db.collection(Collections.statements).doc(parentId).update({
            totalResults: numberOfResults,
            results: childStatementsSimple,
        });
    }
}


