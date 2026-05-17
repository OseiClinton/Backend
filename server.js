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
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

const limiter      = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
const orderLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 });
app.use("/api", limiter);
app.use("/api/orders", orderLimiter);

// ─── BUNDLE CATALOG ───────────────────────────────────
const BUNDLES = {
  mtn: [
    { id:"mtn_1gb",   network:"mtn", size:"1GB",   price:5.00,   wholesale:4.50,   code:"MTN_1GB"   },
    { id:"mtn_2gb",   network:"mtn", size:"2GB",   price:9.50,   wholesale:8.60,   code:"MTN_2GB"   },
    { id:"mtn_3gb",   network:"mtn", size:"3GB",   price:14.50,  wholesale:13.20,  code:"MTN_3GB"   },
    { id:"mtn_4gb",   network:"mtn", size:"4GB",   price:20.00,  wholesale:18.00,  code:"MTN_4GB"   },
    { id:"mtn_5gb",   network:"mtn", size:"5GB",   price:24.50,  wholesale:22.10,  code:"MTN_5GB"   },
    { id:"mtn_6gb",   network:"mtn", size:"6GB",   price:29.00,  wholesale:26.40,  code:"MTN_6GB"   },
    { id:"mtn_8gb",   network:"mtn", size:"8GB",   price:39.00,  wholesale:35.50,  code:"MTN_8GB"   },
    { id:"mtn_10gb",  network:"mtn", size:"10GB",  price:47.00,  wholesale:42.60,  code:"MTN_10GB"  },
    { id:"mtn_15gb",  network:"mtn", size:"15GB",  price:69.00,  wholesale:63.00,  code:"MTN_15GB"  },
    { id:"mtn_20gb",  network:"mtn", size:"20GB",  price:89.00,  wholesale:81.20,  code:"MTN_20GB"  },
    { id:"mtn_25gb",  network:"mtn", size:"25GB",  price:111.00, wholesale:100.78, code:"MTN_25GB"  },
    { id:"mtn_30gb",  network:"mtn", size:"30GB",  price:136.00, wholesale:124.00, code:"MTN_30GB"  },
    { id:"mtn_40gb",  network:"mtn", size:"40GB",  price:175.00, wholesale:159.00, code:"MTN_40GB"  },
    { id:"mtn_100gb", network:"mtn", size:"100GB", price:415.00, wholesale:377.30, code:"MTN_100GB" },
  ],
  telecel: [
    { id:"tel_5gb",  network:"telecel", size:"5GB",  price:25.00,  wholesale:23.00,  code:"TEL_5GB"  },
    { id:"tel_10gb", network:"telecel", size:"10GB", price:46.00,  wholesale:42.00,  code:"TEL_10GB" },
    { id:"tel_15gb", network:"telecel", size:"15GB", price:64.00,  wholesale:58.50,  code:"TEL_15GB" },
    { id:"tel_20gb", network:"telecel", size:"20GB", price:85.00,  wholesale:76.93,  code:"TEL_20GB" },
    { id:"tel_25gb", network:"telecel", size:"25GB", price:105.00, wholesale:95.00,  code:"TEL_25GB" },
    { id:"tel_30gb", network:"telecel", size:"30GB", price:123.00, wholesale:112.00, code:"TEL_30GB" },
    { id:"tel_40gb", network:"telecel", size:"40GB", price:163.00, wholesale:147.98, code:"TEL_40GB" },
    { id:"tel_50gb", network:"telecel", size:"50GB", price:197.00, wholesale:179.00, code:"TEL_50GB" },
  ],
  airteltigo: [
    { id:"at_1gb",  network:"airteltigo", size:"1GB",  price:4.90,  wholesale:4.40,  code:"AT_1GB"  },
    { id:"at_2gb",  network:"airteltigo", size:"2GB",  price:9.40,  wholesale:8.56,  code:"AT_2GB"  },
    { id:"at_3gb",  network:"airteltigo", size:"3GB",  price:13.20, wholesale:12.00, code:"AT_3GB"  },
    { id:"at_4gb",  network:"airteltigo", size:"4GB",  price:18.00, wholesale:16.50, code:"AT_4GB"  },
    { id:"at_5gb",  network:"airteltigo", size:"5GB",  price:22.50, wholesale:20.50, code:"AT_5GB"  },
    { id:"at_6gb",  network:"airteltigo", size:"6GB",  price:28.50, wholesale:25.87, code:"AT_6GB"  },
    { id:"at_8gb",  network:"airteltigo", size:"8GB",  price:37.00, wholesale:33.59, code:"AT_8GB"  },
    { id:"at_10gb", network:"airteltigo", size:"10GB", price:47.00, wholesale:42.56, code:"AT_10GB" },
    { id:"at_15gb", network:"airteltigo", size:"15GB", price:74.00, wholesale:67.20, code:"AT_15GB" },
  ],
};

