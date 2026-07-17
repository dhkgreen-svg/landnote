export const queryKeys = {
  inquiries: {
    all: ['inquiries'] as const,
    lists: () => [...queryKeys.inquiries.all, 'list'] as const,
    list: <T extends object>(filters: T) =>
      [...queryKeys.inquiries.lists(), filters] as const,
    details: () => [...queryKeys.inquiries.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.inquiries.details(), id] as const,
  },

  listings: {
    all: ['listings'] as const,
    lists: () => [...queryKeys.listings.all, 'list'] as const,
    list: <T extends object>(filters: T) =>
      [...queryKeys.listings.lists(), filters] as const,
    details: () => [...queryKeys.listings.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.listings.details(), id] as const,
  },

  matching: {
    all: ['matching'] as const,
    inquiries: () => [...queryKeys.matching.all, 'inquiries'] as const,
    results: (inquiryId: string) =>
      [...queryKeys.matching.all, 'results', inquiryId] as const,
    listings: () => [...queryKeys.matching.all, 'listings'] as const,
    resultsForListing: (listingId: string) =>
      [...queryKeys.matching.all, 'results-listing', listingId] as const,
  },

  stats: {
    all: ['stats'] as const,
    summary: () => [...queryKeys.stats.all, 'summary'] as const,
    inquiries: (params: string) =>
      [...queryKeys.stats.all, 'inquiries', params] as const,
    funnel: (params: string) =>
      [...queryKeys.stats.all, 'funnel', params] as const,
    listingsStatus: () =>
      [...queryKeys.stats.all, 'listings-status'] as const,
    listingsCategories: (params: string) =>
      [...queryKeys.stats.all, 'listings-categories', params] as const,
    contractsDuration: () =>
      [...queryKeys.stats.all, 'contracts-duration'] as const,
  },
} as const;
