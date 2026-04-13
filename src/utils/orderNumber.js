export function generateOrderNumber() {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${random}`;
}
