-- public.customers_shopline definition

-- Drop table

-- DROP TABLE public.customers_shopline;

CREATE TABLE public.customers_shopline (
	full_name varchar(100) NULL,
	email_address varchar(255) NULL,
	country_calling_code varchar(20) NULL,
	mobile_number varchar(255) NULL,
	gender varchar(20) NULL,
	birthday date NULL,
	"language" varchar(20) NULL,
	is_member varchar(20) NULL,
	accepts_marketing varchar(20) NULL,
	tags text NULL,
	note text NULL,
	register_from varchar(20) NULL,
	register_store_id varchar(20) NULL,
	register_date varchar(20) NULL,
	total_spend numeric NULL,
	order_is_accumulation bool NULL,
	membership_tier varchar(20) NULL,
	store_credits int4 NULL,
	reason_for_adding_credits varchar(20) NULL,
	expiry_date_of_credits date NULL,
	member_points int4 NULL,
	reason_for_adding_points varchar(20) NULL,
	country_calling_code_of_contact_phone varchar(20) NULL,
	contact_phone varchar(100) NULL,
	address_recipient_name varchar(100) NULL,
	address_country_calling_code_of_recipient_phone_number varchar(20) NULL,
	address_recipient_phone_number varchar(100) NULL,
	address_1 varchar(255) NULL,
	address_2 varchar(255) NULL,
	address_city varchar(20) NULL,
	address_district_state_province varchar(20) NULL,
	address_postcode varchar(20) NULL,
	address_country varchar(20) NULL,
	original_address varchar(255) NULL
);