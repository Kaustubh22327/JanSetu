import mongoose from 'mongoose';

const problemReportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String, // e.g., "Road", "Sewage", "Garbage", etc.
    required: true
  },

  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true
    }
  },

  status: {
    type: String,
    enum: ['pending', 'under_review', 'assigned', 'resolved'],
    default: 'pending'
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // votes: [{
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'Vote'
  // }],

  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Official',
    default: null
  },
  voteCount: {
    type: Number,
    default: 0
  },  
  averageRating: {
    type: Number,
    default: 0
  },
  adminNotes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

problemReportSchema.index({ location: '2dsphere' });

const ProblemReport = mongoose.model('ProblemReport', problemReportSchema);
export default ProblemReport;