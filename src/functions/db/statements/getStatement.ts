import {
    and,
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    onSnapshot,
    or,
    orderBy,
    query,
    where,
} from "firebase/firestore"
import { Unsubscribe } from "firebase/auth"

// Third party imports
import {
    Collections,
    Statement,
    StatementSubscription,
    StatementSubscriptionSchema,
} from "delib-npm"

// Helpers
import { listenedStatements } from "../../../view/pages/home/App"
import { DB } from "../config"

// Redux Store
import { store } from "../../../model/store"

export function listenToTopStatements(
    setStatementsCB: Function,
    deleteStatementCB: Function
): Unsubscribe {
    try {
        const user = store.getState().user.user
        if (!user) throw new Error("User not logged in")

        const statementsRef = collection(DB, Collections.statementsSubscribe)
        const q = query(
            statementsRef,
            where("userId", "==", user.uid),
            where("statement.parentId", "==", "top"),
            orderBy("lastUpdate", "desc"),
            limit(40)
        )

        return onSnapshot(q, (statementsDB) => {
            statementsDB.docChanges().forEach((change) => {
                const statementSubscription =
                    change.doc.data() as StatementSubscription

                if (change.type === "added") {
                    listenedStatements.add(
                        statementSubscription.statement.statementId
                    )
                    setStatementsCB(statementSubscription.statement)
                    listenToSubStatements(
                        statementSubscription.statement.statementId,
                        setStatementsCB,
                        deleteStatementCB
                    )
                }

                if (change.type === "modified") {
                    listenedStatements.add(
                        statementSubscription.statement.statementId
                    )
                }

                if (change.type === "removed") {
                    listenedStatements.delete(
                        statementSubscription.statement.statementId
                    )
                    deleteStatementCB(
                        statementSubscription.statement.statementId
                    )
                }
            })
        })
    } catch (error) {
        console.error(error)
        return () => {}
    }
}

function listenToSubStatements(
    topStatementId: string,
    setStatementsCB: Function,
    deleteStatementCB: Function
): Unsubscribe {
    try {
        const subStatementsRef = collection(DB, Collections.statements)
        const q = query(
            subStatementsRef,
            where("topParentId", "==", topStatementId),
            where("isQuestion", "==", true),
            orderBy("createdAt", "asc"),
            limit(50)
        )

        return onSnapshot(q, (statementsDB) => {
            statementsDB.docChanges().forEach((change) => {
                const statement = change.doc.data() as Statement

                if (change.type === "added") {
                    listenedStatements.add(statement.statementId)
                    setStatementsCB(statement)
                }

                if (change.type === "modified") {
                    listenedStatements.add(statement.statementId)
                    setStatementsCB(statement)
                }

                if (change.type === "removed") {
                    listenedStatements.delete(statement.statementId)
                    deleteStatementCB(statement.statementId)
                }
            })
        })
    } catch (error) {
        console.error(error)
        return () => {}
    }
}

export async function getStatmentsSubsciptions(): Promise<
    StatementSubscription[]
> {
    try {
        const user = store.getState().user.user
        if (!user) throw new Error("User not logged in")
        if (!user.uid) throw new Error("User not logged in")
        const statementsSubscribeRef = collection(
            DB,
            Collections.statementsSubscribe
        )
        const q = query(
            statementsSubscribeRef,
            where("userId", "==", user.uid),
            limit(20)
        )
        const querySnapshot = await getDocs(q)

        const statementsSubscriptions: StatementSubscription[] = []

        querySnapshot.forEach((doc) => {
            statementsSubscriptions.push(doc.data() as StatementSubscription)
        })
        return statementsSubscriptions
    } catch (error) {
        console.error(error)
        return []
    }
}

export function listenToStatementSubscription(
    statementId: string,
    updateStore: Function
) {
    try {
        if (!statementId) throw new Error("Statement id is undefined")
        const user = store.getState().user.user
        if (!user) throw new Error("User not logged in")
        if (!user.uid) throw new Error("User not logged in")

        const statementsSubscribeRef = doc(
            DB,
            Collections.statementsSubscribe,
            `${user.uid}--${statementId}`
        )

        return onSnapshot(statementsSubscribeRef, (statementSubscriptionDB) => {
            const statementSubscription =
                statementSubscriptionDB.data() as StatementSubscription
            if (!statementSubscription) return
            StatementSubscriptionSchema.parse(statementSubscription)

            updateStore(statementSubscription)
        })
    } catch (error) {
        console.error(error)
        return () => {}
    }
}
export async function getSubscriptions(): Promise<StatementSubscription[]> {
    try {
        const user = store.getState().user.user
        if (!user) throw new Error("User not logged in")
        if (!user.uid) throw new Error("User not logged in")
        const statementsSubscribeRef = collection(
            DB,
            Collections.statementsSubscribe
        )
        const q = query(
            statementsSubscribeRef,
            where("userId", "==", user.uid),
            orderBy("lastUpdate", "desc"),
            limit(20)
        )

        const subscriptionsDB = await getDocs(q)

        const subscriptions: StatementSubscription[] = []
        subscriptionsDB.forEach((doc) => {
            const statementSubscription = doc.data() as StatementSubscription

            StatementSubscriptionSchema.parse(statementSubscription)

            subscriptions.push(statementSubscription)
        })

        return subscriptions
    } catch (error) {
        console.error(error)
        return []
    }
}

