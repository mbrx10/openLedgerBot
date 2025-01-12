import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';

export const newAgent = (proxy = null) => {
    if (proxy && proxy.startsWith('http://')) {
        return new HttpsProxyAgent(proxy);
    } else if (proxy && (proxy.startsWith('socks4://') || proxy.startsWith('socks5://'))) {
        return new SocksProxyAgent(proxy);
    }
    return null;
}; 