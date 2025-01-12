import axios from 'axios';
import axiosRetry from 'axios-retry';
import { ENDPOINT_API } from '../config/api.js';
import { httpHeaders } from '../config/headers.js';
import { newAgent } from '../utils/proxy.js';
import log from '../utils/logger.js';
import chalk from 'chalk';

axiosRetry(axios, {
    retries: 3,
    retryDelay: (retryCount) => retryCount * 1000,
    retryCondition: (error) => error.response?.status >= 400 || error.code === 'ECONNABORTED'
});

export async function generateToken(data, proxy) {
    const agent = newAgent(proxy);
    try {
        const response = await axios.post(ENDPOINT_API.GENERATE_TOKEN, data, {
            headers: {
                ...httpHeaders,
                'Content-Type': 'application/json',
            },
            httpsAgent: agent,
            httpAgent: agent
        });
        return response.data.data;
    } catch (error) {
        return null;
    }
}

export async function getUserInfo(token, proxy, index) {
    const agent = newAgent(proxy);
    try {
        const response = await axios.get(ENDPOINT_API.REALTIME_REWARDS, {
            headers: {
                ...httpHeaders,
                'Authorization': 'Bearer ' + token
            },
            httpsAgent: agent,
            httpAgent: agent
        });
        const { total_heartbeats } = response?.data?.data[0] || { total_heartbeats: '0' };
        log.info(`Account ${index} PointsToday: ${chalk.green(total_heartbeats)}`);

        return response.data.data;
    } catch (error) {
        if (error.response && error.response.status === 401) {
            log.error('Unauthorized, token is invalid or expired');
            return 'unauthorized';
        };

        log.error('Error fetching user info:', error.message || error);
        return null;
    }
}

export async function getClaimDetails(token, proxy, index) {
    const agent = newAgent(proxy);
    try {
        const response = await axios.get(ENDPOINT_API.CLAIM_DETAILS, {
            headers: {
                ...httpHeaders,
                'Authorization': 'Bearer ' + token
            },
            httpsAgent: agent,
            httpAgent: agent
        });
        const { tier, dailyPoint, claimed, nextClaim = 'Not Claimed' } = response?.data?.data || {};
        log.info(`Account ${index} Tier: ${chalk.green(tier)}, Daily Point: ${chalk.green(dailyPoint)}, Claimed: ${chalk.green(claimed)}, Next Claim: ${chalk.green(nextClaim)}`);
        return response.data.data;
    } catch (error) {
        log.error('Error fetching claim info:', error.message || error);
        return null;
    }
}

export async function claimRewards(token, proxy, index) {
    const agent = newAgent(proxy);
    try {
        const response = await axios.get(ENDPOINT_API.CLAIM_REWARDS, {
            headers: {
                ...httpHeaders,
                'Authorization': 'Bearer ' + token
            },
            httpsAgent: agent,
            httpAgent: agent
        });
        log.info(`Daily Rewards Claimed for Account ${index}:`, response.data.data);
        return response.data.data;
    } catch (error) {
        log.error('Error claiming daily reward:', error.message || error);
        return null;
    }
} 