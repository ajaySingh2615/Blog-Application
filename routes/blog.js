const Router = require("express");
const multer = require("multer");
const path = require("path");

const Blog = require("../models/blog");
const Comment = require("../models/comment");
const router = Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(`./public/uploads/`));
  },
  filename: function (req, file, cb) {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  },
});

const upload = multer({ storage: storage });

// Add new blog form route
router.get("/add-new", (req, res) => {
  res.render("addBlog", { user: req.user });
});

// Fetch blog details with comments and related blogs
router.get("/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate("createdBy");
    const comments = await Comment.find({ blogId: req.params.id }).populate(
      "createdBy"
    );
    blog.tags = blog.tags || []; // Ensure tags array is always defined

    // Fetch related blogs based on matching tags
    const relatedBlogs = await Blog.find({
      _id: { $ne: blog._id }, // Exclude current blog
      tags: { $in: blog.tags },
    }).limit(3); // Limit related blogs

    res.render("blog", {
      user: req.user,
      blog,
      comments,
      relatedBlogs,
    });
  } catch (error) {
    console.error("Error fetching blog:", error);
    res.status(500).send("Error loading the blog");
  }
});

// Add a new comment
router.post("/comment/:blogId", async (req, res) => {
  if (!req.user) return res.status(401).send("Unauthorized: Please log in.");

  try {
    await Comment.create({
      content: req.body.content,
      blogId: req.params.blogId,
      createdBy: req.user._id,
    });
    res.redirect(`/blog/${req.params.blogId}`);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Create a new blog with image upload
router.post("/", upload.single("coverImage"), async (req, res) => {
  const { title, body } = req.body;
  const blog = await Blog.create({
    title,
    body,
    createdBy: req.user._id,
    coverImageURL: `/uploads/${req.file.filename}`,
  });
  res.redirect(`/blog/${blog._id}`);
});

// Like a blog
router.post("/like/:blogId", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.blogId);
    if (!blog) return res.status(404).send("Blog not found");

    blog.likes += 1;
    await blog.save();
    res.status(200).json({ likes: blog.likes });
  } catch (error) {
    console.error("Error liking the blog:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Middleware to verify ownership
const isAuthor = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.blogId);
    if (!blog) return res.status(404).send("Blog not found");
    if (blog.createdBy.toString() !== req.user._id.toString())
      return res.status(403).send("Unauthorized");

    next();
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

// Edit Blog Form
router.get("/edit/:blogId", isAuthor, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.blogId);
    res.render("editBlog", { blog });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading edit form");
  }
});

// Update Blog
router.post(
  "/edit/:blogId",
  isAuthor,
  upload.single("coverImage"),
  async (req, res) => {
    try {
      const { title, body } = req.body;
      const update = { title, body };

      if (req.file) {
        update.coverImageURL = `/uploads/${req.file.filename}`;
      }

      await Blog.findByIdAndUpdate(req.params.blogId, update);
      res.redirect(`/blog/${req.params.blogId}`);
    } catch (err) {
      console.error(err);
      res.status(500).send("Error updating blog");
    }
  }
);

// Delete Blog
router.post("/delete/:blogId", isAuthor, async (req, res) => {
  try {
    await Blog.findByIdAndDelete(req.params.blogId);
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting blog");
  }
});

module.exports = router;
