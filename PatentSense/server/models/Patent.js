const mongoose = require('mongoose');

const patentSchema = new mongoose.Schema({
  patentNumber: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  abstract: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  inventors: { 
    type: String 
  },
  assignee: { 
    type: String 
  },
  filingDate: { 
    type: String 
  },
  category: { 
    type: String, 
    required: true 
  },
  embedding: { 
    type: [Number], // Stored dense float vectors (e.g. 384 dimensions from Sentence-Transformers)
    select: false   // Exclude from standard queries unless explicitly projected
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Patent', patentSchema);
