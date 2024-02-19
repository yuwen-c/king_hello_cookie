const { pool } = require('../config/pg');

// 讀db取得「交易平台交易序號」是特定序號的訂單rows
const getOrderData = async (transaction_unique_id) => {
  console.log("getOrderData transaction_unique_id:", transaction_unique_id);
  const client = await pool.connect();
  try {
    const result = await client.query(`SELECT * FROM orders_malbic WHERE 交易平台交易序號 = '${transaction_unique_id}'`);
    return result.rows;
  } catch (error) {
    console.log(error);
  }
  finally {
    client.release();
  }
}

module.exports = getOrderData;