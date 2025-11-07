import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/hooks/useAdmin";
import Layout from "@/components/Layout";
import { Link } from "wouter";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from "@/lib/utils";
import { MGB_TO_TON } from "@shared/constants";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Crown } from "lucide-react";

interface AdminStats {
  totalUsers: number;
  totalEarnings: string;
  totalWithdrawals: string;
  tonWithdrawn: string;
  pendingWithdrawals: number;
  successfulWithdrawals: number;
  rejectedWithdrawals: number;
  dailyActiveUsers: number;
  totalAdsWatched: number;
  todayAdsWatched: number;
  activePromos: number;
}

export default function AdminPage() {
  const { toast } = useToast();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const queryClient = useQueryClient();

  // Fetch admin stats
  const { data: stats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    refetchInterval: 30000,
    enabled: isAdmin,
  });

  // Fetch all users for management table
  const { data: usersData } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: () => apiRequest("GET", "/api/admin/users").then(res => res.json()),
    refetchInterval: 30000,
    enabled: isAdmin,
  });

  // Fetch processed withdrawals
  const { data: payoutLogsData } = useQuery({
    queryKey: ["/api/admin/withdrawals/processed"],
    queryFn: () => apiRequest("GET", "/api/admin/withdrawals/processed").then(res => res.json()),
    refetchInterval: 30000,
    enabled: isAdmin,
  });

  if (adminLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin text-primary text-3xl mb-4">
              <i className="fas fa-spinner"></i>
            </div>
            <div className="text-foreground font-medium">Loading...</div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-4">You don't have permission to access this page.</p>
            <Link href="/">
              <Button>Return Home</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <main className="max-w-md mx-auto px-4 pb-20 pt-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Crown className="w-5 h-5 text-purple-400" />
            Admin
          </h1>
          <Button 
            size="sm"
            variant="outline"
            onClick={() => {
              queryClient.invalidateQueries();
              toast({ title: "✅ Refreshed" });
            }}
            className="h-8 px-3 text-xs bg-purple-900/30 border-purple-500/30"
          >
            <i className="fas fa-sync-alt mr-1"></i>
            Refresh
          </Button>
        </div>

        {/* App Dashboard - Compact */}
        <div className="space-y-3 mb-4">
          <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/20 rounded-xl p-3">
            <h2 className="text-sm font-semibold text-white mb-3">Quick Stats</h2>
            
            {/* User & Ad Stats */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-black/20 rounded-lg p-2">
                <div className="text-xs text-gray-400">Users</div>
                <div className="text-lg font-bold text-white">{stats?.totalUsers?.toLocaleString() || '0'}</div>
              </div>
              <div className="bg-black/20 rounded-lg p-2">
                <div className="text-xs text-gray-400">Active</div>
                <div className="text-lg font-bold text-white">{stats?.dailyActiveUsers?.toLocaleString() || '0'}</div>
              </div>
            </div>

            {/* Balance Stats */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-black/20 rounded-lg p-2">
                <div className="text-xs text-gray-400">Total MGB</div>
                <div className="text-sm font-bold text-purple-300">{formatCurrency(stats?.totalEarnings || '0')}</div>
              </div>
              <div className="bg-black/20 rounded-lg p-2">
                <div className="text-xs text-gray-400">MGB Out</div>
                <div className="text-sm font-bold text-blue-300">{formatCurrency(stats?.tonWithdrawn || '0')}</div>
              </div>
            </div>

            {/* Withdrawal Stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-black/20 rounded-lg p-2 text-center">
                <div className="text-xs text-yellow-400">⏳ {stats?.pendingWithdrawals || 0}</div>
              </div>
              <div className="bg-black/20 rounded-lg p-2 text-center">
                <div className="text-xs text-green-400">✅ {stats?.successfulWithdrawals || 0}</div>
              </div>
              <div className="bg-black/20 rounded-lg p-2 text-center">
                <div className="text-xs text-red-400">❌ {stats?.rejectedWithdrawals || 0}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="grid grid-cols-4 w-full mb-4 bg-purple-900/20 border border-purple-500/20">
            <TabsTrigger value="analytics" className="text-xs data-[state=active]:bg-purple-600/30 data-[state=active]:text-purple-200">
              <i className="fas fa-chart-line mr-1"></i>
              Stats
            </TabsTrigger>
            <TabsTrigger value="promos" className="text-xs data-[state=active]:bg-purple-600/30 data-[state=active]:text-purple-200">
              <i className="fas fa-gift mr-1"></i>
              Promos
            </TabsTrigger>
            <TabsTrigger value="payouts" className="text-xs data-[state=active]:bg-purple-600/30 data-[state=active]:text-purple-200">
              <i className="fas fa-money-check-alt mr-1"></i>
              Payouts
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs data-[state=active]:bg-purple-600/30 data-[state=active]:text-purple-200">
              <i className="fas fa-cog mr-1"></i>
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <AnalyticsSection stats={stats} />
          </TabsContent>

          {/* Promo Creator Tab */}
          <TabsContent value="promos" className="space-y-4">
            <PromoCreatorSection />
          </TabsContent>

          {/* Payout Logs Tab */}
          <TabsContent value="payouts" className="space-y-4">
            <PayoutLogsSection data={payoutLogsData} />
          </TabsContent>
          
          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <SettingsSection />
          </TabsContent>
        </Tabs>
      </main>
    </Layout>
  );
}

// Compact Stat Card Component

// Analytics Section with Live Charts
function AnalyticsSection({ stats }: { stats: AdminStats | undefined }) {
  const [timeFilter, setTimeFilter] = useState<'day' | 'week' | 'month'>('week');

  // Generate mock trend data (in production, fetch from API)
  const generateTrendData = () => {
    const points = timeFilter === 'day' ? 24 : timeFilter === 'week' ? 7 : 30;
    const data = [];
    for (let i = 0; i < points; i++) {
      const multiplier = (i + 1) / points;
      data.push({
        label: timeFilter === 'day' ? `${i}:00` : timeFilter === 'week' ? `Day ${i + 1}` : `Day ${i + 1}`,
        earnings: parseFloat(stats?.totalEarnings || '0') * multiplier * (0.8 + Math.random() * 0.4),
        withdrawals: parseFloat(stats?.totalWithdrawals || '0') * multiplier * (0.7 + Math.random() * 0.5),
      });
    }
    return data;
  };

  const chartData = generateTrendData();

  return (
    <Card className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-500/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-base text-white">
            <i className="fas fa-chart-area mr-2 text-purple-400"></i>
            Trends
          </CardTitle>
          <div className="flex gap-2">
            {(['day', 'week', 'month'] as const).map((filter) => (
              <Button
                key={filter}
                size="sm"
                variant={timeFilter === filter ? 'default' : 'outline'}
                onClick={() => setTimeFilter(filter)}
                className="text-xs"
              >
                {filter === 'day' ? '24H' : filter === 'week' ? '7D' : '30D'}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 11 }}
                stroke="#9ca3af"
              />
              <YAxis 
                tick={{ fontSize: 11 }}
                stroke="#9ca3af"
                tickFormatter={(value) => formatCurrency(value, false)}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(value: any) => [formatCurrency(value), '']}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="earnings" 
                stroke="#10b981" 
                strokeWidth={2}
                name="📈 MGB Earned"
                dot={{ fill: '#10b981', r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line 
                type="monotone" 
                dataKey="withdrawals" 
                stroke="#ef4444" 
                strokeWidth={2}
                name="📉 MGB Withdrawn"
                dot={{ fill: '#ef4444', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// User Management Section
function UserManagementSection({ usersData }: { usersData: any }) {
  const [searchTerm, setSearchTerm] = useState('');
  const users = usersData?.users || [];

  const filteredUsers = users.filter((user: any) => 
    user.personalCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <i className="fas fa-users-cog mr-2 text-purple-600"></i>
            User Management
          </CardTitle>
          <Input
            placeholder="🔍 Search by UID or username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>UID</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead>Friends</TableHead>
                <TableHead>Wallet</TableHead>
                <TableHead className="text-right">Total Earned</TableHead>
                <TableHead className="text-right">Withdrawn</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.username || user.firstName || 'Anonymous'}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{user.personalCode || 'N/A'}</TableCell>
                    <TableCell className="text-sm">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.friendsInvited || 0}</Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono max-w-[150px] truncate">
                      {user.walletAddress ? (
                        <span className="text-green-600" title={user.walletAddress}>
                          {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Not set</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(user.totalEarned || '0')}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-600">
                      {formatCurrency(user.totalWithdrawn || '0')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </CardContent>
    </Card>
  );
}

// Promo Creator Section (Fixed Bug)
function PromoCreatorSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    code: '',
    rewardAmount: '',
    rewardType: 'TON' as const,
    usageLimit: '',
    perUserLimit: '1',
    expiresAt: ''
  });
  const [isCreating, setIsCreating] = useState(false);

  const handleGenerateCode = () => {
    const randomCode = 'PROMO' + Math.random().toString(36).substring(2, 10).toUpperCase();
    setFormData({ ...formData, code: randomCode });
    toast({
      title: "✨ Code Generated!",
      description: `Generated code: ${randomCode}`,
    });
  };

  const { data: promoCodesData } = useQuery({
    queryKey: ["/api/admin/promo-codes"],
    queryFn: () => apiRequest("GET", "/api/admin/promo-codes").then(res => res.json()),
    refetchInterval: 5000,
  });

  const handleCreate = async () => {
    if (!formData.code.trim() || !formData.rewardAmount) {
      toast({
        title: "⚠️ Validation Error",
        description: "Promo code and reward amount are required",
        variant: "destructive",
      });
      return;
    }

    const rewardAmount = parseFloat(formData.rewardAmount);
    if (isNaN(rewardAmount) || rewardAmount <= 0) {
      toast({
        title: "⚠️ Validation Error",
        description: "Reward amount must be a positive number",
        variant: "destructive",
      });
      return;
    }

    // TON rewards are sent directly
    const finalAmount = rewardAmount;

    setIsCreating(true);
    try {
      const response = await apiRequest('POST', '/api/promo-codes/create', {
        code: formData.code.trim().toUpperCase(),
        rewardAmount: finalAmount,
        rewardType: formData.rewardType,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
        perUserLimit: parseInt(formData.perUserLimit),
        expiresAt: formData.expiresAt || null
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "✅ Success!",
          description: `Promo code created: ${rewardAmount} ${formData.rewardType} reward`,
        });
        setFormData({
          code: '',
          rewardAmount: '',
          rewardType: 'TON',
          usageLimit: '',
          perUserLimit: '1',
          expiresAt: ''
        });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-codes"] });
      } else {
        throw new Error(result.message || 'Failed to create promo code');
      }
    } catch (error: any) {
      toast({
        title: "❌ Error",
        description: error.message || "Failed to create promo code",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const promoCodes = promoCodesData?.promoCodes || [];

  // Calculate promo status
  const getPromoStatus = (promo: any) => {
    const now = new Date();
    const expiresAt = promo.expiresAt ? new Date(promo.expiresAt) : null;
    const isExpired = expiresAt && now > expiresAt;
    const isFullyClaimed = promo.usageLimit && promo.usageCount >= promo.usageLimit;

    if (isFullyClaimed) return { label: 'Fully Claimed', color: 'bg-orange-600' };
    if (isExpired) return { label: 'Expired', color: 'bg-gray-600' };
    if (promo.isActive) return { label: 'Active', color: 'bg-green-600' };
    return { label: 'Inactive', color: 'bg-gray-600' };
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "✅ Copied!",
      description: `Code "${code}" copied to clipboard`,
    });
  };

  return (
    <div className="space-y-3">
      {/* Create Promo Card */}
      <Card className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-base text-white">
            <i className="fas fa-plus-circle mr-2 text-purple-400"></i>
            Create Promo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="promo-code">Promo Code *</Label>
            <div className="flex gap-2">
              <Input
                id="promo-code"
                placeholder="e.g., WELCOME100"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                maxLength={20}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleGenerateCode}
                className="shrink-0"
              >
                <i className="fas fa-random mr-2"></i>Generate
              </Button>
            </div>
          </div>
          <div>
            <Label htmlFor="reward-amount">Reward Amount (TON) *</Label>
            <Input
              id="reward-amount"
              type="number"
              placeholder="Enter TON amount (e.g., 0.5)"
              value={formData.rewardAmount}
              onChange={(e) => setFormData({ ...formData, rewardAmount: e.target.value })}
              min="0"
              step="0.01"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Value will be exactly {formData.rewardAmount || '0'} {formData.rewardType} per user
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="max-users">Max Claims</Label>
              <Input
                id="max-users"
                type="number"
                placeholder="Unlimited"
                value={formData.usageLimit}
                onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                min="1"
              />
            </div>
            <div>
              <Label htmlFor="expiry-date">Expiry Date</Label>
              <Input
                id="expiry-date"
                type="date"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
              />
            </div>
          </div>
          <Button 
            onClick={handleCreate}
            disabled={isCreating}
            className="w-full"
          >
            {isCreating ? (
              <><i className="fas fa-spinner fa-spin mr-2"></i>Creating...</>
            ) : (
              <><i className="fas fa-plus mr-2"></i>Create Promo</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Active Promos Card */}
      <Card className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-base text-white">
            <i className="fas fa-list mr-2 text-purple-400"></i>
            Active Promos ({promoCodes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {promoCodes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <i className="fas fa-gift text-4xl mb-2"></i>
                <p>No promo codes created yet</p>
              </div>
            ) : (
              promoCodes.map((promo: any) => {
                const status = getPromoStatus(promo);
                return (
                  <div key={promo.id} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <code className="font-bold text-lg bg-muted px-2 py-1 rounded">{promo.code}</code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(promo.code)}
                          className="h-7 w-7 p-0"
                        >
                          <i className="fas fa-copy text-xs"></i>
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {promo.rewardType || 'TON'}
                        </Badge>
                        <Badge className={status.color}>{status.label}</Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                      <div>
                        <span className="text-muted-foreground">Reward:</span>
                        <span className="font-semibold ml-1">
                          {parseFloat(promo.rewardAmount).toFixed(4)} TON
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Claimed:</span>
                        <span className="font-semibold ml-1">{promo.usageCount || 0} / {promo.usageLimit || '∞'}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Remaining:</span>
                        <span className="font-semibold ml-1">
                          {promo.remainingCount}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Distributed:</span>
                        <span className="font-semibold ml-1">
                          {parseFloat(promo.totalDistributed).toFixed(4)} TON
                        </span>
                      </div>
                    </div>
                    {promo.expiresAt && (
                      <div className="text-xs text-muted-foreground mt-2">
                        <i className="fas fa-clock mr-1"></i>
                        Expires: {new Date(promo.expiresAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Payout Logs Section
function PayoutLogsSection({ data }: { data: any }) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const payouts = data?.withdrawals || [];

  const filteredPayouts = payouts.filter((payout: any) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'approved') return ['success', 'paid', 'Approved'].includes(payout.status);
    if (statusFilter === 'rejected') return payout.status === 'rejected';
    if (statusFilter === 'pending') return payout.status === 'pending';
    return true;
  });

  const getStatusBadge = (status: string) => {
    if (['success', 'paid', 'Approved'].includes(status)) {
      return <Badge className="bg-green-600">✓ Approved</Badge>;
    }
    if (status === 'rejected') {
      return <Badge className="bg-red-600">✗ Rejected</Badge>;
    }
    return <Badge className="bg-yellow-600">⏳ Pending</Badge>;
  };

  return (
    <Card className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-500/20">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="flex items-center text-base text-white">
            <i className="fas fa-file-invoice-dollar mr-2 text-purple-400"></i>
            Payouts
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((filter) => (
              <Button
                key={filter}
                size="sm"
                variant={statusFilter === filter ? 'default' : 'outline'}
                onClick={() => setStatusFilter(filter)}
                className="text-xs capitalize flex-shrink-0"
              >
                {filter}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredPayouts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <i className="fas fa-inbox text-4xl mb-2"></i>
            <p>No {statusFilter !== 'all' && statusFilter} payout records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Wallet</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayouts.map((payout: any) => (
                  <TableRow key={payout.id}>
                    <TableCell className="font-medium">
                      @{payout.user?.username || payout.user?.telegram_id || 'Unknown'}
                    </TableCell>
                    <TableCell className="font-bold text-green-600">
                      {formatCurrency(payout.amount || '0')}
                    </TableCell>
                    <TableCell>{getStatusBadge(payout.status)}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(payout.createdAt || payout.created_on).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-xs font-mono max-w-[150px] truncate">
                      {payout.details?.paymentDetails ? (
                        <span title={payout.details.paymentDetails}>
                          {payout.details.paymentDetails.slice(0, 8)}...{payout.details.paymentDetails.slice(-6)}
                        </span>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                    <TableCell className="text-xs max-w-[200px]">
                      {payout.status === 'rejected' && payout.rejectionReason ? (
                        <span className="text-red-500" title={payout.rejectionReason}>
                          {payout.rejectionReason.length > 30 
                            ? `${payout.rejectionReason.slice(0, 30)}...` 
                            : payout.rejectionReason}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredPayouts.length} of {payouts.length} payout records
        </div>
      </CardContent>
    </Card>
  );
}

// Settings Section Component
function SettingsSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [isTogglingSeason, setIsTogglingSeason] = useState(false);
  
  // Fetch current settings
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ["/api/admin/settings"],
    queryFn: () => apiRequest("GET", "/api/admin/settings").then(res => res.json()),
  });
  
  const [settings, setSettings] = useState({
    dailyAdLimit: '50',
    rewardPerAd: '1000',
    minimumWithdrawal: '2500000',
    taskPerClickReward: '0.0001750',
    taskCreationCost: '0.0003'
  });
  
  // Update form when settings data loads
  useEffect(() => {
    if (settingsData) {
      // Convert minimum withdrawal from TON to MGB for display
      const minWithdrawalMGB = settingsData.minimumWithdrawal 
        ? Math.round(settingsData.minimumWithdrawal * MGB_TO_TON)
        : 50000;
      
      setSettings({
        dailyAdLimit: settingsData.dailyAdLimit?.toString() || '50',
        rewardPerAd: settingsData.rewardPerAd?.toString() || '100',
        minimumWithdrawal: minWithdrawalMGB.toString(),
        taskPerClickReward: settingsData.taskPerClickReward?.toString() || '0.0001750',
        taskCreationCost: settingsData.taskCreationCost?.toString() || '0.0003'
      });
    }
  }, [settingsData]);
  
  const handleSaveSettings = async () => {
    const adLimit = parseInt(settings.dailyAdLimit);
    const reward = parseInt(settings.rewardPerAd);
    const minWithdrawalMGB = parseInt(settings.minimumWithdrawal);
    const taskReward = parseFloat(settings.taskPerClickReward);
    const taskCost = parseFloat(settings.taskCreationCost);
    
    if (isNaN(adLimit) || adLimit <= 0) {
      toast({
        title: "⚠️ Validation Error",
        description: "Daily ad limit must be a positive number",
        variant: "destructive",
      });
      return;
    }
    
    if (isNaN(reward) || reward <= 0) {
      toast({
        title: "⚠️ Validation Error",
        description: "Reward per ad must be a positive number",
        variant: "destructive",
      });
      return;
    }
    
    // Convert minimum withdrawal from MGB to TON for backend
    const minWithdrawalTON = minWithdrawalMGB / MGB_TO_TON;
    
    setIsSaving(true);
    try {
      const response = await apiRequest('PUT', '/api/admin/settings', {
        dailyAdLimit: adLimit,
        rewardPerAd: reward,
        minimumWithdrawal: minWithdrawalTON,
        taskPerClickReward: taskReward,
        taskCreationCost: taskCost
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "✅ Settings Updated",
          description: "App settings have been updated successfully",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
        queryClient.invalidateQueries({ queryKey: ["/api/app-settings"] });
      } else {
        throw new Error(result.message || 'Failed to update settings');
      }
    } catch (error: any) {
      toast({
        title: "❌ Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-500/20">
        <CardContent className="py-8 text-center">
          <i className="fas fa-spinner fa-spin text-3xl text-purple-400 mb-2"></i>
          <p className="text-gray-400">Loading...</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-base text-white">
          <i className="fas fa-cog mr-2 text-purple-400"></i>
          Settings
        </CardTitle>
        <p className="text-xs text-gray-400 mt-1">
          Configure app-wide settings
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Daily Ad Limit Setting */}
          <div className="space-y-2">
            <Label htmlFor="daily-ad-limit" className="text-base font-semibold">
              <i className="fas fa-calendar-day mr-2 text-orange-600"></i>
              Daily Ad Limit
            </Label>
            <p className="text-xs text-muted-foreground mb-2">
              Maximum number of ads a user can watch per day
            </p>
            <Input
              id="daily-ad-limit"
              type="number"
              value={settings.dailyAdLimit}
              onChange={(e) => setSettings({ ...settings, dailyAdLimit: e.target.value })}
              placeholder="50"
              min="1"
              className="text-lg font-semibold"
            />
            <p className="text-xs text-muted-foreground">
              Current: {settingsData?.dailyAdLimit || 50} ads per day
            </p>
          </div>
          
          {/* Reward Per Ad Setting */}
          <div className="space-y-2">
            <Label htmlFor="reward-per-ad" className="text-base font-semibold">
              <i className="fas fa-gem mr-2 text-purple-600"></i>
              Reward Per Ad (MGB)
            </Label>
            <p className="text-xs text-muted-foreground mb-2">
              Amount of MGB tokens awarded for watching one ad
            </p>
            <Input
              id="reward-per-ad"
              type="number"
              value={settings.rewardPerAd}
              onChange={(e) => setSettings({ ...settings, rewardPerAd: e.target.value })}
              placeholder="1000"
              min="1"
              className="text-lg font-semibold"
            />
            <p className="text-xs text-muted-foreground">
              Current: {settingsData?.rewardPerAd || 1000} MGB per ad
            </p>
          </div>

          {/* Minimum Withdrawal Setting */}
          <div className="space-y-2">
            <Label htmlFor="minimum-withdrawal" className="text-base font-semibold">
              <i className="fas fa-money-bill-wave mr-2 text-blue-600"></i>
              Minimum Withdrawal (MGB)
            </Label>
            <p className="text-xs text-muted-foreground mb-2">
              Minimum amount required to withdraw
            </p>
            <Input
              id="minimum-withdrawal"
              type="number"
              value={settings.minimumWithdrawal}
              onChange={(e) => setSettings({ ...settings, minimumWithdrawal: e.target.value })}
              placeholder="2500000"
              min="0"
              step="100000"
              className="text-lg font-semibold"
            />
            <p className="text-xs text-muted-foreground">
              Current: {settingsData?.minimumWithdrawal ? Math.round(settingsData.minimumWithdrawal * MGB_TO_TON).toLocaleString() : '50,000'} MGB
            </p>
          </div>

          {/* Task Per Click Reward Setting */}
          <div className="space-y-2">
            <Label htmlFor="task-per-click-reward" className="text-base font-semibold">
              <i className="fas fa-mouse-pointer mr-2 text-purple-600"></i>
              Task Per Click Reward (MGB)
            </Label>
            <p className="text-xs text-muted-foreground mb-2">
              Reward per task completion
            </p>
            <Input
              id="task-per-click-reward"
              type="number"
              value={settings.taskPerClickReward}
              onChange={(e) => setSettings({ ...settings, taskPerClickReward: e.target.value })}
              placeholder="1750"
              min="0"
              step="1"
              className="text-lg font-semibold"
            />
            <p className="text-xs text-muted-foreground">
              Current: {settingsData?.taskPerClickReward ? Math.round(settingsData.taskPerClickReward * MGB_TO_TON) : 875} MGB
            </p>
          </div>

          {/* Task Creation Cost Setting */}
          <div className="space-y-2">
            <Label htmlFor="task-creation-cost" className="text-base font-semibold">
              <i className="fas fa-plus-circle mr-2 text-red-600"></i>
              Task Creation Cost (TON)
            </Label>
            <p className="text-xs text-muted-foreground mb-2">
              Cost to create a new task
            </p>
            <Input
              id="task-creation-cost"
              type="number"
              value={settings.taskCreationCost}
              onChange={(e) => setSettings({ ...settings, taskCreationCost: e.target.value })}
              placeholder="0.0003"
              min="0"
              step="0.0001"
              className="text-lg font-semibold"
            />
            <p className="text-xs text-muted-foreground">
              Current: {settingsData?.taskCreationCost || 0.0003} TON
            </p>
          </div>
        </div>
        
        {/* Save Button */}
        <div className="pt-4 border-t">
          <Button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="w-full md:w-auto"
            size="lg"
          >
            {isSaving ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Saving...
              </>
            ) : (
              <>
                <i className="fas fa-save mr-2"></i>
                Save Settings
              </>
            )}
          </Button>
        </div>
        
        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <i className="fas fa-info-circle text-blue-600 mt-1"></i>
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <p className="font-semibold mb-1">Settings Information</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Changes take effect immediately for all users</li>
                <li>Daily ad limit resets at midnight (UTC)</li>
                <li>Reward amounts are distributed when ads are watched</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
