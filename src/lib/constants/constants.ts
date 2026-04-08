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