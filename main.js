import banner from './utils/banner.js';
import log from './utils/logger.js';
import { readFile } from './utils/file.js';
import { generateToken, getUserInfo, getClaimDetails, claimRewards } from './services/api.js';
import { WebSocketClient } from './services/websocket.js';

// Main function
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
                let response = await generateToken({ address }, proxy);
                while (!response || !response.token) {
                    log.error(`Account ${index} token failed, retrying...`)
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    response = await generateToken({ address }, proxy);
                }

                const token = response.token;

                log.info(`Account ${index + 1} logged in: Success`);
                log.info(`Account ${index + 1} checking rewards...`);
                const claimDaily = await getClaimDetails(token, proxy, index + 1);
                if (claimDaily && !claimDaily.claimed) {
                    log.info(`Account ${index + 1} claiming rewards...`);
                    await claimRewards(token, proxy, index + 1);
                }
                await getUserInfo(token, proxy, index + 1)

                const socket = new WebSocketClient(token, address, proxy, index + 1);
                socket.connect();
                isConnected = true;

                userInfoInterval = setInterval(async () => {
                    log.info(`Account ${index + 1} checking points...`);
                    const user = await getUserInfo(token, proxy, index + 1);

                    if (user === 'unauthorized') {
                        log.info(`Account ${index + 1} token expired, reconnecting...`);

                        isConnected = false;
                        socket.close();
                        clearInterval(userInfoInterval);
                        clearInterval(claimDetailsInterval);
                    }
                }, 9 * 60 * 1000); 

                claimDetailsInterval = setInterval(async () => {
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
                }, 60 * 60 * 1000); 

            } catch (error) {
                log.error(`Account ${index + 1} start failed:`, error.message || 'unknown error');
                isConnected = false;

                await new Promise(resolve => setTimeout(resolve, 3000));
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