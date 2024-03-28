require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
// const client = require('./src/config/pg');
const { pool } = require('./src/config/pg');
const { createOrders } = require('./src/orders/create_order')
const getOrderData = require('./src/orders/get_order_data')
const orderExample = require('./src/orders/order_example');
const { logger } = require('./src/config/log');
const { createOrderLogger, updateOrderStatusLogger, updatePaymentStatusLogger } = require('./src/config/log_dynamic_path');
const { batchUpdateOrderStatus, batchUpdatePaymentStatus, batchUpdateDeliveryStatus, batchUpdateAllStatus} = require('./src/orders/update_order');
const exportDataToCSV = require('./src/customers/export_csv');
const exportToExcel = require('./src/customers/export_excel');
const handleErrorOrders = require('./src/orders/handle_error_orders');
const { getCustomerDataAndUpdateShopline, getCustomerIdAndUpdateShoplinePointsAndTable, getCustomerShoplinePointsBalance } = require('./src/customers/update_customer');
const { deleteWavenetCustomerBatch } = require('./src/customers/delete_user');
const cancelOrder = require('./src/orders/cancel_order');
const { checkPoints } = require('./src/customers/check_points');
const { updateCustomerTags, updateTagsWithShoplineAPI } = require('./src/customers/update_tags');

const SHOPLINE_API_TOKEN = process.env.SHOPLINE_API_TOKEN;
const SHOPLINE_USER_AGENT = process.env.SHOPLINE_USER_AGENT;

const testShopline = async () => {
  console.log("SHOPLINE_API_TOKEN", SHOPLINE_API_TOKEN)
  try {
    const response = await axios.get('https://open.shopline.io/v1/products', {
      params: {
        per_page: 5,
        page: 1
      },
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${SHOPLINE_API_TOKEN}`,
        'User-Agent': SHOPLINE_USER_AGENT
      }
    });
    console.log(response.data);
    // fs.writeFileSync('./data/product.json', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log(error);
  }
}

const testCreateOrder = async (order) => {
  console.log('SHOPLINE_API_TOKEN', SHOPLINE_API_TOKEN);
  const createOrderUrl = 'https://open.shopline.io/v1/orders'
  const requestData = {
    order
  };
  const headers = {
    'Authorization': `Bearer ${SHOPLINE_API_TOKEN}`,
    'Content-Type': 'application/json'
  };
  try{
    const response = await axios.post(createOrderUrl, requestData, { headers })
    console.log("response.data:", response.data.id); // 存id到db
  }
  catch(error) {
    console.log("error:", error.response.data);
  }
}


// testCreateOrder(orderExample);
// getOrderTransactionId('10002904'); // 建立訂單，使用交易序號，後來發現不是唯一值

// 1. 建立訂單到shopline (後來改用下面的createOrders)
// ordersETL('USHOP10002994', 'USHOP10002995') // start, end「交易平台交易序號」: 開頭分 USHOP 和 自訂交易

// 2. 變更訂單狀態：根據第一、第二、第三階段，帶入phase: 'first', 'second', 'third'
// batchUpdateOrderStatus('USHOP10036961', 'USHOP10036962', 2) // start(含), end「交易平台交易序號」: 

// 3. 變更付款狀態：根據第一、第二、第三階段，帶入phase: 'first', 'second', 'third'
// batchUpdatePaymentStatus('自訂交易10003000', '自訂交易10003001', 1)

// 4. 變更出貨狀態：根據第一、第二、第三階段，帶入phase: 'first', 'second', 'third'
// batchUpdateDeliveryStatus('USHOP10025625', 'USHOP10025626', 1)

// 產生顧客檔案，匯出範圍在export_excel.js裡面設定
// exportToExcel(); 

// 1. 創建訂單+log。根據第一、第二、第三階段，帶入phase: 'first', 'second', 'third'
createOrders('USHOP10037965', 'USHOP10037970', 'fifth')

// 5. 處理錯誤訂單
// handleErrorOrders(1) // 根據第一、第二、第三階段，帶入phase: 'first', 'second', 'third'

// 一次修改一筆訂單的三種狀態
// updateAllStatus('USHOP10004577', 'first')

// 一次修改整批訂單的三種狀態
// batchUpdateAllStatus('自訂交易10035150', '自訂交易10035391', 'fourth')

// 更新客戶紅利點數
// getCustomerIdAndUpdateShoplinePointsAndTable();

// 檢查shopline點數是否正確
// checkPoints();

// 修改客戶tags
// bill 65efafb0199d200028040235
// 國王你好 65f416390ec5c8000a7fc593
// updateTagsWithShoplineAPI('65f416390ec5c8000a7fc593', 'VIP')
// updateCustomerTags();