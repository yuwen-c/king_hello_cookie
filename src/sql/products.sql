CREATE TABLE products_mailbic (
    product_handle VARCHAR(20), -- 商品編號
    product_name VARCHAR(100), -- 商品名稱
    style VARCHAR(100), -- 樣式
    flavor VARCHAR(100), -- 尺寸
    quantity INT, -- 實際庫存
    price INT -- 售價
    has_variant BOOLEAN, -- 是否有子類
);

-- 1. 改成匯入20240118 所有產品，到products_malbic_partial_column table (完整欄位因為格式關係無法匯入)
-- 2. 另外alter加上「有子類 boolean」欄位
-- 寫入「是否有子類」到欄位中：

-- 新table 判斷更新有子類column ok
UPDATE products_malbic_partial_column_2 
SET 有子類 = CASE
    WHEN 商品編號 IN (SELECT 商品編號 FROM products_malbic_partial_column_2 GROUP BY 商品編號 HAVING COUNT(*) > 1)
    THEN TRUE
    ELSE FALSE
END;

-- 新table 將產品寫到shopline ok
INSERT INTO products_shopline_2 (
    product_handle, -- 商品編號
    product_name_chinese, -- 商品名稱
    product_description_chinese, -- 樣式
    product_summary_chinese, -- 尺寸
    online_store_status, -- 網店狀態
    images, -- 圖片
    sku, -- SKU
    price, -- 無子類的售價
    quantity, -- 無子類的庫存
    specification_name_a_chinese, -- 規格
    variation_name_a_chinese, -- 尺寸
    variation_price, -- 子類售價
    variation_quantity -- 子類庫存
)
SELECT
    商品編號,
    商品名稱,
    樣式,
    尺寸,
    true, -- 網店上架狀態
    'https://storage.googleapis.com/drive.cdn.mallbic.com/ushop/528/0/logo.png?ts=637387248738134055', -- 圖片
    商品編號, -- SKU
    CASE WHEN 有子類 THEN null ELSE 售價 END AS price,
    CASE WHEN 有子類 THEN null ELSE 實際庫存 END AS quantity,
    CASE WHEN 有子類 THEN '規格' ELSE null END AS specification_name_a_chinese,
    CASE WHEN 有子類 THEN 尺寸 ELSE null END AS variation_name_a_chinese,
    CASE WHEN 有子類 THEN 售價 ELSE null END AS variation_price,
        CASE WHEN 有子類 THEN 實際庫存 ELSE null END AS variation_quantity
FROM products_malbic_partial_column_2;



--- 舊table------------
-- 舊table
-- UPDATE products_mailbic
-- SET has_variant = CASE
--     WHEN product_handle IN (SELECT product_handle FROM products_mailbic GROUP BY product_handle HAVING COUNT(*) > 1)
--     THEN TRUE
--     ELSE FALSE
-- END;

-- 舊table
-- 把products從mailbic轉成shopline需要的格式：
-- INSERT INTO products_shopline (
--     product_handle, -- 商品編號
--     product_name_chinese, -- 商品名稱
--     product_description_chinese, -- 樣式
--     product_summary_chinese, -- 尺寸
--     online_store_status, -- 網店狀態
--     images, -- 圖片
--     sku, -- SKU
--     price, -- 無子類的售價
--     quantity, -- 無子類的庫存
--     specification_name_a_chinese, -- 規格
--     variation_name_a_chinese, -- 尺寸
--     variation_price, -- 子類售價
--     variation_quantity -- 子類庫存
-- )
-- SELECT
--     product_handle,
--     product_name,
--     style,
--     flavor,
--     true, -- 網店上架狀態
--     'https://storage.googleapis.com/drive.cdn.mallbic.com/ushop/528/0/logo.png?ts=637387248738134055', -- 圖片
--     product_handle, -- SKU
--     CASE WHEN has_variant THEN null ELSE price END AS price,
--     CASE WHEN has_variant THEN null ELSE quantity END AS quantity,
--     CASE WHEN has_variant THEN '規格' ELSE null END AS specification_name_a_chinese,
--     CASE WHEN has_variant THEN flavor ELSE null END AS variation_name_a_chinese,
--     CASE WHEN has_variant THEN price ELSE null END AS variation_price,
--         CASE WHEN has_variant THEN quantity ELSE null END AS variation_quantity
-- FROM products_mailbic;


-- shopline 產品table
-- CREATE TABLE products_shopline (
--     product_handle VARCHAR(20),
--     product_name_english VARCHAR(100),
--     product_name_chinese VARCHAR(100),
--     product_summary_english VARCHAR(100),
--     product_summary_chinese VARCHAR(100),
--     product_description_english VARCHAR(100),
--     product_description_chinese VARCHAR(100),
--     seo_title_english VARCHAR(20),
--     seo_title_chinese VARCHAR(20),
--     seo_description_english VARCHAR(20),
--     seo_description_chinese VARCHAR(20),
--     seo_keywords VARCHAR(20),
--     preorder_item boolean,
--     preorder_note_english VARCHAR(20),
--     preorder_note_chinese VARCHAR(20),
--     online_store_status boolean,
--     retail_store_status boolean,
--     images TEXT,
--     additional_images VARCHAR(20),
--     online_store_categories_english VARCHAR(20),
--     online_store_categories_chinese VARCHAR(20),
--     pos_categories_english VARCHAR(20),
--     pos_categories_chinese VARCHAR(20),
--     price numeric,
--     sales_price numeric,
--     product_retail_store_price numeric,
--     cost numeric,
--     sku VARCHAR(20),
--     member_price VARCHAR(20),
--     level_1_price VARCHAR(20),
--     level_2_price VARCHAR(20),
--     level_3_price VARCHAR(20),
--     quantity integer,
--     weight_kg VARCHAR(20),
--     supplier VARCHAR(20),
--     product_tag TEXT,
--     hidden_product boolean,
--     specification_name_a_english VARCHAR(20),
--     specification_name_a_chinese VARCHAR(20),
--     specification_name_b_english VARCHAR(20),
--     specification_name_b_chinese VARCHAR(20),
--     variation_image VARCHAR(20),
--     variation_name_a_english VARCHAR(20),
--     variation_name_a_chinese VARCHAR(100),
--     variation_name_b_english VARCHAR(20),
--     variation_name_b_chinese VARCHAR(20),
--     variation_quantity integer,
--     variation_price numeric,
--     variant_sale_price numeric,
--     variant_retail_store_price numeric,
--     variant_member_price VARCHAR(20),
--     variant_level_1_price VARCHAR(20),
--     variant_level_2_price VARCHAR(20),
--     variant_level_3_price VARCHAR(20),
--     variant_cost numeric,
--     variation_sku VARCHAR(20),
--     variant_weight_kg numeric,
--     barcode VARCHAR(20)
-- );