export function listenStatmentsSubsciptions(
    cb: Function,
    deleteCB: Function
): Unsubscribe {
    try {
        const user = store.getState().user.user
        if (!user) throw new Error("User not logged in")
        if (!user.uid) throw new Error("User not logged in")

        const statementsSubscribeRef = collection(
            DB,
            Collections.statementsSubscribe
        )
        const q = query(
            statementsSubscribeRef,
            and(
                where("userId", "==", user.uid),
                or(
                    where("statement.isQuestion", "==", true),
                    where("statement.isOption", "==", true)
                )
            ),
            orderBy("lastUpdate", "desc"),
            limit(40)
        )

        return onSnapshot(q, (subsDB) => {
            subsDB.docChanges().forEach((change) => {
                const statementSubscription =
                    change.doc.data() as StatementSubscription

                if (change.type === "added") {
                    listenedStatements.add(
                        statementSubscription.statement.statementId
                    )
                    statementSubscription.lastUpdate =
                        statementSubscription.lastUpdate
                    cb(statementSubscription)
                }

                if (change.type === "modified") {
                    listenedStatements.add(
                        statementSubscription.statement.statementId
                    )

                    statementSubscription.lastUpdate =
                        statementSubscription.lastUpdate
                    cb(statementSubscription)
                }

                if (change.type === "removed") {
                    listenedStatements.delete(
                        statementSubscription.statement.statementId
                    )
                    statementSubscription.lastUpdate =
                        statementSubscription.lastUpdate

                    deleteCB(statementSubscription.statement.statementId)
                }
            })
        })
    } catch (error) {
        console.error(error)
        return () => {}
    }
}

export async function getIsSubscribed(
    statementId: string | undefined
): Promise<boolean> {
    try {
        if (!statementId) throw new Error("Statement id is undefined")
        const user = store.getState().user.user
        if (!user) throw new Error("User not logged in")

        const subscriptionRef = doc(
            DB,
            Collections.statementsSubscribe,
            `${user.uid}--${statementId}`
        )
        const subscriptionDB = await getDoc(subscriptionRef)

        if (!subscriptionDB.exists()) return false
        return true
    } catch (error) {
        console.error(error)
        return false
    }
}

export function listenToStatement(statementId: string, updateStore: Function) {
    try {
        const statementRef = doc(DB, Collections.statements, statementId)
        return onSnapshot(statementRef, (statementDB) => {
            const statement = statementDB.data() as Statement

            updateStore(statement)
        })
    } catch (error) {
        console.error(error)
        return () => {}
    }
}

export async function getStatementFromDB(
    statementId: string
): Promise<Statement | undefined> {
    try {
        const statementRef = doc(DB, Collections.statements, statementId)
        const statementDB = await getDoc(statementRef)
        return statementDB.data() as Statement | undefined
    } catch (error) {
        console.error(error)
        return undefined
    }
}

export function listenToStatementsOfStatment(
    statementId: string | undefined,
    updateStore: Function,
    deleteStatementCB: Function
) {
    try {
        if (!statementId) throw new Error("Statement id is undefined")
        const statementsRef = collection(DB, Collections.statements)
        const q = query(
            statementsRef,
            where("parentId", "==", statementId),
            orderBy("createdAt", "desc"),
            limit(20)
        )

        return onSnapshot(q, (subsDB) => {
            subsDB.docChanges().forEach((change) => {
                const statement = change.doc.data() as any

                if (change.type === "added") {
                    updateStore(statement)
                }

                if (change.type === "modified") {
                    updateStore(statement)
                }

                if (change.type === "removed") {
                    deleteStatementCB(statement.statementId)
                }
            })
        })
    } catch (error) {
        console.error(error)
        return () => {}
    }
}

export function listenToMembers(
    statementId: string,
    setMembershipCB: Function,
    removeMembership: Function
): Function {
    try {
        const membersRef = collection(DB, Collections.statementsSubscribe)
        const q = query(
            membersRef,
            where("statementId", "==", statementId),
            orderBy("createdAt", "desc")
        )

        return onSnapshot(q, (subsDB) => {
            subsDB.docChanges().forEach((change) => {
                const member = change.doc.data() as StatementSubscription
                if (change.type === "added") {
                    setMembershipCB(member)
                }

                if (change.type === "modified") {
                    setMembershipCB(member)
                }

                if (change.type === "removed") {
                    removeMembership(member)
                }
            })
        })
    } catch (error) {
        console.error(error)
        return () => {}
    }
}
