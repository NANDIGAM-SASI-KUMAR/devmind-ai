import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    tech: { type: [String], default: [] }, // e.g. ['React', 'Node.js']
    color: { type: String, default: '#8b5cf6' }
  },
  { timestamps: true }
);

export default mongoose.model('Project', projectSchema);
