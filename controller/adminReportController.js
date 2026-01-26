import { pool } from "../config/db.js";

export const getUsersByType = async (req, res) => {
  try {
    const { type = "all" } = req.query;

    let filter = "";
    if (type === "approved") filter = "AND u.status = 'Approve'";
    if (type === "hold") filter = "AND u.status = 'On Hold'";
    if (type === "process") filter = "AND u.status = 'In Process'";
    if (type === "deactivated") filter = "AND u.status = 'Deactivate'";
    const query = `
      SELECT
        u.id,
        COALESCE(p.first_name, 'N/A') AS name,
        COALESCE(p.last_name, 'N/A') AS Lname,
        u.email,
        p.age,
        p.profession,
        u.status,
        u.created_at
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      WHERE 1=1 ${filter}
      ORDER BY u.id DESC
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
