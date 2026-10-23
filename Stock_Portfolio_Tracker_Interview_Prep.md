# Stock Portfolio Tracker — Interview Prep

Is document ke Stock Portfolio Tracker answers repository ke code aur README ko dekh kar banaye gaye hain. Answers ko apni speaking style mein bolna. Jahan **verify/replace** likha hai, wahan apne actual experience ya deployment details daalna. StayHaven ka source code is workspace mein nahi mila, isliye us section mein truthful answer frameworks diye gaye hain, implemented-feature claims nahi.

## 1. Basic project questions

### 1. Tell me about your project

> “My project is a full-stack Stock Portfolio Tracker built with React, Node.js, Express, MongoDB and Socket.IO. It helps users track Indian and US stocks, maintain holdings and a watchlist, record buy and sell transactions, and view portfolio performance. It also has stock search, historical charts, price alerts, in-app notifications and analytics. The backend gets market data through Yahoo Finance, normalizes symbols such as `TCS`, `TCS.NS` and `TCS:NSE`, and uses in-memory caching. Socket.IO distributes price updates after the backend polls active symbols every three minutes.”

> “The price updates are periodic and provider-dependent; they are not exchange-grade tick-by-tick prices.”

### 2. Why did you choose this project?

> “I chose it because it brings together several full-stack problems in one application: user authentication, user-specific database records, third-party API integration, financial calculations, charts and live UI updates. It gave me a practical way to learn how data moves from an external provider through a backend service to a React interface.”

### 3. Why did you use the MERN stack?

> “React is useful for building reusable interactive screens. Node and Express let me build APIs in JavaScript, and MongoDB with Mongoose fits the user, holdings, transactions and alert documents. Using JavaScript across the frontend and backend also keeps the stack consistent.”

### 4. Explain your project architecture

> “The React client uses Axios for REST calls and Socket.IO Client for pushed events. Express routes map API URLs to controllers. Controllers validate requests and use Mongoose models for MongoDB operations. Stock-related requests go through a stock service, which normalizes symbols, checks the in-memory cache and calls the Yahoo Finance provider when needed. The backend also runs a periodic quote poll and emits Socket.IO events to connected clients.”

```text
React pages/components
  ├─ Axios + JWT → Express routes/controllers → Mongoose → MongoDB
  │                                  └→ stock service → cache / Yahoo Finance
  └─ Socket.IO subscriptions ← periodic quote polling and events
```

### 5. What was your role in the project?

**Use the version that matches your work.**

> “I worked on the full-stack implementation: React pages and API integration, Express endpoints, Mongoose schemas, authentication, portfolio and transaction logic, stock-data integration, caching and Socket.IO updates.”

If it was a team project, replace this with exactly which components you personally built and what teammates owned. Don’t claim sole ownership unless that is true.

### 6. What are the main features?

> “The main features are registration and login, portfolio holdings, buy/sell transaction history, Indian and US stock quotes, watchlists, historical price charts, price alerts and notifications, portfolio snapshots, dashboard summaries, analytics, and light/dark theme support.”

### 7. What was the biggest challenge?

> “A key challenge was making stock symbols work consistently across Indian and US markets. The same Indian stock may be entered as `TCS`, `TCS.NS` or `TCS:NSE`, while the data provider expects its own symbol format. I added a normalization layer and kept market-data access behind a service. Caching and fallback handling also reduce repeated provider calls and give the UI a controlled response when the provider fails.”

## 2. Technical questions

### React: What are components, props and state?

> “A component is a reusable piece of UI. Props are values passed from a parent component to a child. State is data owned by a component that can change over time; when state changes, React renders the updated UI. In this app, pages compose shared components such as cards, charts, tables and transaction modals.”

### Node.js: What is Node.js? Is it single-threaded?

> “Node.js is a JavaScript runtime used to run JavaScript outside the browser. JavaScript callbacks normally run on the main event-loop thread, while Node uses asynchronous I/O so network and database waits do not block the thread. CPU-heavy synchronous work can still block the event loop.”

### Express.js: What is middleware?

> “Middleware is a function that runs during the request-response lifecycle. It can inspect or change the request, end the response, or pass control to the next middleware. This project uses middleware for CORS, JSON parsing, rate limiting and JWT authentication.”

### MongoDB: Collection vs document?

> “A collection is a group of related documents, similar to a table at a high level. A document is one BSON record, similar to a JSON object. This project has collections represented by Mongoose models such as User, Portfolio, Transaction, Watchlist and PriceAlert.”

### REST API: Explain GET, POST, PUT, PATCH and DELETE

> “GET reads a resource. POST creates a resource or performs an action. PUT generally replaces or updates a resource. PATCH applies a partial update. DELETE removes a resource. In this project, for example, GET retrieves portfolio data, POST creates a transaction, PUT updates a holding, PATCH updates alert state, and DELETE removes a record.”

### Authentication: How does JWT work here?

> “At registration, the password is hashed with bcrypt and only the hash is stored. At login, bcrypt compares the submitted password with the stored hash. If it matches, the server signs a JWT containing the user ID with a seven-day expiry. The client stores the token and Axios sends it as a Bearer token. Protected-route middleware verifies it and attaches the decoded user identity to the request.”

