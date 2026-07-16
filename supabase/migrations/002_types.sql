-- DB 레벨에서 오타·불일치 제거
CREATE TYPE subscription_plan_t   AS ENUM ('starter','pro');
CREATE TYPE subscription_status_t AS ENUM ('trial','active','expired','cancelled');
CREATE TYPE category_code_t       AS ENUM ('residential','commercial','industrial','land');
CREATE TYPE transaction_type_t    AS ENUM ('sale','jeonse','monthly_rent','premium_transfer');
CREATE TYPE inquiry_status_t      AS ENUM ('new','contacted','viewing','negotiating','contracted','closed');
CREATE TYPE listing_status_t      AS ENUM ('active','pending','contracted','closed');
