const axios = require('axios');
const { pool } = require('../config/pg');
// const Cursor = require('pg-cursor')
const { updateCustomerLogger } = require('../config/log_dynamic_path');

const SHOPLINE_API_TOKEN_KING = process.env.SHOPLINE_API_TOKEN_KING;
const SHOPLINE_USER_AGENT_KING = process.env.SHOPLINE_USER_AGENT_KING;
const SHOPLINE_API_TOKEN = process.env.SHOPLINE_API_TOKEN;

// member_point_balance: 在shopline儲存的客戶紅利點數
// credit_balance: 在shopline儲存的客戶購物金
// 購物金: 在mailbic 最新的客戶購物金 (要更新成這個值)
// 紅利點數: 在mailbic 最新的客戶紅利點數 (要更新成這個值)
// shopline_id 、shopline_store_credits (商店購物金)、shopline_member_points (會員點數)

const getCustomerIdFromShoplineByEmail = async (email) => {
  const url = 'https://open.shopline.io/v1/customers/search';
  const params = {
    query: email,
  };
  const headers = {
    'Accept': 'application/json',
    'Authorization': `Bearer ${SHOPLINE_API_TOKEN_KING}`,
    'User-Agent': SHOPLINE_USER_AGENT_KING
  };
  try {
    const response = await axios.get(url, { params, headers });
    if(response.data.items && response.data.items.length === 1) {
      console.log(response.data.items[0])
      return response.data.items[0];
    }
    else if(response.data.items && response.data.items.length > 1) {
      console.log('shopline有多筆customer email相同');
      updateCustomerLogger.log('info', { message: 'shopline有多筆customer email相同', email });
    }
    else {
      console.log('shopline查不到此email的customer');
      updateCustomerLogger.log('info', { message: 'shopline查不到此email的customer', email });
    }
    console.log(response.data);
  } catch (error) {
    console.log(error);
    updateCustomerLogger.log('error', { message: '從shopline查詢customer ID錯誤', 錯誤訊息: error, email });
  }
};

const writeCustomerDataToDB = async (customer) => {
  const client = await pool.connect();
  const { email, id: shopline_id, member_point_balance: shopline_member_points, credit_balance: shopline_store_credits } = customer;
  const query = `INSERT INTO customers_mailbic_mandarin_all (shopline_id, shopline_member_points, shopline_store_credits) VALUES ($1, $2, $3)`;
  const values = [ shopline_id, shopline_member_points, shopline_store_credits];
  try {
    const result = await client.query(query, values);
    console.log(result);
  } catch (error) {
    console.log(error);
    updateCustomerLogger.log('error', { message: '寫入customer data to db 錯誤', 錯誤訊息: error, email });
  }
  finally {
    client.release();
  }
};

// todo: 等新增了customers_mailbic_all table，再修改query的table name
const getDifference = async (email) => {
  const client = await pool.connect();
  // const table = 'customers_mailbic_mandarin_all';
  const table = 'customers_mailbic_mandarin'
  try {
    const result = await client.query(`SELECT * FROM ${table} WHERE email = $1`, [email]);
    console.log('result:', result.rows);
    if(result.rows.length === 0) {
      console.log('查無此人');
      return;
    }else if(result.rows.length === 1) {
    const { shopline_id, shopline_store_credits, shopline_member_points, 購物金, 紅利點數 } = result.rows[0];
    console.log(shopline_id, shopline_store_credits, shopline_member_points, 購物金, 紅利點數);
    const creditDiff = 購物金 - shopline_store_credits;
    const pointDiff = 紅利點數 - shopline_member_points; // Number can be -999999~999999
    return { shopline_id, creditDiff, pointDiff };
    }
    else {
      console.log('有多筆customer共用相同email');
    }
  } catch (error) {
    console.log(error);
  } finally {
    client.release();
  }
};

// yuwen.chiu@wavenet.com.tw id: 65a651d69bd1ad0001f8403a
// 現有後台購物金：10; 現有後台紅利點數：0
// 修改：購物金+100; 紅利點數+200
// 購物金 = 商店購物金 = store_credits
const updateCredits = async (id, creditDiff) => {
  const URL = `https://open.shopline.io/v1/customers/${id}/store_credits`;
  const headers = {
    'Authorization': `Bearer ${SHOPLINE_API_TOKEN}`,
    'Content-Type': 'application/json',
  };
  const requestData = {
    value: creditDiff,
    remarks: "搬站" // todo
  };
  try {
    const response = await axios.post(URL, requestData, { headers });
    console.log(response.data);
  } catch (error) {
    console.log(error);
    updateCustomerLogger.log('error', { message: 'update 購物金失敗', 錯誤訊息: error, shopline_id: id, creditDiff });
  }
};

// 會員點數 = 紅利點數 = member_points
// POST https://open.shopline.io/v1/customers/:id/member_points
const updatePoints = async (id, pointDiff) => {
  const URL = `https://open.shopline.io/v1/customers/${id}/member_points`;
  const headers = {
    'Accept': 'application/json',
    'Authorization': `Bearer ${SHOPLINE_API_TOKEN}`,
    'Content-Type': 'application/json'
  };
  const requestData = {
    value: pointDiff,
    remarks: "搬站" // todo
  };
  try {
    const response = await axios.post(URL, requestData, { headers });
    console.log(response.data);
  } catch (error) {
    console.log(error);
    updateCustomerLogger.log('error', { message: 'update 紅利點數失敗', 錯誤訊息: error, shopline_id: id, pointDiff });
  }
};




/**
 * 
 * 修改要注意：todo
 * 做計算，如果有某一種diff，就打某一個api。如果diff = 0就不打。
 ** 不可以重複打，要研究回傳訊息，還有寫log**
 ** 因為不能重複打，應該還是用傳id進去的方式比較好指定**
 *
 * 以下以用sql解決：
 * * 已經有`shopline_export_customers` table，及`customers_mailbic_mandarin_all` table
 * * 要建一個`customers_with_member_points` table，欄位要再挑
 * 1. 從shopline table「現有紅利點數」 !== 0的客戶，寫入`customers_with_member_points` table
 * 2. 從`customers_mailbic_mandarin_all` table，找出「現有紅利點數」 !== 0的客戶，且：
 * - 如果已存在，把紅利點數存到`customers_with_member_points` table
 * - 如果不存在，從shopline table挑出客戶，寫入資料到`customers_with_member_points` table，
 *   並且也從customers_mailbic_mandarin_all 取得紅利點數，一併寫入
 * 3. 也要把第1點的客戶的「mailbic紅利點數」，從`customers_mailbic_mandarin_all` table取得後，
 *    寫到`customers_with_member_points` table
 */

module.exports = {
  getCustomerIdFromShoplineByEmail,
  getDifference,
  updateCredits,
  updatePoints,
}

// getCustomerIdFromShoplineByEmail('zxctop104@yahoo.com.tw');
// getDifference('zxctop104@yahoo.com.tw')
// .then(console.log)


// yuwen.chiu@wavenet.com.tw id: 65a651d69bd1ad0001f8403a
// updateCredits('65a651d69bd1ad0001f8403a', -50)
// updatePoints('65a651d69bd1ad0001f8403a', -80)