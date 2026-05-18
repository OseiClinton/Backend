require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const axios = require("axios");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const { createClient } = require("@supabase/supabase-js");

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── SUPABASE ─────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ─── SECURITY ─────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: [process.env.FRONTEND_URL, "http://localhost:3000", "http://localhost:5173"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));
app.use("/api/spendless/webhook", express.raw({ type: "application/json" }));
app.use("/api/payments/webhook",  express.raw({ type: "application/json" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

const limiter      = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
const orderLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 });
app.use("/api", limiter);
app.use("/api/orders", orderLimiter);

// ─── NETWORK KEY MAP ──────────────────────────────────
const NETWORK_KEYS = {
  mtn:        "YELLO",
  telecel:    "TELECEL",
  airteltigo: "AT_PREMIUM",
};

// ─── BUNDLE CATALOG ───────────────────────────────────
const BUNDLES = {
  mtn: [
    { id:"mtn_1gb",   size:"1GB",   capacity:1,   price:5.00,   wholesale:4.50   },
    { id:"mtn_2gb",   size:"2GB",   capacity:2,   price:9.50,   wholesale:8.60   },
    { id:"mtn_3gb",   size:"3GB",   capacity:3,   price:14.50,  wholesale:13.20  },
    { id:"mtn_4gb",   size:"4GB",   capacity:4,   price:20.00,  wholesale:18.00  },
    { id:"mtn_5gb",   size:"5GB",   capacity:5,   price:24.50,  wholesale:22.10  },
    { id:"mtn_6gb",   size:"6GB",   capacity:6,   price:29.00,  wholesale:26.40  },
    { id:"mtn_8gb",   size:"8GB",   capacity:8,   price:39.00,  wholesale:35.50  },
    { id:"mtn_10gb",  size:"10GB",  capacity:10,  price:47.00,  wholesale:42.60  },
    { id:"mtn_15gb",  size:"15GB",  capacity:15,  price:69.00,  wholesale:63.00  },
    { id:"mtn_20gb",  size:"20GB",  capacity:20,  price:89.00,  wholesale:81.20  },
    { id:"mtn_25gb",  size:"25GB",  capacity:25,  price:111.00, wholesale:100.78 },
    { id:"mtn_30gb",  size:"30GB",  capacity:30,  price:136.00, wholesale:124.00 },
    { id:"mtn_40gb",  size:"40GB",  capacity:40,  price:175.00, wholesale:159.00 },
    { id:"mtn_100gb", size:"100GB", capacity:100, price:415.00, wholesale:377.30 },
  ],
  telecel: [
    { id:"tel_5gb",  size:"5GB",  capacity:5,  price:25.00,  wholesale:23.00  },
    { id:"tel_10gb", size:"10GB", capacity:10, price:46.00,  wholesale:42.00  },
    { id:"tel_15gb", size:"15GB", capacity:15, price:64.00,  wholesale:58.50  },
    { id:"tel_20gb", size:"20GB", capacity:20, price:85.00,  wholesale:76.93  },
    { id:"tel_25gb", size:"25GB", capacity:25, price:105.00, wholesale:95.00  },
    { id:"tel_30gb", size:"30GB", capacity:30, price:123.00, wholesale:112.00 },
    { id:"tel_40gb", size:"40GB", capacity:40, price:163.00, wholesale:147.98 },
    { id:"tel_50gb", size:"50GB", capacity:50, price:197.00, wholesale:179.00 },
  ],
  airteltigo: [
    { id:"at_1gb",  size:"1GB",  capacity:1,  price:4.90,  wholesale:4.40  },
    { id:"at_2gb",  size:"2GB",  capacity:2,  price:9.40,  wholesale:8.56  },
    { id:"at_3gb",  size:"3GB",  capacity:3,  price:13.20, wholesale:12.00 },
    { id:"at_4gb",  size:"4GB",  capacity:4,  price:18.00, wholesale:16.50 },
    { id:"at_5gb",  size:"5GB",  capacity:5,  price:22.50, wholesale:20.50 },
    { id:"at_6gb",  size:"6GB",  capacity:6,  price:28.50, wholesale:25.87 },
    { id:"at_8gb",  size:"8GB",  capacity:8,  price:37.00, wholesale:33.59 },
    { id:"at_10gb", size:"10GB", capacity:10, price:47.00, wholesale:42.56 },
    { id:"at_15gb", size:"15GB", capacity:15, price:74.00, wholesale:67.20 },
  ],
};

// ─── SPENDLESS API ────────────────────────────────────
const spendless = axios.create({
  baseURL: "https://spendless.top/api",
  headers: {
    "X-API-Key": process.env.SPENDLESS_API_KEY,
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

const sendBundle = async ({ network, recipient, capacity, orderId }) => {
  try {
    const networkKey = NETWORK_KEYS[network.toLowerCase()] || network.toUpperCase();
    const webhookUrl = `${process.env.BACKEND_URL}/api/spendless/webhook`;

    const res = await spendless.post("/purchase", {
      networkKey,
      recipient,
      capacity: Number(capacity),
      webhook_url: webhookUrl,
    });

    if (res.data && (res.status === 200 || res.status === 201)) {
      return {
        success:       true,
        reference:     res.data.reference || res.data.data?.reference,
        transactionId: res.data.reference || res.data.data?.reference,
        message:       "Bundle order placed successfully",
      };
    }
    return { success: false, message: res.data?.message || "Bundle delivery failed" };
  } catch (err) {
    console.error("❌ Spendless Error:", err.response?.data || err.message);
    return { success: false, message: err.response?.data?.message || "Bundle delivery error. Contact support." };
  }
};

const checkBundleStatus = async (reference) => {
  try {
    const res = await spendless.get(`/orders?reference=${reference}`);
    return res.data;
  } catch (err) {
    console.error("❌ Bundle Status Error:", err.message);
    return null;
  }
};

const checkWalletBalance = async () => {
  try {
    const res = await spendless.get("/balance");
    return res.data;
  } catch (err) {
    console.error("❌ Balance Error:", err.message);
    return null;
  }
};

// ─── ARKESEL SMS ──────────────────────────────────────
const sendSMS = async (to, message) => {
  try {
    let phone = to.replace(/[\s\-\(\)]/g, "");
    if (phone.startsWith("0"))    phone = "233" + phone.slice(1);
    if (phone.startsWith("+233")) phone = phone.slice(1);
    if (!phone.startsWith("233")) phone = "233" + phone;

    const res = await axios.post("https://sms.arkesel.com/sms/api", null, {
      params: {
        action:  "send-sms",
        api_key: process.env.ARKESEL_API_KEY,
        to:      phone,
        from:    process.env.SMS_SENDER_NAME || "UniMarket",
        sms:     message,
      },
    });
    console.log(`✅ SMS sent to ${phone}`);
    return { success: true };
  } catch (err) {
    console.error("❌ SMS Error:", err.message);
    return { success: false };
  }
};

// ─── PAYSTACK ─────────────────────────────────────────
const paystackAxios = axios.create({
  baseURL: "https://api.paystack.co",
  headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" },
});

const initializePayment = async ({ email, amount, reference, metadata, callback_url }) => {
  const res = await paystackAxios.post("/transaction/initialize", {
    email, amount: Math.round(amount * 100), reference, metadata, callback_url,
    currency: "GHS", channels: ["mobile_money", "card"],
  });
  return res.data;
};

const verifyPayment = async (reference) => {
  const res = await paystackAxios.get(`/transaction/verify/${reference}`);
  return res.data;
};

const verifyPaystackWebhook = (rawBody, sig) => {
  const hash = crypto.createHmac("sha512", process.env.PAYSTACK_WEBHOOK_SECRET || "").update(rawBody).digest("hex");
  return hash === sig;
};

// ════════════════════════════════════════════════════════
// ── ROUTES ──────────────────────────────────────────────
// ════════════════════════════════════════════════════════

// ─── HEALTH ───────────────────────────────────────────
app.get("/",       (req, res) => res.json({ success: true, message: "UniMarket API 🚀", version: "1.0.0" }));
app.get("/health", (req, res) => res.json({ status: "ok", uptime: process.uptime() }));

// ─── WALLET BALANCE (ADMIN) ───────────────────────────
app.get("/api/admin/balance", async (req, res) => {
  if (req.headers["x-admin-key"] !== process.env.ADMIN_SECRET_KEY) return res.status(401).json({ success: false, message: "Unauthorized" });
  const balance = await checkWalletBalance();
  res.json({ success: true, data: balance });
});

// ─── BUNDLES ──────────────────────────────────────────
app.get("/api/bundles",          (req, res) => res.json({ success: true, data: BUNDLES }));
app.get("/api/bundles/:network", (req, res) => {
  const bundles = BUNDLES[req.params.network.toLowerCase()];
  if (!bundles) return res.status(404).json({ success: false, message: "Network not found." });
  res.json({ success: true, data: bundles });
});

// ─── INITIALIZE PAYMENT ───────────────────────────────
app.post("/api/payments/initialize", async (req, res) => {
  try {
    const { bundle_id, network, recipient_phone, payment_phone, is_wholesale, customer_name, bundle_size, capacity, price } = req.body;

    if (!bundle_id || !network || !recipient_phone || !payment_phone) {
      return res.status(400).json({ success: false, message: "bundle_id, network, recipient_phone and payment_phone are required." });
    }

    const reference    = `UNI-${uuidv4().split("-")[0].toUpperCase()}-${Date.now()}`;
    const email        = `${payment_phone.replace(/\s/g, "")}@unimarket.auto`;

    const { data: order, error } = await supabase.from("orders").insert({
      reference, bundle_id, bundle_size, network,
      phone: payment_phone, delivery_phone: recipient_phone,
      customer_name: customer_name || null, customer_email: email,
      amount: price, is_wholesale: is_wholesale || false,
      status: "pending",
      bundle_code: String(capacity),
    }).select().single();

    if (error) { console.error("❌ Order Error:", error); return res.status(500).json({ success: false, message: "Failed to create order." }); }

    const paystackData = await initializePayment({
      email, amount: price, reference,
      callback_url: `${process.env.BACKEND_URL}/api/payments/verify/${reference}`,
      metadata: { order_id: order.id, bundle_size, network, recipient_phone, customer_name: customer_name || "" },
    });

    res.json({ success: true, authorization_url: paystackData.data.authorization_url, reference, order_id: order.id });
  } catch (err) {
    console.error("❌ Initialize Error:", err.message);
    res.status(500).json({ success: false, message: "Payment initialization failed." });
  }
});

// ─── VERIFY PAYMENT + SEND BUNDLE ─────────────────────
app.get("/api/payments/verify/:reference", async (req, res) => {
  try {
    const { reference } = req.params;
    const paystackData  = await verifyPayment(reference);

    if (paystackData.data.status !== "success") {
      return res.status(400).json({ success: false, message: "Payment not successful." });
    }

    const { data: order } = await supabase.from("orders").select("*").eq("reference", reference).single();
    if (!order) return res.status(404).json({ success: false, message: "Order not found." });
    if (order.status === "delivered") return res.json({ success: true, message: "Bundle already delivered." });

    await supabase.from("orders").update({ status: "paid" }).eq("id", order.id);

    // Send bundle via Spendless
    const delivery = await sendBundle({
      network:   order.network,
      recipient: order.delivery_phone,
      capacity:  Number(order.bundle_code),
      orderId:   order.id,
    });

    const finalStatus = delivery.success ? "processing" : "delivery_failed";
    await supabase.from("orders").update({
      status:        finalStatus,
      bundle_txn_id: delivery.transactionId || null,
    }).eq("id", order.id);

    if (delivery.success) {
      await sendSMS(order.phone,
        `UniMarket: Your ${order.bundle_size} bundle order has been placed for ${order.delivery_phone}. Ref: ${reference}. You'll get a confirmation SMS once delivered. 🎉`
      );
    } else {
      await sendSMS(order.phone,
        `UniMarket: Payment received but bundle delivery failed. Our team is on it. Ref: ${reference}. WhatsApp: https://chat.whatsapp.com/Ih8ivypyeZ2FZa8hGjWAJs`
      );
    }

    res.json({
      success: delivery.success,
      message: delivery.success
        ? "Payment confirmed! Bundle is being delivered to your number."
        : "Payment received but delivery failed. Support has been notified.",
      reference,
    });
  } catch (err) {
    console.error("❌ Verify Error:", err.message);
    res.status(500).json({ success: false, message: "Verification failed." });
  }
});

// ─── PAYSTACK WEBHOOK ─────────────────────────────────
app.post("/api/payments/webhook", async (req, res) => {
  try {
    if (!verifyPaystackWebhook(req.body, req.headers["x-paystack-signature"])) return res.status(401).send("Invalid signature");
    const event = JSON.parse(req.body.toString());

    if (event.event === "charge.success") {
      const { data: order } = await supabase.from("orders").select("*").eq("reference", event.data.reference).single();
      if (order && order.status === "pending") {
        await supabase.from("orders").update({ status: "paid" }).eq("id", order.id);
        const delivery = await sendBundle({
          network:   order.network,
          recipient: order.delivery_phone,
          capacity:  Number(order.bundle_code),
          orderId:   order.id,
        });
        if (delivery.success) {
          await supabase.from("orders").update({ status: "processing", bundle_txn_id: delivery.transactionId }).eq("id", order.id);
          await sendSMS(order.phone, `UniMarket: Payment confirmed! Your ${order.bundle_size} bundle is being delivered to ${order.delivery_phone}. 🎉`);
        }
      }
    }
    res.sendStatus(200);
  } catch (err) { console.error("❌ Paystack Webhook Error:", err.message); res.sendStatus(500); }
});

// ─── SPENDLESS WEBHOOK ────────────────────────────────
app.post("/api/spendless/webhook", async (req, res) => {
  try {
    const payload = JSON.parse(req.body.toString());
    console.log("📦 Spendless Webhook:", JSON.stringify(payload));

    const { event, data } = payload;

    if (!data?.reference) return res.sendStatus(200);

    const { data: order } = await supabase.from("orders")
      .select("*").eq("bundle_txn_id", data.reference).single();

    if (!order) return res.sendStatus(200);

    if (event === "order.delivered" || data.status === "delivered") {
      await supabase.from("orders").update({
        status:       "delivered",
        delivered_at: new Date().toISOString(),
      }).eq("id", order.id);

      await sendSMS(order.phone,
        `UniMarket: ✅ Your ${order.bundle_size} bundle has been successfully delivered to ${order.delivery_phone}! Thank you for choosing UniMarket. 🎉`
      );
      console.log(`✅ Bundle delivered for order ${order.id}`);

    } else if (event === "order.failed" || data.status === "failed") {
      await supabase.from("orders").update({ status: "delivery_failed" }).eq("id", order.id);
      await sendSMS(order.phone,
        `UniMarket: ❌ Bundle delivery failed for ${order.delivery_phone}. Our team will resolve this immediately. Ref: ${order.reference}. WhatsApp: https://chat.whatsapp.com/Ih8ivypyeZ2FZa8hGjWAJs`
      );
      console.log(`❌ Bundle failed for order ${order.id}`);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Spendless Webhook Error:", err.message);
    res.sendStatus(500);
  }
});

// ─── ORDER TRACKING ───────────────────────────────────
app.get("/api/track/:reference", async (req, res) => {
  try {
    const { data: order, error } = await supabase
      .from("orders")
      .select("id, reference, bundle_size, network, delivery_phone, amount, status, created_at, delivered_at")
      .eq("reference", req.params.reference)
      .single();

    if (error || !order) return res.status(404).json({ success: false, message: "Order not found. Check your reference number." });

    const statusMessages = {
      pending:         "⏳ Awaiting payment",
      paid:            "💳 Payment confirmed",
      processing:      "⚡ Delivering your bundle...",
      delivered:       "✅ Bundle delivered successfully!",
      delivery_failed: "❌ Delivery failed — support notified",
      refunded:        "💰 Order refunded",
    };

    res.json({
      success: true,
      data: { ...order, status_message: statusMessages[order.status] || order.status },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to track order." });
  }
});

// ─── TRACK BY PHONE ───────────────────────────────────
app.get("/api/track/phone/:phone", async (req, res) => {
  try {
    const { data: orders } = await supabase
      .from("orders")
      .select("id, reference, bundle_size, network, delivery_phone, amount, status, created_at, delivered_at")
      .eq("phone", decodeURIComponent(req.params.phone))
      .order("created_at", { ascending: false })
      .limit(10);

    res.json({ success: true, data: orders || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch orders." });
  }
});

// ─── WHOLESALE REGISTRATION ───────────────────────────
app.post("/api/wholesale/register", async (req, res) => {
  try {
    const { name, phone, email, primary_network } = req.body;
    if (!name || !phone) return res.status(400).json({ success: false, message: "Name and phone are required." });

    const { data: existing } = await supabase.from("resellers").select("id, status").eq("phone", phone).single();
    if (existing) {
      if (existing.status === "approved") return res.status(400).json({ success: false, message: "This number is already a verified reseller." });
      if (existing.status === "pending")  return res.status(400).json({ success: false, message: "Your application is still under review." });
    }

    const reference     = `WS-${uuidv4().split("-")[0].toUpperCase()}-${Date.now()}`;
    const resolvedEmail = email || `${phone.replace(/\s/g,"")}@unimarket.auto`;

    const { data: reseller, error } = await supabase.from("resellers").insert({
      name, phone, email: resolvedEmail,
      primary_network: primary_network || "all",
      registration_ref: reference, status: "pending_payment",
    }).select().single();

    if (error) return res.status(500).json({ success: false, message: "Failed to save application." });

    const paystackData = await initializePayment({
      email: resolvedEmail, amount: Number(process.env.WHOLESALE_FEE) || 50, reference,
      callback_url: `${process.env.BACKEND_URL}/api/wholesale/verify/${reference}`,
      metadata: { type: "wholesale_registration", reseller_id: reseller.id, name, phone },
    });

    await sendSMS(phone, `Hi ${name}! Your UniMarket reseller registration has been received. Complete payment to activate your wholesale account. Ref: ${reference}`);

    res.json({ success: true, message: "Application received.", authorization_url: paystackData.data.authorization_url, reference });
  } catch (err) {
    console.error("❌ Wholesale Register Error:", err.message);
    res.status(500).json({ success: false, message: "Registration failed." });
  }
});

// ─── VERIFY WHOLESALE PAYMENT ─────────────────────────
app.get("/api/wholesale/verify/:reference", async (req, res) => {
  try {
    const paystackData = await verifyPayment(req.params.reference);
    if (paystackData.data.status !== "success") return res.status(400).json({ success: false, message: "Payment not successful." });

    const { data: reseller } = await supabase.from("resellers")
      .update({ status: "pending", registration_paid_at: new Date().toISOString() })
      .eq("registration_ref", req.params.reference).select().single();

    if (reseller) {
      await sendSMS(reseller.phone, `Hi ${reseller.name}! Payment confirmed. Your UniMarket reseller account is under review. Approval within 24 hours. 🚀`);
    }

    res.json({ success: true, message: "Payment confirmed! Application under review. SMS sent." });
  } catch (err) { res.status(500).json({ success: false, message: "Verification failed." }); }
});

// ─── APPROVE RESELLER (ADMIN) ─────────────────────────
app.post("/api/wholesale/approve/:id", async (req, res) => {
  try {
    if (req.headers["x-admin-key"] !== process.env.ADMIN_SECRET_KEY) return res.status(401).json({ success: false, message: "Unauthorized." });

    const { data: reseller } = await supabase.from("resellers")
      .update({ status: "approved", approved_at: new Date().toISOString() })
      .eq("id", req.params.id).select().single();

    if (!reseller) return res.status(404).json({ success: false, message: "Reseller not found." });

    await sendSMS(reseller.phone, `🎉 Congratulations ${reseller.name}! Your UniMarket reseller account is now APPROVED. You have access to wholesale prices. Welcome aboard!`);
    res.json({ success: true, message: `${reseller.name} approved.`, reseller });
  } catch (err) { res.status(500).json({ success: false, message: "Approval failed." }); }
});

// ─── RESELLER STATUS ──────────────────────────────────
app.get("/api/wholesale/status/:phone", async (req, res) => {
  try {
    const { data: reseller } = await supabase.from("resellers")
      .select("name, phone, status, primary_network, approved_at")
      .eq("phone", decodeURIComponent(req.params.phone)).single();
    res.json({ success: true, data: reseller || { status: "not_registered" } });
  } catch (err) { res.status(500).json({ success: false, message: "Failed to check status." }); }
});

// ─── AFA REGISTRATION ─────────────────────────────────
app.post("/api/afa/register", async (req, res) => {
  try {
    const { name, phone, gh_card, occupation, email, residence, dob } = req.body;
    if (!name || !phone || !gh_card) return res.status(400).json({ success: false, message: "Name, phone and Ghana Card are required." });

    const reference     = `AFA-${uuidv4().split("-")[0].toUpperCase()}-${Date.now()}`;
    const resolvedEmail = email || `${phone.replace(/\s/g,"")}@unimarket.auto`;

    const paystackData = await initializePayment({
      email: resolvedEmail, amount: 18.86, reference,
      callback_url: `${process.env.BACKEND_URL}/api/afa/verify/${reference}`,
      metadata: { type: "afa_registration", name, phone, gh_card, occupation, residence, dob },
    });

    await sendSMS(phone, `Hi ${name}! Your UniMarket AFA Bundle registration has been received. Complete payment (GH₵18.86) to activate. Ref: ${reference}`);
    res.json({ success: true, authorization_url: paystackData.data.authorization_url, reference });
  } catch (err) {
    console.error("❌ AFA Register Error:", err.message);
    res.status(500).json({ success: false, message: "AFA registration failed." });
  }
});

// ─── VERIFY AFA PAYMENT ───────────────────────────────
app.get("/api/afa/verify/:reference", async (req, res) => {
  try {
    const paystackData = await verifyPayment(req.params.reference);
    if (paystackData.data.status !== "success") return res.status(400).json({ success: false, message: "Payment not successful." });

    const { name, phone, gh_card, occupation, residence, dob } = paystackData.data.metadata;

    // Register AFA via Spendless API
    const afaRes = await spendless.post("/afa", {
      name, phone, gh_card, occupation, residence, dob,
      webhook_url: `${process.env.BACKEND_URL}/api/spendless/webhook`,
    });

    await sendSMS(phone, `✅ Hi ${name}! Your AFA Bundle registration payment is confirmed. Your account is being activated. 🎉`);
    res.json({ success: true, message: "AFA registration confirmed!", data: afaRes.data });
  } catch (err) {
    console.error("❌ AFA Verify Error:", err.message);
    res.status(500).json({ success: false, message: "AFA verification failed." });
  }
});

// ─── 404 & ERROR ──────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: "Route not found." }));
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.message);
  res.status(500).json({ success: false, message: "Internal server error." });
});

app.listen(PORT, () => {
  console.log(`✅ UniMarket API running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
});
