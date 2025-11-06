import { useAuth } from "./useAuth";

export function useAdmin() {
  const { user, isLoading } = useAuth();
  
  // Check if current user is admin based on their Telegram ID using environment variable
  const telegramId = (user as any)?.telegram_id || (user as any)?.telegramId;
  const adminId = import.meta.env.VITE_ADMIN_ID || "";
  
  // Compare as strings to handle both string and number formats
  const isAdmin = telegramId && adminId && String(telegramId) === String(adminId);
  
  console.log('🔍 Admin check:', { telegramId, adminId, isAdmin, user: !!user });
  
  return {
    isAdmin,
    isLoading,
    user
  };
}