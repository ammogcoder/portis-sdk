import { Payload, Network, ScopeType } from "./types";
import { isMobile, isLocalhost, randomId } from "./utils";
import { css } from './style';

const sdkVersion = '1.3.4';
const postMessages = {
    PT_RESPONSE: 'PT_RESPONSE',
    PT_HANDLE_REQUEST: 'PT_HANDLE_REQUEST',
    PT_GREEN_LIGHT: 'PT_GREEN_LIGHT',
    PT_SHOW_IFRAME: 'PT_SHOW_IFRAME',
    PT_HIDE_IFRAME: 'PT_HIDE_IFRAME',
    PT_USER_DENIED: 'PT_USER_DENIED',
    PT_USER_LOGGED_IN: 'PT_USER_LOGGED_IN',
    PT_PURCHASE_INITIATED: 'PT_PURCHASE_INITIATED',
    PT_ON_DATA: 'PT_ON_DATA',
    PT_SHOW_NOTIFICATION: 'PT_SHOW_NOTIFICATION',
    PT_HIDE_NOTIFICATION: 'PT_HIDE_NOTIFICATION',
};
const portisPayloadMethods = {
    SET_DEFAULT_EMAIL: 'SET_DEFAULT_EMAIL',
    SHOW_PORTIS: 'SHOW_PORTIS',
    CHANGE_NETWORK: 'CHANGE_NETWORK',
    SHOW_TX_DETAILS: 'SHOW_TX_DETAILS',
    UPDATE_WIDGET_LOCATION: 'UPDATE_WIDGET_LOCATION',
};

export class PortisProvider {
    portisClient = 'https://app.portis.io';
    requests: { [id: string]: { payload: Payload, cb } } = {};
    queue: { payload: Payload, cb }[] = [];
    elements: Promise<{ wrapper: HTMLDivElement, iframe: HTMLIFrameElement, notification: HTMLDivElement }>;
    iframeReady: boolean;
    account: string | null = null;
    network: string | null = null;
    isPortis = true;
    referrerAppOptions;
    events: { eventName: string, callback }[] = [];
    portisViewportMetaTag;
    dappViewportMetaTag;

    constructor(opts: { apiKey: string, network?: Network, infuraApiKey?: string, providerNodeUrl?: string, scope?: ScopeType[] }) {
        if (!isLocalhost() && !opts.apiKey) {
            throw 'apiKey is missing. Please check your apiKey in the Portis dashboard: https://app.portis.io/dashboard';
        }

        if (opts.infuraApiKey && opts.providerNodeUrl) {
            throw 'Invalid parameters. \'infuraApiKey\' and \'providerNodeUrl\' cannot be both provided. Refer to the Portis documentation for more info.';
        }

        this.referrerAppOptions = {
            sdkVersion,
            network: opts.network || 'mainnet',
            apiKey: opts.apiKey,
            infuraApiKey: opts.infuraApiKey,
            providerNodeUrl: opts.providerNodeUrl,
            scope: opts.scope,
        };
        this.elements = this.createIframe();
        this.listen();
    }

    sendAsync(payload: Payload, cb) {
        this.enqueue(payload, cb);
    }

    send(payload: Payload, cb?) {
        if (cb) {
            this.sendAsync(payload, cb);
            return;
        }

        let result;

        switch (payload.method) {

            case 'eth_accounts':
                const account = this.account;
                result = account ? [account] : [];
                break;

            case 'eth_coinbase':
                result = this.account;
                break;

            case 'net_version':
                result = this.network;
                break;

            case 'eth_uninstallFilter':
                this.sendAsync(payload, (_) => _);
                result = true;
                break;

            default:
                throw new Error(`The Portis Web3 object does not support synchronous methods like ${payload.method} without a callback parameter.`);
        }

        return {
            id: payload.id,
            jsonrpc: payload.jsonrpc,
            result: result,
        }
    }

    isConnected() {
        return true;
    }

    setDefaultEmail(email: string, editable: boolean = true) {
        this.sendGenericPayload(portisPayloadMethods.SET_DEFAULT_EMAIL, [email, editable]);
    }

    showPortis(callback) {
        this.sendGenericPayload(portisPayloadMethods.SHOW_PORTIS, [], callback);
    }

    on(eventName: string, callback) {
        this.events.push({ eventName, callback });
    }

