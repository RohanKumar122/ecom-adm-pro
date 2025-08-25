// routes/enquiries.js
const express = require('express');
const router = express.Router();
const Enquiry = require('../models/Enquiry');

// GET /api/enquiries - Get all enquiries with filtering and search
router.get('/', async (req, res) => {
    
  try {
    const { 
      search, 
      status, 
      priority, 
      city,
      state,
      source,
      dateFrom,
      dateTo,
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query object
    let query = {};

    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }

    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Priority filter
    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    // Location filters
    if (city && city !== 'all') {
      query.city = new RegExp(city, 'i');
    }

    if (state && state !== 'all') {
      query.state = new RegExp(state, 'i');
    }

    // Source filter
    if (source && source !== 'all') {
      query.source = source;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const enquiries = await Enquiry.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Enquiry.countDocuments(query);

    res.json({
      enquiries,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching enquiries:', error);
    res.status(500).json({ error: 'Failed to fetch enquiries', details: error.message });
  }
});

// GET /api/enquiries/:id - Get single enquiry
router.get('/:id', async (req, res) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id);
    
    if (!enquiry) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }

    res.json(enquiry);
  } catch (error) {
    console.error('Error fetching enquiry:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid enquiry ID format' });
    }
    res.status(500).json({ error: 'Failed to fetch enquiry', details: error.message });
  }
});

// POST /api/enquiries - Create new enquiry
router.post('/', async (req, res) => {
  try {
    const enquiryData = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address,
      city: req.body.city,
      state: req.body.state,
      pincode: req.body.pincode,
      subject: req.body.subject,
      message: req.body.message,
      productUrls: req.body.productUrls || [],
      attachedImages: req.body.attachedImages || [],
      source: req.body.source || 'website',
      priority: req.body.priority || 'medium'
    };

    const enquiry = new Enquiry(enquiryData);
    const savedEnquiry = await enquiry.save();

    res.status(201).json({
      message: 'Enquiry created successfully',
      enquiry: savedEnquiry
    });
  } catch (error) {
    console.error('Error creating enquiry:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationErrors 
      });
    }
    
    res.status(500).json({ error: 'Failed to create enquiry', details: error.message });
  }
});

// PUT /api/enquiries/:id - Update enquiry
router.put('/:id', async (req, res) => {
  try {
    const updateData = {
      status: req.body.status,
      priority: req.body.priority,
      notes: req.body.notes,
      assignedTo: req.body.assignedTo,
      followUpDate: req.body.followUpDate
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );

    const enquiry = await Enquiry.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!enquiry) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }

    res.json({
      message: 'Enquiry updated successfully',
      enquiry
    });
  } catch (error) {
    console.error('Error updating enquiry:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationErrors 
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid enquiry ID format' });
    }
    
    res.status(500).json({ error: 'Failed to update enquiry', details: error.message });
  }
});

// DELETE /api/enquiries/:id - Delete enquiry
router.delete('/:id', async (req, res) => {
  try {
    const enquiry = await Enquiry.findByIdAndDelete(req.params.id);

    if (!enquiry) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }

    res.json({
      message: 'Enquiry deleted successfully',
      enquiry
    });
  } catch (error) {
    console.error('Error deleting enquiry:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid enquiry ID format' });
    }
    
    res.status(500).json({ error: 'Failed to delete enquiry', details: error.message });
  }
});

// PUT /api/enquiries/:id/status - Update enquiry status
router.put('/:id/status', async (req, res) => {
  try {
    const { status, notes } = req.body;

    if (!status || !['pending', 'in-progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ 
        error: 'Valid status is required (pending, in-progress, completed, cancelled)' 
      });
    }

    const updateData = { status };
    if (notes) updateData.notes = notes;

    const enquiry = await Enquiry.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!enquiry) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }

    res.json({
      message: 'Status updated successfully',
      enquiry
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Failed to update status', details: error.message });
  }
});

// PUT /api/enquiries/:id/priority - Update enquiry priority
router.put('/:id/priority', async (req, res) => {
  try {
    const { priority } = req.body;

    if (!priority || !['low', 'medium', 'high', 'urgent'].includes(priority)) {
      return res.status(400).json({ 
        error: 'Valid priority is required (low, medium, high, urgent)' 
      });
    }

    const enquiry = await Enquiry.findByIdAndUpdate(
      req.params.id,
      { priority },
      { new: true, runValidators: true }
    );

    if (!enquiry) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }

    res.json({
      message: 'Priority updated successfully',
      enquiry
    });
  } catch (error) {
    console.error('Error updating priority:', error);
    res.status(500).json({ error: 'Failed to update priority', details: error.message });
  }
});

// POST /api/enquiries/:id/complete - Mark enquiry as completed
router.post('/:id/complete', async (req, res) => {
  try {
    const { notes } = req.body;

    const enquiry = await Enquiry.findById(req.params.id);
    
    if (!enquiry) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }

    await enquiry.markCompleted(notes);

    res.json({
      message: 'Enquiry marked as completed',
      enquiry
    });
  } catch (error) {
    console.error('Error completing enquiry:', error);
    res.status(500).json({ error: 'Failed to complete enquiry', details: error.message });
  }
});

