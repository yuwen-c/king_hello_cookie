const axios = require('axios');
const { pool } = require('../config/pg');

// 跑完shopline點數更新後，檢查點數是否正確

const SHOPLINE_API_TOKEN_KING = process.env.SHOPLINE_API_TOKEN_KING;
const SHOPLINE_USER_AGENT_KING = process.env.SHOPLINE_USER_AGENT_KING;

const getCustomerShoplinePointsBalance = async (id) => {
  console.log('getCustomerShoplinePointsBalance id:', id);
  // GET https://open.shopline.io/v1/customers/:id
    const URL = `https://open.shopline.io/v1/customers/${id}`;
    const headers = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${SHOPLINE_API_TOKEN_KING}`,
      'User-Agent': SHOPLINE_USER_AGENT_KING
    };
    try {
      const response = await axios.get(URL, { headers });
      // console.log(response.data);
      console.log(`getCustomerShoplinePointsBalance id: ${id} shopline的紅利點數：`, response.data.member_point_balance);
      return response.data.member_point_balance;
    } catch (error) {
      console.log(error);
    }
};

const getDBPoints = async (id) => {
  console.log('getDBPoints id:', id);
  const client = await pool.connect();
  const query = `SELECT 莫比克紅利點數 FROM customers_point_union_2 WHERE 顧客id = $1`;
  const values = [id];
  try {
    const res = await client.query(query, values);
    console.log(`getDBPoints id: ${id} 莫比克紅利點數:`, res.rows[0].莫比克紅利點數);
    return res.rows[0].莫比克紅利點數;
  } catch (error) {
    console.log(error);
  } finally {
    client.release();
  }
};

const comparePoints = async (id, shopline_points, mailbic_points) => {
  console.log('comparePoints:', id, shopline_points, mailbic_points);
  // 如果兩個points相等，寫入資料庫欄位點數核對為true
  // 如果不相等，寫入資料庫欄位點數核對為false
  const client = await pool.connect();
  const query = `UPDATE customers_point_union_2 SET 點數核對 = $1 WHERE 顧客id = $2`;
  const values = [shopline_points === mailbic_points, id];
  try {
    const res = await client.query(query, values);
    console.log(`id: ${id} 點數核對:`, shopline_points === mailbic_points);
  } catch (error) {
    console.log(error);
  } finally {
    client.release();
  }
};

const checkPoints = async () => {
  const client = await pool.connect();
  // todo: 依照要跑單筆或多筆，修改where條件:     where 顧客id = '65cdc922d94bdc0001b3bdd0'
  const query = `
    SELECT 顧客id FROM customers_point_union_2 where 點數核對 is null ;
  `;
  try {
    const res = await client.query(query);
    for (let i = 0; i < res.rows.length; i++) {
      const id = res.rows[i].顧客id;
      const shopline_points = await getCustomerShoplinePointsBalance(id);
      const mailbic_points = await getDBPoints(id);
      await comparePoints(id, shopline_points, mailbic_points);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  } catch (error) {
    console.log(error);
  } finally {
    client.release();
  }
};

module.exports = { checkPoints };