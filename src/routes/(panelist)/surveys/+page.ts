// src/routes/(panelist)/surveys/+page.ts
import type { AvailableSurveysResponse, SurveyTransactionsResponse } from '$types/api-responses';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, depends }) => {
  depends('surveys:data');

  // Fetch available surveys
  const surveysRes = await fetch('/api/surveys/available');
  if (!surveysRes.ok) {
    throw new Error('Failed to fetch survey data');
  }
  const availableSurveyData: AvailableSurveysResponse = await surveysRes.json();

  // Fetch survey transactions
  const transactionsRes = await fetch('/api/panelist/survey-transactions');
  if (!transactionsRes.ok) {
    throw new Error('Failed to fetch survey transactions');
  }
  const surveyTransactions: SurveyTransactionsResponse = await transactionsRes.json();

  return {
    availableSurveyData,
    surveyTransactions
  };
};