// GET /api/enquiries/pending/list - Get pending enquiries
router.get('/pending/list', async (req, res) => {
  try {
    const pendingEnquiries = await Enquiry.getPendingEnquiries();
    
    res.json({
      message: 'Pending enquiries fetched successfully',
      enquiries: pendingEnquiries,
      count: pendingEnquiries.length
    });
  } catch (error) {
    console.error('Error fetching pending enquiries:', error);
    res.status(500).json({ error: 'Failed to fetch pending enquiries', details: error.message });
  }
});

// GET /api/enquiries/priority/:priority - Get enquiries by priority
router.get('/priority/:priority', async (req, res) => {
  try {
    const { priority } = req.params;
    
    if (!['low', 'medium', 'high', 'urgent'].includes(priority)) {
      return res.status(400).json({ error: 'Invalid priority level' });
    }

    const enquiries = await Enquiry.getByPriority(priority);
    
    res.json({
      message: `${priority} priority enquiries fetched successfully`,
      enquiries,
      count: enquiries.length
    });
  } catch (error) {
    console.error('Error fetching enquiries by priority:', error);
    res.status(500).json({ error: 'Failed to fetch enquiries', details: error.message });
  }
});

// GET /api/enquiries/stats/overview - Get enquiry statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const totalEnquiries = await Enquiry.countDocuments();
    const pendingCount = await Enquiry.countDocuments({ status: 'pending' });
    const inProgressCount = await Enquiry.countDocuments({ status: 'in-progress' });
    const completedCount = await Enquiry.countDocuments({ status: 'completed' });
    const cancelledCount = await Enquiry.countDocuments({ status: 'cancelled' });

    const priorityStats = await Enquiry.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const cityStats = await Enquiry.aggregate([
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const monthlyStats = await Enquiry.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    const sourceStats = await Enquiry.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      overview: {
        totalEnquiries,
        pendingCount,
        inProgressCount,
        completedCount,
        cancelledCount
      },
      priorityStats,
      cityStats,
      monthlyStats,
      sourceStats
    });
  } catch (error) {
    console.error('Error fetching enquiry stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics', details: error.message });
  }
});

// GET /api/enquiries/search/:term - Search enquiries
router.get('/search/:term', async (req, res) => {
  try {
    const { term } = req.params;
    const { limit = 10 } = req.query;

    const enquiries = await Enquiry.find({
      $or: [
        { name: new RegExp(term, 'i') },
        { email: new RegExp(term, 'i') },
        { phone: new RegExp(term, 'i') },
        { subject: new RegExp(term, 'i') },
        { city: new RegExp(term, 'i') }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

    res.json({
      message: 'Search completed successfully',
      enquiries,
      count: enquiries.length,
      searchTerm: term
    });
  } catch (error) {
    console.error('Error searching enquiries:', error);
    res.status(500).json({ error: 'Failed to search enquiries', details: error.message });
  }
});

// PUT /api/enquiries/bulk/status - Bulk update status
router.put('/bulk/status', async (req, res) => {
  try {
    const { enquiryIds, status, notes } = req.body;

    if (!enquiryIds || !Array.isArray(enquiryIds) || enquiryIds.length === 0) {
      return res.status(400).json({ error: 'Valid enquiry IDs array is required' });
    }

    if (!status || !['pending', 'in-progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ 
        error: 'Valid status is required (pending, in-progress, completed, cancelled)' 
      });
    }

    const updateData = { status };
    if (notes) updateData.notes = notes;

    const result = await Enquiry.updateMany(
      { _id: { $in: enquiryIds } },
      updateData
    );

    res.json({
      message: `${result.modifiedCount} enquiries updated successfully`,
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount
    });
  } catch (error) {
    console.error('Error bulk updating enquiries:', error);
    res.status(500).json({ error: 'Failed to bulk update enquiries', details: error.message });
  }
});

// GET /api/enquiries/export/csv - Export enquiries to CSV (basic endpoint)
router.get('/export/csv', async (req, res) => {
  try {
    const { status, priority, dateFrom, dateTo } = req.query;
    
    let query = {};
    if (status && status !== 'all') query.status = status;
    if (priority && priority !== 'all') query.priority = priority;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const enquiries = await Enquiry.find(query).sort({ createdAt: -1 });

    // Simple CSV format
    const csvHeader = 'Name,Email,Phone,City,State,Status,Priority,Created Date\n';
    const csvData = enquiries.map(enquiry => 
      `"${enquiry.name}","${enquiry.email}","${enquiry.phone}","${enquiry.city}","${enquiry.state}","${enquiry.status}","${enquiry.priority}","${enquiry.createdAt.toISOString()}"`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=enquiries.csv');
    res.send(csvHeader + csvData);
  } catch (error) {
    console.error('Error exporting enquiries:', error);
    res.status(500).json({ error: 'Failed to export enquiries', details: error.message });
  }
});

module.exports = router;