// routes/products.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// GET /api/products - Get all products with filtering and search
router.get('/', async (req, res) => {
    console.log('Query Parameters:', req.query);
  try {
    const { 
      search, 
      category, 
      featured, 
      minPrice, 
      maxPrice, 
      stockStatus,
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query object
    let query = { isActive: true };

    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }

    // Category filter
    if (category && category !== 'all') {
      query.category = new RegExp(category, 'i');
    }

    // Featured filter
    if (featured !== undefined) {
      query.featured = featured === 'true';
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Stock status filter
    if (stockStatus && stockStatus !== 'all') {
      switch (stockStatus) {
        case 'out-of-stock':
          query.stock = 0;
          break;
        case 'low-stock':
          query.stock = { $gt: 0, $lte: 10 };
          break;
        case 'in-stock':
          query.stock = { $gt: 10 };
          break;
      }
    }

    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);
      console.log('Total enquiries found:', total);

    res.json({
      products,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products', details: error.message });
  }
});

// GET /api/products/:id - Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product || !product.isActive) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid product ID format' });
    }
    res.status(500).json({ error: 'Failed to fetch product', details: error.message });
  }
});

// POST /api/products - Create new product
router.post('/', async (req, res) => {
  try {
    const productData = {
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      category: req.body.category,
      image: req.body.image,
      stock: req.body.stock,
      featured: req.body.featured || false
    };

    const product = new Product(productData);
    const savedProduct = await product.save();

    res.status(201).json({
      message: 'Product created successfully',
      product: savedProduct
    });
  } catch (error) {
    console.error('Error creating product:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationErrors 
      });
    }
    
    res.status(500).json({ error: 'Failed to create product', details: error.message });
  }
});

// PUT /api/products/:id - Update product
router.put('/:id', async (req, res) => {
  try {
    const updateData = {
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      category: req.body.category,
      image: req.body.image,
      stock: req.body.stock,
      featured: req.body.featured
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Error updating product:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationErrors 
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid product ID format' });
    }
    
    res.status(500).json({ error: 'Failed to update product', details: error.message });
  }
});

// DELETE /api/products/:id - Delete product (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      message: 'Product deleted successfully',
      product
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid product ID format' });
    }
    
    res.status(500).json({ error: 'Failed to delete product', details: error.message });
  }
});

// PUT /api/products/:id/stock - Update product stock
router.put('/:id/stock', async (req, res) => {
  try {
    const { stock } = req.body;

    if (stock === undefined || stock < 0) {
      return res.status(400).json({ error: 'Valid stock quantity is required' });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { stock },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      message: 'Stock updated successfully',
      product,
      stockStatus: product.stockStatus
    });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ error: 'Failed to update stock', details: error.message });
  }
});

// POST /api/products/:id/rating - Add product rating
router.post('/:id/rating', async (req, res) => {
  try {
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await product.updateRatings(rating);

    res.json({
      message: 'Rating added successfully',
      product
    });
  } catch (error) {
    console.error('Error adding rating:', error);
    res.status(500).json({ error: 'Failed to add rating', details: error.message });
  }
});

// GET /api/products/stats/overview - Get product statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments({ isActive: true });
    const outOfStock = await Product.countDocuments({ isActive: true, stock: 0 });
    const lowStock = await Product.countDocuments({ 
      isActive: true, 
      stock: { $gt: 0, $lte: 10 } 
    });
    const featuredProducts = await Product.countDocuments({ 
      isActive: true, 
      featured: true 
    });

    const categories = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      totalProducts,
      outOfStock,
      lowStock,
      featuredProducts,
      categories
    });
  } catch (error) {
    console.error('Error fetching product stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics', details: error.message });
  }
});

module.exports = router;