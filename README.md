# 📈 Stock Portfolio Tracker

A full-stack stock portfolio management application built with the **MERN stack**. Track **US and Indian (NSE/BSE) equities** with market quotes, historical OHLC charts, portfolio P/L, transactions, watchlists, price alerts, authentication, and periodic quote updates delivered through Socket.IO.

### 🔗 Links

- 🚀 **Live Demo:** [stock-portfolio-tracker-bice.vercel.app](https://stock-portfolio-tracker-bice.vercel.app)
- 💻 **GitHub:** [Aditya2saxena/Stock-Portfolio-Tracker](https://github.com/Aditya2saxena/Stock-Portfolio-Tracker)

## Features

- **Portfolio dashboard** — holdings, market value, cost basis, profit/loss, and recent transactions.
- **US and Indian equities** — symbol normalization supports common forms such as `AAPL`, `TCS`, `TCS.NS`, and `RELIANCE:NSE`.
- **Market quotes and charts** — quote details and historical chart ranges from `1D` to `1Y`.
- **Portfolio management** — add, update, and remove holdings; repeated additions merge into the holding using weighted-average cost basis.
- **Buy and sell ledger** — record transactions and update holdings when a transaction is created.
- **Watchlist and price alerts** — track symbols and configure price targets with in-app notifications.
- **Analytics and snapshots** — view portfolio value history based on saved portfolio snapshots.
- **Authentication** — registration, login, and protected portfolio features.
- **Quote caching and fallback** — in-memory quote, history, and search caches; quotes fall back to stale cache or labeled demo values when available.

## Technology

| Area | Stack |
| --- | --- |
| Frontend | React 19, React Router, Recharts, Socket.IO Client, Axios |
| Backend | Node.js, Express 5, Socket.IO |
| Database | MongoDB with Mongoose |
| Market data | `yahoo-finance2` and Yahoo Finance chart endpoint |
| Tests | Jest, Supertest, React Testing Library |

## Application workflow

1. A user registers or logs in. The client stores the JWT and sends it with protected API requests.
2. The API reads and updates user data in MongoDB. Protected data includes holdings, transactions, watchlists, alerts, notifications, and portfolio snapshots.
3. For quotes, the backend checks its in-memory cache, then requests market data. If the provider request fails, it tries stale cached data, then a demo quote for supported symbols; otherwise it reports an error.
4. The dashboard and stock pages subscribe to symbols over Socket.IO. The server polls quotes every three minutes for a set containing default symbols and client subscriptions, then broadcasts `priceUpdate` events to connected clients.
5. Portfolio snapshots are saved at most once per minute per user and power the portfolio history views.

## Architecture

```text
React client
  ├── REST API requests ──> Express routes/controllers ──> MongoDB
  │                                      └───────────────> Stock service
  │                                                         ├── In-memory cache
  │                                                         └── Yahoo Finance provider
  └── Socket.IO subscriptions <── periodic quote polling and broadcasts
```

## Getting started

### Requirements

- Node.js **22 or newer** (the installed `yahoo-finance2` dependency requires Node.js 22+)
- npm
- MongoDB Atlas or a local MongoDB instance

### 1. Clone the repository

```bash
git clone https://github.com/Aditya2saxena/Stock-Portfolio-Tracker.git
cd Stock-Portfolio-Tracker
```

### 2. Configure and start the backend

```bash
cd server
npm install
```

Create `server/.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/stock-portfolio-tracker
JWT_SECRET=replace-with-a-long-random-secret
CLIENT_URL=http://localhost:3000
```

Set `MONGO_URI` to your MongoDB connection string. `CLIENT_URL` should be the frontend origin when running or deploying the app. Keep secrets in environment variables and do not commit `.env` files.

Start the API and Socket.IO server:

```bash
npm run dev
```

The backend listens on `http://localhost:5000` by default. A health check is available at `http://localhost:5000/api/health`.

### 3. Configure and start the frontend

Open a second terminal from the repository root:

```bash
cd client
npm install
```

Optionally create `client/.env` to point the app at a different backend:

```env
REACT_APP_API_URL=http://localhost:5000
```

Start the React development server:

```bash
npm start
```

The frontend runs at `http://localhost:3000`. The API and Socket.IO server run at `http://localhost:5000`.

## Available scripts

### Backend (`server/`)

| Command | Description |
| --- | --- |
| `npm run dev` | Start the backend with nodemon |
| `npm start` | Start the backend with Node.js |
| `npm test` | Run the Jest suite |

### Frontend (`client/`)

| Command | Description |
| --- | --- |
| `npm start` | Start the React development server |
| `npm run build` | Create a production build |
| `npm test` | Run the React Scripts test runner |

The stock-service tests call the external market-data provider. Network access may be needed, and provider availability can affect those tests.

## API overview

All API routes are prefixed with `/api`. Routes marked **Auth** require `Authorization: Bearer <token>`.

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | Public | Create an account |
| `POST` | `/auth/login` | Public | Log in and receive a JWT |
| `GET` | `/auth/me` | Auth | Get the current user |
| `PUT` | `/auth/change-password` | Auth | Change the account password |
| `GET` | `/stocks/search?query=TCS` | Public | Search symbols |
| `GET` | `/stocks/:symbol` | Public | Get a quote |
| `GET` | `/stocks/:symbol/history?range=1M` | Public | Get historical chart data |
| `GET` | `/portfolio` | Auth | Get holdings with quote and P/L data |
| `POST` | `/portfolio` | Auth | Add or merge a holding |
| `PUT` | `/portfolio/:id` | Auth | Update holding quantity or buy price |
| `DELETE` | `/portfolio/:id` | Auth | Remove a holding |
| `POST` | `/portfolio/snapshot` | Auth | Save a portfolio snapshot (throttled to once per minute) |
| `GET` | `/portfolio/history` | Auth | Get up to 20 portfolio snapshots |
| `GET` | `/watchlist` | Auth | List watchlist symbols |
| `POST` | `/watchlist` | Auth | Add a symbol to the watchlist |
| `DELETE` | `/watchlist/:symbol` | Auth | Remove a symbol from the watchlist |
| `GET` | `/transactions` | Auth | List transactions; supports `type`, `stockSymbol`, and `limit` query parameters |
| `GET` | `/transactions/:id` | Auth | Get a transaction |
| `POST` | `/transactions` | Auth | Create a `BUY` or `SELL` transaction |
| `DELETE` | `/transactions/:id` | Auth | Delete a transaction record |
| `GET` | `/alerts` | Auth | List price alerts |
| `POST` | `/alerts` | Auth | Create a price alert |
| `PATCH` | `/alerts/:id` | Auth | Update an alert |
| `PATCH` | `/alerts/:id/toggle` | Auth | Activate or deactivate an alert |
| `DELETE` | `/alerts/:id` | Auth | Delete an alert |
| `GET` | `/notifications` | Auth | List notifications |
| `PATCH` | `/notifications/:id/read` | Auth | Mark a notification as read |
| `PATCH` | `/notifications/read-all` | Auth | Mark all notifications as read |
| `DELETE` | `/notifications/:id` | Auth | Delete a notification |
| `GET` | `/health` | Public | Check API health |

## Socket.IO events

| Event | Direction | Payload / behavior |
| --- | --- | --- |
| `subscribe:symbols` | Client → server | Array of symbols to add to the polling pool |
| `unsubscribe:symbols` | Client → server | Array of symbols to remove from that client's subscription set |
| `priceUpdate` | Server → connected clients | Quote update broadcast during polling |
| `priceAlertTriggered` | Server → connected clients | Triggered price-alert event |

The server currently broadcasts quote and alert events to all connected clients. Do not treat the quote stream as exchange-grade tick data: updates are driven by a three-minute polling loop and depend on the upstream provider.

## Market data and caching notes

- Quote, history, and search caches are in-memory and are cleared when the backend restarts.
- Configured cache lifetimes are 60 seconds for quotes, 15 minutes for history, and 1 hour for search.
- A fresh quote-cache response is returned with `dataSource: "live"`; provider failures can return `"cached"`, `"demo"`, or an error response depending on available data.
- Demo quotes are static sample values for supported symbols. They are labeled as demo data in the response and should not be used for investment decisions.
- Historical data returns cached results when available; if provider retrieval fails and there is no cached history, the API returns an empty array.
- Availability, delays, and coverage depend on Yahoo Finance and may vary by symbol or market.

## Project structure

```text
client/
  src/pages/          Application screens
  src/components/     Shared UI and dashboard components
  src/api/            API service modules
  src/context/        Authentication, theme, and toast state
server/
  src/controllers/    Request handlers
  src/routes/         REST route definitions
  src/services/       Market data, caching, and alert logic
  src/models/         Mongoose schemas
  src/middleware/     Authentication middleware
  src/__tests__/      Backend tests
```

## Contributing

1. Create a branch for your change.
2. Keep frontend and backend changes focused and document any new environment variables or API behavior.
3. Run the relevant build or test command before opening a pull request.

## Author

**Aditya Saxena** · [GitHub](https://github.com/Aditya2saxena)
