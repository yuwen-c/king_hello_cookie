const { pool } = require('../config/pg');
const Cursor = require('pg-cursor');
const { ORDER_TABLE_MAPPING } = require('./utils');

// todo: 確定訂單是第一階段還是第二階段，目前修改訂單狀態是用getCursor，改的是第一階段的訂單，用order_id_platform table
const getCursor = async(transaction_start, transaction_end) => {
  const client = await pool.connect()
  // 判斷序號: >=start，>end
  const text = `
    SELECT * FROM orders_id_platform
    WHERE 交易平台交易序號 >= $1 AND 交易平台交易序號 < $2
    ORDER BY 交易平台交易序號 ASC;
  `;
  const values = [transaction_start.toString(), transaction_end.toString()]
  const cursor = client.query(new Cursor(text, values))
  return { client, cursor }
}

// 改為傳入client
// todo: 修改為select第二階段訂單的table
// 創建訂單使用這個function，打的是第二階段的訂單，用orders_id_platform_2 table
const getCursorWOConnect = async(transaction_start, transaction_end, client, phase) => {
  // const client = await pool.connect()
  // 判斷序號: >=start，>end
  // const table = phase === 1 ? ORDER_TABLE_MAPPING.first.ID_PLATFORM : ORDER_TABLE_MAPPING.second.ID_PLATFORM;
  const table = ORDER_TABLE_MAPPING[phase].ID_PLATFORM;
  const text = `
    SELECT * FROM ${table}
    WHERE 交易平台交易序號 >= $1 AND 交易平台交易序號 < $2
    ORDER BY 交易平台交易序號 ASC;
  `;
  const values = [transaction_start.toString(), transaction_end.toString()]
  const cursor = client.query(new Cursor(text, values))
  return cursor;
}

module.exports = {
  getCursor,
  getCursorWOConnect
};