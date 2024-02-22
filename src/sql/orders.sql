
-- CREATE TABLE public.orders_malbic (
-- 	shopline_id varchar(50) NULL, -- 自行新增欄位
-- 	交易序號 varchar(100) NULL,
-- 	訂單編號 varchar(100) NULL,
-- 	出貨類型 varchar(100) NULL,
-- 	收件者姓名 varchar(100) NULL,
-- 	收件者手機 varchar(100) NULL,
-- 	訂購者電話日 varchar(100) NULL,
-- 	訂購者電話夜 varchar(100) NULL,
-- 	收件者地址 varchar(100) NULL,
-- 	店家備註 varchar(500) NULL,
-- 	取消原因 varchar(100) NULL,
-- 	訂單狀態 varchar(100) NULL,
-- 	買家姓名 varchar(200) NULL,
-- 	出貨單號 varchar(100) NULL,
-- 	交易平台 varchar(100) NULL,
-- 	交易金額 varchar(100) NULL,
-- 	會員帳號 varchar(100) NULL,
-- 	商品編號 varchar(100) NULL,
-- 	出貨日期 varchar(100) NULL,
-- 	買家備註 varchar(500) NULL,
-- 	商品資訊 varchar(100) NULL,
-- 	小計數量 varchar(100) NULL,
-- 	商品名稱 varchar(100) NULL,
-- 	商品樣式 varchar(100) NULL,
-- 	商品單價 varchar(100) NULL,
-- 	付款資訊 varchar(100) NULL,
-- 	配貨時間 varchar(100) NULL,
-- 	建立時間 varchar(100) NULL,
-- 	配送狀態 varchar(100) NULL,
-- 	買家email varchar(100) NULL,
-- 	運費 varchar(100) NULL,
-- 	郵遞區號 varchar(50) NULL,
-- 	出貨備註 varchar(200) NULL,
-- 	商品備註 varchar(100) NULL,
-- 	確認日期 varchar(100) NULL,
-- 	付款方式 varchar(100) NULL,
-- 	取消日期 varchar(100) NULL,
-- 	付款日期 varchar(100) NULL,
-- 	折扣總額 varchar(100) NULL,
-- 	使用購物金 varchar(50) NULL,
-- 	交易店鋪 varchar(50) NULL,
-- 	系統備註 varchar(100) NULL,
-- 	配送狀態時間 varchar(100) NULL,
-- 	商品小計 varchar(100) NULL,
-- 	優惠折扣 varchar(100) NULL,
-- 	自訂折扣 varchar(100) NULL,
-- 	店家名稱 varchar(100) NULL,
-- 	子交易數量 varchar(50) NULL,
-- 	配貨狀態 varchar(100) NULL,
-- 	收件者縣市 varchar(100) NULL, -- 自行新增欄位
-- );

/*
* 訂單需要處理的欄位：
* 1. 交易序號+交易平台 -> 寫交易平台交易序號 ok
* 1-1. 另外取單一個交易平台交易序號，寫到orders_id_platform ok
* 2. 收件者手機無0 -> 補0到收件址手機欄位 ok
* 3. 收件者地址 -> 擷取縣市寫到收件者縣市欄位 ok
*/
/*
* 20240222處理第二批訂單：
* 1. 兩個需要的table開_2
* 2. 把這邊的sql table rename成_2
* 3. 開始跟著底下的sql執行
*/


-- 擷取縣市寫到收件者縣市欄位 ok
-- 但發現有很多內含「南投門市、東門市場」的地址，多加一個判斷
-- 還不確定沒有地址的會怎樣 todo
UPDATE orders_malbic_2
SET 收件者縣市 = 
  CASE
    WHEN POSITION('縣' IN 收件者地址) > 0 
		THEN substring(收件者地址 FROM position('縣' IN 收件者地址) - 2 FOR 3)
    
		WHEN POSITION('市' IN 收件者地址) > 0 THEN 
      CASE
        WHEN substring(收件者地址 FROM position('市' IN 收件者地址) - 2 FOR 3) LIKE '%門市%' THEN NULL
        ELSE substring(收件者地址 FROM position('市' IN 收件者地址) - 2 FOR 3)
      END
    ELSE NULL
  END
WHERE POSITION('縣' IN 收件者地址) > 0 OR POSITION('市' IN 收件者地址) > 0;

-- 處理「巿」異體字 (音：福) ok(0 row)
UPDATE orders_malbic_2
SET 收件者地址 = REPLACE(收件者地址, '巿', '市')
WHERE 收件者地址 LIKE '%巿%';

-- 在查為什麼有的地址縣市更新無效：結果對方打的是「巿」
-- SELECT 
--     交易平台交易序號,
--     收件者地址,
--     CASE
--         WHEN 收件者地址 LIKE '%縣%' THEN '包含縣'
--         WHEN 收件者地址 LIKE '%市%' THEN '包含市'
--         ELSE '不包含縣或市'
--     END AS 是否包含縣市
-- FROM 
--     orders_malbic_2
-- WHERE 
--     交易平台交易序號 = '自訂交易10003206' or 交易平台交易序號 = '自訂交易10003845';

-- 把兩個欄位組合，當成判斷訂單的唯一值
-- ALTER TABLE orders_malbic_2
-- ADD COLUMN 交易平台交易序號 VARCHAR(255);

-- 加入交易平台交易序號 ok (90228 rows)
UPDATE orders_malbic_2
SET 交易平台交易序號 = 交易平台 || 交易序號;

-- 將所有不同的(distinct)交易序號挑出來，插入到 orders_transaction_id 表格中 ok (3377 rows)
insert into orders_id_platform_2 ("交易平台交易序號")
select distinct 交易平台交易序號 from orders_malbic_2;

-- 處理收件者手機，0被去掉的問題，限定2023年的訂單 -- 新訂單無此問題
UPDATE orders_malbic_2
SET "收件者手機" = 
   CASE 
       WHEN "收件者手機無0" IS NULL  AND "建立時間" LIKE '2023%' THEN ''
       WHEN "收件者手機無0" = '' AND "建立時間" LIKE '2023%' THEN ''
       WHEN ("收件者手機無0" IS NOT NULL and  "收件者手機無0" != '') and  "建立時間" LIKE '2023%' THEN CONCAT('0', "收件者手機無0")
   END
WHERE "建立時間" LIKE '2023%';

-- 商品小計、商品單價 有小數點，只能手動處理。 (要注意建立時間在2023上半年) -- 新訂單只有一筆：自訂交易10035019
SELECT DISTINCT ON (交易平台交易序號) 交易平台交易序號, 商品小計, 交易金額, 折扣總額, 運費, 商品單價, 建立時間 
FROM orders_malbic_2 
WHERE 商品單價 LIKE '%.%' OR 商品小計 LIKE '%.%';

-- 發現有8079筆交易(商品)的收件者姓名''，出貨類型'尚未選擇' -- 新訂單無此問題
-- 因為沒有收件者姓名無法匯入shopline，所以將這些交易從orders_id_platform刪除
-- 保留交易在orders_malbic_2，只有從交易平台交易序號的地方刪掉
-- 總共刪除16筆，用distinct(交易平台交易序號)看只有16筆
select count(*) from orders_malbic_2 om 
where 收件者姓名='' and 出貨類型 = '尚未選擇';

DELETE FROM orders_id_platform_2
WHERE 交易平台交易序號 IN (
    SELECT distinct(交易平台交易序號) 
    FROM orders_malbic_2 
    WHERE 收件者姓名 = '' AND 出貨類型 = '尚未選擇'
);





