const AskForNotifications = () => {
    return (
        <div className="popup">
            <div className="popup__box">
                <h1>Would you like to receive notifications in this group?</h1>
                <div className="btnBox">
                    <button className="btn btn--default">{"Yes"}</button>
                    <button className="btn btn--secondry">{"No"}</button>
                </div>
            </div>
        </div>
    );
};

export default AskForNotifications;
