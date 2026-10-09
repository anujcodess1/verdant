import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const KINDS = ['milestone', 'perfect_day', 'streak_saved', 'streak_lost', 'welcome'];

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    kind: { type: String, enum: KINDS, required: true },
    title: { type: String, required: true, maxlength: 90 },
    body: { type: String, default: '', maxlength: 200 },
    habitId: { type: Schema.Types.ObjectId, default: null },
    habitName: { type: String, default: '' },
    achievementId: { type: String, default: '' },
    streakLength: { type: Number, default: 0 },
    read: { type: Boolean, default: false },
    dedupeKey: { type: String, default: null, index: { unique: true, sparse: true } },
  },
  { timestamps: true },
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

notificationSchema.methods.toPublic = function toPublic() {
  return {
    id: String(this._id),
    kind: this.kind,
    title: this.title,
    body: this.body,
    habitId: this.habitId ? String(this.habitId) : null,
    habitName: this.habitName,
    achievementId: this.achievementId,
    streakLength: this.streakLength,
    read: this.read,
    createdAt: this.createdAt,
  };
};

export const Notification = model('Notification', notificationSchema);
export const NOTIFICATION_KINDS = KINDS;
