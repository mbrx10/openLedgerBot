import banner from './utils/banner.js';
import log from './utils/logger.js';
import { readFile } from './utils/file.js';
import { processAccountLogin, processAccountRewards, getUserInfo } from './services/api.js';
import { WebSocketClient, setupAccountIntervals } from './services/websocket.js';
import { INTERVALS } from './config/api.js';

const main = async () => {
    log.info(banner);
    const wallets = readFile("wallets.txt")

    if (wallets.length === 0) {
        log.error('No wallets found in wallets.txt');
        return;
    }

    const proxies = readFile("proxy.txt");
    log.info(`Starting for all accounts:`, wallets.length);

    const accountsProcessing = wallets.map(async (address, index) => {
        const proxy = proxies[index % proxies.length];
        let isConnected = false;

        log.info(`Starting Account ${index + 1} with Proxy ${(index % proxies.length) + 1}`);

        let claimDetailsInterval;
        let userInfoInterval;

        while (!isConnected) {
            try {
                const token = await processAccountLogin(address, proxy, index);
                await processAccountRewards(token, proxy, index);
                await getUserInfo(token, proxy, index + 1);

                const socket = new WebSocketClient(token, address, proxy, index + 1);
                socket.connect();
                isConnected = true;

                const intervals = setupAccountIntervals(token, proxy, index, socket);
                userInfoInterval = intervals.userInfoInterval;
                claimDetailsInterval = intervals.claimDetailsInterval;

            } catch (error) {
                log.error(`Account ${index + 1} start failed:`, error.message || 'unknown error');
                isConnected = false;
                await new Promise(resolve => setTimeout(resolve, INTERVALS.RECONNECT_DELAY));
            }
        }

        process.on('SIGINT', () => {
            log.warn(`Cleaning up and exiting...`);
            clearInterval(claimDetailsInterval);
            clearInterval(userInfoInterval);
            process.exit(0);
        });

        process.on('SIGTERM', () => {
            log.warn(`Cleaning up and exiting...`);
            clearInterval(claimDetailsInterval);
            clearInterval(userInfoInterval);
            process.exit(0);
        });
    });

    await Promise.all(accountsProcessing);
};

main();