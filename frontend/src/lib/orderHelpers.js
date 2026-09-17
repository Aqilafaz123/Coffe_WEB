export function getOrderCustomerLabel(order) {
  if (order.user?.name) return order.user.name;
  if (order.guest_name) return order.guest_name;
  return order.customer_name || '-';
}

export function isWalkInOrder(order) {
  return !order.user_id && !!order.guest_name;
}

export function canDownloadReceipt(order) {
  return order?.payment_status === 'paid';
}
