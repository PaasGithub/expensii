// context/ExpenseContext.tsx
import React, { createContext, useContext, useState } from 'react';

type ExpenseItem = {
  id: string;
  item: string;
  price: number;
  date: string;
};

type ExpenseContextType = {
  expenses: ExpenseItem[];
  addExpense: (expense: ExpenseItem) => void; // Add a single expense
  deleteExpense: (id: string) => void; // Delete an expense by ID
  updateExpense: (id: string, field: 'item' | 'price', value: string) => void; // Update an expense
};

const ExpenseContext = createContext<ExpenseContextType>({
  expenses: [],
  addExpense: () => {},
  deleteExpense: () => {},
  updateExpense: () => {},
});

export const useExpenseContext = () => useContext(ExpenseContext);

export const ExpenseProvider = ({ children }: { children: React.ReactNode }) => {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);

  // Add a single expense
  const addExpense = (expense: ExpenseItem) => {
    setExpenses((prevExpenses) => [...prevExpenses, expense]);
  };

  // Delete an expense by ID
  const deleteExpense = (id: string) => {
    setExpenses((prevExpenses) => prevExpenses.filter((expense) => expense.id !== id));
  };

  // Update an expense
  const updateExpense = (id: string, field: 'item' | 'price', value: string) => {
    setExpenses((prevExpenses) =>
      prevExpenses.map((expense) =>
        expense.id === id
          ? { ...expense, [field]: field === 'price' ? Number(value) : value }
          : expense
      )
    );
  };

  return (
    <ExpenseContext.Provider value={{ expenses, addExpense, deleteExpense, updateExpense }}>
      {children}
    </ExpenseContext.Provider>
  );
};