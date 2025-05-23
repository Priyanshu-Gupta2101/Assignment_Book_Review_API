const express = require("express");
const Book = require("../models/Book");

const router = express.Router();

// Search books by title or author
router.get("/", async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const books = await Book.find({
      $or: [
        { title: { $regex: q, $options: "i" } },
        { author: { $regex: q, $options: "i" } },
      ],
    }).sort({ createdAt: -1 });

    res.json({
      books: books.map((book) => ({
        title: book.title,
        author: book.author,
        genre: book.genre,
        description: book.description,
        createdAt: book.createdAt,
        updatedAt: book.updatedAt,
      })),
      count: books.length,
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
