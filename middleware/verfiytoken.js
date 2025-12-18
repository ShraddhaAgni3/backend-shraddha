import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
export const validateAccessToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(404).json({ message: "Access token not found" });
    }

    const accessToken = authHeader.split(" ")[1];
    const access_secret_key = process.env.ACCESS_SECRET_KEY;
   // console.log("keyyy",access_secret_key);
    
    const verifyAccessToken = jwt.verify(accessToken, access_secret_key);

    req.user = verifyAccessToken;
    next();
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Invalid or expire token" });
  }
};

// export const validateRefreshToken = (req, res, next) => {
//   try {
//      const refreshToken = req.headers.authorization.split(" ")[1];
//    // const refreshToken = req.cookies.refreshToken;
//     if (!refreshToken) {
//       res.status(404).json({ message: "refresh token not found" });
//     }
//     const refresh_secret_key = process.env.REFRESH_SECRET_KEY;
//     const verifyRefreshToken = jwt.verify(refreshToken, refresh_secret_key);

//     if (!verifyRefreshToken) {
//       return res.status(400).json({ message: "refresh token is not verified" });
//     }
//     //generate new access token with refresh token
//     const data = verifyRefreshToken;
//     const payload ={
//       id:data.id,
//       name:data.name,
//       email:data.email
//     }

//     req.user = data;
//     const access_secret_key = process.env.ACCESS_SECRET_KEY;

//     const accessToken = jwt.sign(payload, access_secret_key, {
//       expiresIn: "15m",
//     });
//     res.status(200).json({
//       status: 'success',
//       message: "New access token generated successfully",
//       accessToken
//     })
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ message: "Invalid refresh token or error generating new access token " });
//   }
// };



export const validateRefreshToken = (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    // ✅ 1️⃣ Safe check
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Refresh token not provided",
      });
    }

    const refreshToken = authHeader.split(" ")[1];

    // ✅ 2️⃣ Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_SECRET_KEY
    );

    // ✅ 3️⃣ SAME payload structure as login/register
    const payload = {
      id: decoded.id,
      user_id: decoded.user_id,
      email: decoded.email,
      first_name: decoded.first_name,
      last_name: decoded.last_name,
      profession: decoded.profession,
      status: decoded.status,
    };

    // ✅ 4️⃣ Generate new access token
    const accessToken = jwt.sign(
      payload,
      process.env.ACCESS_SECRET_KEY,
      { expiresIn: "15m" }
    );

    // ✅ 5️⃣ Single response
    return res.status(200).json({
      status: "success",
      message: "New access token generated successfully",
      accessToken,
    });

  } catch (err) {
    console.error("Refresh token error:", err);
    return res.status(403).json({
      message: "Invalid or expired refresh token",
    });
  }
};
