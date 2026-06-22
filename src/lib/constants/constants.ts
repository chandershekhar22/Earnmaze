export const pointsTransactionTypes = [
    "completed",
    "terminated",
    "quota_full",
    "disqualified",
    "redeemed",
    "bonus",
    "rejected",
    "penalty",
    "adjustment",
    "refund",
    "expired",
] as const;

export type TransactionType = (typeof pointsTransactionTypes)[number];
export type TransactionEffect = 'positive' | 'negative' | 'neutral' | 'variable';

export const transactionEffects: Record<TransactionType, TransactionEffect> = {
    completed:    'positive',  // survey completed — points awarded
    terminated:   'positive',  // survey terminated — partial points awarded
    quota_full:   'positive',  // quota full — partial points awarded
    disqualified: 'neutral',   // disqualified — no points change
    redeemed:     'negative',  // points spent on reward
    bonus:        'positive',  // bonus points added
    rejected:     'negative',  // points deducted
    penalty:      'negative',  // penalty applied
    adjustment:   'variable',  // admin adjustment — sign depends on points value
    refund:       'positive',  // refund credited
    expired:      'negative',  // points expired
};

/**
 * Compute the signed display amount for a points transaction. The DB stores
 * `points` as a positive magnitude on every row; the `type` encodes whether
 * the effect on the user's wallet is positive or negative. Use this to pick
 * the sign + color in the UI without having to spread the same conditional
 * everywhere.
 */
export function signedTransactionPoints(type: string, points: number): number {
    const effect = transactionEffects[type as TransactionType];
    if (effect === 'negative') return -Math.abs(points);
    if (effect === 'neutral') return 0;
    // 'variable' (adjustment) trusts the stored sign; 'positive' is always +.
    if (effect === 'variable') return points;
    return Math.abs(points);
}