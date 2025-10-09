import { pool } from "../config/db.js";

export async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email and password
    const query = `
      SELECT id, email, created_at
      FROM users_users
      WHERE email = $1 AND password_hash = $2
    `;
    const values = [email, password];
    //console.log(email + " : "+password);
    const {rows} = await pool.query(query, values);

     if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = rows[0];

    return res.status(200).json({
      message: 'Login successful',
      user,
    });
  } catch (err) {
    console.log('❌ loginUser error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}