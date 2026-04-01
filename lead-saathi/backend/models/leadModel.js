const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 10,
  },
  category: {
    type: String,
    enum: ['Hot', 'Warm', 'Cold'],
    required: true,
  },
  bant: {
    budget: Boolean,
    authority: Boolean,
    need: Boolean,
    timeline: Boolean,
  },
  response: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Lead', leadSchema);
