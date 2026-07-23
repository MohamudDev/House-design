// The "Apartment" house type is displayed to users as "Floor" across the app,
// while the underlying stored/compared value in the database remains "Apartment".
export const formatHouseType = (type) => {
  if (!type) return type;
  return type.toLowerCase() === 'apartment' ? 'Floor' : type;
};
