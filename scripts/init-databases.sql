-- DOA Market 데이터베이스 초기화 스크립트
-- PostgreSQL 컨테이너 시작 시 자동 실행됩니다.

-- Auth Service 데이터베이스
CREATE DATABASE doa_auth;

-- User Service 데이터베이스
CREATE DATABASE doa_users;

-- Product Service 데이터베이스
CREATE DATABASE doa_products;

-- Order Service 데이터베이스
CREATE DATABASE doa_orders;

-- Payment Service 데이터베이스
CREATE DATABASE doa_payments;

-- Shipping Service 데이터베이스
CREATE DATABASE doa_shippings;

-- Seller Service 데이터베이스
CREATE DATABASE doa_sellers;

-- Settlement Service 데이터베이스
CREATE DATABASE doa_settlements;

-- Coupon Service 데이터베이스
CREATE DATABASE doa_coupons;

-- Inventory Service 데이터베이스
CREATE DATABASE doa_inventory;

-- Notification Service 데이터베이스
CREATE DATABASE doa_notifications;

-- Review Service 데이터베이스
CREATE DATABASE doa_reviews;

-- Stats Service 데이터베이스
CREATE DATABASE doa_stats;

-- Banner Service 데이터베이스
CREATE DATABASE doa_banners;

-- 데이터베이스 목록 확인
\c doa_auth;
\c doa_users;
\c doa_products;
\c doa_orders;
\c doa_payments;
\c doa_shippings;
\c doa_sellers;
\c doa_settlements;
\c doa_coupons;
\c doa_inventory;
\c doa_notifications;
\c doa_reviews;
\c doa_stats;
\c doa_banners;

