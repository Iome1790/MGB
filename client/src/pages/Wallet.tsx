import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { showNotification } from '@/components/AppNotification';
import Layout from '@/components/Layout';
import { apiRequest } from '@/lib/queryClient';
import { formatCurrency } from '@/lib/utils';
import { useAdmin } from '@/hooks/useAdmin';
import { Link } from 'wouter';
import { PAYMENT_SYSTEMS, type PaymentSystem } from '@/constants/paymentSystems';
import { MGB_TO_TON } from '@shared/constants';

interface WithdrawalRequest {
  id: string;
  amount: string;
  method: string;
  status: string;
  details: any;
  createdAt: string;
  updatedAt?: string;
  adminNotes?: string;
}

interface User {
  id: string;
  username?: string;
  telegram_id?: string;
  balance: string;
  [key: string]: any;
}

interface WalletDetails {
  tonWalletAddress: string;
  walletUpdatedAt?: string;
  canWithdraw: boolean;
}

interface WithdrawForm {
  paymentSystem: string;
  amount: string;
  paymentDetails: string;
  comment?: string;
}

interface WalletForm {
  tonWalletAddress: string;
}

export default function Wallet() {
  // Fetch user data
  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ['/api/auth/user'],
    retry: false,
  });
  const queryClient = useQueryClient();
  const { isAdmin } = useAdmin();
  const [activeTab, setActiveTab] = useState('withdraw');

  // Fetch app settings for minimum withdrawal
  const { data: appSettings } = useQuery<{ minimumWithdrawal: number }>({
    queryKey: ['/api/app-settings'],
    retry: false,
  });
  
  // Wallet details form
  const [walletForm, setWalletForm] = useState<WalletForm>({
    tonWalletAddress: ''
  });
  
  // Withdraw form
  const [withdrawForm, setWithdrawForm] = useState<WithdrawForm>({
    paymentSystem: 'mgb_wallet',
    amount: '',
    paymentDetails: '',
    comment: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch wallet details
  const { data: walletDetailsData, isLoading: walletLoading } = useQuery<{ success: boolean; walletDetails: WalletDetails }>({
    queryKey: ['/api/wallet/details'],
    retry: false,
  });

  const walletDetails = walletDetailsData?.walletDetails;

  // Fetch user's withdrawal history
  const { data: withdrawalsResponse, isLoading: withdrawalsLoading } = useQuery<{ success: boolean; withdrawals: WithdrawalRequest[] }>({
    queryKey: ['/api/withdrawals'],
    retry: false,
  });

  const withdrawalsData = withdrawalsResponse?.withdrawals || [];

  // Check if there's a pending withdrawal
  const hasPendingWithdrawal = withdrawalsData.some(w => w.status === 'pending');

  // Update wallet form when wallet details are loaded
  useEffect(() => {
    if (walletDetails) {
      setWalletForm({
        tonWalletAddress: walletDetails.tonWalletAddress || ''
      });
    }
  }, [walletDetails]);

  // Auto-fill TON wallet address
  useEffect(() => {
    if (walletDetails) {
      setWithdrawForm(prev => ({
        ...prev,
        paymentDetails: walletDetails.tonWalletAddress || '',
        comment: ''
      }));
    }
  }, [walletDetails]);

  // Save wallet details mutation
  const saveWalletMutation = useMutation({
    mutationFn: async (data: WalletForm) => {
      const response = await apiRequest('POST', '/api/wallet/save', data);
      return response.json();
    },
    onSuccess: () => {
      showNotification("Wallet details saved successfully!", "success");
      queryClient.invalidateQueries({ queryKey: ['/api/wallet/details'] });
    },
    onError: (error: any) => {
      showNotification(error.message || "Failed to save wallet details", "error");
    },
  });

  // Helper function for amount formatting
  const autoRoundAmount = (value: string | number): string => {
    let valueStr = typeof value === 'string' ? value : value.toString();
    const num = parseFloat(valueStr);
    if (isNaN(num)) return '0';
    if (num === 0) return '0';
    if (valueStr.includes('e') || valueStr.includes('E')) {
      valueStr = num.toString();
    }
    if (valueStr.includes('.')) {
      let [whole, decimals] = valueStr.split('.');
      decimals = decimals.replace(/0+$/, '');
      decimals = decimals.substring(0, 5);
      if (decimals.length === 0 || decimals === '' || parseInt(decimals) === 0) {
        return whole;
      } else {
        return `${whole}.${decimals}`;
      }
    }
    return valueStr;
  };

  // Get selected payment system
  const selectedPaymentSystem = PAYMENT_SYSTEMS.find(ps => ps.id === withdrawForm.paymentSystem);
  
  // Calculate fee
  const calculateFee = (amount: number, paymentSystem: typeof selectedPaymentSystem): number => {
    if (!paymentSystem) return 0;
    if (paymentSystem.feeType === 'percentage') {
      return (amount * paymentSystem.fee) / 100;
    }
    return paymentSystem.fee;
  };

  // Calculate amount after fee
  const calculateAmountAfterFee = (): { fee: number; afterFee: number } => {
    const amount = parseFloat(withdrawForm.amount) || 0;
    if (!selectedPaymentSystem) return { fee: 0, afterFee: amount };
    
    const fee = calculateFee(amount, selectedPaymentSystem);
    return { fee, afterFee: amount - fee };
  };

  const validateWithdrawForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const amountMGB = parseFloat(withdrawForm.amount);
    const balanceMGB = Math.round(parseFloat(user?.balance || '0') * MGB_TO_TON);

    // Check for pending withdrawal
    if (hasPendingWithdrawal) {
      showNotification("Cannot create new request until current one is processed", "error");
      return false;
    }

    if (!withdrawForm.amount || amountMGB <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    } else if (amountMGB > balanceMGB) {
      newErrors.amount = 'Insufficient balance';
    }

    if (!withdrawForm.paymentDetails.trim()) {
      showNotification("Please set up your MGB wallet address first", "error");
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const withdrawMutation = useMutation({
    mutationFn: async (data: WithdrawForm) => {
      const response = await apiRequest('POST', '/api/withdrawals', {
        amount: data.amount,
        paymentSystemId: data.paymentSystem,
        paymentDetails: data.paymentDetails,
        comment: data.comment || ''
      });
      return response.json();
    },
    onSuccess: () => {
      showNotification("💸 Withdrawal request submitted!", "success");
      setWithdrawForm({
        paymentSystem: 'mgb_wallet',
        amount: '',
        paymentDetails: walletDetails?.tonWalletAddress || '',
        comment: ''
      });
      setErrors({});
      queryClient.invalidateQueries({ queryKey: ['/api/withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error: any) => {
      // Clean up error messages - extract user-friendly text from JSON or raw messages
      let errorMessage = "Withdrawal failed";
      
      if (error.message) {
        const msg = error.message.toLowerCase();
        
        // Check for common error patterns
        if (msg.includes('insufficient') || msg.includes('not enough')) {
          errorMessage = "Insufficient MGB";
        } else if (msg.includes('pending')) {
          errorMessage = "You already have a pending withdrawal";
        } else if (msg.includes('minimum')) {
          errorMessage = "Amount is below minimum withdrawal";
        } else if (msg.includes('wallet') || msg.includes('address')) {
          errorMessage = "Invalid wallet address";
        } else if (msg.includes('referral') || msg.includes('friend')) {
          errorMessage = "Minimum friend invite requirement not met";
        } else {
          // Try to extract clean message from JSON format
          try {
            const jsonMatch = error.message.match(/\{.*"message"\s*:\s*"([^"]*)"/);
            if (jsonMatch && jsonMatch[1]) {
              errorMessage = jsonMatch[1];
            } else {
              // Use the original message if it's not JSON
              errorMessage = error.message.replace(/^\{.*\}$/, error.message);
            }
          } catch {
            errorMessage = error.message;
          }
        }
      }
      
      showNotification(errorMessage, "error");
    },
  });

  const handleSaveWallet = (e: React.FormEvent) => {
    e.preventDefault();
    saveWalletMutation.mutate(walletForm);
  };

  const handleSubmitWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateWithdrawForm()) {
      withdrawMutation.mutate(withdrawForm);
    }
  };

  const updateWalletForm = (field: keyof WalletForm, value: string) => {
    setWalletForm(prev => ({ ...prev, [field]: value }));
  };

  const updateWithdrawForm = (field: keyof WithdrawForm, value: string) => {
    setWithdrawForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'approved':
      case 'successful':
      case 'successfull':
        return 'text-green-600';
      case 'pending':
        return 'text-orange-600';
      case 'rejected':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'approved':
      case 'successful':
      case 'successfull':
        return '✅ Approved';
      case 'pending':
        return '⏳ Pending';
      case 'rejected':
        return '❌ Rejected';
      default:
        return status;
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getUTCDate().toString().padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getUTCMonth()];
    const year = date.getUTCFullYear();
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${minutes} UTC`;
  };

  if (userLoading) {
    return (
      <Layout>
        <div className="max-w-md mx-auto p-4 pb-20">
          <div className="text-center py-8">
            <div className="animate-spin text-primary text-xl mb-2">
              <i className="fas fa-spinner"></i>
            </div>
            <div className="text-muted-foreground">Loading wallet...</div>
          </div>
        </div>
      </Layout>
    );
  }

  const { fee, afterFee } = calculateAmountAfterFee();

  return (
    <Layout>
      <div className="max-w-md mx-auto p-4 pb-20">
        {/* User Info & Balance Section */}
        <div className="mb-4">
          <div className="bg-gradient-to-r from-primary to-secondary p-4 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-2">
              {/* User Info - Top Left */}
              <div>
                <div className="text-white font-medium text-sm">@{user?.username || user?.telegram_id}</div>
                <div className="text-primary-foreground/70 text-xs">UID: {user?.referralCode}</div>
              </div>
              
              {/* Admin Dashboard Button - Top Right */}
              {isAdmin && (
                <Link href="/admin">
                  <Button variant="secondary" size="sm" className="gap-2 h-8">
                    <i className="fas fa-cog text-xs"></i>
                    <span className="text-xs">Dashboard</span>
                  </Button>
                </Link>
              )}
            </div>
            
            {/* Balance - Centered */}
            <div className="text-center">
              <div className="text-primary-foreground/80 text-xs font-medium">Balance</div>
              <div className="text-2xl font-bold text-white">
                {Math.round(parseFloat(user?.balance || "0") * MGB_TO_TON)} MGB
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3">
          <TabsList className="grid w-full grid-cols-3 h-12 bg-muted/50">
            <TabsTrigger value="wallets" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <i className="fas fa-wallet mr-2"></i>
              <span>Wallets</span>
            </TabsTrigger>
            <TabsTrigger value="withdraw" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <i className="fas fa-arrow-down mr-2"></i>
              <span>Withdraw</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <i className="fas fa-history mr-2"></i>
              <span>History</span>
            </TabsTrigger>
          </TabsList>

          {/* My Wallets Tab */}
          <TabsContent value="wallets" className="space-y-3">
            <Card className="neon-glow-border shadow-lg">
              <CardHeader className="py-3">
                <CardTitle className="text-base font-medium">My Wallets</CardTitle>
                <CardDescription className="text-xs">Enter your payment details to withdraw earned funds.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveWallet} className="space-y-4">
                  {/* MGB Section */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Enter MGB Wallet Address</Label>
                    <Input
                      placeholder="Enter MGB Wallet Address"
                      value={walletForm.tonWalletAddress}
                      onChange={(e) => updateWalletForm('tonWalletAddress', e.target.value)}
                      required
                    />
                  </div>

                  {/* Save Button */}
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={saveWalletMutation.isPending}
                  >
                    {saveWalletMutation.isPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save mr-2"></i>
                        Save
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Withdraw Tab */}
          <TabsContent value="withdraw" className="space-y-3">
            <Card className="neon-glow-border shadow-lg">
              <CardHeader className="py-3">
                <CardTitle className="text-base font-medium">Withdraw funds</CardTitle>
                <CardDescription className="text-xs">Minimum 50,000 = 0.1 TON<br />500,000 = 1 TON</CardDescription>
              </CardHeader>
              
              <CardContent className="p-4 pt-2">
                <form onSubmit={handleSubmitWithdraw} className="space-y-4">
                  {/* Amount Input */}
                  <div className="space-y-2">
                    <Label htmlFor="withdraw-amount" className="text-sm font-medium">Enter amount to withdraw</Label>
                    <div className="relative">
                      <Input
                        id="withdraw-amount"
                        type="number"
                        step="1"
                        min="0"
                        max={Math.round(parseFloat(user?.balance || "0") * MGB_TO_TON)}
                        value={withdrawForm.amount}
                        onChange={(e) => updateWithdrawForm('amount', e.target.value)}
                        placeholder="0"
                        className={`text-lg h-12 pr-16 ${errors.amount ? 'border-red-500' : ''}`}
                      />
                      <Button 
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-3 text-xs font-semibold"
                        onClick={() => updateWithdrawForm('amount', String(Math.round(parseFloat(user?.balance || '0') * MGB_TO_TON)))}
                      >
                        MAX
                      </Button>
                    </div>
                    {errors.amount && <p className="text-sm text-red-500">{errors.amount}</p>}
                    
                    {/* Balance preview */}
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Available Balance: {Math.round(parseFloat(user?.balance || "0") * MGB_TO_TON)} MGB</div>
                    </div>
                  </div>

                  {/* Warning Messages */}
                  {hasPendingWithdrawal && (
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <i className="fas fa-info-circle text-blue-600 dark:text-blue-400 mt-0.5"></i>
                        <p className="text-xs text-blue-800 dark:text-blue-300">
                          You have a pending withdrawal request. Cannot create a new one until it's processed.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-semibold"
                    disabled={
                      withdrawMutation.isPending || 
                      !user?.balance || 
                      parseFloat(user?.balance || '0') <= 0 ||
                      hasPendingWithdrawal
                    }
                  >
                    {withdrawMutation.isPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Processing...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-arrow-down mr-2"></i>
                        Withdraw
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-3">
            <Card className="neon-glow-border shadow-lg">
              <CardHeader className="py-2 pb-1.5">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <i className="fas fa-history text-muted-foreground text-sm"></i>
                  History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {withdrawalsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin text-primary text-base mb-1">
                      <i className="fas fa-spinner"></i>
                    </div>
                    <div className="text-muted-foreground text-xs">Loading...</div>
                  </div>
                ) : withdrawalsData.length > 0 ? (
                  <div className="max-h-[400px] overflow-y-auto px-3 pb-3">
                    <div className="space-y-0 divide-y divide-border/50">
                      {[...withdrawalsData].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((withdrawal) => (
                        <div key={withdrawal.id} className="flex items-center justify-between py-2 first:pt-0">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              withdrawal.status === 'paid' || withdrawal.status === 'Approved' || withdrawal.status === 'Successfull' 
                                ? 'bg-green-500' 
                                : withdrawal.status === 'pending' 
                                ? 'bg-orange-500' 
                                : 'bg-red-500'
                            }`}></div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-sm text-foreground">{Math.round(parseFloat(withdrawal.amount) * MGB_TO_TON)} MGB</span>
                                <span className={`text-xs font-medium ${getStatusTextColor(withdrawal.status)}`}>
                                  {getStatusLabel(withdrawal.status)}
                                </span>
                              </div>
                              <div className="text-[10px] text-muted-foreground truncate">
                                {formatDateTime(withdrawal.createdAt)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <i className="fas fa-receipt text-2xl text-muted-foreground mb-2"></i>
                    <div className="text-muted-foreground text-sm">No history</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
