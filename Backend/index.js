require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { body, validationResult } = require("express-validator");

const app = express();

// Security Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// MongoDB Connection
mongoose
  .connect(process.env.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    retryWrites: true,
    w: "majority",
    dbName: "Roadmap",
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Schemas
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      "Please fill a valid email address",
    ],
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const roadmapItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },
  category: {
    type: String,
    required: true,
    enum: ["Feature", "Bug", "Enhancement", "Other"],
  },
  status: {
    type: String,
    required: true,
    enum: ["Planned", "In Progress", "Completed", "On Hold"],
    default: "Planned",
  },
  upvotes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    roadmapItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RoadmapItem",
      required: true,
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
    replies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    depth: {
      type: Number,
      default: 0,
      max: 3,
    },
  },
  {
    timestamps: true,
  }
);

// Models
const User = mongoose.model("User", userSchema);
const RoadmapItem = mongoose.model("RoadmapItem", roadmapItemSchema);
const Comment = mongoose.model("Comment", commentSchema);

// Middleware
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
      return res.status(401).json({ error: "Authorization token required" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ error: "User not found" });

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

// Validation Middleware
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map((validation) => validation.run(req)));
    const errors = validationResult(req);
    if (errors.isEmpty()) return next();
    res.status(400).json({ errors: errors.array() });
  };
};

// Routes

// Auth Routes
app.post(
  "/api/auth/signup",
  validate([
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }),
  ]),
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 12);

      const user = new User({
        email,
        password: hashedPassword,
      });

      await user.save();

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      res.status(201).json({ token, userId: user._id });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(400).json({ error: "Email already exists" });
      }
      res.status(500).json({ error: "Registration failed" });
    }
  }
);

app.post(
  "/api/auth/login",
  validate([
    body("email").isEmail().normalizeEmail(),
    body("password").exists(),
  ]),
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      res.json({ token, userId: user._id });
    } catch (err) {
      res.status(500).json({ error: "Login failed" });
    }
  }
);

// Roadmap Routes
app.get("/api/roadmap", async (req, res) => {
  try {
    const { category, status, sort } = req.query;
    const query = {};

    if (category) query.category = category;
    if (status) query.status = status;

    const sortOption = sort === "upvotes" ? { upvotes: -1 } : { createdAt: -1 };

    const items = await RoadmapItem.find(query)
      .sort(sortOption)
      .populate("comments")
      .lean();

    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch roadmap items" });
  }
});

app.post("/api/roadmap/:id/upvote", authMiddleware, async (req, res) => {
  try {
    const item = await RoadmapItem.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Item not found" });

    const userId = req.user._id;
    const upvoteIndex = item.upvotes.indexOf(userId);

    if (upvoteIndex === -1) {
      item.upvotes.push(userId);
    } else {
      item.upvotes.splice(upvoteIndex, 1);
    }

    await item.save();
    res.json({ upvotes: item.upvotes.length, upvoted: upvoteIndex === -1 });
  } catch (err) {
    res.status(500).json({ error: "Failed to update upvote" });
  }
});

// Comment Routes
app.post(
  "/api/roadmap/:id/comments",
  authMiddleware,
  validate([
    body("content").trim().isLength({ min: 1, max: 300 }),
    body("parentCommentId").optional().isMongoId(),
  ]),
  async (req, res) => {
    try {
      const { content, parentCommentId } = req.body;
      const roadmapItemId = req.params.id;
      const userId = req.user._id;

      let depth = 0;
      if (parentCommentId) {
        const parentComment = await Comment.findById(parentCommentId);
        if (!parentComment)
          return res.status(404).json({ error: "Parent comment not found" });
        depth = parentComment.depth + 1;
        if (depth > 3)
          return res
            .status(400)
            .json({ error: "Maximum comment depth reached" });
      }

      const comment = new Comment({
        content,
        user: userId,
        roadmapItem: roadmapItemId,
        parentComment: parentCommentId,
        depth,
      });

      await comment.save();

      if (parentCommentId) {
        await Comment.findByIdAndUpdate(parentCommentId, {
          $push: { replies: comment._id },
        });
      }

      await RoadmapItem.findByIdAndUpdate(roadmapItemId, {
        $push: { comments: comment._id },
      });

      res.status(201).json(comment);
    } catch (err) {
      res.status(500).json({ error: "Failed to create comment" });
    }
  }
);

app.put(
  "/api/comments/:id",
  authMiddleware,
  validate([body("content").trim().isLength({ min: 1, max: 300 })]),
  async (req, res) => {
    try {
      const comment = await Comment.findById(req.params.id);
      if (!comment) return res.status(404).json({ error: "Comment not found" });
      if (!comment.user.equals(req.user._id))
        return res.status(403).json({ error: "Unauthorized" });

      comment.content = req.body.content;
      await comment.save();

      res.json(comment);
    } catch (err) {
      res.status(500).json({ error: "Failed to update comment" });
    }
  }
);

app.delete("/api/comments/:id", authMiddleware, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: "Comment not found" });
    if (!comment.user.equals(req.user._id))
      return res.status(403).json({ error: "Unauthorized" });

    // Remove comment and its replies recursively
    const removeCommentAndReplies = async (commentId) => {
      const comment = await Comment.findById(commentId);
      if (!comment) return;

      // First remove all replies
      for (const replyId of comment.replies) {
        await removeCommentAndReplies(replyId);
      }

      // Then remove the comment itself
      await Comment.deleteOne({ _id: commentId });
      await RoadmapItem.updateOne(
        { _id: comment.roadmapItem },
        { $pull: { comments: commentId } }
      );
    };

    await removeCommentAndReplies(comment._id);
    res.json({ message: "Comment and its replies deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
