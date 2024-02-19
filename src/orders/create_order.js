// require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
// const client = require('../config/pg');
const { pool } = require('../config/pg');
const Cursor = require('pg-cursor')
const modifyOrder = require('./modify_order')
const getOrderData = require('./get_order_data')
const logger = require('../config/log');
const getCursor = require('./get_cursor');
const { cli } = require('winston/lib/winston/config');
// const beep = require('beepbeep');
const sendMail = require('../config/mailer');
const loggerFire = require('../config/logFireTimestamp');

const SHOPLINE_API_TOKEN = process.env.SHOPLINE_API_TOKEN;
const SHOPLINE_API_TOKEN_KING = process.env.SHOPLINE_API_TOKEN_KING;

const writeOrderShoplineId = async (transaction_unique_id, shopline_id) => {
  const client = await pool.connect();
  if(!shopline_id) {
    // logger.log('error', { message: '寫入shopline id error', error: 'shopline_id不存在', transaction_unique_id});
    client.release();
    return;
  }
  try {
    const result = await client.query("UPDATE orders_malbic SET shopline_id = $1 WHERE 交易平台交易序號 = $2", [shopline_id, transaction_unique_id]);
    console.log('write shopline id success');
  } catch (error) {
    console.log(error);
    logger.log('error', { message: '寫入shopline id error', error});
  }
  finally {
    client.release();
  }
}

// 打shopline create order api
// 每打完一筆要停一秒
const createOrderByAPI = async (order, transaction_unique_id) => {
  const createOrderUrl = 'https://open.shopline.io/v1/orders'
  const requestData = { order };
  const headers = {
    'Authorization': `Bearer ${SHOPLINE_API_TOKEN_KING}`,
    'Content-Type': 'application/json'
  };
  try{
    loggerFire.log('info', { 交易平台交易序號: transaction_unique_id});
    const response = await axios.post(createOrderUrl, requestData, { headers, timeout: 5000 })
    console.log("response.data:", response.data.id); // 存id到db
    return response.data.id;
  }
  catch(error) {
    // logger.log('error', { message: 'create order error', 交易平台交易序號: transaction_unique_id, 錯誤訊息: error.response?.data, keys: Object.keys(error)});
    logger.log('error', { 
      message: 'create order error', 
      交易平台交易序號: transaction_unique_id, 
      錯誤訊息: error, 
      // keys: error.response?.data ? Object.keys(error.response.data) : [] 
    });
    await new Promise(resolve => setTimeout(resolve, 2*60*1000)); // 如果有失敗就睡2min 
  }
  finally {
    // if(lastTwoChars = transaction_unique_id.substring(transaction_unique_id.length - 2) === '00') {
    //   await new Promise(resolve => setTimeout(resolve, 5*60*1000)); 
    // }
    await new Promise(resolve => setTimeout(resolve, 2000)); // 改600看看，因為後面還有寫入shopline id的task，有時會失敗，改800。改回1000。還是會有internal error，改1200。改1400。改3000。
    console.log('sleep 2s');
  }
}

// 修改辨識訂單的唯一值，從交易序號改為「交易平台交易序號」(存在orders_id_platform)
// 已另外將distinct的交易序號存到orders_transaction_id table(直接在DBeaver操作)
const ordersETL = async (transaction_start, transaction_end) => {
  try {
    const { client, cursor } = await getCursor(transaction_start, transaction_end)
    let rows = await cursor.read(1);

    while (rows.length) {
      console.log('rows[0].交易平台交易序號:', rows[0].交易平台交易序號);
      const transaction_unique_id = rows[0].交易平台交易序號;
      const orderData =  await getOrderData(transaction_unique_id)
      console.log('orderData[0].shopline_id:', orderData[0].shopline_id);
      // 確定如果訂單還沒有寫到shopline，才會繼續執行
      if(orderData[0].shopline_id === null || orderData[0].shopline_id === '') {
        const order = modifyOrder(orderData);
        const shoplineId = await createOrderByAPI(order, transaction_unique_id);
        await writeOrderShoplineId(transaction_unique_id, shoplineId);
      }
      else{
        console.log(`${transaction_unique_id}已有shopline_id，不執行後續動作`);
      }
      // 讀下一筆
      rows = await cursor.read(1);
    }
    // 關閉cursor
    cursor.close(() => {
      console.log('cursor.close');
      client.release()
    })
  } catch (error) {
    console.log(error);
  }
  finally {
    process.stdout.write('\u0007');
    sendMail(transaction_start, transaction_end);
  }
}

module.exports = {
  // getOrderTransactionId,
  ordersETL,
};