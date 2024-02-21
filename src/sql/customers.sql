-- mailbic 顧客table
-- CREATE TABLE customers_mailbic (
--     name VARCHAR(255),
--     phone VARCHAR(255),
--     address VARCHAR(255),
--     email VARCHAR(255),
--     birthday VARCHAR(255),
--     store_credits INTEGER, -- 購物金
--     member_points INTEGER, -- 紅利點數/ 會員點數
--     total_spend INTEGER, -- 累積消費金額
--     membership_tier VARCHAR(20), -- 會員等級/ 會員級別
--     notes VARCHAR(100) -- 會員備註
-- );

-- shopline 顧客table
-- CREATE TABLE customers_shopline (
--     full_name VARCHAR(100), -- 姓名
--     email_address VARCHAR(255), -- email
--     country_calling_code VARCHAR(20), -- 國際電話區碼 886
--     mobile_number VARCHAR(255), -- 手機號碼
--     gender VARCHAR(20),
--     birthday DATE, -- 生日
--     language VARCHAR(20),
--     is_member VARCHAR(20), -- 是否為會員，如果填Y，可以發送mail通知改密碼
--     accepts_marketing VARCHAR(20),
--     tags TEXT, -- 把會員等級寫在這裡：「會員等級: 一般/ VIP」
--     note TEXT, -- 備註
--     register_from VARCHAR(20),
--     register_store_id VARCHAR(20),
--     register_date VARCHAR(20),
--     total_spend NUMERIC, -- 累積消費金額
--     order_is_accumulation BOOLEAN,
--     membership_tier VARCHAR(20), -- X 會員級別-> 需要經過設定，不能直接寫
--     store_credits INTEGER, -- 購物金
--     reason_for_adding_credits VARCHAR(20),
--     expiry_date_of_credits DATE,
--     member_points INTEGER, -- 紅利點數/ 會員點數
--     reason_for_adding_points VARCHAR(20),
--     country_calling_code_of_contact_phone VARCHAR(20),
--     contact_phone VARCHAR(100),
--     address_recipient_name VARCHAR(100), -- 送貨地址 - 收件人姓名
--     address_country_calling_code_of_recipient_phone_number VARCHAR(20), -- 送貨地址 - 電話國碼
--     address_recipient_phone_number VARCHAR(100), -- 送貨地址 - 電話號碼
--     address_1 VARCHAR(255), -- 送貨地址 - 1
--     address_2 VARCHAR(255),
--     address_city VARCHAR(20), -- 送貨地址 - 城市
--     address_district_state_province VARCHAR(20),
--     address_postcode VARCHAR(20),
--     address_country VARCHAR(20), -- 送貨地址 - 國家TW
--     original_address VARCHAR(255)
-- );

-- 初步顧客資料格式轉換，先把地址塞在original_address裡面，還沒拆 ok*2
INSERT INTO customers_shopline_2 (
    full_name,
    email_address,
    country_calling_code,
    mobile_number,
    birthday,
    is_member,
    tags,
    note,
    total_spend,
    member_points,
    store_credits,
    original_address
)
SELECT
    COALESCE(NULLIF(姓名, ''), '使用者'), -- 沒有名字的塞使用者進去
    會員帳號,
    CASE WHEN 電話 <> '' THEN '886' ELSE NULL END, -- 根據 phone 有無填寫 country_calling_code
    電話,
    CASE WHEN 生日 = '' THEN NULL ELSE TO_DATE(生日, 'YYYY-MM-DD') END,
    'Y', -- 寫為會員
    CONCAT('舊站-會員級別-', customers_mailbic_mandarin_2.會員等級, ',') AS tags, -- 所有要加的tag前面都要加上「舊站-」
    case when 會員備註 = '' then null else CONCAT('舊站-會員備註-', customers_mailbic_mandarin_2.會員備註, ',') end,
    null,  -- 交易總金額應該直接寫null
    NULLIF(紅利點數, 0), -- 使用 NULLIF 將為 0 的值轉為 NULL
    NULLIF(購物金, 0),   
    地址
FROM customers_mailbic_mandarin_2;


-- 把original_address有門市的刪 ok*2
UPDATE customers_shopline_2
SET original_address = ''
WHERE original_address LIKE '%門市%';

-- 先判斷縣，再判斷市，如果都沒有就留空 ok*2
UPDATE customers_shopline_2
SET address_city = 
  CASE
    WHEN POSITION('縣' IN original_address) > 0 
    THEN substring(original_address FROM position('縣' IN original_address) - 2 FOR 3)
    
    WHEN POSITION('市' IN original_address) > 0 
    THEN substring(original_address FROM position('市' IN original_address) - 2 FOR 3)
    
    ELSE NULL
  END
