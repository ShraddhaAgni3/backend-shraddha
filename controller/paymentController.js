import Stripe from "stripe";
import { pool } from "../config/db.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// -------------------- 1) CREATE CHECKOUT SESSION ------------------------
export const createCheckoutSession = async (req, res) => {
  try {
    const { plan, user_id } = req.body;

    if (!plan || !user_id) {
      return res.status(400).json({ message: "Missing plan or user id" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: { name: plan.name },
            unit_amount: plan.price * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      locale: "en",
      success_url: `${process.env.FRONTEND_URL}/#/payment-success`,
      cancel_url: `${process.env.FRONTEND_URL}/#/payment-failed`,
      metadata: {
        user_id,
        plan_id: plan.id,
        plan_name: plan.name,
      },
    });

    // Save pending payment
    await pool.query(
      `INSERT INTO payments (user_id, plan_id, plan_name, amount, currency, stripe_session_id, status)
       VALUES ($1, $2, $3, $4, 'GBP', $5, 'pending')`,
      [user_id, plan.id, plan.name, plan.price, session.id]
    );

    res.json({ url: session.url });
  } catch (error) {
    console.error("Stripe Session Error:", error);
    res.status(500).json({ message: "Stripe session creation failed" });
  }
};

// -------------------- 2) STRIPE WEBHOOK ------------------------
export const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // SUCCESSFUL PAYMENT
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const user_id = session.metadata.user_id;
    const plan_id = session.metadata.plan_id;
    const plan_name = session.metadata.plan_name;

    const amount = session.amount_total / 100;
    const currency = session.currency.toUpperCase();

    try {
      await pool.query(
        `UPDATE payments SET status='success', amount=$1, currency=$2 
         WHERE stripe_session_id=$3`,
        [amount, currency, session.id]
      );

      console.log("✅ Payment marked successful:", session.id);
    } catch (err) {
      console.error("DB Insert Error:", err);
    }
  }

  // FAILED PAYMENT
  if (event.type === "checkout.session.async_payment_failed") {
    const session = event.data.object;

    await pool.query(
      `UPDATE payments SET status='failed' WHERE stripe_session_id=$1`,
      [session.id]
    );
  }

  res.json({ received: true });
};

// -------------------- 3) GET USER PAYMENT HISTORY ------------------------
export const getUserPayments = async (req, res) => {
  const { user_id } = req.params;

  try {
    const result = await pool.query(
      `SELECT id, plan_name, amount, currency, status, created_at
       FROM payments
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [user_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Fetch payment history error:", err);
    res.status(500).json({ message: "Database error" });
  }
};
