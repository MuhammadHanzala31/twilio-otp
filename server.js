require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID, PORT } = process.env;
const twilio = require("twilio")(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// Health check
app.get("/", (req, res) => {
  res.json({ ok: true, message: "OTP server running" });
});

// 1) Send OTP
app.post("/send-otp", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ ok: false, error: "Phone is required" });

    const verification = await twilio.verify.v2.services(TWILIO_VERIFY_SERVICE_SID)
      .verifications
      .create({ to: phone, channel: "sms" }); // channel: "sms" | "call" | "email"

    res.json({ ok: true, status: verification.status }); // pending
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 2) Verify OTP
app.post("/verify-otp", async (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) return res.status(400).json({ ok: false, error: "Phone & code required" });

    const check = await twilio.verify.v2.services(TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks
      .create({ to: phone, code });

    // status can be: approved | pending | canceled
    const success = check.status === "approved";
    res.json({ ok: success, status: check.status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(PORT || 4000, () => {
  console.log(`Server on http://localhost:${PORT || 4000}`);
});
