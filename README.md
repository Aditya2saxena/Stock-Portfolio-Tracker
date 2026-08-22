# 📈 Stock Portfolio Tracker

A real-time stock portfolio management application built with the MERN stack (MongoDB, Express, React, Node.js). Track holdings, execute buy/sell orders, monitor live prices, set price alerts, and analyze portfolio diversification — all in one dashboard.

**Live Demo:** [Add your deployed link here]
**Repository:** https://github.com/Aditya2saxena/Stock-Portfolio-Tracker

---

## ✨ Features

- 🔐 **Authentication** — JWT-based login/register with bcrypt password hashing
- 💼 **Portfolio Management** — Add/remove holdings with automatic weighted-average cost basis calculation
- 📊 **Live Stock Prices** — Real-time market data via Alpha Vantage API
- ⚡ **Real-Time Updates** — Socket.io streams price updates to the dashboard without page refresh
- 🛡️ **3-Level API Fallback** — Live data → cached data → demo data, so the app never breaks even if the external API rate-limits
- 💹 **Buy/Sell Engine** — Full transaction system with oversell protection and weighted-average price recalculation
- 📜 **Transaction History** — Filterable ledger (All/Buy/Sell) with volume summaries
- ⭐ **Watchlist** — Track stocks without owning them, sortable by price/symbol/change
- 🔔 **Price Alerts** — Set target price triggers (above/below); get notified automatically when hit
- 📈 **Portfolio Analytics** — Herfindahl-Hirschman Index (HHI) diversification score, allocation breakdown, historical performance chart
- 🌗 **Dark/Light Mode** — Theme toggle with persistence
- 📱 **Responsive UI** — Works across desktop, tablet, and mobile

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, React Router, Recharts, Socket.io-client, Axios, lucide-react |
| Backend | Node.js, Express.js |
| Database | MongoDB with Mongoose |
| Auth | JWT + bcrypt |
| Real-time | Socket.io |
| Market Data | Alpha Vantage API |

---

## 🏗️ Architecture

```
React Dashboard
      ↓
Express REST API  ←────────────→  Socket.io (real-time price stream)
      ↓
MongoDB (Users, Portfolio, Transactions, Watchlist, Alerts, Snapshots)
      ↓
Alpha Vantage API
      ↓
  Available?
   ├── Yes → Live price (cached for 5 min to conserve rate limit)
   └── No  → Last cached price → Demo data (labeled clearly in UI)
```

**Why the fallback system matters:** Alpha Vantage's free tier allows only 25 requests/day. Rather than letting the app break when the limit is hit, every price lookup falls back gracefully — live data is preferred, stale cache is used if live fails, and clearly-labeled demo data is the last resort. The UI always shows which source is being used (🟢 Live / 🟡 Cached / 🟠 Demo).

---

## 📂 Project Structure

```
stock-portfolio-tracker/
├── client/                  # React frontend
│   └── src/
│       ├── api/             # Axios service layer
│       ├── context/         # Auth & Theme context providers
│       ├── pages/           # Route-level pages
│       └── components/      # Reusable UI components
│
└── server/                  # Node/Express backend
    └── src/
        ├── config/          # DB connection
        ├── controllers/     # Route handlers / business logic
        ├── middleware/      # JWT auth middleware
        ├── models/          # Mongoose schemas
        ├── routes/          # API route definitions
        └── services/        # Stock price fetching + fallback logic
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account (free tier)
- Alpha Vantage API key (free at [alphavantage.co](https://www.alphavantage.co/support/#api-key))

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
```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
```

```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd ../client
npm install
npm start
```

App runs at `http://localhost:3000`, API at `http://localhost:5000`.

---

## 🔑 API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create a new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/portfolio` | Get holdings with live P/L |
| POST | `/api/transactions` | Execute a BUY/SELL order |
| GET | `/api/transactions` | Get transaction history |
| GET | `/api/watchlist` | Get watchlist with live prices |
| GET | `/api/stocks/search?query=` | Search stocks by symbol/name |
| POST | `/api/alerts` | Create a price alert |
| GET | `/api/analytics` | Portfolio diversification & performance data |

All routes except register/login require a `Authorization: Bearer <token>` header.

---

## 🧠 Key Design Decisions

- **Weighted average cost basis** — Buying the same stock multiple times merges into one holding using `(oldInvestment + newInvestment) / totalQuantity`, matching how real brokerages track average cost.
- **Rate-limit-aware caching** — Prices are cached for 5 minutes before a fresh API call is made, cutting external API calls by roughly 10x compared to naive polling.
- **Crash-proof controllers** — If price data is unavailable for one stock, only that item is marked "unavailable" — the rest of the portfolio still loads.
- **User data isolation** — Every database query is scoped to `req.user.id`, so users can never access another user's portfolio, transactions, or alerts.

---

## 🔮 Future Scope

- Stock news feed integration
- Multi-currency support
- CSV export of transaction history
- Automated tests (Jest/Supertest)
- CI/CD pipeline

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🙋 Author

**Aditya Saxena**
GitHub: [@Aditya2saxena](https://github.com/Aditya2saxena)