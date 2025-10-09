import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
export const validateAccessToken = async (req, res, next) => {
  try {
    //using cookie
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
      return res.status(404).json({ message: "access token not found" });
    }
    const access_secret_key = process.env.access_secret_key;
    const verifyAccessToken = jwt.verify(accessToken, access_secret_key);

    req.user = verifyAccessToken;
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Invalid or expire token" });
  }
  next();
};

export const validateRefreshToken = (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      res.status(404).json({ message: "refresh token not found" });
    }
    const refresh_secret_key = process.env.refresh_secret_key;
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
    const access_secret_key = process.env.access_secret_key;
  
    const generateAccessToken = jwt.sign(payload, access_secret_key, {
      expiresIn: "15m",
    });
    res.cookie("accessToken", generateAccessToken, {
      maxAge: 1000 * 60 * 15,
      sameSite: "strict",
      httpOnly: true,
    });

    next();
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Invalid refresh token or error generating new access token " });
  }
};