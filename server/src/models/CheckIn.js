import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const checkInSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    habit: { type: Schema.Types.ObjectId, ref: 'Habit', required: true },
    dayKey: { type: String, required: true },
    count: { type: Number, default: 1, min: 0, max: 9999 },
    note: { type: String, trim: true, maxlength: 140, default: '' },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

checkInSchema.index({ habit: 1, dayKey: 1 }, { unique: true });
checkInSchema.index({ user: 1, dayKey: 1 });
checkInSchema.index({ user: 1, completedAt: -1 });

checkInSchema.methods.toPublic = function toPublic() {
  return {
    id: String(this._id),
    habitId: String(this.habit),
    dayKey: this.dayKey,
    count: this.count,
    note: this.note,
    completedAt: this.completedAt,
    updatedAt: this.updatedAt,
  };
};

export const CheckIn = model('CheckIn', checkInSchema);
