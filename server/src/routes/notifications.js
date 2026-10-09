import { Router } from 'express';
import { Notification } from '../models/Notification.js';
import { wrap } from '../lib/async-route.js';
import { notFound } from '../lib/http.js';
import { parse, readNotificationsSchema } from '../lib/validation.js';
import { requireAuth } from '../middleware/session.js';

export const notificationRouter = Router();
const OBJECT_ID = /^[a-f0-9]{24}$/i;

notificationRouter.use(requireAuth);

notificationRouter.get(
  '/',
  wrap(async (req, res) => {
    const filter = { user: req.user._id };
    if (req.query.unread === 'true') filter.read = false;
    const limit = Math.min(Math.max(Number(req.query.limit) || 40, 1), 100);
    const docs = await Notification.find(filter).sort({ createdAt: -1 }).limit(limit);
    res.json({
      ok: true,
      unread: await Notification.countDocuments({ user: req.user._id, read: false }),
      notifications: docs.map((doc) => doc.toPublic()),
    });
  }),
);

notificationRouter.post(
  '/read',
  wrap(async (req, res) => {
    const { ids } = parse(readNotificationsSchema, req.body);
    const filter = { user: req.user._id, read: false };
    if (ids?.length) filter._id = { $in: ids.filter((id) => OBJECT_ID.test(id)) };
    await Notification.updateMany(filter, { $set: { read: true } });
    res.json({ ok: true, unread: await Notification.countDocuments({ user: req.user._id, read: false }) });
  }),
);

notificationRouter.delete(
  '/:id',
  wrap(async (req, res) => {
    if (!OBJECT_ID.test(req.params.id)) throw notFound('Notification not found');
    const doc = await Notification.findOne({ _id: req.params.id, user: req.user._id });
    if (!doc) throw notFound('Notification not found');
    await doc.deleteOne();
    res.json({ ok: true, removedId: String(doc._id) });
  }),
);
