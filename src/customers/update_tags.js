const axios = require('axios');
const { pool } = require('../config/pg');
const Cursor = require('pg-cursor')
const { updateCustomerTagsLogger } = require('../config/log_dynamic_path');

const SHOPLINE_API_TOKEN_KING = process.env.SHOPLINE_API_TOKEN_KING;
const SHOPLINE_USER_AGENT_KING = process.env.SHOPLINE_USER_AGENT_KING;

/**
 * 改用這隻API: Add or Remove Customer tags, PATCH
 */

/**
 * 1. 讀取全部會員table_2
 * 2. 挑出級別「不是一般」的會員
 * 3. 組合tag
 * 4. 打api
 * 5. 加logger
 */

// status: 'success' or 'fail'
const writeStatusToDb = async (customer_id, status) => {
  const client = await pool.connect();
  const query = `update customers_tag_union set 標籤更新狀態 = $1 where 顧客id = $2;`;
  const values = [status, customer_id];
  await client.query(query, values);
  client.release();
  return;
}

const updateTagsWithShoplineAPI = async (customer_id, level) => {
  console.log('updateTagsWithShoplineAPI: ', customer_id, level, [`0325-${level}`]);
  try{          
    const URL = `https://open.shopline.io/v1/customers/${customer_id}/tags`;
    console.log("URL", URL);
    const headers = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${SHOPLINE_API_TOKEN_KING}`,
      'Content-Type': 'application/json'
    };
    const data = {
      tags: [`0325-${level}`], // ['0325-vip'] or ['0325-vvip']
      update_mode: 'add'
    };
    console.log("data", data);
    const response = await axios.patch(URL, data, { headers });
    console.log('updateTagsWithShoplineAPI response: ', response.data);
    if(response && response.data && response.data.tags && response.data.tags.length > 0){
      await writeStatusToDb(customer_id, 'success');
      updateCustomerTagsLogger.info(`${customer_id}updateTagsWithShoplineAPI: ${level}`, response.data.tags);
    }
    else{
      await writeStatusToDb(customer_id, 'fail');
      updateCustomerTagsLogger.error(`${customer_id}updateTagsWithShoplineAPI: ${level}`, response.data);
    }
    return;
  }
  catch(error){
    const data = error.response.data || {};
    console.log('updateTagsWithShoplineAPI error: ', error.response.data);
    updateCustomerTagsLogger.error(`${customer_id}updateTagsWithShoplineAPI: ${tags}`, data);
    return;
  }
};

const updateCustomerTags = async () => {
  updateCustomerTagsLogger.log('info', { message: '===開始更新會員等級==='}); 
  const client = await pool.connect();
  try{
    const query = `select 顧客id, 會員等級 from customers_tag_union 
    where 標籤更新狀態 is null;`;
    const cursor = client.query(new Cursor(query));
    let row = [];
    row = await cursor.read(1);
    while(row.length > 0){
      const customer_id = row[0].顧客id;
      const level = row[0].會員等級;
      console.log('customer_id, level: ', customer_id, level);
      await updateTagsWithShoplineAPI(customer_id, level);
      row = await cursor.read(1);
      console.log('等待1秒');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    cursor.close();
  }
  catch(error){
    updateCustomerTagsLogger.error('updateCustomerTags error: ', error);
    console.log('updateCustomerTags error: ', error);
  }
  finally{
    client.release();
    updateCustomerTagsLogger.log('info', { message: '===結束更新會員等級==='});
  }
};


module.exports = {
  updateCustomerTags,
  updateTagsWithShoplineAPI
};

