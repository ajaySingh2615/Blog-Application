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

router.get("/add-new", (req, res) => {
  return res.render("addBlog", {
    user: req.user,
  });
});

router.get("/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate("createdBy");
    const comments = await Comment.find({ blogId: req.params.id }).populate(
      "createdBy"
    );

    // Ensure tags and relatedBlogs arrays are always defined
    blog.tags = blog.tags || [];

    // Find related blogs based on tags or category (example logic)
    const relatedBlogs = await Blog.find({
      _id: { $ne: blog._id }, // Exclude the current blog
      tags: { $in: blog.tags }, // Blogs with similar tags
    }).limit(3); // Limit to 3 related blogs

    return res.render("blog", {
      user: req.user,
      blog,
      comments,
      relatedBlogs, // Pass related blogs to the template
    });
  } catch (error) {
    console.error("Error fetching blog:", error);
    return res.status(500).send("Error loading the blog");
  }
});

router.post("/comment/:blogId", async (req, res) => {
  if (!req.user) {
    return res.status(401).send("Unauthorized: Please log in to comment.");
  }

  try {
    await Comment.create({
      content: req.body.content,
      blogId: req.params.blogId,
      createdBy: req.user._id,
    });
    return res.redirect(`/blog/${req.params.blogId}`);
  } catch (error) {
    console.error("Error creating comment:", error);
    return res.status(500).send("Internal Server Error");
  }
});

router.post("/", upload.single("coverImage"), async (req, res) => {
  const { title, body } = req.body;
  const blog = await Blog.create({
    body,
    title,
    createdBy: req.user._id,
    coverImageURL: `/uploads/${req.file.filename}`,
  });
  console.log(req.file);
  return res.redirect(`/blog/${blog._id}`);
});

module.exports = router;
