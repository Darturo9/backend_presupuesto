export interface DashboardStatsDto {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
}

export interface RecentTransactionDto {
  id: number;
  amount: number;
  description: string;
  type: 'income' | 'expense';
  createdAt: Date;
  category: {
    id: number;
    name: string;
    type: 'income' | 'expense';
  };
}

export interface ExpensesByCategoryDto {
  category: string;
  amount: number;
}