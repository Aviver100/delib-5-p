import { NavObject, Screen } from "delib-npm";


// TODO: Change Screen.??? to current name: Screen.DOC doesn't make sense anymore. Change to Main or something
export const navArray: NavObject[] = [
    { link: Screen.DOC, name: "Main", id: "doc", default: false },
    { link: Screen.CHAT, name: "Chat", id: "chat", default: true },
    { link: Screen.OPTIONS, name: "Evaluations", id: "options", default: true },
    {
        link: Screen.QUESTIONS,
        name: "Questions",
        id: "questions",
        default: false,
    },
    { link: Screen.VOTE, name: "Voting", id: "vote", default: true },
    {
        link: Screen.MASS_QUESTIONS,
        name: "Mass Questions",
        id: "questions-mass",
        default: false,
    },
    { link: Screen.GROUPS, name: "Rooms", id: "rooms", default: false },

    { link: Screen.SETTINGS, name: "Settings", id: "settings" },
];
