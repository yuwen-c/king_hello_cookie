const { pool } = require('../config/pg');
const { ORDER_TABLE_MAPPING } = require('./utils');

// 讀db取得「交易平台交易序號」是特定序號的訂單rows
const getOrderData = async (transaction_unique_id, phase, client) => {
  if (!client || typeof client.query !== 'function') {
    throw new Error('Invalid client object');
  }
  console.log("getOrderData transaction_unique_id:", transaction_unique_id);
  // const client = await pool.connect();
  const table = phase === 1 ? ORDER_TABLE_MAPPING.FIRST_PHASE.ORDERS : ORDER_TABLE_MAPPING.SECOND_PHASE.ORDERS;
  try {
    const result = await client.query(`SELECT * FROM ${table} WHERE 交易平台交易序號 = '${transaction_unique_id}'`);
    return result.rows;
  } catch (error) {
    console.log(error);
  }
  // finally {
  //   client.release();
  // }
}

module.exports = getOrderData;