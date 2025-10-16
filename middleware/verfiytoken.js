import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
export const validateAccessToken = async (req, res, next) => {
  try {
    const accessToken = req.headers.authorization.split(" ")[1];
    if (!accessToken) {
      return res.status(404).json({ message: "access token not found" });
    }
    const access_secret_key = process.env.ACCESS_SECRET_KEY;
    const verifyAccessToken = jwt.verify(accessToken, access_secret_key);

    req.user = verifyAccessToken;
    next();
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Invalid or expire token" });
  }
};

export const validateRefreshToken = (req, res, next) => {
  try {
    const refreshToken = req.headers.authorization.split(" ")[1];
    if (!refreshToken) {
      res.status(404).json({ message: "refresh token not found" });
    }
    const refresh_secret_key = process.env.REFRESH_SECRET_KEY;
    const verifyRefreshToken = jwt.verify(refreshToken, refresh_secret_key);

    if (!verifyRefreshToken) {
      return res.status(400).json({ message: "refresh token is not verified" });
    }
    //generate new access token with refresh token
    const data = verifyRefreshToken;
    const payload ={
      id:data.id,
      name:data.name,
      email:data.email
    }

    req.user = data;
    const access_secret_key = process.env.ACCESS_SECRET_KEY;
  
    const accessToken = jwt.sign(payload, access_secret_key, {
      expiresIn: "15m",
    });
    res.status(200).json({
      status:success,
      message: "New access token generated successfully",
      accessToken
    })
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Invalid refresh token or error generating new access token " });
  }
};






// import jwt from "jsonwebtoken";
// import dotenv from "dotenv";

// dotenv.config();

// // ✅ Validate Access Token Middleware
// export const validateAccessToken = async (req, res, next) => {
//   try {
//     const authHeader = req.headers.authorization;

//     // Check if header is missing or wrong format
//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return res.status(401).json({ message: "Access token not found or invalid format" });
//     }

//     const accessToken = authHeader.split(" ")[1];
//     const access_secret_key = process.env.ACCESS_SECRET_KEY;

//     // Verify access token
//     const verifyAccessToken = jwt.verify(accessToken, access_secret_key);
//     req.user = verifyAccessToken;

//     next();
//   } catch (err) {
//     console.error("Access Token Error:", err.message);
//     return res.status(403).json({ message: "Invalid or expired access token" });
//   }
// };

// // ✅ Validate Refresh Token (No Cookies — LocalStorage Based)
// export const validateRefreshToken = async (req, res) => {
//   try {
//     // 🔹 Refresh token will come from frontend body
//     const { refreshToken } = req.body;

//     if (!refreshToken) {
//       return res.status(404).json({ message: "Refresh token not found" });
//     }

//     const refresh_secret_key = process.env.REFRESH_SECRET_KEY;
//     const verifyRefreshToken = jwt.verify(refreshToken, refresh_secret_key);

//     if (!verifyRefreshToken) {
//       return res.status(400).json({ message: "Invalid refresh token" });
//     }

//     // Generate new access token
//     const payload = {
//       id: verifyRefreshToken.id,
//       name: verifyRefreshToken.name,
//       email: verifyRefreshToken.email,
//     };

//     const access_secret_key = process.env.ACCESS_SECRET_KEY;
//     const newAccessToken = jwt.sign(payload, access_secret_key, { expiresIn: "15m" });

//     // 🔹 Send new token in response — frontend will store it in localStorage
//     return res.status(200).json({
//       message: "New access token generated successfully",
//       accessToken: newAccessToken,
//     });
//   } catch (err) {
//     console.error("Refresh Token Error:", err.message);
//     return res.status(500).json({
//       message: "Invalid or expired refresh token",
//     });
//   }
// };
