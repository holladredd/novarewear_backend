const Lookbook = require("../models/Lookbooks");
const slugify = require("slugify");

// @desc    Get all lookbooks
// @route   GET /api/lookbooks
// @access  Public
exports.getLookbooks = async (req, res) => {
  try {
    const { sort, page = 1, limit = 10, isActive } = req.query;

    const query = {};
    if (isActive) {
      query.isActive = isActive === "true";
    }

    const sortOptions = {};
    if (sort === "latest") {
      sortOptions.createdAt = -1;
    } else if (sort === "oldest") {
      sortOptions.createdAt = 1;
    } else {
      sortOptions.displayOrder = 1; // Default sort
    }

    const lookbooks = await Lookbook.find(query)
      .populate("products", "name slug price images")
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Lookbook.countDocuments(query);

    res.json({
      success: true,
      count: lookbooks.length,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      lookbooks,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get a single lookbook by slug
// @route   GET /api/lookbooks/:slug
// @access  Public
exports.getLookbookBySlug = async (req, res) => {
  try {
    const lookbook = await Lookbook.findOne({ slug: req.params.slug }).populate(
      "products",
      "name slug price images"
    );

    if (!lookbook) {
      return res.status(404).json({ message: "Lookbook not found" });
    }

    res.json({ success: true, lookbook });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Create a lookbook
// @route   POST /api/lookbooks
// @access  Private/Admin
exports.createLookbook = async (req, res) => {
  try {
    const { title } = req.body;
    const slug = slugify(title, { lower: true, strict: true });

    const lookbook = await Lookbook.create({ ...req.body, slug });
    res.status(201).json({ success: true, lookbook });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error creating lookbook", error: error.message });
  }
};

// @desc    Update a lookbook
// @route   PUT /api/lookbooks/:slug
// @access  Private/Admin
exports.updateLookbook = async (req, res) => {
  try {
    const { title } = req.body;
    const updateData = { ...req.body };

    if (title) {
      updateData.slug = slugify(title, { lower: true, strict: true });
    }

    const lookbook = await Lookbook.findOneAndUpdate(
      { slug: req.params.slug },
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!lookbook) {
      return res.status(404).json({ message: "Lookbook not found" });
    }

    res.json({ success: true, lookbook });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error updating lookbook", error: error.message });
  }
};
