// src/routes/+page.ts
import type { PanelistDashboardData } from '$lib/types/panelist';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
  const res = await fetch('/api/panelist/dashboard');

  if (!res.ok) {
    throw new Error('Failed to fetch dashboard data');
  }

  const dashboardData: PanelistDashboardData = await res.json();

  return { dashboardData };
};