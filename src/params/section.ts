import type { ParamMatcher } from '@sveltejs/kit';

const SECTIONS = ['streaks', 'quizzes', 'weekly-challenges', 'exclusive-deals', 'artifacts'];

export const match: ParamMatcher = (param) => SECTIONS.includes(param);
