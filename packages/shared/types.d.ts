import type { CategoryCode, TransactionType } from './constants';
export interface Agent {
    id: string;
    user_id: string;
    email: string;
    agent_name: string;
    license_number: string;
    office_name: string | null;
    phone: string | null;
    agent_code: string;
    profile_image_url: string | null;
    subscription_plan: 'starter' | 'pro';
    subscription_status: 'trial' | 'active' | 'expired' | 'cancelled';
    selected_categories: CategoryCode[];
    pending_plan: 'starter' | 'pro' | null;
    category_changed_at: string | null;
    trial_ends_at: string | null;
    cancelled_at: string | null;
    billing_key: string | null;
    billing_card_info: {
        company: string;
        number: string;
        card_type: string;
    } | null;
    subscription_start: string | null;
    subscription_end: string | null;
    next_billing_date: string | null;
    billing_day: number;
    created_at: string;
    updated_at: string;
}
export interface CustomerInquiry {
    id: string;
    agent_id: string;
    inquiry_type: 'looking_for' | 'listing';
    customer_name: string | null;
    customer_phone: string | null;
    customer_email: string | null;
    category_codes: CategoryCode[];
    subcategory_codes: string[];
    tags: string[];
    transaction_types: TransactionType[];
    detailed_conditions: Record<string, unknown>;
    images: InquiryImage[];
    status: 'new' | 'contacted' | 'viewing' | 'negotiating' | 'contracted' | 'closed';
    priority: number;
    agent_memo: string | null;
    created_at: string;
    updated_at: string;
}
export interface InquiryImage {
    path: string;
    signed_url?: string;
    uploaded_at: string;
}
export interface PropertyListing {
    id: string;
    agent_id: string;
    category_codes: CategoryCode[];
    subcategory_codes: string[];
    tags: string[];
    transaction_types: TransactionType[];
    address_full: string | null;
    address_road: string | null;
    address_jibun: string | null;
    dong_name: string | null;
    latitude: number | null;
    longitude: number | null;
    price_sale: number | null;
    deposit: number | null;
    monthly_rent: number | null;
    maintenance_fee: number | null;
    premium_price: number | null;
    premium_floor: number | null;
    premium_facility: number | null;
    premium_business: number | null;
    contract_remaining_months: number | null;
    area_supply: number | null;
    area_exclusive: number | null;
    floor_current: number | null;
    floor_total: number | null;
    built_year: number | null;
    direction: string | null;
    images: ListingImage[];
    detail_info: Record<string, unknown>;
    status: 'active' | 'pending' | 'contracted' | 'closed';
    agent_memo: string | null;
    source_inquiry_id: string | null;
    created_at: string;
    updated_at: string;
}
export interface ListingImage {
    path: string;
    signed_url?: string;
    is_representative: boolean;
    label: string | null;
    uploaded_at: string;
}
export interface MatchResult {
    id: string;
    agent_id: string;
    inquiry_id: string;
    property_id: string;
    score: number;
    score_breakdown: {
        category: number;
        price: number;
        area: number;
        location: number;
    };
    is_shown: boolean;
    is_liked: boolean;
    created_at: string;
}
export interface AdminUser {
    id: string;
    user_id: string;
    email: string;
    name: string;
    role: 'superadmin' | 'admin';
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
export interface PlatformKpis {
    total_agents: number;
    active_agents: number;
    trial_agents: number;
    expired_agents: number;
    total_revenue: number;
    mrr: number;
    new_agents_this_month: number;
    new_agents_diff: number;
}
export type ApiResponse<T> = {
    ok: true;
    data: T;
} | {
    ok: false;
    error: {
        code: string;
        message: string;
        details?: unknown;
    };
};
//# sourceMappingURL=types.d.ts.map