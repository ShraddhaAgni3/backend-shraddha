import { pool } from "../config/db.js";

// ---------------------- Get All Plans ----------------------
export const getAllPlans = async (req, res) => {
    try {
        const q = `SELECT * FROM plans ORDER BY id ASC;`;
        const { rows } = await pool.query(q);
        res.json(rows);
    } catch (err) {
        console.error("Error fetching plans:", err);
        res.status(500).json({ error: "Database error" });
    }
};