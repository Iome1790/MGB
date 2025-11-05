import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { showNotification } from '@/components/AppNotification';
import { Loader2 } from 'lucide-react';

interface User {
  id: string;
  tonBalance: string;
  friendsInvited?: number;
}

interface WithdrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function WithdrawDialog({ open, onOpenChange }: WithdrawDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const { data: user, refetch: refetchUser } = useQuery<any>({
    queryKey: ['/api/auth/user'],
    retry: false,
    enabled: open,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const { data: appSettings } = useQuery<any>({
    queryKey: ['/api/app-settings'],
    retry: false,
  });

  const tonBalance = parseFloat(user?.tonBalance || "0");
  const MINIMUM_WITHDRAWAL = parseFloat(appSettings?.minimumWithdrawal || 0.001);
  const withdrawalCurrency = appSettings?.withdrawalCurrency || 'TON';
  const walletAddress = user?.cwalletId || "";

  const { data: withdrawalsResponse, refetch: refetchWithdrawals } = useQuery<{ withdrawals?: any[] }>({
    queryKey: ['/api/withdrawals'],
    retry: false,
    enabled: open,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  useEffect(() => {
    if (open) {
      refetchUser();
      refetchWithdrawals();
      setWithdrawAmount("");
    }
  }, [open, refetchUser, refetchWithdrawals]);

  const withdrawalsData = withdrawalsResponse?.withdrawals || [];
  const hasPendingWithdrawal = withdrawalsData.some(w => w.status === 'pending');

  const withdrawMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await apiRequest('POST', '/api/withdrawals', {
        amount: amount
      });
      return response.json();
    },
    onSuccess: async () => {
      showNotification("Withdrawal request submitted successfully!", "success");
      
      queryClient.invalidateQueries({ queryKey: ['/api/withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/stats'] });
      
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['/api/auth/user'] }),
        queryClient.refetchQueries({ queryKey: ['/api/user/stats'] }),
        queryClient.refetchQueries({ queryKey: ['/api/withdrawals'] })
      ]);
      
      setWithdrawAmount("");
      onOpenChange(false);
    },
    onError: (error: any) => {
      showNotification(error.message || "Failed to submit withdrawal request", "error");
    },
  });

  const handleWithdraw = () => {
    if (!walletAddress) {
      showNotification("Please set up your TON wallet address first", "error");
      return;
    }

    const amount = parseFloat(withdrawAmount);
    
    if (!amount || amount <= 0) {
      showNotification("Please enter a valid withdrawal amount", "error");
      return;
    }

    if (hasPendingWithdrawal) {
      showNotification("You have a pending withdrawal. Please wait for it to be processed.", "error");
      return;
    }

    if (amount < MINIMUM_WITHDRAWAL) {
      showNotification(`Minimum withdrawal: ${MINIMUM_WITHDRAWAL} ${withdrawalCurrency}`, "error");
      return;
    }

    if (amount > tonBalance) {
      showNotification("Insufficient balance", "error");
      return;
    }

    withdrawMutation.mutate(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md frosted-glass border border-white/10 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-[#4cd3ff] text-lg">Withdraw Funds</DialogTitle>
          <DialogDescription className="text-gray-400">
            Enter the amount you wish to withdraw
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Withdrawal Amount Input */}
          <div>
            <Label htmlFor="withdraw-amount" className="text-white mb-2 block">
              Enter amount to withdraw
            </Label>
            <Input
              id="withdraw-amount"
              type="number"
              step="0.0001"
              min={MINIMUM_WITHDRAWAL}
              max={tonBalance}
              placeholder={`Min: ${MINIMUM_WITHDRAWAL} ${withdrawalCurrency}`}
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              disabled={withdrawMutation.isPending}
              className="bg-[#0d0d0d] border-[#4cd3ff]/30 text-white text-lg h-12"
            />
          </div>

          {/* Current Balance Display */}
          <div className="p-4 bg-[#0d0d0d] rounded-lg border border-[#4cd3ff]/20">
            <div className="text-xs text-muted-foreground mb-1">Current Balance</div>
            <div className="text-xl font-bold text-[#4cd3ff]">{tonBalance.toFixed(4)} {withdrawalCurrency}</div>
          </div>

          {/* Saved Wallet Address Display */}
          {walletAddress ? (
            <div className="p-4 bg-[#0d0d0d] rounded-lg border border-green-500/20">
              <div className="text-xs text-muted-foreground mb-1">Saved TON Wallet Address</div>
              <div className="text-sm font-mono text-green-400 break-all">{walletAddress}</div>
            </div>
          ) : (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-xs text-red-500 font-medium">
                Please set up your TON wallet address before withdrawing
              </p>
            </div>
          )}

          {/* Pending Withdrawal Warning */}
          {hasPendingWithdrawal && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-xs text-yellow-500">
                You have a pending withdrawal. Please wait for it to be processed.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-center gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={withdrawMutation.isPending}
            className="flex-1 bg-transparent border-white/20 text-white hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleWithdraw}
            disabled={withdrawMutation.isPending || hasPendingWithdrawal || !walletAddress}
            className="flex-1 bg-[#4cd3ff] hover:bg-[#6ddeff] text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {withdrawMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : "Withdraw"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
