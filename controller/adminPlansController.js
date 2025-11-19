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

// ---------------------- Get Plan By ID ----------------------
export const getPlanById = async (req, res) => {
    try {
        const { id } = req.params;

        const q = `SELECT * FROM plans WHERE id = $1;`;
        const { rows } = await pool.query(q, [id]);

        if (rows.length === 0)
            return res.status(404).json({ message: "Plan not found" });

        res.json(rows[0]);
    } catch (err) {
        console.error("Error fetching plan:", err);
        res.status(500).json({ error: "Database error" });
    }
};

// ---------------------- Create Plan ----------------------
export const createPlan = async (req, res) => {
    try {
        const {
            name,
            price,
            duration,
            video_call_limit,
            people_search_limit,
            people_message_limit,
            audio_call_limit,
            people_details_visibility,
            type,
        } = req.body;

        const q = `
      INSERT INTO plans 
      (name, price, duration, video_call_limit, people_search_limit, people_message_limit, audio_call_limit, people_details_visibility,type)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING id;
    `;

        const { rows } = await pool.query(q, [
            name,
            price,
            duration,
            video_call_limit,
            people_search_limit,
            people_message_limit,
            audio_call_limit,
            people_details_visibility,
            type,
        ]);

        res.status(201).json({
            message: "Plan created successfully",
            plan_id: rows[0].id,
        });
    } catch (err) {
        console.error("Error creating plan:", err);
        res.status(500).json({ error: "Database error" });
    }
};

// ---------------------- Update Plan ----------------------
export const updatePlan = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            name,
            price,
            duration,
            video_call_limit,
            people_search_limit,
            people_message_limit,
            audio_call_limit,
            people_details_visibility,
            type,
        } = req.body;

        const q = `
      UPDATE plans
      SET name=$1, price=$2, duration=$3, video_call_limit=$4,
          people_search_limit=$5, people_message_limit=$6,
          audio_call_limit=$7, people_details_visibility=$8, type=$9
      WHERE id=$10;
    `;

        await pool.query(q, [
            name,
            price,
            duration,
            video_call_limit,
            people_search_limit,
            people_message_limit,
            audio_call_limit,
            people_details_visibility,
            type,
            id,
        ]);

        res.json({ message: "Plan updated successfully" });
    } catch (err) {
        console.error("Error updating plan:", err);
        res.status(500).json({ error: "Database error" });
    }
};

// ---------------------- Delete Plan ----------------------
export const deletePlan = async (req, res) => {
    try {
        const { id } = req.params;

        const q = `DELETE FROM plans WHERE id = $1;`;
        await pool.query(q, [id]);

        res.json({ message: "Plan deleted successfully" });
    } catch (err) {
        console.error("Error deleting plan:", err);
        res.status(500).json({ error: "Database error" });
    }
};
