const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const Blog = require("./models/blog");
const userRoute = require("./routes/user");
const blogRoute = require("./routes/blog");
const {
  checkForAuthenticationCookie,
} = require("./middlewares/authentication");

const app = express();
const PORT = 8080;

// Connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017/blogify")
  .then(() => console.log("MongoDB connected"))
  .catch((error) => console.error("MongoDB connection error:", error));

// Set view engine and views directory
app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

// Middleware setup
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(checkForAuthenticationCookie("token"));
app.use(express.static(path.resolve("./public")));

// Home route to display all blogs
app.get("/", async (req, res) => {
  try {
    const allBlogs = await Blog.find({});
    res.render("home", {
      user: req.user,
      blogs: allBlogs,
    });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).send("Internal Server Error");
  }
});

// User and Blog routes
app.use("/user", userRoute);
app.use("/blog", blogRoute);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
