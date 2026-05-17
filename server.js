require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const bundleRoutes    = require("./src/routes/bundles");
const orderRoutes     = require("./src/routes/orders");
const paymentRoutes   = require("./src/routes/payments");
const wholesaleRoutes = require("./src/routes/wholesale");

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({
  origin: [process.env.FRONTEND_URL, "http://localhost:3000", "http://localhost:5173"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));

app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
const orderLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 });

app.use("/api", limiter);
app.use("/api/orders", orderLimiter);

app.use("/api/bundles",   bundleRoutes);
app.use("/api/orders",    orderRoutes);
app.use("/api/payments",  paymentRoutes);
app.use("/api/wholesale", wholesaleRoutes);

app.get("/", (req, res) => {
  res.json({ success: true, message: "UniMarket API is running 🚀", version: "1.0.0" });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.message);
  res.status(err.status || 500).json({ success: false, message: err.message || "Internal server error." });
});

app.listen(PORT, () => {
  console.log(`✅ UniMarket API running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
});
