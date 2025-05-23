const express = require("express");
const { body, validationResult } = require("express-validator");
const Book = require("../models/Book");
const Review = require("../models/Review");
const auth = require("../middleware/auth");

const router = express.Router();

// Add a new book (authenticated)
router.post(
  "/",
  auth,
  [
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("author").trim().notEmpty().withMessage("Author is required"),
    body("genre").trim().notEmpty().withMessage("Genre is required"),
    body("description")
      .trim()
      .notEmpty()
      .withMessage("Description is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const book = new Book({
        ...req.body,
        createdBy: req.user._id,
      });

      await book.save();
      res.status(201).json({
        title: book.title,
        author: book.author,
        genre: book.genre,
        description: book.description,
        createdAt: book.createdAt,
        updatedAt: book.updatedAt,
      });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Get all books with pagination and filters
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let filter = {};
    if (req.query.author) {
      filter.author = { $regex: req.query.author, $options: "i" };
    }
    if (req.query.genre) {
      filter.genre = { $regex: req.query.genre, $options: "i" };
    }

    const books = await Book.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Book.countDocuments(filter);

    res.json({
      books: books.map((book) => ({
        title: book.title,
        author: book.author,
        genre: book.genre,
        description: book.description,
        createdAt: book.createdAt,
        updatedAt: book.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get book by ID with average rating and reviews
router.get("/:id", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get reviews with pagination
    const reviews = await Review.find({ book: req.params.id })
      .populate("user", "username")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalReviews = await Review.countDocuments({ book: req.params.id });

    // Calculate average rating
    const ratingStats = await Review.aggregate([
      { $match: { book: book._id } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
    ]);

    const avgRating = ratingStats.length > 0 ? ratingStats[0].avgRating : 0;

    res.json({
      book: {
        title: book.title,
        author: book.author,
        genre: book.genre,
        description: book.description,
        createdAt: book.createdAt,
        updatedAt: book.updatedAt,
      },
      averageRating: Math.round(avgRating * 10) / 10,
      reviews,
      reviewsPagination: {
        page,
        limit,
        total: totalReviews,
        totalPages: Math.ceil(totalReviews / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Submit a review (authenticated, one per user per book)
router.post(
  "/:id/reviews",
  auth,
  [
    body("rating")
      .isInt({ min: 1, max: 5 })
      .withMessage("Rating must be between 1 and 5"),
    body("comment").trim().notEmpty().withMessage("Comment is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const book = await Book.findById(req.params.id);
      if (!book) {
        return res.status(404).json({ error: "Book not found" });
      }

      // Check if user already reviewed this book
      const existingReview = await Review.findOne({
        book: req.params.id,
        user: req.user._id,
      });

      if (existingReview) {
        return res
          .status(400)
          .json({ error: "You have already reviewed this book" });
      }

      const review = new Review({
        book: req.params.id,
        user: req.user._id,
        rating: req.body.rating,
        comment: req.body.comment,
      });

      await review.save();
      await review.populate("user", "username");

      res.status(201).json(review);
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

module.exports = router;
