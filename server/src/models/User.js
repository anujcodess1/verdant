import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const unlockedSchema = new Schema(
  {
    achievementId: { type: String, required: true },
    habitId: { type: Schema.Types.ObjectId, default: null },
    streakLength: { type: Number, default: 0 },
    unlockedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    googleId: { type: String, index: { unique: true, sparse: true } },
    email: { type: String, trim: true, lowercase: true, index: { unique: true, sparse: true } },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    picture: { type: String, default: '', maxlength: 600 },
    timezone: { type: String, default: 'UTC' },
    startOfWeek: { type: Number, default: 1, min: 0, max: 6 },
    onboarded: { type: Boolean, default: false },
    lastRolloverDay: { type: String, default: null },
    achievements: { type: [unlockedSchema], default: [] },
  },
  { timestamps: true },
);

userSchema.methods.toPublic = function toPublic() {
  return {
    id: String(this._id),
    name: this.name,
    email: this.email || null,
    picture: this.picture || null,
    timezone: this.timezone,
    startOfWeek: this.startOfWeek,
    onboarded: this.onboarded,
    createdAt: this.createdAt,
    unlockedAchievements: this.achievements.map((entry) => ({
      achievementId: entry.achievementId,
      habitId: entry.habitId ? String(entry.habitId) : null,
      streakLength: entry.streakLength,
      unlockedAt: entry.unlockedAt,
    })),
  };
};

export const User = model('User', userSchema);
