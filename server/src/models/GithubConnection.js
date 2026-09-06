import mongoose from 'mongoose';

// Foundation only: the schema a real GitHub OAuth + repo-sync integration would use.
// No endpoint currently writes `connected: true` — there is no OAuth flow yet, so every
// row here genuinely reflects "not connected" rather than faking a connection.
const githubConnectionSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    connected: { type: Boolean, default: false },
    repoFullName: { type: String, default: '' },
    connectedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

export default mongoose.model('GithubConnection', githubConnectionSchema);