    enable() {
        return new Promise((resolve, reject) => {
            this.sendGenericPayload('eth_accounts', undefined, (err, resp) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(resp.result);
                }
            })
        });
    }

    changeNetwork(opts: { network?: Network, infuraApiKey?: string, providerNodeUrl?: string }, callback?: (err, resp) => void) {
        if (opts.network) {
            this.referrerAppOptions.network = opts.network;
        }

        if (opts.infuraApiKey) {
            this.referrerAppOptions.infuraApiKey = opts.infuraApiKey;
        }

        if (opts.providerNodeUrl) {
            this.referrerAppOptions.providerNodeUrl = opts.providerNodeUrl;
        }

        this.sendGenericPayload(portisPayloadMethods.CHANGE_NETWORK, [opts.network, opts.infuraApiKey, opts.providerNodeUrl], callback);
    }

    private sendGenericPayload(method: string, params: any[] = [], callback: (err, resp) => any = _ => _) {
        const payload = {
            id: randomId(),
            jsonrpc: '2.0',
            method,
            params,
        };
        this.enqueue(payload, callback);
    }

    private createIframe(): Promise<{ wrapper: HTMLDivElement, iframe: HTMLIFrameElement, notification: HTMLDivElement }> {
        return new Promise((resolve, reject) => {
            const onload = () => {
                const mobile = isMobile();
                const wrapper = document.createElement('div');
                const iframe = document.createElement('iframe');
                const styleElem = document.createElement('style');
                const viewportMetaTag = document.createElement('meta');
                const notification = document.createElement('div');
                const notificationDetails = document.createElement('div');
                const notificationLogo = document.createElement('img');
                const notificationText = document.createElement('span');
                const showDetailsBtn = document.createElement('a');

                wrapper.className = mobile ? 'portis-mobile-wrapper' : 'portis-wrapper';
                iframe.className = mobile ? 'portis-mobile-iframe' : 'portis-iframe';
                notificationDetails.className = 'portis-notification-details';
                notification.className = mobile ? 'portis-mobile-notification' : 'portis-notification';
                notificationLogo.src = 'https://assets.portis.io/portis-logo/logo_64_64.png';
                notificationLogo.className = 'portis-notifiction-logo';
                iframe.src = `${this.portisClient}/send/?p=${btoa(JSON.stringify(this.referrerAppOptions))}`;
                styleElem.innerHTML = css;
                viewportMetaTag.name = 'viewport';
                viewportMetaTag.content = 'width=device-width, initial-scale=1';
                showDetailsBtn.innerHTML = 'Details';
                showDetailsBtn.onclick = () => {
                    this.sendGenericPayload(portisPayloadMethods.SHOW_TX_DETAILS);
                };
                showDetailsBtn.className = 'portis-notification-button';

                notificationDetails.appendChild(notificationLogo);
                notificationDetails.appendChild(notificationText);
                notification.appendChild(notificationDetails);
                notification.appendChild(showDetailsBtn);
                wrapper.appendChild(iframe);
                document.body.appendChild(wrapper);
                document.body.appendChild(notification);
                document.head.appendChild(styleElem);
                this.portisViewportMetaTag = viewportMetaTag;
                this.dappViewportMetaTag = this.getDappViewportMetaTag();

                resolve({ wrapper, iframe, notification });
            }

            if (['loaded', 'interactive', 'complete'].indexOf(document.readyState) > -1) {
                onload();
            } else {
                window.addEventListener('load', onload.bind(this), false);
            }
        });
    }

    private showIframe() {
        this.elements.then(elements => {
            elements.wrapper.style.display = 'block';
            this.sendGenericPayload(portisPayloadMethods.UPDATE_WIDGET_LOCATION, [elements.wrapper.getBoundingClientRect()]);
            if (isMobile()) {
                document.body.style.overflow = 'hidden';
                this.setPortisViewport();
            }
        });
    }

    private hideIframe() {
        this.elements.then(elements => {
            elements.wrapper.style.display = 'none';

            if (isMobile()) {
                document.body.style.overflow = 'inherit';
                this.setDappViewport();
            }
        });
    }

    private showNotification(msg: string, showDetailsButton?: boolean) {
        this.elements.then(elements => {
            const button = elements.notification.querySelector('a');
            if (button) {
                button.style.display = showDetailsButton ? 'initial' : 'none';
            }

            const span = elements.notification.querySelector('span');
            if (span) {
                span.innerText = msg;
                elements.notification.style.display = 'flex';
            }
        });
    }

    private hideNotification() {
        this.elements.then(elements => {
            const span = elements.notification.querySelector('span');
            if (span) {
                span.innerText = '';
                elements.notification.style.display = 'none';
            }
        });
    }

    private getDappViewportMetaTag() {
        const metaTags = document.head.querySelectorAll('meta[name=viewport]');
        return metaTags.length ? metaTags[metaTags.length - 1] : null;
    }

    private setPortisViewport() {
        document.head.appendChild(this.portisViewportMetaTag);

        if (this.dappViewportMetaTag) {
            this.dappViewportMetaTag.remove();
        }
    }

    private setDappViewport() {
        if (this.portisViewportMetaTag) {
            this.portisViewportMetaTag.remove();
        }

        if (this.dappViewportMetaTag) {
            document.head.appendChild(this.dappViewportMetaTag);
        }
    }

    private enqueue(payload: Payload, cb) {
        if (Array.isArray(payload)) {
            payload = payload.map(p => {
                p.id = randomId();
                return p;
            }) as any;
        } else {
            payload.id = randomId();
        }

        this.queue.push({ payload, cb });

        if (this.iframeReady) {
            this.dequeue();
        }
    }

    private dequeue() {
        if (this.queue.length == 0) {
            return;
        }

        const item = this.queue.shift();

        if (item) {
            const payload = item.payload;
            const cb = item.cb;
            const id = Array.isArray(payload) ?
                payload.map(i => i.id).join(':') :
                payload.id;
            this.sendPostMessage(postMessages.PT_HANDLE_REQUEST, payload);
            this.requests[id] = { payload, cb };
            this.dequeue();
        }
    }

    private sendPostMessage(msgType: string, payload?: Object) {
        this.elements.then(elements => {
            if (elements.iframe.contentWindow) {
                elements.iframe.contentWindow.postMessage({ msgType, payload }, '*');
            }
        });
    }

    private listen() {
        window.addEventListener('message', (evt) => {
            if (evt.origin === this.portisClient) {
                switch (evt.data.msgType) {

                    case postMessages.PT_GREEN_LIGHT: {
                        this.iframeReady = true;
                        this.dequeue();
                        break;
                    }

                    case postMessages.PT_RESPONSE: {
                        const id = Array.isArray(evt.data.response) ?
                            evt.data.response.map(i => i.id).join(':') :
                            evt.data.response.id;
                        this.requests[id].cb(null, evt.data.response);

                        if (this.requests[id].payload.method === 'eth_accounts' || this.requests[id].payload.method === 'eth_coinbase') {
                            this.account = evt.data.response.result[0];
                        }

                        if (this.requests[id].payload.method === 'net_version') {
                            this.network = evt.data.response.result;
                        }

                        this.dequeue();
                        break;
                    }

                    case postMessages.PT_SHOW_IFRAME: {
                        this.showIframe();
                        break;
                    }

                    case postMessages.PT_HIDE_IFRAME: {
                        this.hideIframe();
                        break;
                    }

                    case postMessages.PT_SHOW_NOTIFICATION: {
                        this.showNotification(evt.data.response.message, evt.data.response.showDetailsButton);
                        break;
                    }

                    case postMessages.PT_HIDE_NOTIFICATION: {
                        this.hideNotification();
                        break;
                    }

                    case postMessages.PT_USER_DENIED: {
                        const id = evt.data.response ? evt.data.response.id : null;

                        if (id) {
                            this.requests[id].cb(new Error('User denied transaction signature.'));
                        } else {
                            this.queue.forEach(item => item.cb(new Error('User denied transaction signature.')));
                        }

                        this.dequeue();
                        break;
                    }

                    case postMessages.PT_USER_LOGGED_IN: {
                        this.events
                            .filter(event => event.eventName == 'login')
                            .forEach(event => event.callback({
                                provider: 'portis',
                                address: evt.data.response.address,
                                email: evt.data.response.email,
                            }));
                        break;
                    }

                    case postMessages.PT_PURCHASE_INITIATED: {
                        this.events
                            .filter(event => event.eventName == 'purchase-initiated')
                            .forEach(event => event.callback({
                                provider: 'portis',
                                purchaseId: evt.data.response.purchaseId,
                            }));
                        break;
                    }

                    case postMessages.PT_ON_DATA: {
                        this.events
                            .filter(event => event.eventName == 'data')
                            .forEach(event => event.callback(evt.data.response));
                        break;
                    }
                }
            }
        }, false);
    }
}
