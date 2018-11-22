export const css = `
.portis-wrapper {
    display: none;
    position: fixed;
    top: 10px;
    right: 20px;
    height: 525px;
    width: 390px;
    border-radius: 8px;
    z-index: 2147483647;
    box-shadow: rgba(0, 0, 0, 0.16) 0px 5px 40px;
    animation: portis-entrance 250ms ease-in-out forwards;
    opacity: 0;
}

.portis-iframe {
    display: block;
    width: 100%;
    height: 100%;
    border: none;
    border-radius: 8px;
}

.portis-mobile-wrapper {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: 100%;
    z-index: 2147483647;
}

.portis-mobile-iframe {
    display: block;
    width: 100%;
    height: 100%;
    border: none;
}

.portis-notification {
    display: none;
    position: fixed;
    bottom: 10px;
    right: 20px;
    height: 50px;
    width: 390px;
    border-radius: 8px;
    z-index: 2147483647;
    box-shadow: rgba(0, 0, 0, 0.16) 0px 5px 40px;
    animation: portis-notification-entrance 250ms ease-in-out forwards;
    opacity: 0;
    font-family: BlinkMacSystemFont,-apple-system,"Segoe UI",Roboto,Oxygen,Ubuntu,Cantarell,"Fira Sans","Droid Sans","Helvetica Neue",Helvetica,Arial,sans-serif;
    justify-content: flex-start;
    align-items: center;
    padding: 0 10px;
    background-color: white;
}

.portis-mobile-notification {
    display: none;
    position: fixed;
    bottom: 10px;
    right: 0;
    left: 0;
    height: 50px;
    width: calc(100% - 20px);
    margin: 0 10px;
    border-radius: 8px;
    z-index: 2147483647;
    animation: portis-notification-entrance 250ms ease-in-out forwards;
    opacity: 0;
    font-family: BlinkMacSystemFont,-apple-system,"Segoe UI",Roboto,Oxygen,Ubuntu,Cantarell,"Fira Sans","Droid Sans","Helvetica Neue",Helvetica,Arial,sans-serif;
    justify-content: flex-start;
    align-items: center;
    padding: 0 10px;
    background-color: white;
}

.portis-notifiction-logo {
    width: 25px;
    margin-right: 10px;
}

@keyframes portis-entrance {
    100% { opacity: 1; top: 20px; }
}

@keyframes portis-notification-entrance {
    100% { opacity: 1; bottom: 20px; }
}
`
