// models/Enquiry.js
const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
    maxLength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: 'Please provide a valid email address'
    }
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^[6-9]\d{9}$/.test(v); // Indian mobile number format
      },
      message: 'Please provide a valid 10-digit phone number'
    }
  },
  address: {
    type: String,
    trim: true,
    maxLength: [200, 'Address cannot exceed 200 characters']
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true
  },
  pincode: {
    type: String,
    required: [true, 'Pincode is required'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^[1-9][0-9]{5}$/.test(v); // Indian pincode format
      },
      message: 'Please provide a valid 6-digit pincode'
    }
  },
  subject: {
    type: String,
    trim: true,
    maxLength: [100, 'Subject cannot exceed 100 characters']
  },
  message: {
    type: String,
    trim: true,
    maxLength: [1000, 'Message cannot exceed 1000 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  productUrls: [{
    type: String,
    validate: {
      validator: function(v) {
        return /^(https?:\/\/)/.test(v);
      },
      message: 'Please provide valid URLs'
    }
  }],
  attachedImages: [{
    type: String,
    validate: {
      validator: function(v) {
        return /^(https?:\/\/)/.test(v);
      },
      message: 'Please provide valid image URLs'
    }
  }],
  notes: {
    type: String,
    trim: true,
    maxLength: [500, 'Notes cannot exceed 500 characters']
  },
  assignedTo: {
    type: String,
    trim: true
  },
  followUpDate: {
    type: Date
  },
  source: {
    type: String,
    enum: ['website', 'phone', 'email', 'social-media', 'referral', 'other'],
    default: 'website'
  }
}, {
  timestamps: true
});

// Index for better search and filter performance
enquirySchema.index({ status: 1, priority: 1, createdAt: -1 });
enquirySchema.index({ name: 'text', email: 'text', subject: 'text' });

// Virtual for full address
enquirySchema.virtual('fullAddress').get(function() {
  return `${this.address}, ${this.city}, ${this.state} - ${this.pincode}`;
});

// Method to mark as completed
enquirySchema.methods.markCompleted = function(notes) {
  this.status = 'completed';
  if (notes) this.notes = notes;
  return this.save();
};

// Static method to get enquiries by priority
enquirySchema.statics.getByPriority = function(priority) {
  return this.find({ priority, status: { $ne: 'completed' } })
    .sort({ createdAt: -1 });
};

// Static method to get pending enquiries
enquirySchema.statics.getPendingEnquiries = function() {
  return this.find({ status: 'pending' })
    .sort({ priority: -1, createdAt: -1 });
};

module.exports = mongoose.model('Enquiry', enquirySchema);