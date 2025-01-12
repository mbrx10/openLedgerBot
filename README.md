# 🤖 OpenLedger Worker Bot

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg?cacheSeconds=2592000)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![node-current](https://img.shields.io/badge/node-%3E%3D%2018.0.0-green)

**Automated OpenLedger Worker with Multiple Account Support and Auto Claim Feature**

</div>

## ✨ Features

- 🔄 Auto claim daily rewards
- 🔁 Auto reconnect when token expired
- 👥 Support multiple accounts
- 🌐 HTTP & SOCKS proxy support
- 💓 30-second heartbeat interval
- 📊 Real-time points monitoring
- 🚀 Fast and efficient
- 🛡️ Error handling & auto retry
- 📝 Clean and consistent logging

## 🏗️ Project Structure
```
project/
├── config/
│   ├── api.js         # API endpoints
│   ├── headers.js     # HTTP & WebSocket headers  
│   └── websocket.js   # WebSocket message format
├── services/
│   ├── api.js         # API functions
│   └── websocket.js   # WebSocket client
├── utils/
│   ├── banner.js      # CLI banner
│   ├── capacity.js    # Random capacity generator
│   ├── file.js        # File handler
│   ├── logger.js      # Logger utility
│   └── proxy.js       # Proxy helper
├── main.js            # Main file
├── wallets.txt        # Wallet addresses list
└── proxy.txt          # Proxy list
```

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/mbrx10/openLedgerBot.git
cd openLedgerBot
```

2. Install dependencies:
```bash
npm install
```

## 💼 Wallets Configuration

3. create wallets.txt file with your wallet addresses
```bash
touch wallets.txt
```

- add your wallet addresses to the wallets.txt file
```bash
nano wallets.txt
```

## 🌐 Proxy Configuration

4. create proxy.txt file with your proxies
```bash
touch proxy.txt
```

- add your proxies to the proxy.txt file
```bash
nano proxy.txt
```
## 🚀 Usage

Run the worker:
```bash
npm start
```
## ⚙️ Configuration

1. Create `wallets.txt` with wallet addresses (one per line):
```
0x1234567890abcdef...
0xabcdef1234567890...
```

2.Create `proxy.txt` with proxies (one per line):
```
# HTTP proxies
http://ip:port
http://username:password@ip:port

# SOCKS proxies
socks4://ip:port
socks5://ip:port
```

## ⏱️ Intervals

- 🎁 Daily rewards check: Every 60 minutes
- 📊 Points check: Every 9 minutes
- 💓 Heartbeat: Every 30 seconds

## 📦 Dependencies

- **axios** & **axios-retry** - Robust HTTP client with retry capability
- **ws** - Fast & reliable WebSocket client
- **https-proxy-agent** - HTTP/HTTPS proxy support
- **socks-proxy-agent** - SOCKS proxy support
- **chalk** - Beautiful console output

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions, issues and feature requests are welcome!

## ⭐️ Show your support

Give a ⭐️ if this project helped you! 