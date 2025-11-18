import { pool } from "../config/db.js";

// ---------------------- Get Cart Items By User ----------------------
export const getCartItems = async (req, res) => {
    try {
        const { user_id } = req.params;

        const q = `
            SELECT c.id, c.plan_id, p.name, p.price, p.duration, p.type
            FROM cart c
            JOIN plans p ON c.plan_id = p.id
            WHERE c.user_id = $1
            ORDER BY c.id ASC;
        `;

        const { rows } = await pool.query(q, [user_id]);
        res.json(rows);
    } catch (err) {
        console.error("Error fetching cart items:", err);
        res.status(500).json({ error: "Database error" });
    }
};

// ---------------------- Add Item to Cart ----------------------
export const addToCart = async (req, res) => {
    try {
        const { plan_id, user_id = 1 } = req.body;

        if (!plan_id || !user_id) {
            return res.status(400).json({ message: "Missing plan_id or user_id" });
        }

        // ✅ check if plan exists in cart
        const checkQuery = "SELECT * FROM cart WHERE plan_id = $1 AND user_id = $2";
        const checkResult = await pool.query(checkQuery, [plan_id, user_id]);

        if (checkResult.rows.length > 0) {
            return res.status(400).json({ message: "Plan already in cart!" });
        }

        const insertQuery = `
            INSERT INTO cart (plan_id, user_id, created_at)
            VALUES ($1, $2, NOW())
            RETURNING id;
        `;
        const result = await pool.query(insertQuery, [plan_id, user_id]);

        res.json({ message: "Plan added to cart!", cart_id: result.rows[0].id });
    } catch (err) {
        console.error("Error adding to cart:", err);
        res.status(500).json({ error: "Database error" });
    }
};

// --------------------  Delete Item from Cart  ------------------- 
export const deleteCartItem = async (req, res) => { 
    try {
        const { id } = req.params;
        const user_id = req.user?.id || 1; // ⚡ logged-in user ka ID (abhi ke liye static 1)

        // 🧠 First check if item belongs to the logged-in user
        const checkQuery = `SELECT * FROM cart WHERE id = $1 AND user_id = $2;`;
        const { rows } = await pool.query(checkQuery, [id, user_id]);

        if (rows.length === 0) {
            return res.status(403).json({ message: "You are not authorized to delete this item!" });
        }

        // ✅ Delete item only if it belongs to the same user
        const q = `DELETE FROM cart WHERE id = $1 AND user_id = $2;`;
        await pool.query(q, [id, user_id]);

        res.json({ message: "Item removed from your cart successfully!" });
    } catch (err) {
        console.error("Error deleting cart item:", err);
        res.status(500).json({ error: "Database error" });
    }
};