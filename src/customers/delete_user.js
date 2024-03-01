const axios = require('axios');
const { pool } = require('../config/pg');
const Cursor = require('pg-cursor');
const { deleteCustomerLogger } = require('../config/log_dynamic_path');


// 把wavenet裡面，國王你好當初測試搬搬看的資料刪除

const SHOPLINE_API_TOKEN = process.env.SHOPLINE_API_TOKEN;

const deleteWavenetCustomer = async (id) => {
  const URL = `https://open.shopline.io/v1/customers/${id}`;
  const headers = {
    'Authorization': `Bearer ${SHOPLINE_API_TOKEN}`,
    'Content-Type': 'application/json',
  };
  try {
    const response = await axios.delete(URL, { headers });
    console.log(response.data);
  } catch (error) {
    console.log(error);
    deleteCustomerLogger.log('error', { message: '刪除測試商店顧客失敗', 顧客id: id, error });
  }
};

const deleteWavenetCustomerBatch = async () => {
  const client = await pool.connect();
  try {
    const text = `
      SELECT * FROM wavenet_shopline_customers
      where id > '65c1a83b39540f001932b712'
      ORDER BY id ASC;
    `;
    const cursor = client.query(new Cursor(text))

    let rows = await cursor.read(1);
    console.log(rows);
    while (rows.length) {
      const id = rows[0].id;
      await deleteWavenetCustomer(id); // todo : 要刪的時候打開
      console.log(`${id} 已刪除`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      rows = await cursor.read(1);
    }
    await cursor.close();
  } catch (error) {
    console.log(error);
  } finally {
    client.release();
  }
};

module.exports = {
  deleteWavenetCustomer,
  deleteWavenetCustomerBatch
}