/**
 * Split-sale helpers: Full house, Half A, or Half B.
 * paymentPlan "half" (Tahy) is unrelated — that is installment payment.
 */

const PURCHASE_TYPES = ['full', 'halfA', 'halfB'];

function normalizePurchaseType(raw) {
  const t = String(raw || 'full').trim();
  return PURCHASE_TYPES.includes(t) ? t : 'full';
}

function purchaseTypeLabel(purchaseType) {
  if (purchaseType === 'halfA') return 'Half A';
  if (purchaseType === 'halfB') return 'Half B';
  return 'Full house';
}

function deriveHalfSpecsFromParent(body = {}) {
  const rooms = Number(body.rooms) || 0;
  const bathrooms = Number(body.bathrooms) || 0;
  const area = Number(body.houseArea) || (
    Number(body.houseLength) && Number(body.houseWidth)
      ? Math.round(Number(body.houseLength) * Number(body.houseWidth) * 100) / 100
      : 0
  );
  // Split existing house only — no separate "new" half designs
  const roomsA = rooms > 0 ? Math.ceil(rooms / 2) : 0;
  const roomsB = rooms > 0 ? Math.floor(rooms / 2) : 0;
  const bathsA = bathrooms > 0 ? Math.ceil(bathrooms / 2) : 0;
  const bathsB = bathrooms > 0 ? Math.floor(bathrooms / 2) : 0;
  const areaA = area > 0 ? Math.round((area / 2) * 100) / 100 : 0;
  const areaB = area > 0 ? Math.round((area - areaA) * 100) / 100 : 0;
  return {
    halfA: { rooms: roomsA, bathrooms: bathsA, area: areaA },
    halfB: { rooms: roomsB, bathrooms: bathsB, area: areaB }
  };
}

function parseHalfPayload(raw, fallbackLabel) {
  let data = raw;
  if (typeof raw === 'string') {
    try {
      data = JSON.parse(raw);
    } catch {
      data = {};
    }
  }
  data = data || {};
  return {
    label: String(data.label || fallbackLabel).trim() || fallbackLabel,
    rooms: Number(data.rooms) || 0,
    bathrooms: Number(data.bathrooms) || 0,
    area: Number(data.area) || 0,
    price: Number(data.price) || 0,
    status: data.status === 'sold' ? 'sold' : 'available'
  };
}

function buildSplitSaleFromBody(body = {}) {
  const allowHalfSale =
    body.allowHalfSale === true ||
    body.allowHalfSale === 'true' ||
    body.allowHalfSale === '1';

  if (!allowHalfSale) {
    return {
      allowHalfSale: false,
      halfA: { label: 'Half A', rooms: 0, bathrooms: 0, area: 0, price: 0, status: 'available' },
      halfB: { label: 'Half B', rooms: 0, bathrooms: 0, area: 0, price: 0, status: 'available' },
      fullSaleStatus: 'available'
    };
  }

  const derived = deriveHalfSpecsFromParent(body);
  const halfAIn = parseHalfPayload(body.halfA, 'Half A');
  const halfBIn = parseHalfPayload(body.halfB, 'Half B');

  return {
    allowHalfSale: true,
    halfA: {
      label: 'Half A',
      rooms: derived.halfA.rooms,
      bathrooms: derived.halfA.bathrooms,
      area: derived.halfA.area,
      price: halfAIn.price,
      status: halfAIn.status || 'available'
    },
    halfB: {
      label: 'Half B',
      rooms: derived.halfB.rooms,
      bathrooms: derived.halfB.bathrooms,
      area: derived.halfB.area,
      price: halfBIn.price,
      status: halfBIn.status || 'available'
    },
    fullSaleStatus: body.fullSaleStatus === 'sold' ? 'sold' : 'available'
  };
}

function validateSplitSalePayload(split, fullPrice) {
  if (!split.allowHalfSale) return null;
  if (!split.halfA.price || split.halfA.price < 0.01) {
    return 'Half A price must be at least $0.01.';
  }
  if (!split.halfB.price || split.halfB.price < 0.01) {
    return 'Half B price must be at least $0.01.';
  }
  if (!fullPrice || Number(fullPrice) < 0.01) {
    return 'Full house price must be at least $0.01.';
  }
  return null;
}

function getSaleOption(design, purchaseType) {
  const type = normalizePurchaseType(purchaseType);
  if (!design.allowHalfSale) {
    if (type !== 'full') {
      return { ok: false, message: 'This design is only sold as a full house.' };
    }
    if (design.fullSaleStatus === 'sold') {
      return { ok: false, message: 'This design is already sold.' };
    }
    return {
      ok: true,
      purchaseType: 'full',
      label: 'Full house',
      totalPrice: Number(design.price || design.budgetEstimate || 100)
    };
  }

  const halfASold = design.halfA?.status === 'sold';
  const halfBSold = design.halfB?.status === 'sold';
  const fullSold = design.fullSaleStatus === 'sold';

  if (type === 'full') {
    if (fullSold) return { ok: false, message: 'Full house is already sold.' };
    if (halfASold || halfBSold) {
      return { ok: false, message: 'Cannot buy full house — one or both halves are already sold.' };
    }
    return {
      ok: true,
      purchaseType: 'full',
      label: 'Full house',
      totalPrice: Number(design.price || design.budgetEstimate || 100)
    };
  }

  if (fullSold) {
    return { ok: false, message: 'Full house was sold — halves are no longer available.' };
  }

  if (type === 'halfA') {
    if (halfASold) return { ok: false, message: 'Half A is already sold.' };
    const price = Number(design.halfA?.price || 0);
    if (price < 0.01) return { ok: false, message: 'Half A is not priced for sale.' };
    return {
      ok: true,
      purchaseType: 'halfA',
      label: design.halfA?.label || 'Half A',
      totalPrice: price
    };
  }

  if (halfBSold) return { ok: false, message: 'Half B is already sold.' };
  const price = Number(design.halfB?.price || 0);
  if (price < 0.01) return { ok: false, message: 'Half B is not priced for sale.' };
  return {
    ok: true,
    purchaseType: 'halfB',
    label: design.halfB?.label || 'Half B',
    totalPrice: price
  };
}

async function markDesignSoldForPurchase(design, purchaseType) {
  const type = normalizePurchaseType(purchaseType);
  if (!design.allowHalfSale) {
    design.fullSaleStatus = 'sold';
    if (design.halfA) design.halfA.status = 'sold';
    if (design.halfB) design.halfB.status = 'sold';
  } else if (type === 'full') {
    design.fullSaleStatus = 'sold';
    design.halfA.status = 'sold';
    design.halfB.status = 'sold';
  } else if (type === 'halfA') {
    design.halfA.status = 'sold';
  } else if (type === 'halfB') {
    design.halfB.status = 'sold';
  }
  design.salesCount = (design.salesCount || 0) + 1;
  await design.save();
  return design;
}

module.exports = {
  PURCHASE_TYPES,
  normalizePurchaseType,
  purchaseTypeLabel,
  buildSplitSaleFromBody,
  validateSplitSalePayload,
  getSaleOption,
  markDesignSoldForPurchase
};
