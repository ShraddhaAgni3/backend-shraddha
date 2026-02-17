import { pool } from '../config/db.js';

//Get specific Users and Profile table:
export const userProfile = async (req, res) => {
    let { userId } = req.params;
    let q = `SELECT u.*, p.*
        FROM users AS u
        INNER JOIN profiles AS p
        ON u.id = p.user_id
        WHERE u.id = $1;
    `;

    let result = await pool.query(q, [userId]);
    let user = result.rows[0];
    if (!user) {
        res.json({ message: "User is not exitings" });
    };
    res.json(user);
};