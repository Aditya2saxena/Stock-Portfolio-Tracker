# 📈 Real Market Data Stock Portfolio Tracker

A production-quality, real-market-data-driven stock portfolio management application built with the MERN stack (MongoDB, Express, React, Node.js). Track holdings across both **US** and **Indian (NSE/BSE)** markets with real live stock quotes, OHLC historical charts, weighted-average cost basis calculations, Socket.IO real-time price streaming, price alerts, and analytics.

---

## ✨ Key Features & Enhancements

- 🌐 **Dual Market Support** — Native quote and chart data for both US stocks (`AAPL`, `MSFT`, `AMZN`, `GOOGL`, `TSLA`, `NVDA`, `META`) and Indian stocks (`TCS`, `INFY`, `RELIANCE`, `HDFCBANK`, `ICICIBANK`, `TATAMOTORS`, `SBIN`, `WIPRO`).
- 🔀 **Symbol Normalization Layer** — Dedicated service normalizing inputs like `TCS`, `TCS:NSE`, `TCS.NS`, `RELIANCE`, `RELIANCE.NS`, and `AAPL` without code scattering.
- ⚡ **Pooled Socket.IO Updates** — Client socket subscription model (`subscribe:symbols`) where the backend pools requested symbols and broadcasts updates without triggering duplicate external API requests.
- 🛡️ **5-Level Fallback Strategy** — Live External Market Provider → Fresh Cache → Stale Cache → Labeled Demo Fallback → Controlled Error, protecting against API outages.
- 📊 **Real Historical OHLC Charts** — Replaced mock data with real time-series chart data (`1D`, `1W`, `1M`, `3M`, `6M`, `1Y`).
- 🏷️ **Data Source & Market Status Indicators** — UI clearly displays `LIVE`, `CACHED` ("Last updated X mins ago"), or `DEMO` ("Demo data — live market data unavailable") badges along with exchange market state (`OPEN`, `CLOSED`, `PRE`, `POST`).
- 💱 **Multi-Currency Support** — Dynamic currency formatting (`₹` for INR / NSE/BSE stocks, `$` for USD / US stocks).
- 💼 **Portfolio P/L Engine** — Automated weighted-average cost basis recalculation, invested amount, market value, P/L, return %, top gainers, and top losers.
- 🔍 **Symbol Search** — Fast cached search across US and Indian equity markets.

---

## 🛠️ Tech Stack & Provider Architecture

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router v7, Recharts, Socket.io-client, Axios, lucide-react |
| Backend | Node.js, Express 5 |
| Database | MongoDB with Mongoose 9 |
| Real-time | Socket.io 4 (Pooled Symbol Subscription Model) |
| Caching | In-Memory CacheService with Multi-TTL (Quotes: 60s, History: 15m, Search: 1h) |
| Market Data Provider | Server-side Abstraction Layer (`marketDataProvider.js`) powering Yahoo Finance & REST fallbacks |

---

## 🏗️ Recommended Data Flow & Architecture

```
React Frontend (UI / Charts)
       ↓
Express REST API / Socket.IO Client
       ↓
Stock Controller / Symbol Normalizer
       ↓
Stock Service (Fallback Hierarchy)
       ↓
Server-Side Cache (Quote / History / Search TTLs)
       ↓
External Market Data Provider (MarketDataProvider Abstraction)
       ↓
Cache Storage
       ↓
Socket.IO Broadcast Pool / REST Response
       ↓
React UI (Data Source Badge + Dynamic Currency)
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas or local MongoDB instance

### 1. Clone the repository
```bash
git clone https://github.com/Aditya2saxena/Stock-Portfolio-Tracker.git
cd Stock-Portfolio-Tracker
```

### 2. Backend Setup
```bash
cd server
npm install
```

Create a `.env` file in `server/`:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:3000
MARKET_DATA_API_KEY=optional_provider_key
```

Run tests:
```bash
npm test
```

Start server:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd ../client
npm install
```

Create a `.env` file in `client/` (optional):
```env
REACT_APP_API_URL=http://localhost:5000
```

Start React app:
```bash
npm start
```

App runs at `http://localhost:3000`, API server at `http://localhost:5000`.

---

## 🔑 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | User authentication (returns JWT) |
| GET | `/api/stocks/:symbol` | Real stock quote with currency, exchange, marketStatus, dataSource |
| GET | `/api/stocks/:symbol/history?range=1M` | Historical OHLC chart data (1D, 1W, 1M, 3M, 6M, 1Y) |
| GET | `/api/stocks/search?query=` | Stock search (US and Indian tickers) |
| GET | `/api/portfolio` | User portfolio holdings with live prices and P/L calculations |
| POST | `/api/portfolio` | Add/merge stock holding |
| PUT | `/api/portfolio/:id` | Update holding quantity/buy price |
| DELETE | `/api/portfolio/:id` | Remove portfolio holding |
| GET | `/api/watchlist` | User watchlist with live quotes |
| POST | `/api/watchlist` | Add symbol to watchlist |
| DELETE | `/api/watchlist/:symbol` | Remove symbol from watchlist |
| GET | `/api/transactions` | Order ledger (BUY/SELL transactions) |
| POST | `/api/transactions` | Execute BUY/SELL transaction |
| GET | `/api/alerts` | Get user price alerts |
| POST | `/api/alerts` | Create price alert trigger |

---

## ⚡ Socket.IO Event Contract

- **`subscribe:symbols`** (Client → Server): `['AAPL', 'TCS']` - Adds symbols to active server polling pool.
- **`unsubscribe:symbols`** (Client → Server): `['AAPL']` - Removes symbols from client pool.
- **`priceUpdate`** (Server → Client): Broadcasts updated stock quote payload.
- **`priceAlertTriggered`** (Server → Client): Broadcasts alert notification when price target is reached.

---

## 🧪 Testing

Run backend Jest test suite:
```bash
cd server
npm test
```

Included tests cover:
- Symbol normalization (`US`, `NSE`, `BSE`, `:NSE` format)
- Market quote retrieval & cache integration
- Fallback hierarchy (Live API → Cache → Demo → Error)
- Historical OHLC data processing
- Stock search service

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 🙋 Author

**Aditya Saxena**
GitHub: [@Aditya2saxena](https://github.com/Aditya2saxena)