// ─── SMS SERVICE (ARKESEL) ────────────────────────────
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
    console.log(`✅ SMS sent to ${phone}:`, res.data);
    return { success: true };
  } catch (err) {
    console.error("❌ SMS Error:", err.message);
    return { success: false };
  }
};

// ─── BUNDLE DELIVERY SERVICE ──────────────────────────
const sendBundle = async ({ network, phone, bundleCode, orderId }) => {
  try {
    const res = await axios.post(
      `${process.env.BUNDLE_API_BASE_URL}/send-bundle`,
      { network, phone_number: phone, bundle_code: bundleCode, reference: orderId },
      { headers: { Authorization: `Bearer ${process.env.BUNDLE_API_KEY}`, "Content-Type": "application/json" }, timeout: 30000 }
    );
    if (res.data.success || res.data.status === "success") {
      return { success: true, transactionId: res.data.transaction_id || res.data.id };
    }
    return { success: false, message: res.data.message || "Bundle delivery failed" };
  } catch (err) {
    console.error("❌ Bundle API Error:", err.response?.data || err.message);
    return { success: false, message: "Bundle delivery error. Please contact support." };
  }
};

// ─── PAYSTACK SERVICE ─────────────────────────────────
const initializePayment = async ({ email, amount, reference, metadata, callback_url }) => {
  const res = await axios.post(
    "https://api.paystack.co/transaction/initialize",
    { email, amount: Math.round(amount * 100), reference, metadata, callback_url, currency: "GHS", channels: ["mobile_money", "card"] },
    { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" } }
  );
  return res.data;
};

const verifyPayment = async (reference) => {
  const res = await axios.get(
    `https://api.paystack.co/transaction/verify/${reference}`,
    { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
  );
  return res.data;
};

const verifyWebhook = (rawBody, sig) => {
  const hash = crypto.createHmac("sha512", process.env.PAYSTACK_WEBHOOK_SECRET || "").update(rawBody).digest("hex");
  return hash === sig;
};

// ════════════════════════════════════════════════════════
// ROUTES
// ════════════════════════════════════════════════════════

// ─── HEALTH CHECK ─────────────────────────────────────
app.get("/", (req, res) => res.json({ success: true, message: "UniMarket API 🚀", version: "1.0.0" }));
app.get("/health", (req, res) => res.json({ status: "ok", uptime: process.uptime() }));

// ─── BUNDLES ──────────────────────────────────────────
app.get("/api/bundles", (req, res) => res.json({ success: true, data: BUNDLES }));
app.get("/api/bundles/:network", (req, res) => {
  const bundles = BUNDLES[req.params.network.toLowerCase()];
  if (!bundles) return res.status(404).json({ success: false, message: "Network not found." });
  res.json({ success: true, data: bundles });
});

// ─── INITIALIZE PAYMENT ───────────────────────────────
app.post("/api/payments/initialize", async (req, res) => {
  try {
    const { bundle_id, network, recipient_phone, payment_phone, is_wholesale, customer_name, bundle_size, bundle_code, price } = req.body;

    if (!bundle_id || !network || !recipient_phone || !payment_phone) {
      return res.status(400).json({ success: false, message: "bundle_id, network, recipient_phone and payment_phone are required." });
    }

    const reference = `UNI-${uuidv4().split("-")[0].toUpperCase()}-${Date.now()}`;
    const email     = `${payment_phone.replace(/\s/g, "")}@unimarket.auto`;

    const { data: order, error } = await supabase.from("orders").insert({
      reference, bundle_id, bundle_size, bundle_code, network,
      phone: payment_phone, delivery_phone: recipient_phone,
      customer_name: customer_name || null, customer_email: email,
      amount: price, is_wholesale: is_wholesale || false, status: "pending",
    }).select().single();

    if (error) { console.error("❌ Order Error:", error); return res.status(500).json({ success: false, message: "Failed to create order." }); }

    const paystackData = await initializePayment({
      email, amount: price, reference,
      callback_url: `${process.env.FRONTEND_URL}/payment/verify?ref=${reference}`,
      metadata: { order_id: order.id, bundle_size, network, recipient_phone, customer_name: customer_name || "" },
    });

    res.json({ success: true, authorization_url: paystackData.data.authorization_url, reference, order_id: order.id });
  } catch (err) {
    console.error("❌ Initialize Error:", err.message);
    res.status(500).json({ success: false, message: "Payment initialization failed." });
  }
});

// ─── VERIFY PAYMENT + DELIVER BUNDLE ──────────────────
app.get("/api/payments/verify/:reference", async (req, res) => {
  try {
    const { reference } = req.params;
    const paystackData = await verifyPayment(reference);
    if (paystackData.data.status !== "success") return res.status(400).json({ success: false, message: "Payment not successful." });

    const { data: order } = await supabase.from("orders").select("*").eq("reference", reference).single();
    if (!order) return res.status(404).json({ success: false, message: "Order not found." });
    if (order.status === "delivered") return res.json({ success: true, message: "Bundle already delivered.", order });

    await supabase.from("orders").update({ status: "paid" }).eq("id", order.id);

    const delivery = await sendBundle({ network: order.network, phone: order.delivery_phone, bundleCode: order.bundle_code, orderId: order.id });
    const finalStatus = delivery.success ? "delivered" : "delivery_failed";

    await supabase.from("orders").update({
      status: finalStatus,
      delivered_at: delivery.success ? new Date().toISOString() : null,
      bundle_txn_id: delivery.transactionId || null,
    }).eq("id", order.id);

    if (delivery.success) {
      await sendSMS(order.phone, `UniMarket: Your ${order.bundle_size} bundle has been delivered to ${order.delivery_phone}. Ref: ${reference}. Thank you! 🎉`);
    } else {
      await sendSMS(order.phone, `UniMarket: Payment received but bundle delivery failed. Our team is on it. Ref: ${reference}. WhatsApp: https://chat.whatsapp.com/Ih8ivypyeZ2FZa8hGjWAJs`);
    }

    res.json({ success: delivery.success, message: delivery.success ? "Bundle delivered!" : "Payment received but delivery failed. Support notified.", reference });
  } catch (err) {
    console.error("❌ Verify Error:", err.message);
    res.status(500).json({ success: false, message: "Verification failed." });
  }
});

// ─── PAYSTACK WEBHOOK ─────────────────────────────────
app.post("/api/payments/webhook", async (req, res) => {
  try {
    if (!verifyWebhook(req.body, req.headers["x-paystack-signature"])) return res.status(401).send("Invalid signature");
    const event = JSON.parse(req.body.toString());
    if (event.event === "charge.success") {
      const { data: order } = await supabase.from("orders").select("*").eq("reference", event.data.reference).single();
      if (order && order.status === "paid") {
        const delivery = await sendBundle({ network: order.network, phone: order.delivery_phone, bundleCode: order.bundle_code, orderId: order.id });
        if (delivery.success) {
          await supabase.from("orders").update({ status: "delivered", delivered_at: new Date().toISOString(), bundle_txn_id: delivery.transactionId }).eq("id", order.id);
          await sendSMS(order.phone, `UniMarket: Your ${order.bundle_size} bundle has been delivered to ${order.delivery_phone}. Thank you! 🎉`);
        }
      }
    }
    res.sendStatus(200);
  } catch (err) { console.error("❌ Webhook Error:", err.message); res.sendStatus(500); }
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
      pending:          "⏳ Order placed — awaiting payment",
      paid:             "💳 Payment confirmed — delivering bundle",
      delivered:        "✅ Bundle delivered successfully",
      delivery_failed:  "❌ Delivery failed — support has been notified",
      refunded:         "💰 Order refunded",
    };

    res.json({
      success: true,
      data: {
        ...order,
        status_message: statusMessages[order.status] || order.status,
      },
    });
  } catch (err) {
    console.error("❌ Track Error:", err.message);
    res.status(500).json({ success: false, message: "Failed to track order." });
  }
});

