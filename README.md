Search results provide quick navigation to the stock details page.

📋 Stock Details

Each stock has a dedicated details page containing:

Current price
Price change
Percentage change
Market high
Market low
Open price
Previous close
Interactive price chart
Watchlist action
BUY button
SELL button
User's current position
💰 BUY / SELL System

Users can execute stock transactions directly from the application.

BUY

When buying additional shares, the application automatically calculates the weighted average purchase price.

New Average Price =
(Old Investment + New Investment)
/
(Old Quantity + New Quantity)
SELL

The system validates:

Stock ownership
Available quantity
Valid transaction quantity

Users cannot sell more shares than they currently own.

🧾 Transaction History

Every BUY and SELL transaction is stored in MongoDB.

Transaction history includes:

Stock symbol
Transaction type
Quantity
Price
Total amount
Date and time

Available filters:

ALL
BUY
SELL
⭐ Watchlist

Users can maintain a personal stock watchlist.

Features:

Add stocks
Remove stocks
Real-time prices
Percentage changes
View stock details
Buy directly from watchlist
Sort by symbol
Sort by price
Sort by percentage change
🔔 Price Alerts

Users can create price-based alerts.

Example:

Stock: AAPL
Current Price: ₹227


Alert Type: ABOVE
Target Price: ₹228

When the target price is reached:

🔔 Price Alert


AAPL has reached your target price.


Target: ₹228
Current: ₹228.32

The application provides:

Toast notification
Notification bell badge
Notification record
Alert deactivation after trigger

Supported conditions:

ABOVE
BELOW
🔔 Notification System

The application includes an in-app notification system.

Features:

Notification bell
Unread notification count
Notification dropdown
Mark notification as read
Mark all notifications as read
Real-time alert notifications
📊 Portfolio Analytics

Dedicated analytics dashboard providing:

Portfolio performance
Historical portfolio value
Asset allocation
Concentration analysis
Portfolio diversification insights
Performance trends

Supported time ranges:

1D
1W
1M
3M
6M
1Y
Portfolio Concentration

The application calculates a normalized Herfindahl-Hirschman Index (HHI) to identify portfolio concentration risk.

🏆 Portfolio Insights

The dashboard automatically identifies:

Best Performer

The stock with the highest return percentage.

Worst Performer

The stock with the lowest return percentage.

Portfolio Health

The application evaluates portfolio characteristics such as:

Diversification
Concentration
Risk
Performance
🌓 Dark / Light Mode

The application supports both:

Dark Mode
Light Mode

User preference is persisted using localStorage.

The dark theme follows a modern fintech-style design with:

#0b1120
#111827
#1f2937
📱 Responsive Design

The application is designed to work across:

Desktop
Laptop
Tablet
Mobile

Responsive features include:

Mobile sidebar drawer
Responsive tables
Responsive charts
Stacked forms
Mobile-friendly navigation
⚡ Real-Time Architecture

Stock price updates are delivered using Socket.io.

Stock Market API
       ↓
Node.js / Express
       ↓
Socket.io
       ↓
React Client
       ↓
Portfolio UI

This allows portfolio values and stock prices to update without manually refreshing the page.

🏗️ Architecture
                    ┌──────────────────┐
                    │   React Client   │
                    │                  │
                    │ Dashboard        │
                    │ Watchlist        │
                    │ Stock Details    │
                    │ Transactions     │
                    │ Analytics        │
                    │ Alerts           │
                    └────────┬─────────┘
                             │
                       REST API
                             │
                    ┌────────▼─────────┐
                    │ Node.js /        │
                    │ Express Server   │
                    └────────┬─────────┘
                             │
             ┌───────────────┼────────────────┐
             │               │                │
             ▼               ▼                ▼
        MongoDB         Stock Price API   Socket.io
             │                                │
             └───────────────┬────────────────┘
                             │
                             ▼
                    Real-Time Portfolio
                         Updates
🛠️ Tech Stack
Frontend
React.js
React Router
Axios
Recharts
Socket.io Client
Lucide React
CSS3
Responsive Design
Backend
Node.js
Express.js
MongoDB
Mongoose
JWT
Socket.io
Development Tools
Git
GitHub
VS Code
npm
Postman / API testing tools
📂 Project Structure
Stock-Portfolio-Tracker/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.js
│   │   └── index.js
│   │
│   ├── package.json
│   └── README.md
│
├── server/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   │
│   ├── server.js
│   └── package.json
│
├── .gitignore
└── README.md