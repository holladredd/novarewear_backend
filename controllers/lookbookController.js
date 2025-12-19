const Lookbook = require("../models/Lookbook");

// @desc    Get all lookbook items
// @route   GET /api/lookbook
exports.getLookbook = async (req, res) => {
  try {
    const looks = await Lookbook.find({ isActive: true })
      .populate("products", "name slug price images")
      .sort({ displayOrder: 1 });
    res.json({ success: true, looks });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Create lookbook item (Admin)
// @route   POST /api/lookbook
exports.createLookbook = async (req, res) => {
  try {
    const lookbook = await Lookbook.create(req.body);
    res.status(201).json({ success: true, lookbook });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update lookbook item (Admin)
// @route   PUT /api/lookbook/:id
exports.updateLookbook = async (req, res) => {
  try {
    const lookbook = await Lookbook.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!lookbook) {
      return res.status(404).json({ message: "Lookbook item not found" });
    }
    res.json({ success: true, lookbook });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
