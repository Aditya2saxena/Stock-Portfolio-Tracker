require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');

const app = require('./src/app');
const connectDB = require('./src/config/db');
const { getStockPrice } = require('./src/services/stockService');
const { checkPriceAlerts } = require('./src/services/alertService');

const PORT = process.env.PORT || 5000;

// Wrap express app in HTTP server
const server = http.createServer(app);

// Production Socket.io CORS setup
const clientOrigin = process.env.CLIENT_URL || 'http://localhost:3000';
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'https://stock-portfolio-tracker-a3lu064ol-aditya-465e.vercel.app'],
    methods: ['GET', 'POST'],
  },
});

// Attach io to app for access in routes/controllers
app.set('io', io);

// Tracked symbols
const trackedSymbols = ['AAPL', 'RELIANCE.NS', 'MSFT', 'TSLA', 'INFY.NS'];

// Client socket connection
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// Send stock updates and check alerts
const sendStockUpdates = async () => {
  for (const symbol of trackedSymbols) {
    try {
      const stockData = await getStockPrice(symbol);
      io.emit('priceUpdate', stockData);
      console.log(`📡 Sent update for ${symbol}: ₹${stockData.currentPrice}`);

      // Check active price alerts for this stock
      await checkPriceAlerts(stockData, io);
    } catch (error) {
      console.error(`❌ Failed to fetch ${symbol}:`, error.message);
    }
  }
};

// Interval update every 5 minutes
setInterval(sendStockUpdates, 5 * 60 * 1000);

// Connect DB & Start server
connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log('⚡ Socket.io ready for real-time updates and alerts');
    });
  })
  .catch((error) => {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  });