/**
 * Backfill Project records for existing completed purchases.
 * Usage (from backend/): node scripts/backfillProjectsFromTransactions.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Design = require('../models/Design');
const { createPaidProjectFromTransaction } = require('../controllers/projectController');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const txs = await Transaction.find({ paymentStatus: 'completed' }).sort({ createdAt: 1 });
  console.log(`Found ${txs.length} completed transactions`);
  let created = 0;
  for (const tx of txs) {
    const design = await Design.findById(tx.design);
    const before = await mongoose.connection.db.collection('projects').countDocuments({ transaction: tx._id });
    await createPaidProjectFromTransaction({ transaction: tx, design, io: null });
    const after = await mongoose.connection.db.collection('projects').countDocuments({ transaction: tx._id });
    if (before === 0 && after > 0) created += 1;
  }
  console.log(`Backfill done. New projects linked: ${created}`);
  await mongoose.disconnect();
})().catch(async (e) => {
  console.error(e);
  try { await mongoose.disconnect(); } catch (_) {}
  process.exit(1);
});
