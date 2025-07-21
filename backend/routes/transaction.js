const express = require("express")
const Transaction = require("../models/Transaction")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()

// Get all transactions for user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 50, type, category } = req.query

    const query = { userId: req.user.userId }

    if (type) query.type = type
    if (category) query.category = category

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Transaction.countDocuments(query)

    res.json({
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    })
  } catch (error) {
    console.error("Transactions fetch error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Create transaction
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { type, description, category, amount } = req.body

    // Validation
    if (!type || !description || !category || !amount) {
      return res.status(400).json({ message: "All fields are required" })
    }

    if (!["income", "expense"].includes(type)) {
      return res.status(400).json({ message: "Type must be income or expense" })
    }

    if (amount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0" })
    }

    const transaction = new Transaction({
      userId: req.user.userId,
      type,
      description: description.trim(),
      category: category.trim(),
      amount: Number.parseFloat(amount),
    })

    await transaction.save()

    res.status(201).json({
      message: "Transaction created successfully",
      transaction,
    })
  } catch (error) {
    console.error("Transaction creation error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Update transaction
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { type, description, category, amount } = req.body

    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { type, description, category, amount },
      { new: true, runValidators: true },
    )

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" })
    }

    res.json({
      message: "Transaction updated successfully",
      transaction,
    })
  } catch (error) {
    console.error("Transaction update error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Delete transaction
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId,
    })

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" })
    }

    res.json({ message: "Transaction deleted successfully" })
  } catch (error) {
    console.error("Transaction deletion error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
