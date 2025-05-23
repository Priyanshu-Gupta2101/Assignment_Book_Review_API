const express = require("express");
const { body, validationResult } = require("express-validator");
const Review = require("../models/Review");
const auth = require("../middleware/auth");

const router = express.Router();

// Update your own review
router.put(
  "/:id",
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

      const review = await Review.findOne({
        _id: req.params.id,
        user: req.user._id,
      });

      if (!review) {
        return res
          .status(404)
          .json({ error: "Review not found or unauthorized" });
      }

      review.rating = req.body.rating;
      review.comment = req.body.comment;
      await review.save();

      await review.populate("user", "username");
      res.json(review);
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Delete your own review
router.delete("/:id", auth, async (req, res) => {
  try {
    const review = await Review.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!review) {
      return res
        .status(404)
        .json({ error: "Review not found or unauthorized" });
    }

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
