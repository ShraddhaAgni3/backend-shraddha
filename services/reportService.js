import { pool } from "../config/db.js";

export const fetchAdminReport = async (
  fromDate,
  toDate,
  groupBy = "month" // 👈 default monthly
) => {
  // ------------------ SUMMARY QUERIES ------------------

  // ✅ USERS REPORT (ENUM SAFE)
  const usersQuery = `
    SELECT 
      COUNT(*) AS total_users,
      COUNT(*) FILTER (WHERE status::text = 'Approve')    AS approved_users,
      COUNT(*) FILTER (WHERE status::text = 'On Hold')    AS hold_users,
      COUNT(*) FILTER (WHERE status::text = 'Deactivate') AS deactivated_users
    FROM users
    WHERE created_at BETWEEN $1 AND $2
  `;

  // ✅ SUBSCRIPTIONS REPORT
  const subscriptionsQuery = `
    SELECT 
      COUNT(*) AS total_subscriptions,
      COUNT(*) FILTER (WHERE status::text = 'Approve') AS active_subscriptions
    FROM subscriptions
    WHERE created_at BETWEEN $1 AND $2
  `;


   // ✨ NEW QUERY: Plan Purchase History by Date
  const planSeriesQuery = `
    SELECT
      (DATE_TRUNC($3, created_at)::date)::text AS period,
      plan_name,
      COUNT(*) AS count
    FROM subscriptions
    WHERE created_at BETWEEN $1 AND $2
    GROUP BY DATE_TRUNC($3, created_at), plan_name
    ORDER BY DATE_TRUNC($3, created_at)
  `;

  // ✅ MESSAGES REPORT
  const messagesQuery = `
    SELECT 
      COUNT(*) AS total_messages
    FROM messages
    WHERE created_at BETWEEN $1 AND $2
  `;

  // ✅ USAGE REPORT
  const usageQuery = `
    SELECT 
      COALESCE(SUM(video_call_used), 0)     AS video_calls,
      COALESCE(SUM(audio_call_used), 0)     AS audio_calls,
      COALESCE(SUM(people_message_used), 0) AS messages_used
    FROM user_plans
    WHERE created_at BETWEEN $1 AND $2
  `;

  // ------------------ TIME SERIES QUERIES ------------------

  // ✅ USERS TIME SERIES (MONTHLY / WEEKLY)
const usersTimeSeriesQuery = `
    SELECT
      (DATE_TRUNC($3, created_at)::date)::text AS period,
      COUNT(*) AS total_users
    FROM users
    WHERE created_at BETWEEN $1 AND $2
    GROUP BY DATE_TRUNC($3, created_at)
    ORDER BY DATE_TRUNC($3, created_at)
  `;

  // ✅ MESSAGES TIME SERIES (MONTHLY / WEEKLY)
   const messagesTimeSeriesQuery = `
    SELECT
      (DATE_TRUNC($3, created_at)::date)::text AS period,
      COUNT(*) AS total_messages
    FROM messages
    WHERE created_at BETWEEN $1 AND $2
    GROUP BY DATE_TRUNC($3, created_at)
    ORDER BY DATE_TRUNC($3, created_at)
  `;

  // ------------------ EXECUTION ------------------

  const [
    usersResult,
    subscriptionsResult,
    messagesResult,
    usageResult,
    usersSeriesResult,
    messagesSeriesResult,
    planSeriesResult
  ] = await Promise.all([
    pool.query(usersQuery, [fromDate, toDate]),
    pool.query(subscriptionsQuery, [fromDate, toDate]),
    pool.query(messagesQuery, [fromDate, toDate]),
    pool.query(usageQuery, [fromDate, toDate]),
    pool.query(usersTimeSeriesQuery, [fromDate, toDate, groupBy]),
    pool.query(messagesTimeSeriesQuery, [fromDate, toDate, groupBy]),
    pool.query(planSeriesQuery, [fromDate, toDate, groupBy])
  ]);

  // ------------------ FINAL RESPONSE ------------------

  return {
    summary: {
      users: usersResult.rows[0],
      subscriptions: subscriptionsResult.rows[0],
      messages: messagesResult.rows[0],
      usage: usageResult.rows[0]
    },
    timeline: {
      users: usersSeriesResult.rows,
      messages: messagesSeriesResult.rows,
      plans: planSeriesResult.rows
    }
  };
};
