import WebSocket from 'ws';
import crypto from 'crypto';
import { ENDPOINT_API, INTERVALS } from '../config/api.js';
import { wsHeaders } from '../config/headers.js';
import { createHeartbeat, createRegWorkerID } from '../config/websocket.js';
import { newAgent } from '../utils/proxy.js';
import { generateRandomCapacity } from '../utils/capacity.js';
import { getUserInfo } from '../services/api.js';
import log from '../utils/logger.js';
import chalk from 'chalk';

export class WebSocketClient {
    constructor(authToken, address, proxy, index) {
        this.url = ENDPOINT_API.WSS_URL + authToken;
        this.ws = null;
        this.reconnect = true
        this.index = index
        this.intervalId = null
        this.registered = false;
        this.proxy = proxy;
        this.address = address;
        this.identity = btoa(address);
        this.capacity = generateRandomCapacity();
        this.id = crypto.randomUUID();
        this.heartbeat = createHeartbeat(this.identity, this.address, this.capacity);
        this.regWorkerID = createRegWorkerID(this.identity, this.address, this.id);
    }

    loadJobData = async (event) => {
        if (event && event.data) {
            const message = event.data;

            if (message?.MsgType == "JOB") {
                this.ws.send(
                    JSON.stringify({
                        workerID: this.identity,
                        msgType: "JOB_ASSIGNED",
                        workerType: "LWEXT",
                        message: {
                            Status: true,
                            Ref: message?.UUID,
                        },
                    })
                );
            }
        }
    };

    connect() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        const agent = newAgent(this.proxy);
        const options = {
            headers: wsHeaders,
            ...(agent ? { agent } : {})
        };
        this.ws = new WebSocket(this.url, options);

        this.ws.on('open', (type) => {
            log.info(`Account ${this.index} connected`);
            
            this.sendMessage(this.regWorkerID);
            log.info(`Account ${this.index} registered`);
            
            this.sendMessage(this.heartbeat);
            log.info(`Account ${this.index} heartbeat sent`);

            this.intervalId = setInterval(() => {
                log.info(`Account ${this.index} heartbeat sent`);
                this.sendMessage(this.heartbeat);
            }, INTERVALS.HEARTBEAT_DELAY);
        });

        this.ws.on('message', (event) => {
            try {
                const message = JSON.parse(event);
                log.info(`Account ${this.index} Status: ${chalk.green(message?.status)}`);
                if (message?.data) {
                    const data = message.data;
                    if (data?.MsgType !== "JOB") {
                        this.sendMessage({
                            type: "WEBSOCKET_RESPONSE",
                            data: data,
                        });
                    } else {
                        this.loadJobData({ data });
                    }
                }
            } catch (error) {
                log.error(`Account ${this.index} parse error: ${error.message}`);
            }
        });

        this.ws.on('error', (error) => {
            log.error(`Account ${this.index} Error: ${error.message}`);
        });

        this.ws.on('close', () => {
            clearInterval(this.intervalId);
            if (this.reconnect) {
                log.warn(`Account ${this.index} reconnecting...`);
                setTimeout(() => this.connect("reconnect"), INTERVALS.WSS_RECONNECT_DELAY);
            } else {
                log.warn(`Account ${this.index} closed`);
            }
        });
    }

    sendMessage(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        } else {
            log.error(`WebSocket connection is not open for Account ${this.index}, cannot send message.`);
        }
    }

    close() {
        this.reconnect = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}

export function setupAccountIntervals(token, proxy, index, socket) {
    const userInfoInterval = setInterval(async () => {
        log.info(`Account ${index + 1} checking points...`);
        const user = await getUserInfo(token, proxy, index + 1);

        if (user === 'unauthorized') {
            log.info(`Account ${index + 1} token expired, reconnecting...`);
            socket.close();
            clearInterval(userInfoInterval);
            clearInterval(claimDetailsInterval);
            return false;
        }
    }, INTERVALS.POINTS_CHECK);

    const claimDetailsInterval = setInterval(async () => {
        try {
            log.info(`Checking Daily Rewards for Account ${index + 1}...`)
            const claimDetails = await getClaimDetails(token, proxy, index + 1);

            if (claimDetails && !claimDetails.claimed) {
                log.info(`Trying to Claim Daily rewards for Account ${index + 1}...`);
                await claimRewards(token, proxy, index + 1);
            }
        } catch (error) {
            log.error(`Error fetching claim details for Account ${index + 1}: ${error.message || 'unknown error'}`);
        }
    }, INTERVALS.DAILY_REWARDS);

    return { userInfoInterval, claimDetailsInterval };
} 