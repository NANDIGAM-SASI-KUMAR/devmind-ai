import Notification from '../models/Notification.js';

// Best-effort — a notification failing to write should never break the action that triggered it.
export const notify = async (userId, { type, title, message = '', link = '' }) => {
  try {
    await Notification.create({ user: userId, type, title, message, link });
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
};

// GET /api/notifications
export const listNotifications = async (req, res) => {
  const [items, unreadCount] = await Promise.all([
    Notification.find({ user: req.user._id }).sort('-createdAt').limit(30),
    Notification.countDocuments({ user: req.user._id, read: false })
  ]);
  res.json({ items, unreadCount });
};

// POST /api/notifications/:id/read
export const markRead = async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { read: true },
    { new: true }
  );
  if (!notification) return res.status(404).json({ message: 'Notification not found' });
  res.json(notification);
};

// POST /api/notifications/read-all
export const markAllRead = async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ message: 'All notifications marked as read' });
};
