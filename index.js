require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const client = require('./src/config/pg');
const { getOrderTransactionId, ordersETL} = require('./src/orders/create_order')
const getOrderData = require('./src/orders/get_order_data')
const orderExample = require('./src/orders/order_example');
const logger = require('./src/config/log');
const { batchUpdateOrderStatus, batchUpdatePaymentStatus, batchUpdateDeliveryStatus} = require('./src/orders/update_order');
const exportDataToCSV = require('./src/customers/export_csv');
const exportToExcel = require('./src/customers/export_excel');

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

// 1. 建立訂單到shopline
// ordersETL('USHOP10002994', 'USHOP10002995') // start, end「交易平台交易序號」: 開頭分 USHOP 和 自訂交易
// start(含), end「交易平台交易序號」: 
// 'USHOP10002724', 'USHOP10002726'
// 'USHOP10002726', 'USHOP10002730'
// 'USHOP10002730', 'USHOP10002740'
// 'USHOP10002740', 'USHOP10002742'
// USHOP10002742, USHOP10002762 ok

// 2. 變更訂單狀態
// batchUpdateOrderStatus('USHOP10002742', 'USHOP10002762')
// start(含), end「交易平台交易序號」: 
// 'USHOP10002724', 'USHOP10002740'
// 'USHOP10002740', 'USHOP10002742'

// 3. 變更付款狀態
// batchUpdatePaymentStatus('USHOP10002742', 'USHOP10002762')

// 4. 變更出貨狀態
// batchUpdateDeliveryStatus('USHOP10002742', 'USHOP10002762')

// 產生顧客檔案，匯出範圍在export_excel.js裡面設定
// exportToExcel(); 

const createOrders = async (transaction_start, transaction_end) => {
  logger.log('info', { message: '開始創訂單與改狀態', transaction_start, transaction_end });
  await ordersETL(transaction_start, transaction_end);
  logger.log('info', { message: '創訂單結束', transaction_start, transaction_end });
}

createOrders('USHOP10020927', 'USHOP10034778') 
