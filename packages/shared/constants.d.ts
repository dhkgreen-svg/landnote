export declare const ADMIN_ROLE: {
    readonly SUPERADMIN: "superadmin";
    readonly ADMIN: "admin";
};
export type AdminRole = typeof ADMIN_ROLE[keyof typeof ADMIN_ROLE];
export declare const ACCESS_LOG_RETENTION_DAYS = 90;
export declare const SUBSCRIPTION_PLAN: {
    readonly STARTER: "starter";
    readonly PRO: "pro";
};
export declare const SUBSCRIPTION_STATUS: {
    readonly TRIAL: "trial";
    readonly ACTIVE: "active";
    readonly EXPIRED: "expired";
    readonly CANCELLED: "cancelled";
};
export declare const PLAN_PRICE: Record<string, number>;
export declare const PLAN_LIMITS: {
    readonly starter: {
        readonly max_categories: 2;
        readonly max_listings_per_month: 0;
        readonly max_qr_codes: 1;
        readonly max_images_per_listing: 5;
        readonly category_changes_per_month: 1;
    };
    readonly pro: {
        readonly max_categories: 4;
        readonly max_listings_per_month: 0;
        readonly max_qr_codes: 4;
        readonly max_images_per_listing: 20;
        readonly category_changes_per_month: 0;
    };
};
export declare const TRIAL_DAYS = 7;
export declare const CANCELLED_DATA_RETENTION_DAYS = 30;
export declare function isUnlimited(limit: number): boolean;
export declare function clampBillingDay(day: number): number;
export declare const CATEGORY_CODE: {
    readonly RESIDENTIAL: "residential";
    readonly COMMERCIAL: "commercial";
    readonly INDUSTRIAL: "industrial";
    readonly LAND: "land";
};
export type CategoryCode = typeof CATEGORY_CODE[keyof typeof CATEGORY_CODE];
export declare const CATEGORY_LABELS: Record<CategoryCode, string>;
export declare const SUBCATEGORIES: Record<CategoryCode, Record<string, string[]>>;
export declare const SUBCATEGORY_LABELS: Record<string, string>;
export declare const TRANSACTION_TYPE: {
    readonly SALE: "sale";
    readonly JEONSE: "jeonse";
    readonly MONTHLY_RENT: "monthly_rent";
    readonly PREMIUM_TRANSFER: "premium_transfer";
};
export type TransactionType = typeof TRANSACTION_TYPE[keyof typeof TRANSACTION_TYPE];
export declare const REQUIRED_PRICE_FIELDS: Record<TransactionType, string[]>;
export declare const INQUIRY_STATUS: {
    readonly NEW: "new";
    readonly CONTACTED: "contacted";
    readonly VIEWING: "viewing";
    readonly NEGOTIATING: "negotiating";
    readonly CONTRACTED: "contracted";
    readonly CLOSED: "closed";
};
export declare const LISTING_STATUS: {
    readonly ACTIVE: "active";
    readonly PENDING: "pending";
    readonly CONTRACTED: "contracted";
    readonly CLOSED: "closed";
};
//# sourceMappingURL=constants.d.ts.map