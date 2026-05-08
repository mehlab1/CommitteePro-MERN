const Expense = require("../models/Expense");
const Category = require("../models/Category");

const createExpense = async (req, res, next) => {
  try {
    const { title, amount, categoryId, paymentMethod, date, notes } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ success: false, message: "title is required" });
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: "amount must be greater than 0" });
    }

    if (categoryId) {
      const category = await Category.findOne({ _id: categoryId, type: "expense", isActive: true });
      if (!category) {
        return res.status(400).json({ success: false, message: "category does not exist" });
      }
    }

    const expense = await Expense.create({
      userId: req.user.userId,
      title: String(title).trim(),
      amount: parsedAmount,
      categoryId: categoryId || undefined,
      paymentMethod,
      date: date ? new Date(date) : new Date(),
      notes,
    });

    return res.status(201).json({
      success: true,
      message: "Expense created successfully",
      data: expense,
    });
  } catch (error) {
    return next(error);
  }
};

const getMyExpenses = async (req, res, next) => {
  try {
    const { fromDate, toDate, categoryId } = req.query;
    const filter = { userId: req.user.userId };

    if (categoryId) {
      filter.categoryId = categoryId;
    }

    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) {
        filter.date.$gte = new Date(fromDate);
      }
      if (toDate) {
        filter.date.$lte = new Date(toDate);
      }
    }

    const expenses = await Expense.find(filter).sort({ date: -1, createdAt: -1 }).populate("categoryId");

    return res.status(200).json({
      success: true,
      message: "Expenses fetched successfully",
      data: expenses,
    });
  } catch (error) {
    return next(error);
  }
};

const updateExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const expense = await Expense.findById(id);

    if (!expense) {
      return res.status(404).json({ success: false, message: "Expense not found" });
    }

    if (expense.userId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: "Forbidden: Not expense owner" });
    }

    const { title, amount, categoryId, paymentMethod, date, notes } = req.body;

    if (title !== undefined) {
      if (!String(title).trim()) {
        return res.status(400).json({ success: false, message: "title cannot be empty" });
      }
      expense.title = String(title).trim();
    }

    if (amount !== undefined) {
      const parsedAmount = Number(amount);
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ success: false, message: "amount must be greater than 0" });
      }
      expense.amount = parsedAmount;
    }

    if (categoryId !== undefined) {
      if (categoryId) {
        const category = await Category.findOne({ _id: categoryId, type: "expense", isActive: true });
        if (!category) {
          return res.status(400).json({ success: false, message: "category does not exist" });
        }
        expense.categoryId = categoryId;
      } else {
        expense.categoryId = undefined;
      }
    }

    if (paymentMethod !== undefined) {
      expense.paymentMethod = paymentMethod;
    }
    if (date !== undefined) {
      expense.date = new Date(date);
    }
    if (notes !== undefined) {
      expense.notes = notes;
    }

    await expense.save();

    return res.status(200).json({
      success: true,
      message: "Expense updated successfully",
      data: expense,
    });
  } catch (error) {
    return next(error);
  }
};

const deleteExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const expense = await Expense.findById(id);

    if (!expense) {
      return res.status(404).json({ success: false, message: "Expense not found" });
    }

    if (expense.userId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: "Forbidden: Not expense owner" });
    }

    await Expense.deleteOne({ _id: id });

    return res.status(200).json({
      success: true,
      message: "Expense deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
};

const getMonthlySummary = async (req, res, next) => {
  try {
    const monthly = await Expense.aggregate([
      { $match: { userId: req.user.userId } },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
          },
          totalAmount: { $sum: "$amount" },
          expenseCount: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
    ]);

    return res.status(200).json({
      success: true,
      message: "Monthly expense summary fetched successfully",
      data: monthly,
    });
  } catch (error) {
    return next(error);
  }
};

const getCategorySummary = async (req, res, next) => {
  try {
    const byCategory = await Expense.aggregate([
      { $match: { userId: req.user.userId } },
      {
        $group: {
          _id: "$categoryId",
          totalAmount: { $sum: "$amount" },
          expenseCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $project: {
          _id: 0,
          categoryId: "$_id",
          categoryName: { $ifNull: [{ $arrayElemAt: ["$category.name", 0] }, "Uncategorized"] },
          totalAmount: 1,
          expenseCount: 1,
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    return res.status(200).json({
      success: true,
      message: "Category expense summary fetched successfully",
      data: byCategory,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createExpense,
  getMyExpenses,
  updateExpense,
  deleteExpense,
  getMonthlySummary,
  getCategorySummary,
};
