const axios = require('axios');
const fs = require('fs');
const { pool } = require('../config/pg');
const loggerErrorOrders = require('../config/logErrorOrders');
const { ORDER_TABLE_MAPPING } = require('./utils');

const SHOPLINE_API_TOKEN_KING = process.env.SHOPLINE_API_TOKEN_KING;

const getErrorOrders = async (client, phase) => {
  console.log('getErrorOrders'); // ok
  const table = phase === 1 ? ORDER_TABLE_MAPPING.FIRST_PHASE.ORDERS : ORDER_TABLE_MAPPING.SECOND_PHASE.ORDERS;
  const query = `select distinct(交易平台交易序號) from ${table} om 
  where shopline_id is null and 交易平台 = 'USHOP'
  order by 交易平台交易序號 ASC;`;
  try {
    const result = await client.query(query);
    // console.log("getErrorOrders - result.rows:", result.rows);
    return result.rows;
  }
  catch(error) {
    loggerErrorOrders.log('error', { message: '查詢db失敗', 錯誤訊息: error});
    console.log("error:", error);
  }
}


const searchOrders = async (order_id) => {
  console.log('order_id:', order_id); // ok
  const searchOrderUrl = 'https://open.shopline.io/v1/orders/search';
  const params = {
    page: 1,
    per_page: 10,
    query: order_id,
  };
  const headers = {
    'Accept': 'application/json',
    'Authorization': `Bearer ${SHOPLINE_API_TOKEN_KING}`
  };
  try{
    const response = await axios.get(searchOrderUrl, { params, headers });
    console.log("response.data:", response.data);
    if(response.data.items.length > 0) {
      if(response.data.items.length === 1) {
        const { id } = response.data.items[0];
        loggerErrorOrders.log('info', { message: '寫入交易平台交易序號', 交易平台交易序號: order_id, shopline_id: id});
        console.log(`寫入交易平台交易序號：${order_id} 的shopline_id = ${id}`);
        return id;
      }
      else {
        loggerErrorOrders.log('info', { message: '有多筆訂單，需要手動查詢', 交易平台交易序號: order_id});
        console.log(`${order_id}有多筆訂單，需要手動查詢`);
      }
    }
    else {
      loggerErrorOrders.log('info', { message: '沒有找到訂單', 交易平台交易序號: order_id});
      console.log(`${order_id}沒有找到訂單`);
    }
  }
  catch(error) {
    loggerErrorOrders.log('error', { message: '查詢訂單失敗', 錯誤訊息: error, 交易平台交易序號: order_id});
    console.log("error:", error);
  }
}

const writeOrderShoplineId = async (client, transaction_unique_id, shopline_id, phase) => {
  console.log('transaction_unique_id:', transaction_unique_id, 'shopline_id:', shopline_id);
  const table = phase === 1 ? ORDER_TABLE_MAPPING.FIRST_PHASE.ORDERS : ORDER_TABLE_MAPPING.SECOND_PHASE.ORDERS;
  try {
    const result = await client.query(`UPDATE ${table} SET shopline_id = $1 WHERE 交易平台交易序號 = $2`, [shopline_id, transaction_unique_id]);
    console.log(`${transaction_unique_id} write shopline id success`);
  } catch (error) {
    console.log(error);
    loggerErrorOrders.log('error', { message: '寫入shopline id error', error});
  }
}

// 1. 查詢db中沒有shopline_id的「交易平台交易序號」
// 2. 透過shopline api查詢shopline_id
// 3. 存shopline_id到db
// 4. 如果沒有，再手動處理。需要寫到logger
const handleErrorOrders = async (phase) => {
  if(!phase){
    console.log('需要指定第一階段或第二階段');
    return;
  }
  loggerErrorOrders.log('info', { message: '=== 開始處理錯誤訂單==='});
  const client = await pool.connect();
  try {
    const errorOrders = await getErrorOrders(client, phase);
    // console.log('errorOrders', errorOrders); // ok
    // const getSampleOrders = errorOrders.slice(0, 8);
    for(let i = 0; i < errorOrders.length; i++) {
      const shopline_id = await searchOrders(errorOrders[i]['交易平台交易序號']);
      await new Promise(resolve => setTimeout(resolve, 1000));
      if(shopline_id) {
        await writeOrderShoplineId(client, errorOrders[i]['交易平台交易序號'], shopline_id, phase);
      }
    }
  }
  catch(error) {
    console.log("error:", error);
  }
  finally {
    client.release();
    loggerErrorOrders.log('info', { message: '=== 處理錯誤訂單結束==='});
  }
}

module.exports = handleErrorOrders;
