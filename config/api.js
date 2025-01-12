export const ENDPOINT_API = {
    WSS_URL: 'wss://apitn.openledger.xyz/ws/v1/orch?authToken=',
    CLAIM_DETAILS: 'https://rewardstn.openledger.xyz/api/v1/claim_details',
    CLAIM_REWARDS: 'https://rewardstn.openledger.xyz/api/v1/claim_reward',
    GENERATE_TOKEN: 'https://apitn.openledger.xyz/api/v1/auth/generate_token',
    REALTIME_REWARDS: 'https://rewardstn.openledger.xyz/api/v1/reward_realtime'
};

export const INTERVALS = {
    POINTS_CHECK: 9 * 60 * 1000,      // 9 minutes
    DAILY_REWARDS: 60 * 60 * 1000,    // 60 minutes
    RECONNECT_DELAY: 3000,            // 3 seconds
    HEARTBEAT_DELAY: 30 * 1000,      // 30 seconds
    WSS_RECONNECT_DELAY: 10000       // 10 seconds
};