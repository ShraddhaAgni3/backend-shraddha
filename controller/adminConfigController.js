import { pool } from "../config/db.js";

// 🔹 Update member approval setting
export const updateMemberApproval = async (req, res) => {
  // Implementation for updating member approval settings
  try {
    
    const settingkeys  = req.body;
    const memberkeys = ['member_approval','check_video_call_limit','check_audio_call_limit','check_search_limit','check_message_limit'];
    //console.log("keys",settingkeys);

      
    for (const key in settingkeys) {
      if (!memberkeys.includes(key)) {
        return  res.status(400).json({ message: `Invalid key: ${key}` });
      }
      if (settingkeys[key] !== 0 && settingkeys[key] !== 1) {
        return res.status(400).json({ message: `Invalid value for ${key}` });
      }
    }
  
    await pool.query(
      `
      UPDATE configurations
      SET member_approval = $1,
      check_video_call_limit = $2,
      check_audio_call_limit = $3,
      check_search_limit = $4,
      check_message_limit = $5
      WHERE id = 1
      `,
      [settingkeys.member_approval, settingkeys.check_video_call_limit, settingkeys.check_audio_call_limit, settingkeys.check_search_limit, settingkeys.check_message_limit]
    );

    res.json({
      success: true,
      message: "Setting updated successfully",
      member_approval: settingkeys.member_approval,
      check_video_call_limit: settingkeys.check_video_call_limit,
      check_audio_call_limit: settingkeys.check_audio_call_limit,
      check_search_limit: settingkeys.check_search_limit,
      check_message_limit: settingkeys.check_message_limit,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// export const updateMemberApproval = async (req, res) => {
//   try {
//     const updates = req.body;

//     const allowedKeys = [
//       "member_approval",
//       "check_video_call_limit",
//       "check_audio_call_limit",
//       "check_search_limit",
//       "check_message_limit",
//     ];

//     const fields = [];
//     const values = [];
//     let index = 1;

//     for (const key in updates) {
//       if (!allowedKeys.includes(key)) {
//         return res.status(400).json({ message: `Invalid key: ${key}` });
//       }

//       if (updates[key] !== 0 && updates[key] !== 1) {
//         return res
//           .status(400)
//           .json({ message: `Invalid value for ${key}` });
//       }

//       fields.push(`${key} = $${index}`);
//       values.push(updates[key]);
//       index++;
//     }

//     if (fields.length === 0) {
//       return res.status(400).json({ message: "No valid fields to update" });
//     }

//     const query = `
//       UPDATE configurations
//       SET ${fields.join(", ")}
//       WHERE id = 1
//       RETURNING *
//     `;

//     const result = await pool.query(query, values);

//     res.json({
//       success: true,
//       message: "Setting updated successfully",
//       data: result.rows[0],
//     });
//   } catch (error) {
//     console.error("Update setting error:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };


// 🔹 Get member approval setting
export const getMemberApproval = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM configurations WHERE id = 1"
    );

    const {member_approval, check_video_call_limit, check_audio_call_limit, check_search_limit, check_message_limit } = result.rows[0];

    res.json({
       member_approval,
       check_video_call_limit,
       check_audio_call_limit,
       check_search_limit,
       check_message_limit
    });
  } catch (error) {
    console.error("Get setting error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


