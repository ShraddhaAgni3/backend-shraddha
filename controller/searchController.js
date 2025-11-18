import { pool } from "../config/db.js";

export const searchProfiles = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      gender,
      city,
      state,
      skills,
      interests,
      profession,
      min_age,
      max_age,
      radius,
      marital_status,
      lat,
      lon,
      search_mode
    } = req.query;

    let queryStr = `
      SELECT pr.*, p.latitude, p.longitude
      FROM profiles pr
      LEFT JOIN pincodes p ON pr.pincode = p.pincode
      WHERE 1=1
    `;

    const params = [];
    let idx = 1;

    /* ----------------------------------------------------------
       ⭐ GUARANTEE: NO LOGIC RUNS IF NOT ITS MODE
    ---------------------------------------------------------- */

    /* ==========================================================
       ⭐ BASIC SEARCH MODE  (OR SEARCH)
       DO NOT TOUCH THIS LOGIC
    ========================================================== */
    if (search_mode === "basic") {
      if (first_name) {
        params.push(`%${first_name}%`);
        params.push(`%${first_name}%`);
        params.push(`%${first_name}%`);
        params.push(`%${first_name}%`);
        params.push(`%${first_name}%`);

        queryStr += `
          AND (
            LOWER(pr.first_name) LIKE LOWER($${idx})
            OR LOWER(pr.profession) LIKE LOWER($${idx + 1})
            OR (
              jsonb_typeof(pr.skills::jsonb) = 'array' 
              AND EXISTS (SELECT 1 FROM json_array_elements_text(pr.skills) s WHERE LOWER(s) LIKE LOWER($${idx + 2}))
            )
            OR (
              jsonb_typeof(pr.skills::jsonb) = 'string'
              AND LOWER(pr.skills::text) LIKE LOWER($${idx + 2})
            )
            OR (
              jsonb_typeof(pr.interests::jsonb) = 'array' 
              AND EXISTS (SELECT 1 FROM json_array_elements_text(pr.interests) i WHERE LOWER(i) LIKE LOWER($${idx + 3}))
            )
            OR (
              jsonb_typeof(pr.interests::jsonb) = 'string'
              AND LOWER(pr.interests::text) LIKE LOWER($${idx + 3})
            )
            OR LOWER(pr.city) LIKE LOWER($${idx + 4})
          )
        `;
        idx += 5;
      }

      // ADD Basic mode AND filters 
      if (profession) {
        params.push(`%${profession}%`);
        queryStr += ` AND LOWER(pr.profession) LIKE LOWER($${idx})`;
        idx++;
      }

      if (city) {
        params.push(`%${city}%`);
        queryStr += ` AND LOWER(pr.city) LIKE LOWER($${idx})`;
        idx++;
      }
    }

    /* ==========================================================
       ⭐ ADVANCED SEARCH MODE (AND FILTERS)
    ========================================================== */
    if (search_mode === "advanced") {

      const textFilters = {
        first_name: "pr.first_name",
        last_name: "pr.last_name",
        profession: "pr.profession",
        city: "pr.city",
        state: "pr.state"
      };

      for (const [key, col] of Object.entries(textFilters)) {
        if (req.query[key]) {
          params.push(`%${req.query[key]}%`);
          queryStr += ` AND LOWER(${col}) LIKE LOWER($${idx})`;
          idx++;
        }
      }

      if (gender) {
        params.push(gender);
        queryStr += ` AND LOWER(pr.gender::text) = LOWER($${idx})`;
        idx++;
      }

      if (marital_status) {
        params.push(marital_status);
        queryStr += ` AND LOWER(pr.marital_status::text) = LOWER($${idx})`;
        idx++;
      }

      if (skills) {
        params.push(`%${skills}%`);
        params.push(`%${skills}%`);
        queryStr += `
          AND (
            (jsonb_typeof(pr.skills::jsonb) = 'array'
              AND EXISTS (SELECT 1 FROM json_array_elements_text(pr.skills) s WHERE LOWER(s) LIKE LOWER($${idx}))
            )
            OR
            (jsonb_typeof(pr.skills::jsonb) = 'string'
              AND LOWER(pr.skills::text) LIKE LOWER($${idx + 1})
            )
          )
        `;
        idx += 2;
      }

      if (interests) {
        params.push(`%${interests}%`);
        params.push(`%${interests}%`);
        queryStr += `
          AND (
            (jsonb_typeof(pr.interests::jsonb) = 'array'
              AND EXISTS (SELECT 1 FROM json_array_elements_text(pr.interests) i WHERE LOWER(i) LIKE LOWER($${idx}))
            )
            OR
            (jsonb_typeof(pr.interests::jsonb) = 'string'
              AND LOWER(pr.interests::text) LIKE LOWER($${idx + 1})
            )
          )
        `;
        idx += 2;
      }

      if (min_age && max_age) {
        params.push(min_age, max_age);
        queryStr += ` AND pr.age BETWEEN $${idx} AND $${idx + 1}`;
        idx += 2;
      } else if (min_age) {
        params.push(min_age);
        queryStr += ` AND pr.age >= $${idx}`;
        idx++;
      } else if (max_age) {
        params.push(max_age);
        queryStr += ` AND pr.age <= $${idx}`;
        idx++;
      }
    }
/* ==========================================================
   ⭐ NEAR ME MODE (GPS / CITY)
========================================================== */
if (search_mode === "nearme") {

  /* -----------------------------------------
     PRIORITY 1 → CITY SEARCH (ALWAYS OVERRIDES GPS)
     If city exists → IGNORE GPS + RADIUS COMPLETELY
  ----------------------------------------- */
  if (city) {
    params.push(`${city}`);
    queryStr += ` AND LOWER(pr.city) = LOWER($${idx}) `;
    idx++;

    // STOP HERE → Return ONLY city-filter results
    const finalQuery = queryStr + ` ORDER BY pr.user_id LIMIT 200`;
    const { rows } = await pool.query(finalQuery, params);
    return res.json(rows);
  }

  /* -----------------------------------------
     PRIORITY 2 → GPS SEARCH (only when NO city)
  ----------------------------------------- */
  if (lat && lon && radius) {
    params.push(Number(lat));
    params.push(Number(lon));
    params.push(Number(radius));

    queryStr += `
      AND p.latitude IS NOT NULL
      AND p.longitude IS NOT NULL
      AND 6371 * acos(LEAST(1,
        cos(radians($${idx})) * cos(radians(p.latitude)) *
        cos(radians(p.longitude) - radians($${idx+1})) +
        sin(radians($${idx})) * sin(radians(p.latitude))
      )) <= $${idx+2}
    `;

    idx += 3;
  }
}

    /* ========================================================== */
    queryStr += ` ORDER BY pr.user_id LIMIT 200`;

    const { rows } = await pool.query(queryStr, params);
    return res.json(rows);

  } catch (err) {
    console.error("Search API Error:", err);
    return res.status(500).json({ error: err.message });
  }
};
