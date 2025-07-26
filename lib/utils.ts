// lib/utils.ts
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export const formatAmount = (amount: number): string => {
  return `₵${amount.toLocaleString()}`;
};

export const calculateRemainingAmount = (totalAmount: number, items: Array<{ amount: number }>): number => {
  const spentAmount = items.reduce((sum, item) => sum + item.amount, 0);
  return totalAmount - spentAmount;
}; 