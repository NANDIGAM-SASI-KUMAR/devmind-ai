import mongoose from 'mongoose';

// One cached AI-insight document per user. Regenerated only when `dataFingerprint`
// (derived from attempt counts + latest attempt ids) no longer matches the user's
// current data — never on every dashboard load.
const resultsInsightSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    dataFingerprint: { type: String, required: true },
    summary: { type: String, default: '' },
    strengths: { type: [String], default: [] },
    weakAreas: { type: [String], default: [] },
    trends: { type: [String], default: [] },
    recommendations: { type: [String], default: [] },
    generatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model('ResultsInsight', resultsInsightSchema);
