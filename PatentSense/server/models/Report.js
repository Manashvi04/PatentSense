const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
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
  technologyDomain: { 
    type: String, 
    required: true 
  },
  keywords: [{ 
    type: String 
  }],
  noveltyScore: { 
    type: Number, 
    required: true 
  },
  similarityPercentage: { 
    type: Number, 
    required: true 
  },
  aiSummary: { 
    type: String, 
    required: true 
  },
  closestPatent: {
    patentId: { type: String },
    patentNumber: { type: String },
    title: { type: String }
  },
  topMatches: [{
    patentNumber: { type: String },
    title: { type: String },
    category: { type: String },
    similarities: {
      title: { type: Number },
      abstract: { type: Number },
      description: { type: Number },
      overall: { type: Number }
    },
    overlapTerms: [{ type: String }]
  }],
  isFavorite: { 
    type: Boolean, 
    default: false 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Report', reportSchema);
