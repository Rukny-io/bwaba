import { api } from '@/lib/api-client';

export type MetaPortfolioFieldDef = {
  key: string;
  label: string;
  labelAr: string;
  requirement: string;
  requirementAr: string;
};

export type MetaPortfolioRequest = {
  id: string;
  developerAppId: string;
  appId: string | null;
  appName: string | null;
  businessName: string;
  domain: string;
  businessEmail: string;
  websiteUrl: string;
  businessDescription: string;
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled' | string;
  rejectionReason: string | null;
  metaBusinessId: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  ownership: 'owned_by_rukny';
};

export type MetaPortfolioStatus = {
  ownership: 'owned_by_rukny';
  reviewSlaNote: string;
  reviewSlaNoteAr: string;
  effectivePlan: 'FREE' | 'PRO' | string;
  isPro: boolean;
  canApply: boolean;
  fields: MetaPortfolioFieldDef[];
  eligibility: {
    proActive: boolean;
    hasApp: boolean;
    ownershipUnderstood: boolean;
    variableReviewTime: boolean;
  };
  apps: Array<{
    appId: string;
    name: string;
    hasPendingRequest: boolean;
    hasAssignedPortfolio: boolean;
    canRequest: boolean;
  }>;
  latestRequest: MetaPortfolioRequest | null;
};

export type SubmitMetaPortfolioInput = {
  appId: string;
  businessName: string;
  domain: string;
  businessEmail: string;
  websiteUrl: string;
  businessDescription: string;
};

export async function getMetaPortfolioStatus(): Promise<MetaPortfolioStatus> {
  const { data } = await api.get<MetaPortfolioStatus>(
    '/developer/meta-portfolio/status',
  );
  return data;
}

export async function submitMetaPortfolioRequest(
  input: SubmitMetaPortfolioInput,
): Promise<{ success: boolean; message: string; request: MetaPortfolioRequest }> {
  const { data } = await api.post<{
    success: boolean;
    message: string;
    request: MetaPortfolioRequest;
  }>('/developer/meta-portfolio/requests', input);
  return data;
}
