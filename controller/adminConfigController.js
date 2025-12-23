import { pool } from "../config/db.js";

// 🔹 Update member approval setting
export const updateMemberApproval = async (req, res) => {
  // Implementation for updating member approval settings
  try {
    
    const { member_approval } = req.body;

    if (member_approval !== 0 && member_approval !== 1) {
      return res.status(400).json({ message: "Invalid value" });
    }

    await pool.query(
      `
      UPDATE configurations
      SET member_approval = $1
      WHERE id = 1
      `,
      [member_approval]
    );

    res.json({
      success: true,
      message: "Setting updated successfully",
      member_approval,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// 🔹 Get member approval setting
export const getMemberApproval = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT member_approval FROM configurations WHERE id = 1"
    );

    res.json({
      member_approval: Number(result.rows[0]?.member_approval ?? 0),
    });
  } catch (error) {
    console.error("Get setting error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

