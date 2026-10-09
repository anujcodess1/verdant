import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const habitSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    description: { type: String, trim: true, maxlength: 120, default: '' },
    icon: { type: String, trim: true, maxlength: 24, default: 'sprout' },
    color: { type: String, default: '#2f9e44' },
    daysOfWeek: { type: [Number], default: null },
    targetCount: { type: Number, default: 1, min: 1, max: 50 },
    order: { type: Number, default: 0 },
    archived: { type: Boolean, default: false },
    createdAtKey: { type: String, default: null },
  },
  { timestamps: true },
);

habitSchema.index({ user: 1, archived: 1, order: 1 });

habitSchema.methods.toPublic = function toPublic() {
  return {
    id: String(this._id),
    name: this.name,
    description: this.description,
    icon: this.icon,
    color: this.color,
    daysOfWeek: this.daysOfWeek ?? null,
    targetCount: this.targetCount,
    order: this.order,
    archived: this.archived,
    createdAtKey: this.createdAtKey,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const Habit = model('Habit', habitSchema);
