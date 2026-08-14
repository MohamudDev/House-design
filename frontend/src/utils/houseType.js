// Display labels differ from stored DB values for some house types.
// - Apartment → Floor
// - Townhouse → Jinkad
export const formatHouseType = (type) => {
  if (!type) return type;
  const key = String(type).toLowerCase();
  if (key === 'apartment') return 'Floor';
  if (key === 'townhouse') return 'Jinkad';
  return type;
};
