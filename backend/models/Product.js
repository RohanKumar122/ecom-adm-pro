// models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxLength: [100, 'Product name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
    maxLength: [1000, 'Description cannot exceed 1000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  category: {
    type: String,
    required: [true, 'Product category is required'],
    trim: true
  },
  image: {
    type: String,
    required: [true, 'Product image URL is required'],
    validate: {
      validator: function(v) {
        return /^(https?:\/\/)/.test(v);
      },
      message: 'Please provide a valid image URL'
    }
  },
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better search performance
productSchema.index({ name: 'text', category: 'text', description: 'text' });

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  if (this.stock === 0) return 'out-of-stock';
  if (this.stock <= 10) return 'low-stock';
  return 'in-stock';
});

// Method to update ratings
productSchema.methods.updateRatings = function(newRating) {
  const totalRatings = this.ratings.average * this.ratings.count + newRating;
  this.ratings.count += 1;
  this.ratings.average = totalRatings / this.ratings.count;
  return this.save();
};

module.exports = mongoose.model('Product', productSchema);