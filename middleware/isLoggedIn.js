export const isLoggedIn = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: "User not logged in" });
  }
  next();
};
