import WebSocket from 'ws';
import crypto from 'crypto';
import { ENDPOINT_API } from '../config/api.js';
import { wsHeaders } from '../config/headers.js';
import { createHeartbeat, createRegWorkerID } from '../config/websocket.js';
import { newAgent } from '../utils/proxy.js';
import { generateRandomCapacity } from '../utils/capacity.js';
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
            }, 30 * 1000);
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
            log.error(`Account ${this.index} Error: ${error.response?.status || error.code}`);
        });

        this.ws.on('close', () => {
            clearInterval(this.intervalId);
            if (this.reconnect) {
                log.warn(`Account ${this.index} reconnecting...`);
                setTimeout(() => this.connect("reconnect"), 10000);
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