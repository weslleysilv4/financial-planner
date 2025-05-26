export interface Debt {
  id: string
  user_id: string
  name: string
  total_amount: number
  monthly_interest_rate: number
  minimum_payment: number
  due_day: number
  priority_strategy: "avalanche" | "snowball" | "custom"
  status: "active" | "negotiated" | "paid"
  notes?: string
  created_at: string
  updated_at: string
  paid_amount?: number
  current_balance?: number
}

export interface Transaction {
  id: string
  user_id: string
  date: string
  description: string
  category: "income" | "fixed_expense" | "variable_expense" | "debt_payment"
  subcategory?: string
  amount: number
  account_source?: string
  debt_id?: string
  created_at: string
  updated_at: string
}

export interface Budget {
  id: string
  user_id: string
  month: number
  year: number
  category: string
  planned_amount: number
  created_at: string
  updated_at: string
  actual_amount?: number
}

export interface DashboardSummary {
  monthly_income: number
  monthly_expenses: number
  monthly_debt_payments: number
  monthly_balance: number
  total_debt_balance: number
}
