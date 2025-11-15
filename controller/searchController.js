// import express from "express";
// import { pool } from "../config/db.js";

// // Search Profiles with advanced filtering
// export const searchProfiles = async (req, res) => {
//   try {
//     const { 
//       first_name, last_name, gender, city, state, skills, hobby, profession, 
//       position, company, company_type, min_age, max_age, radius, lat, lon, 
//       limit = 100, offset = 0 
//     } = req.query;

//     let queryStr = `
//       SELECT pr.*, pr.city, pr.state
//       FROM profiles pr
//       JOIN addresses a ON pr.user_id = a.user_id
//       JOIN pincodes p ON a.pincode = p.pincode

      
//     `;

//     const params = [];
//     let idx = 1;

//     // Text-based filters
//     const textFilters = { 
//       first_name: "pr.first_name", 
//       last_name: "pr.last_name", 
//       gender: "pr.gender", 
//       city: "p.city", 
//       state: "p.state", 
//       profession: "pr.profession", 
//       position: "pr.position", 
//       company: "pr.company", 
//       company_type: "pr.company_type" 
//     };

//     for (const [key, col] of Object.entries(textFilters)) {
//   if (req.query[key]) {
//     if (key === "gender") {
//       params.push(req.query[key]);
//       queryStr += ` AND LOWER(${col}::text) = LOWER($${idx})`; // cast enum to text
//     } else {
//       params.push(`%${req.query[key]}%`);
//       queryStr += ` AND LOWER(${col}) LIKE LOWER($${idx})`;
//     }
//     idx++;
//   }
// }

//     // JSON filters
//     if (skills) {
//       params.push(`%${skills}%`);
//       queryStr += ` AND EXISTS (SELECT 1 FROM json_array_elements_text(pr.skills) s WHERE LOWER(s) LIKE LOWER($${idx}))`;
//       idx++;
//     }

//     if (hobby) {
//       params.push(`%${hobby}%`);
//       queryStr += ` AND EXISTS (SELECT 1 FROM json_array_elements_text(pr.interests) h WHERE LOWER(h) LIKE LOWER($${idx}))`;
//       idx++;
//     }

//     // Age filter
//     if (min_age && max_age) {
//       params.push(Number(min_age), Number(max_age));
//       queryStr += ` AND pr.age BETWEEN $${idx} AND $${idx + 1}`;
//       idx += 2;
//     } else if (min_age) {
//       params.push(Number(min_age));
//       queryStr += ` AND pr.age >= $${idx}`;
//       idx++;
//     } else if (max_age) {
//       params.push(Number(max_age));
//       queryStr += ` AND pr.age <= $${idx}`;
//       idx++;
//     }

//     // Radius filter (uses pincode latitude/longitude)
//     if (radius && lat && lon) {
//       queryStr += ` AND 6371 * acos(LEAST(1,
//         cos(radians($${idx})) * cos(radians(p.latitude)) *
//         cos(radians(p.longitude) - radians($${idx + 1})) +
//         sin(radians($${idx})) * sin(radians(p.latitude))
//       )) <= $${idx + 2}`;
//       params.push(Number(lat), Number(lon), Number(radius));
//       idx += 3;
//     }

//     // Pagination
//     queryStr += ` ORDER BY pr.user_id LIMIT $${idx} OFFSET $${idx + 1}`;
//     params.push(Number(limit), Number(offset));

//     const { rows } = await pool.query(queryStr, params);
//     res.json(rows);

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// }


