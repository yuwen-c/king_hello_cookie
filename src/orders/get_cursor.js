const { pool } = require('../config/pg');
const Cursor = require('pg-cursor')

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

module.exports = getCursor;