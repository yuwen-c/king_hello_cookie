-- 相關tables:
-- 1. 從shopline匯出已匯入的客戶資料： shopline_export_customers_2，已匯入資料(現有購物金、現有點數)
-- 2. 將要從莫比克匯出的最終版~20240307客戶資料： customers_mailbic_mandarin_all_2，已匯入(購物金、紅利點數)
-- 3. 將兩邊有紅利點數、購物金的客戶資料，取聯集：customers_point_union_2，欄位？

-- CREATE TABLE customers_point_union_2 (
--     顧客id VARCHAR(100),
--     全名 VARCHAR(100),
--     電郵 VARCHAR(100),
--     現有購物金 INT,
--     現有點數 INT,
--     莫比克購物金 INT,
--     莫比克紅利點數 INT
-- );


-- INSERT INTO customers_point_union_2 (顧客id, 全名, 電郵, 現有購物金, 現有點數, 莫比克購物金, 莫比克紅利點數)
-- SELECT 
--     sec."顧客ID" as 顧客id, 
--     cmma.姓名 as 全名,
--     cmma.會員帳號 as 電郵, 
--     sec.現有購物金 as 現有購物金, 
--     sec.現有點數 as 現有點數, 
--     cmma.購物金 as 莫比克購物金, 
--     cmma.紅利點數 as 莫比克紅利點數
-- FROM 
--     customers_mailbic_mandarin_all_2 cmma
-- JOIN 
--     shopline_export_customers_2 sec ON cmma.會員帳號 = sec.電郵
-- WHERE 
--     cmma.購物金 != 0 OR cmma.紅利點數 != 0 OR sec.現有購物金 != 0 OR sec.現有點數 != 0;

-- INNER JOIN，不是這個版本！！！！
-- 先用cmm table測試
-- 明明cmm table有點數的有3886筆，卻只有插入3819筆？？
INSERT INTO customers_point_union_2 (顧客id, 全名, 電郵, 現有購物金, 現有點數, 莫比克購物金, 莫比克紅利點數)
SELECT 
    sec."顧客ID" as 顧客id, 
    cmm.姓名 as 全名,
    cmm.會員帳號 as 電郵, 
    sec.現有購物金 as 現有購物金, 
    sec.現有點數 as 現有點數, 
    cmm.購物金 as 莫比克購物金, 
    cmm.紅利點數 as 莫比克紅利點數
FROM 
    customers_mailbic_mandarin_all_2 cmm
JOIN 
    shopline_export_customers_2 sec ON cmm.會員帳號 = sec.電郵
WHERE 
    cmm.購物金 != 0 OR cmm.紅利點數 != 0 OR sec.現有購物金 != 0 OR sec.現有點數 != 0;

-- LEFT JOIN，不是這個版本！！！！
-- 我将JOIN改为了LEFT JOIN，这意味着customers_mailbic_mandarin_all_2表中的所有行都会被包括在结果中，
-- 并且如果shopline_export_customers_2表中没有匹配的行，那么对应的列会用NULL填充。
INSERT INTO customers_point_union_2 (顧客id, 全名, 電郵, 現有購物金, 現有點數, 莫比克購物金, 莫比克紅利點數)
SELECT 
    sec."顧客ID" as 顧客id, 
    cmm.姓名 as 全名,
    cmm.會員帳號 as 電郵, 
    sec.現有購物金 as 現有購物金, 
    sec.現有點數 as 現有點數, 
    cmm.購物金 as 莫比克購物金, 
    cmm.紅利點數 as 莫比克紅利點數
FROM 
    customers_mailbic_mandarin_all_2 cmm
LEFT JOIN 
    shopline_export_customers_2 sec ON cmm.會員帳號 = sec.電郵
WHERE 
    cmm.購物金 != 0 OR cmm.紅利點數 != 0 OR sec.現有購物金 != 0 OR sec.現有點數 != 0;

-- FULL JOIN，最終使用的版本。比數有核對過，正確。
-- FULL JOIN...3890 rows
-- 改用LOWER -> 3887 rows
INSERT INTO customers_point_union_2 (顧客id, 全名, 電郵, 現有購物金, 現有點數, 莫比克購物金, 莫比克紅利點數)
SELECT 
    sec."顧客ID" as 顧客id, 
    cmm.姓名 as 全名,
    cmm.會員帳號 as 電郵, 
    sec.現有購物金 as 現有購物金, 
    sec.現有點數 as 現有點數, 
    cmm.購物金 as 莫比克購物金, 
    cmm.紅利點數 as 莫比克紅利點數
FROM 
    customers_mailbic_mandarin_all_2 cmm
FULL JOIN 
    shopline_export_customers_2 sec ON LOWER(cmm.會員帳號) = LOWER(sec.電郵)
WHERE 
    cmm.購物金 != 0 OR cmm.紅利點數 != 0 OR sec.現有購物金 != 0 OR sec.現有點數 != 0;
-- 本來ON的條件是：cmm.會員帳號 = sec.電郵
-- 但是shopline存的是小寫，所以要改成：LOWER(cmm.會員帳號) = LOWER(sec.電郵)

-- 確定寫進去的筆數，看起來是合理的了，
-- query看看有沒有null的欄位，還真的有！
-- 資料看起來，是email有大寫的問題，shopline會存成小寫
-- `cmm.會員帳號 = sec.電郵` → 這邊應該可以加個轉換？ok