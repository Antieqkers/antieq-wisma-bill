
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calculator } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Payment, Tenant } from "@/lib/supabaseTypes";
import { formatCurrency } from "@/lib/paymentCalculator";

interface PaymentWithTenant extends Payment {
  tenants: Tenant;
}

interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  notes?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function FinancialReport() {
  const [payments, setPayments] = useState<PaymentWithTenant[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { toast } = useToast();

  useEffect(() => {
    fetchFinancialData();
  }, [selectedYear]);

  const fetchFinancialData = async () => {
    setIsLoading(true);
    try {
      // Fetch payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          *,
          tenants (*)
        `)
        .eq('period_year', selectedYear)
        .order('payment_date', { ascending: false });

      if (paymentsError) throw paymentsError;
      setPayments((paymentsData && Array.isArray(paymentsData)) ? paymentsData : []);

      // Fetch expenses from localStorage
      const savedExpenses = localStorage.getItem('expenses');
      if (savedExpenses) {
        const allExpenses = JSON.parse(savedExpenses);
        const yearExpenses = allExpenses.filter((expense: Expense) => 
          new Date(expense.date).getFullYear() === selectedYear
        );
        setExpenses(yearExpenses);
      }
    } catch (error) {
      console.error('Error fetching financial data:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data keuangan",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getMonthlyData = () => {
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(0, i).toLocaleString('id-ID', { month: 'short' }),
      income: 0,
      expense: 0,
      profit: 0
    }));

    // Calculate monthly income
    payments.forEach(payment => {
      const month = payment.period_month - 1;
      if (month >= 0 && month < 12) {
        monthlyData[month].income += payment.payment_amount;
      }
    });

    // Calculate monthly expenses
    expenses.forEach(expense => {
      const month = new Date(expense.date).getMonth();
      if (month >= 0 && month < 12) {
        monthlyData[month].expense += expense.amount;
      }
    });

    // Calculate profit
    monthlyData.forEach(data => {
      data.profit = data.income - data.expense;
    });

    return monthlyData;
  };

  const getExpensesByCategory = () => {
    const categoryTotals: { [key: string]: number } = {};
    expenses.forEach(expense => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });

    return Object.entries(categoryTotals).map(([name, value]) => ({ name, value }));
  };

  const calculateSummary = () => {
    const totalIncome = payments.reduce((sum, payment) => sum + payment.payment_amount, 0);
    const totalExpense = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const netProfit = totalIncome - totalExpense;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

    return {
      totalIncome,
      totalExpense,
      netProfit,
      profitMargin
    };
  };

  const monthlyData = getMonthlyData();
  const expensesByCategory = getExpensesByCategory();
  const summary = calculateSummary();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Calculator className="h-6 w-6" />
          Laporan Keuangan & Laba Rugi
        </h2>
      </div>

      {/* Year Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label htmlFor="year">Tahun:</Label>
            <Input
              id="year"
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-32"
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(summary.totalIncome)}
                </div>
                <p className="text-sm text-muted-foreground">Total Pendapatan</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-8 w-8 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(summary.totalExpense)}
                </div>
                <p className="text-sm text-muted-foreground">Total Pengeluaran</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className={`h-8 w-8 ${summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              <div>
                <div className={`text-2xl font-bold ${summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(summary.netProfit)}
                </div>
                <p className="text-sm text-muted-foreground">Laba Bersih</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calculator className={`h-8 w-8 ${summary.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              <div>
                <div className={`text-2xl font-bold ${summary.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {summary.profitMargin.toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground">Margin Laba</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Profit/Loss Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Grafik Laba Rugi Bulanan {selectedYear}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${value / 1000000}M`} />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), '']}
                  labelFormatter={(label) => `Bulan: ${label}`}
                />
                <Bar dataKey="income" fill="#10b981" name="Pendapatan" />
                <Bar dataKey="expense" fill="#ef4444" name="Pengeluaran" />
                <Bar dataKey="profit" fill="#3b82f6" name="Laba Bersih" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Categories Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Distribusi Pengeluaran per Kategori</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensesByCategory}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                  >
                    {expensesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Key Performance Indicators */}
        <Card>
          <CardHeader>
            <CardTitle>Indikator Kinerja Keuangan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="font-medium">Break Even Point</span>
                <Badge variant="outline" className="text-green-700">
                  {summary.totalExpense > 0 ? `${((summary.totalExpense / (summary.totalIncome || 1)) * 100).toFixed(1)}%` : '0%'}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="font-medium">ROI (Return on Investment)</span>
                <Badge variant="outline" className="text-blue-700">
                  {summary.totalExpense > 0 ? `${((summary.netProfit / summary.totalExpense) * 100).toFixed(1)}%` : '0%'}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="font-medium">Rata-rata Pendapatan/Bulan</span>
                <Badge variant="outline" className="text-purple-700">
                  {formatCurrency(summary.totalIncome / 12)}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <span className="font-medium">Rata-rata Pengeluaran/Bulan</span>
                <Badge variant="outline" className="text-orange-700">
                  {formatCurrency(summary.totalExpense / 12)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Monthly Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Bulanan Detail</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Bulan</th>
                  <th className="text-right p-2">Pendapatan</th>
                  <th className="text-right p-2">Pengeluaran</th>
                  <th className="text-right p-2">Laba/Rugi</th>
                  <th className="text-right p-2">Margin</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((data, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{data.month}</td>
                    <td className="p-2 text-right text-green-600">
                      {formatCurrency(data.income)}
                    </td>
                    <td className="p-2 text-right text-red-600">
                      {formatCurrency(data.expense)}
                    </td>
                    <td className={`p-2 text-right font-bold ${data.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(data.profit)}
                    </td>
                    <td className={`p-2 text-right ${data.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {data.income > 0 ? `${((data.profit / data.income) * 100).toFixed(1)}%` : '0%'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