> “The React protected route improves navigation, but the backend JWT middleware is what protects API data.”

### API integration: What happens when an external API fails?

> “The stock service tries a provider quote after checking the cache. If the provider fails, it can use stale cached quote data, then labeled static demo data for supported symbols, or return an error response. Historical data uses cache and returns an empty array when no data is available, although a provider exception can currently reach the controller as an error. The source should remain visible so demo or stale data is not presented as a fresh market quote.”

### Database: How did you design holdings and transactions?

> “A Portfolio document stores one user's symbol, current quantity and average buy price. It has a unique compound index on user ID and stock symbol. A Transaction document is a separate ledger record with user ID, symbol, BUY/SELL type, quantity, execution price and total amount. A buy merges into the holding and recalculates its weighted average cost. A sell checks that the holding exists and has enough quantity before reducing or removing it.”

> “These are currently separate database writes rather than one atomic MongoDB transaction, which is a consistency improvement I would make.”

### Error handling: How do you handle server errors and invalid requests?

> “Controllers use try/catch and return JSON errors with relevant HTTP status codes. They validate fields such as symbol, quantity, price, transaction type and MongoDB IDs. Mongoose schema constraints provide another validation layer. The Express app also handles disallowed CORS origins and malformed JSON, and applies a request body limit and rate limit.”

> “Validation coverage is not identical for every endpoint, so I would centralize validation and use a consistent error-response format as a future improvement.”

### Deployment: How did you deploy the frontend and backend?

> “The README documents the frontend deployment on Vercel and the app uses environment variables for the API URL, MongoDB connection, JWT secret and allowed client origin. The repository does not identify the backend hosting provider or its production URL, so I would confirm that detail before the interview rather than guess.”

Before the interview, verify the actual backend host, MongoDB hosting, environment variables configured in production, and whether the current demo is still online. Do not describe a local setup as a production deployment.

## 3. Fifteen frequent project questions

The first seven are answered in Section 1. Here are the remaining questions and short versions for revision.

### 8. How does the frontend communicate with the backend?

> “The frontend uses Axios with a configured base URL for REST endpoints. An Axios request interceptor attaches the JWT to requests. REST handles operations such as login, reading holdings and creating transactions. Socket.IO Client maintains a separate persistent connection for quote and alert events.”

### 9. What challenges did you face?

> “The main challenge was handling market-specific symbol formats and external provider reliability. Symbol normalization, caching and labeled fallbacks help keep the app consistent. Another challenge was synchronizing the portfolio UI after transaction and socket updates.”

### 10. How did you handle errors?

> “I validate request data in controllers and schemas, use try/catch around asynchronous operations, return status codes with JSON messages, and show loading/error/toast states in the UI. The Axios response interceptor clears an invalid saved session on a 401.”

### 11. How does authentication work?

See the JWT answer in Section 2: bcrypt password hash, signed seven-day token, Bearer header, JWT middleware and user-scoped database queries.

### 12. How did you test your project?

> “The repository includes Jest tests for symbol normalization and stock service integration, plus a React Testing Library test for the unauthenticated login redirect. The stock-service tests call the external provider, so their results depend on network and provider availability. I would add isolated unit tests with mocked provider calls and API/controller tests for transactions and authentication.”

Only say you ran tests if you actually ran them. This preparation document does not claim the tests were run.

### 13. How did you deploy your project?

Use the answer in the Deployment section above and fill in the actual backend provider from your deployment dashboard. README confirms Vercel frontend configuration but not the backend host.

### 14. What improvements would you make?

> “I would make buy/sell and ledger writes atomic, normalize symbols consistently before saving, add currency conversion for combined Indian/US totals, authenticate Socket.IO and use user-specific rooms, improve historical snapshot semantics, centralize request validation, and add mocked tests for provider failures.”

### 15. Can you explain one feature with code?

**BUY transaction walkthrough:**

> “The transaction controller reads the symbol, type, quantity and price, validates them, and derives total amount. For a BUY it looks up the user's holding. If it exists, it calculates the weighted average cost and updates quantity; otherwise it creates a holding. Finally it creates a Transaction ledger record and returns a success response. One improvement is to put the holding update and ledger insert in a MongoDB transaction so they succeed or fail together.”

Code location: `server/src/controllers/transactionController.js`.

## 4. Five extra stock-tracker questions

### 1. How do you calculate average purchase price?

> “I use weighted average cost: `(old quantity × old average price + new quantity × new purchase price) / total quantity`. For example, 10 shares at ₹100 plus 5 at ₹130 gives `(1000 + 650) / 15 = ₹110` average cost.”

### 2. How do you fetch real-time stock market data?

> “The backend normalizes the symbol, checks its in-memory quote cache, then calls the Yahoo Finance provider if necessary. The Socket.IO server polls the active symbol pool every three minutes and emits quote updates. So the application gives periodic updates, not exchange-grade tick-by-tick data.”

