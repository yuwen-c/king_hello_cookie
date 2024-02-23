require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
// const client = require('./src/config/pg');
const { pool } = require('./src/config/pg');
const { ordersETL} = require('./src/orders/create_order')
const getOrderData = require('./src/orders/get_order_data')
const orderExample = require('./src/orders/order_example');
const logger = require('./src/config/log');
const { batchUpdateOrderStatus, batchUpdatePaymentStatus, batchUpdateDeliveryStatus} = require('./src/orders/update_order');
const exportDataToCSV = require('./src/customers/export_csv');
const exportToExcel = require('./src/customers/export_excel');
const handleErrorOrders = require('./src/orders/handle_error_orders');

const SHOPLINE_API_TOKEN = process.env.SHOPLINE_API_TOKEN;
const SHOPLINE_USER_AGENT = process.env.SHOPLINE_USER_AGENT;

const testShopline = async () => {
  console.log("SHOPLINE_API_TOKEN", SHOPLINE_API_TOKEN)
  try {
    const response = await axios.get('https://open.shopline.io/v1/products', {
      params: {
        per_page: 20,
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

// 2. 變更訂單狀態：
batchUpdateOrderStatus('自訂交易10034970', '自訂交易10035182', 2) // start(含), end「交易平台交易序號」: 

// 3. 變更付款狀態：目前還在第一階段(代入1)
// batchUpdatePaymentStatus('USHOP10002724', 'USHOP10002730', 1)

// 4. 變更出貨狀態：目前還在第一階段(代入1)
// batchUpdateDeliveryStatus('USHOP10002724', 'USHOP10002730', 1)

// 產生顧客檔案，匯出範圍在export_excel.js裡面設定
// exportToExcel(); 

// 1. 創建訂單+log
const createOrders = async (transaction_start, transaction_end, phase) => {
  if(!phase) {
    console.log('需要指定第一階段或第二階段');
    return;
  }
  logger.log('info', { message: '===開始創訂單===', transaction_start, transaction_end });
  await ordersETL(transaction_start, transaction_end, phase);
  logger.log('info', { message: '===創訂單結束===', transaction_start, transaction_end });
}
// 根據第一、第二階段，帶入phase
// createOrders('自訂交易10034387', '自訂交易10034388', 2)

// 5. 處理錯誤訂單
// handleErrorOrders(1) // phase=1 or 2;