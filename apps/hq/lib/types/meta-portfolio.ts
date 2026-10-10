export type MetaPortfolioRequestStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'fulfilled';

export type MetaPortfolioAdminRequest = {
  id: string;
  status: MetaPortfolioRequestStatus | string;
  businessName: string;
  domain: string;
  businessEmail: string;
  websiteUrl: string;
  businessDescription: string;
  metaBusinessId: string | null;
  rejectionReason: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  ownership: 'owned_by_rukny';
  app: { appId: string; name: string };
  user: {
    id: string;
    email: string;
    name: string | null;
    username: string | null;
  };
  checklist: {
    domainPresent: boolean;
    emailOnDomain: boolean;
    websiteShowsName: boolean | null;
  };
};

export type MetaPortfolioListResponse = {
  data: MetaPortfolioAdminRequest[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type MetaPortfolioStats = {
  pending: number;
  approved: number;
  rejected: number;
  fulfilled: number;
};
