-- 相關tables:
-- 1. 全部莫比克會員資料 已經有
-- 2. shopline匯出會員資料 已經有
-- 3. 兩者union: customer_tag_union

-- union on: email


CREATE TABLE public.customers_tag_union (
	顧客id varchar(100) NULL,
	全名 varchar(100) NULL,
	電郵 varchar(100) NULL,
	會員等級 varchar(50) NULL,
	標籤更新狀態 varchar(20) NULL DEFAULT NULL::character varying
);

INSERT INTO customers_tag_union (顧客id, 全名, 電郵, 會員等級)
SELECT 
    sec."顧客ID" as 顧客id, 
    cmm.姓名 as 全名,
    cmm.會員帳號 as 電郵, 
    cmm.會員等級 as 會員等級
FROM 
    customers_mailbic_mandarin_all_2 cmm
FULL JOIN 
    shopline_export_customers_2 sec ON LOWER(cmm.會員帳號) = LOWER(sec.電郵)
WHERE 
    cmm.會員等級 != '一般';