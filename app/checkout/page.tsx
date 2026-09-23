import type { Metadata } from 'next';
import { CheckoutView } from '@/components/CheckoutView';
import { ringColors, ringSizes, type RingColorId } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Checkout — KAIRO',
  robots: { index: false, follow: false },
};

type Props = { searchParams: { color?: string; size?: string } };

export default function CheckoutPage({ searchParams }: Props) {
  const color = (ringColors.find((c) => c.id === searchParams.color)?.id ?? 'graphite') as RingColorId;
  const parsed = Number(searchParams.size);
  const size = (ringSizes as readonly number[]).includes(parsed) ? parsed : 9;
  return <CheckoutView color={color} size={size} />;
}
