import { configureStore } from "@reduxjs/toolkit";
import { statementsSlicer } from "./statements/statementsSlice";
import { userSlicer } from "./users/userSlice";
import { evaluationsSlicer } from "./evaluations/evaluationsSlice";
import { votesSlicer } from "./vote/votesSlice";
import { resultsSlice } from "./results/resultsSlice";
import {roomsSlice} from "./rooms/roomsSlice";
import {timersSlice} from "./timers/timersSlice";
import errorSlice from "./error/errorSlice";


export const store = configureStore({
    reducer: {
        statements: statementsSlicer.reducer,
        evaluations: evaluationsSlicer.reducer,
        user: userSlicer.reducer,
        votes: votesSlicer.reducer,
        results: resultsSlice.reducer,
        rooms: roomsSlice.reducer,
        timers: timersSlice.reducer,
        error: errorSlice.reducer,
    },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;

// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
