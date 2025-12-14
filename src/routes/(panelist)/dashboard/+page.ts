// src/routes/+page.ts
import type { PanelistDashboardData } from '$lib/types/panelist';
import type { PageLoad } from './$types';
import { getErrorLogger } from '$lib/utils/app-logger';

export const load: PageLoad = async ({ fetch }) => {
  const res = await fetch('/api/panelist/dashboard');

  if (!res.ok) {
    const correlationId = res.headers.get('x-correlation-id');
    const errLog = getErrorLogger(correlationId);
    errLog.error({ status: res.status }, 'Failed to fetch panelist dashboard');
    throw new Error('Failed to fetch dashboard data');
  }

  const dashboardData: PanelistDashboardData = await res.json();

  return { dashboardData };
};