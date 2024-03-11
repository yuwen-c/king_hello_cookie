const axios = require('axios');
const { pool } = require('../config/pg');
const Cursor = require('pg-cursor');
const { cancelOrderLogger } = require('../config/log_dynamic_path');

// 把wavenet裡面，國王你好當初測試搬搬看的資料刪除

const SHOPLINE_API_TOKEN = process.env.SHOPLINE_API_TOKEN;

const  cancelOrder = async (id) => {
  const URL = `https://open.shopline.io/v1/orders/${id}/cancel`;
  const headers = {
    'Authorization': `Bearer ${SHOPLINE_API_TOKEN}`,
    'Content-Type': 'application/json',
  };
  const params = {
    order_id: id,
    cancelled_reason: {
      key: 'other',
      message: '刪除測試商店訂單'
    }
  }
  try {
    const response = await axios.patch(URL, { ...params}, { headers });
    console.log(response);
  } catch (error) {
    // console.log("錯誤response：", error);
    cancelOrderLogger.error(error);
    // cancelOrderLogger.log('error', { message: 'cancel order error', 錯誤訊息: error, 訂單序號: id });
  }
}
// cancelOrder('65e587a71e6b9c001d511c04');

module.exports = cancelOrder;


