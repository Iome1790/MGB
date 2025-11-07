export const APP_VERSION = "1.0.0";
export const MGB_TO_TON = 500000; // ✅ 500,000 MGB = 1 TON (50,000 MGB = 0.1 TON)
export const MGB_TO_USD = 100000; // Legacy: kept for compatibility
export const APP_COLORS = {
  primary: "#4aa8ff", // light blue
  background: "#000000", // pure black
  text: "#d9e6ff", // light white/blue
};

/**
 * Convert TON to MGB
 * @param tonAmount - Amount in TON (string or number)
 * @returns Amount in MGB (TON * 500,000)
 */
export function tonToMGB(tonAmount: number | string): number {
  const numValue = typeof tonAmount === 'string' ? parseFloat(tonAmount) : tonAmount;
  return Math.round(numValue * MGB_TO_TON);
}

/**
 * Convert MGB to TON
 * @param mgbAmount - Amount in MGB
 * @returns Amount in TON (MGB / 500,000)
 */
export function mgbToTON(mgbAmount: number | string): number {
  const numValue = typeof mgbAmount === 'string' ? parseFloat(mgbAmount) : mgbAmount;
  return numValue / MGB_TO_TON;
}

/**
 * Legacy function - Convert MGB to USD (kept for compatibility)
 * @param mgbAmount - Amount in MGB
 * @returns Amount in USD (MGB / 100,000)
 */
export function mgbToUSD(mgbAmount: number | string): number {
  const numValue = typeof mgbAmount === 'string' ? parseFloat(mgbAmount) : mgbAmount;
  return numValue / MGB_TO_USD;
}

/**
 * Format large numbers into compact format (1k, 1.2M, 1B)
 * @param num - Number to format
 * @returns Formatted string (e.g., "1.2M", "154k", "24B")
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
}