### 3. What is Socket.IO, and why did you use it?

> “Socket.IO is a library for event-based, bidirectional communication between client and server over a persistent connection, with reconnection support. I use it so the backend can push price and alert events to an open UI without the frontend repeatedly polling for each update.”

### 4. How do you handle API rate limits or API failure?

> “I use in-memory cache with different TTLs for quotes, history and search, which reduces repeated provider requests. On quote failure, the service checks stale cache and then labeled demo data for supported symbols before returning an error. The app also has an Express rate limit for incoming API requests. Provider rate limits and availability still depend on Yahoo Finance.”

### 5. How do you calculate realized and unrealized P/L?

> “The current portfolio screen calculates unrealized P/L as `(current market price − average cost) × remaining quantity`. The project stores BUY and SELL transactions, but it does not currently calculate realized profit/loss by matching sold shares to their original cost basis. To add realized P/L, I would choose and implement a consistent accounting method such as weighted average or FIFO, calculate it at each sale, and store or derive the realized result.”

Do not say the current app fully calculates realized P/L. Its main P/L figure is holding-based and unrealized.

## 5. StayHaven questions — answer only after checking that project

The workspace used for this preparation contains the Stock Portfolio Tracker code, not StayHaven. The following are **answer templates**. Replace bracketed text only with details verified in the StayHaven source code. Do not claim these features are implemented based only on the question list.

### 1. What problem does StayHaven solve?

> “StayHaven helps [target users] discover and [book/manage] [type of property or stay]. It addresses [specific verified problem] by providing [verified features].”

### 2. Explain the MVC architecture

> “The Model layer defines [verified database models]. The View layer is [verified frontend/template technology]. The Controller layer handles [verified request/business logic]. Routes connect incoming requests to the appropriate controllers.”

### 3. How does Passport.js authentication work?

> “Passport uses the [verified strategy, such as Local Strategy] to authenticate credentials. On success, the app establishes [verified session or token behavior]. Protected routes use [verified middleware] to ensure the user is signed in.”

### 4. How do you upload images with Cloudinary and Multer?

> “Multer handles the incoming multipart file. The app then uploads it to Cloudinary and stores the returned URL and public ID with the listing. I would explain the exact storage and deletion behavior from the code.”

### 5. How do you store property listings?

> “A listing document stores [verified fields], and [verified owner/reference relationship] links it to the user. The exact schema and validation are defined in [model file].”

### 6. How do you prevent unauthorized listing edits?

> “The route first requires an authenticated user. The controller checks that the listing exists and that its owner ID matches the current user's ID before allowing an update or deletion.”

Only use this answer if the owner check is actually present in the code.

### 7. How does the availability calendar work?

> “The calendar reads [verified booking/availability data], marks unavailable date ranges and validates requested dates before creating a booking. I would describe how date overlap is checked from the actual implementation.”

### 8. How are maps integrated with Leaflet and OpenStreetMap?

> “Leaflet renders the interactive map and OpenStreetMap provides map tiles. Listing coordinates are passed to the map marker. I would confirm how the project obtains and stores those coordinates.”

### 9. How would you handle payment verification and cancellation?

If not implemented, answer as a design proposal:

> “I would verify payment on the server using the payment provider's signed webhook or signature verification, store the provider transaction ID and status, and make booking confirmation idempotent. Cancellation would update booking state and trigger a refund according to the cancellation policy, with all changes recorded.”

### 10. What security measures did you implement?

> “I would list only verified controls, such as authentication, ownership checks, input validation, upload restrictions, CSRF protection where relevant, secure session settings, rate limiting and secret management. I would distinguish controls that are implemented from ones I would add.”

## 6. Code review notes to know if the interviewer asks about trade-offs

- Socket.IO quote and alert events use a global broadcast in this version; per-user rooms and socket authentication would improve isolation.
- Holding updates and transaction ledger writes are separate operations, so they are not atomic together.
- Deleting a transaction record does not reverse the corresponding portfolio change.
- Symbols are not normalized to one canonical representation everywhere they are saved; `TCS` and `TCS.NS` can behave like different stored symbols.
- Indian and US holding values are summed without currency conversion, so a mixed-currency total is not financially comparable.
- Portfolio snapshots accept totals sent by the client rather than recalculating them server-side.
- The dashboard's “Today's P/L” uses the first and last available snapshot values; the snapshot response does not guarantee those points belong to the same calendar day.
- Browser localStorage is used for the JWT. An `httpOnly`, `Secure`, `SameSite` cookie setup is a possible security improvement.
- Quote data can be cached, stale or demo. Preserve the `dataSource` and timestamp distinction when describing it.

## 7. Last-minute speaking checklist

1. Start with the project intro, then explain the architecture.
2. Explain one full flow: login, stock quote, or BUY transaction.
3. Memorize the weighted-average and P/L formulas.
4. Describe Socket.IO as periodic three-minute polling plus pushed events.
5. State what the code does today, then offer improvements separately.
6. Verify the backend hosting provider and your personal role before the interview.
7. For StayHaven, use its repository before making implementation claims.
