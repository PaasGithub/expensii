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

export const calculateRemainingAmount = (totalAmount: number, items: Array<{ amount: number }>, groupType: 'add' | 'subtract' = 'subtract'): number => {
  const spentAmount = items.reduce((sum, item) => sum + item.amount, 0);
  
  if (groupType === 'add') {
    return spentAmount; // For Add groups, return the total accumulated amount
  } else {
    return totalAmount - spentAmount; // For Subtract groups, return remaining amount
  }
};

export const calculateTotalAmount = (baseAmount: number, items: Array<{ amount: number }>, groupType: 'add' | 'subtract' = 'subtract'): number => {
  const spentAmount = items.reduce((sum, item) => sum + item.amount, 0);
  
  if (groupType === 'add') {
    return spentAmount; // For Add groups, total is the sum of all items
  } else {
    return baseAmount; // For Subtract groups, total is the original amount
  }
}; 