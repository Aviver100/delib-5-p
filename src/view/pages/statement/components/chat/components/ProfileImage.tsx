import { FC } from "react";

// Third Party Imports
import { Statement } from "delib-npm";

// Helpers
import {
    getInitials,
} from "../../../../../../functions/general/helpers";
import { generateRandomLightColor } from "../../../../../../functions/general/generating";

interface Props {
    statement: Statement;
    showImage: Function;
}

const ProfileImage: FC<Props> = ({ statement, showImage }) => {
    const userProfile = statement.creator.photoURL;

    const displayName = getInitials(statement.creator.displayName);

    const color = generateRandomLightColor(statement.creator.uid);
    return (
        <div
            onClick={() => showImage(statement.creator)}
            className="message__user__avatar"
            style={
                userProfile
                    ? { backgroundImage: `url(${userProfile})` }
                    : { backgroundColor: color }
            }
        >
            {!userProfile && <span>{displayName}</span>}
        </div>
    );
};

export default ProfileImage;
