import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}

export function calculateProgress(collected: number, target: number): number {
  return Math.min(100, Math.round((collected / target) * 100));
}

export function getBaseUrl(): string {
  return window.location.origin;
}

export function buildJoinLink(sessionId: string): string {
  return `${getBaseUrl()}/join?sessionId=${sessionId}`;
}

export function shareViaWhatsApp(joinLink: string, giftName: string): void {
  const text = `Join our gift session for ${giftName}: ${joinLink}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

export function shareViaEmail(joinLink: string, giftName: string): void {
  const subject = `Join our gift session for ${giftName}`;
  const body = `Join our gift session: ${joinLink}`;
  window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
}

export function calculateSuggestedContribution(
  giftPrice: number | string, 
  expectedParticipants: number | string
): { min: number; recommended: number; max: number } {
  const price = typeof giftPrice === 'string' ? parseFloat(giftPrice) : giftPrice;
  const participants = typeof expectedParticipants === 'string' ? parseInt(expectedParticipants.toString()) : expectedParticipants;
  
  if (participants <= 0) {
    return { min: 0, recommended: price, max: price * 1.2 };
  }
  
  const averageContribution = price / participants;
  
  return {
    min: Math.max(averageContribution * 0.8, 0.01),
    recommended: averageContribution,
    max: averageContribution * 1.2
  };
}