// ─── TRACK BY PHONE ───────────────────────────────────
app.get("/api/track/phone/:phone", async (req, res) => {
  try {
    const phone = decodeURIComponent(req.params.phone);
    const { data: orders } = await supabase
      .from("orders")
      .select("id, reference, bundle_size, network, amount, status, created_at, delivered_at")
      .eq("phone", phone)
      .order("created_at", { ascending: false })
      .limit(10);

    res.json({ success: true, data: orders || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch orders." });
  }
});

// ─── ORDERS ───────────────────────────────────────────
app.get("/api/orders/:reference", async (req, res) => {
  try {
    const { data: order, error } = await supabase.from("orders").select("*").eq("reference", req.params.reference).single();
    if (error || !order) return res.status(404).json({ success: false, message: "Order not found." });
    res.json({ success: true, data: order });
  } catch (err) { res.status(500).json({ success: false, message: "Failed to fetch order." }); }
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

    const reference    = `WS-${uuidv4().split("-")[0].toUpperCase()}-${Date.now()}`;
    const resolvedEmail = email || `${phone.replace(/\s/g,"")}@unimarket.auto`;

    const { data: reseller, error } = await supabase.from("resellers").insert({
      name, phone, email: resolvedEmail, primary_network: primary_network || "all",
      registration_ref: reference, status: "pending_payment",
    }).select().single();

    if (error) return res.status(500).json({ success: false, message: "Failed to save application." });

    const paystackData = await initializePayment({
      email: resolvedEmail, amount: Number(process.env.WHOLESALE_FEE) || 50, reference,
      callback_url: `${process.env.FRONTEND_URL}/wholesale/verify?ref=${reference}`,
      metadata: { type: "wholesale_registration", reseller_id: reseller.id, name, phone },
    });

    await sendSMS(phone, `Hi ${name}! Your UniMarket reseller application has been received. Complete payment to activate your account. Ref: ${reference}`);

    res.json({ success: true, message: "Application received. Proceed to payment.", authorization_url: paystackData.data.authorization_url, reference });
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

    if (reseller) await sendSMS(reseller.phone, `Hi ${reseller.name}! Payment confirmed. Your UniMarket reseller account is under review. Approval within 24 hours. 🚀`);

    res.json({ success: true, message: "Payment confirmed! Application under review. SMS confirmation sent." });
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
    await sendSMS(reseller.phone, `Congratulations ${reseller.name}! Your UniMarket reseller account has been APPROVED. You now have access to wholesale prices. Welcome! 🎉`);
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

    const reference = `AFA-${uuidv4().split("-")[0].toUpperCase()}-${Date.now()}`;
    const resolvedEmail = email || `${phone.replace(/\s/g,"")}@unimarket.auto`;

    const paystackData = await initializePayment({
      email: resolvedEmail, amount: 18.86, reference,
      callback_url: `${process.env.FRONTEND_URL}/afa/verify?ref=${reference}`,
      metadata: { type: "afa_registration", name, phone, gh_card, occupation, residence, dob },
    });

    await sendSMS(phone, `Hi ${name}! Your UniMarket AFA Bundle registration has been received. Complete payment to activate. Ref: ${reference}`);

    res.json({ success: true, authorization_url: paystackData.data.authorization_url, reference });
  } catch (err) {
    console.error("❌ AFA Register Error:", err.message);
    res.status(500).json({ success: false, message: "AFA registration failed." });
  }
});

// ─── 404 ──────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: "Route not found." }));
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  res.status(500).json({ success: false, message: "Internal server error." });
});

app.listen(PORT, () => {
  console.log(`✅ UniMarket API running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
});
