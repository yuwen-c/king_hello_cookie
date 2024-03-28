-- 訂單相關table:
-- orders_malbic: 直接匯入舊站訂單，分批次後面加_2, _3, _4
-- orders_id_platform: 交易平台交易序號，也是分批次，後面加_2, _3, _4

-- 1. 開table(依照批次 table_name加上_2...)
-- 2. 這個orders.sql檔案的table name對應修改
-- 3. 匯入莫比克訂單(後來莫比克的訂單無法用google開，要用excel開啟後，另存csv)
-- 4. 處理訂單欄位(以下script)
-- 5. 寫入交易平台交易序號到另外一個table
-- 6. 將訂單欄位mapping加到script (_3, _4)

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


-- 擷取縣市寫到收件者縣市欄位 ok 3ok 4ok 5ok
-- 但發現有很多內含「南投門市、東門市場」的地址，多加一個判斷
-- 還不確定沒有地址的會怎樣 todo
UPDATE orders_malbic_5
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

-- 處理「巿」異體字 (音：福) ok(0 row) ok3(0 row) ok4(0 row) 5(0 row)
UPDATE orders_malbic_5
SET 收件者地址 = REPLACE(收件者地址, '巿', '市')
WHERE 收件者地址 LIKE '%巿%';

-- 縣市的地方需要手動檢查抓到的縣市是否正確： ok4 ok5
-- 肉眼看有沒有錯誤的縣市，手動修改
select distinct(收件者縣市) from orders_malbic_5;

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
--     orders_malbic_5
-- WHERE 
--     交易平台交易序號 = '自訂交易10003206' or 交易平台交易序號 = '自訂交易10003845';

-- 把兩個欄位組合，當成判斷訂單的唯一值
-- ALTER TABLE orders_malbic_5
-- ADD COLUMN 交易平台交易序號 VARCHAR(255);

-- 加入交易平台交易序號 ok (90228 rows) ok3(1343 row) ok3(7529rows) ok4(9014rows)
UPDATE orders_malbic_5
SET 交易平台交易序號 = 交易平台 || 交易序號;

-- 將所有不同的(distinct)交易序號挑出來，插入到 orders_transaction_id 表格中 ok (3377 rows) ok4 ok5(390rows)
insert into orders_id_platform_5 ("交易平台交易序號")
select distinct 交易平台交易序號 from orders_malbic_5;

-- 處理收件者手機，0被去掉的問題，限定2023年的訂單 -- 新訂單無此問題
UPDATE orders_malbic_5
SET "收件者手機" = 
   CASE 
       WHEN "收件者手機無0" IS NULL  AND "建立時間" LIKE '2023%' THEN ''
       WHEN "收件者手機無0" = '' AND "建立時間" LIKE '2023%' THEN ''
       WHEN ("收件者手機無0" IS NOT NULL and  "收件者手機無0" != '') and  "建立時間" LIKE '2023%' THEN CONCAT('0', "收件者手機無0")
   END
WHERE "建立時間" LIKE '2023%';

-- 後來有修改script，可以匯入小數點訂單了。
-- 商品小計、商品單價 有小數點，只能手動處理。 (要注意建立時間在2023上半年) -- 新訂單只有一筆：自訂交易10035019
SELECT DISTINCT ON (交易平台交易序號) 交易平台交易序號, 商品小計, 交易金額, 折扣總額, 運費, 商品單價, 建立時間 
FROM orders_malbic_5
WHERE 商品單價 LIKE '%.%' OR 商品小計 LIKE '%.%';

-- 發現有8079筆交易(商品)的收件者姓名''，出貨類型'尚未選擇' -- 新訂單無此問題
-- 因為沒有收件者姓名無法匯入shopline，所以將這些交易從orders_id_platform刪除
-- 保留交易在orders_malbic_4，只有從交易平台交易序號的地方刪掉
-- 總共刪除16筆，用distinct(交易平台交易序號)看只有16筆
select count(*) from orders_malbic_5 om 
where 收件者姓名='' and 出貨類型 = '尚未選擇';

DELETE FROM orders_id_platform_5
WHERE 交易平台交易序號 IN (
    SELECT distinct(交易平台交易序號) 
    FROM orders_malbic_5
    WHERE 收件者姓名 = '' AND 出貨類型 = '尚未選擇'
);