WHERE POSITION('縣' IN original_address) > 0 OR POSITION('市' IN original_address) > 0;


-- 把 > 2011的生日改成null ok*2
update customers_shopline_2
set birthday = null
WHERE birthday >= DATE '2011-01-01';

-- 把電話寫到備註，接在原本的備註後面。之後再把有問題的電話刪除。ok*2
update customers_shopline_2 
set note =
case 
	when (note is not null and note !='') then concat(note, '舊站電話-', mobile_number, '。')
	else concat('舊站電話-', mobile_number, '。')
end
where mobile_number is not null and mobile_number !='';

-- 電話移除'-'，包含手機、非手機都移除 ok*2
UPDATE customers_shopline_2
SET mobile_number = REPLACE(mobile_number, '-', '')
WHERE mobile_number LIKE '%-%';

-- 把不是手機的刪除 ok*2
update customers_shopline_2 
set mobile_number = null 
where length(mobile_number) != 10 or mobile_number not like '09%';

-- 把空電話的886刪除 ok*2
update customers_shopline_2 
set country_calling_code = null 
where mobile_number is null;


-- 如果address_city有值，再去寫收件人欄位。address_1會把縣市刪除 ??? 如果沒有mobile
-- 先用回這種試試看。
UPDATE customers_shopline_2
SET address_recipient_name = full_name,
    address_country_calling_code_of_recipient_phone_number = '886',
    address_recipient_phone_number = mobile_number,
    address_1 = REPLACE(original_address, address_city, ''),
    address_country = 'TW'
WHERE address_city IS NOT NULL;
-- 1. 收件人地址 ok ----此方法做出來無法匯入shopline
-- UPDATE customers_shopline_2
-- SET address_recipient_name = full_name,
--     address_1 = REPLACE(original_address, address_city, ''),
--     address_country = 'TW'
-- WHERE address_city IS NOT NULL;
-- 2. 收件人電話 ok ----此方法做出來無法匯入shopline
-- UPDATE customers_shopline_2
-- SET address_country_calling_code_of_recipient_phone_number = '886',
--     address_recipient_phone_number = mobile_number
-- WHERE address_city IS NOT null and mobile_number is not null;

-- 檢查mobile_number有沒有重複 (不確定資料大時跑是否ok)
SELECT mobile_number
FROM customers_shopline_2
GROUP BY mobile_number
HAVING COUNT(*) > 1;

-- 把重複的電話刪除，只留下email比較小的-----不然如果有重複的電話，會兩筆都無法匯入shopline ok*2
UPDATE customers_shopline_2 AS c
SET mobile_number = NULL
WHERE EXISTS (
   SELECT 1
   FROM customers_shopline_2 AS c2
   WHERE c2.mobile_number = c.mobile_number
   AND c2.email_address < c.email_address
);

-- 之後要再跑一次，清除886 --- ok*2
update customers_shopline_2 
set country_calling_code = null 
where mobile_number is null;



-- 舊版資料備查 -----------------------------------------------------
-- 舊版的轉換mailbic到shopline，後來欄位跟table都有改(為了要把欄位改成中文)
INSERT INTO customers_shopline (
    full_name,
    email_address,
    country_calling_code,
    mobile_number,
    birthday,
    is_member,
    tags,
    note,
    total_spend,
    member_points,
    store_credits,
    original_address
)
SELECT
    COALESCE(NULLIF(name, ''), '使用者'), -- 使用 COALESCE 函數來判斷 name 是否為 null,
    email,
    CASE WHEN phone <> '' THEN '886' ELSE NULL END, -- 根據 phone 有無填寫 country_calling_code
    phone,
    CASE WHEN birthday = '' THEN NULL ELSE TO_DATE(birthday, 'YYYY-MM-DD') END,
    'Y', -- 看客戶要不要寄發信件通知改密碼
    CONCAT('舊站-會員級別-', customers_mailbic.membership_tier, ',') AS tags, -- 所有要加的tag前面都要加上「舊站-」
    notes,
    NULLIF(total_spend, 0), -- 使用 NULLIF 將 total_spend 為 0 的值轉為 NULL
    NULLIF(member_points, 0), -- 使用 NULLIF 將 total_spend 為 0 的值轉為 NULL
    NULLIF(store_credits, 0), -- 使用 NULLIF 將 total_spend 為 0 的值轉為 NULL    
    address
FROM customers_mailbic;

-- 先刪掉name是空白的row: 
-- DELETE FROM customers_mailbic
-- WHERE name IS NULL OR name = '';
--UPDATE customers_shopline
--SET name = '使用者'
--WHERE name = '' OR name IS NULL;