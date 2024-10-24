const { Router } = require("express");
const User = require("../models/user");

const router = Router();

// Middleware to ensure the user is authenticated
const isAuthenticated = (req, res, next) => {
  if (!req.user) return res.redirect("/user/signin");
  next();
};

router.get("/signin", (req, res) => {
  return res.render("signin");
});

router.get("/signup", (req, res) => {
  return res.render("signup");
});

router.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  try {
    const token = await User.matchPasswordAndGenerateToken(email, password);
    return res.cookie("token", token).redirect("/");
  } catch (e) {
    return res.render("signin", {
      error: "Incorrect email or password",
    });
  }
});

router.post("/signup", async (req, res) => {
  const { fullName, email, password } = req.body;
  await User.create({
    fullName,
    email,
    password,
  });
  return res.redirect("/");
});

router.get("/logout", (req, res) => {
  res.clearCookie("token").redirect("/");
});

module.exports = router;
