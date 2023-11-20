import { z } from "zod"
import { Results, Statement, StatementSchema } from "delib-npm"
import { install } from "../../../main"
import _ from "lodash"

interface ResultLevel {
    result: Results
    ids: Set<string>
}

//create a function which sorts an array according to results
export function sortStatementsByHirarrchy(statements: Statement[]): Results[] {
    try {
        const results: Results[] = []
        if (statements.length === 0) return []

        let _statements = [...statements]

        _statements.forEach((s) => {
            console.log(s.statement)
        })
        z.array(StatementSchema).parse(_statements)
        //convert string set to string array

        let counter = 0
        let ids = new Set<string>()

        while (ids.size < statements.length && counter < 8) {
            //take firs statement
            const statement = _statements[0]

            //find top parent statement
            const parentStatement = findMostTopStatement(statement, _statements)
            console.log('parentStatement', parentStatement.statement)

            const { result, ids: _ids } = createResultLevel(
                parentStatement,
                _statements,
                ids
            )
            _statements = _statements.filter((s) => !_ids.has(s.statementId))

            //add result to results
           
            results.push(result)
            counter++
        }
        console.log(results)
        return results
    } catch (error) {
        console.error(error)
        return []
    }
}

function findMostTopStatement(
    statement: Statement,
    statements: Statement[],
    maxLevels: number = 10
): Statement {
    try {
        if (!statement) throw new Error("statement is undefined")
        let counter = 0
        let parentStatement: Statement | undefined = statement

        if (statement.parentId === "top") return statement
        while (counter < maxLevels) {
            parentStatement = statements.find(
                (s) => s.statementId === statement.parentId
            )

            if (!parentStatement) return statement
            statement = parentStatement
            counter++
        }
        return parentStatement
    } catch (error) {
        console.error(error)
        return statement
    }
}

function createResultLevel(
    statement: Statement,
    statements: Statement[],
    ids: Set<string>
): ResultLevel {
    try {
        const _statements = [...statements]

        ids.add(statement.statementId)

        const subs = _statements
            .filter((s) => s.parentId === statement.statementId)
            .sort((b, a) => b.lastUpdate - a.lastUpdate)
        const results: ResultLevel[] = subs.map((sub) =>
            createResultLevel(sub, statements, ids)
        )

        return {
            result: { top: statement, sub: results.map((r) => r.result) },
            ids,
        }
    } catch (error) {
        console.error(error)
        return { result: { top: statement, sub: [] }, ids }
    }
}

export function prompStore(setDeferredPrompt: React.Dispatch<any>) {
    const deferredPrompt = install.deferredPrompt

    if (deferredPrompt) {
        deferredPrompt.prompt()
        deferredPrompt.userChoice.then((choiceResult: any) => {
            if (choiceResult.outcome === "accepted") {
                console.info("User accepted the A2HS prompt")
            }
            setDeferredPrompt(null)
        })
    }
}
