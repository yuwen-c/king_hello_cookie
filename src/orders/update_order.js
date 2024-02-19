const axios = require('axios');
const logger = require('../config/log');
const getOrderData = require('./get_order_data')
const getCursor = require('./get_cursor')

const SHOPLINE_API_TOKEN = process.env.SHOPLINE_API_TOKEN;
const SHOPLINE_API_TOKEN_KING = process.env.SHOPLINE_API_TOKEN_KING;

// 更新訂單狀態：PATCH https://open.shopline.io/v1/orders/:id/status
// shopline訂單狀態：pending 處理中, confirmed 已確認, completed 已完成, cancelled 已取消
// 舊站訂單狀態：交易終結, 出貨中, 已出貨, 已取消, 新訂單


// 把resolve從500ms改成200ms試試看
const orderStatusMap = {
  '交易終結': 'completed',
  '出貨中': 'confirmed',
  '已出貨': 'confirmed',
  '已取消': 'cancelled',
  '新訂單': 'pending'
}

const updateOrderStatus = async (transaction_unique_id) => {
  try{
    const orderRows = await getOrderData(transaction_unique_id);
    if(orderRows.length > 0) {
      const { shopline_id, '訂單狀態': order_status } = orderRows[0];
      console.log('訂單id和狀態:', shopline_id, order_status, orderStatusMap[order_status]);
      if(!orderStatusMap[order_status]) {
        logger.log('error', { message: 'update order status error', error: 'order_status 不存在'});
        console.log('order_status 不存在:', transaction_unique_id);
        return;
      }
      const response = await axios.patch(`https://open.shopline.io/v1/orders/${shopline_id}/status`, {
        status: orderStatusMap[order_status]
      }, {
        headers: {
          'Authorization': `Bearer ${SHOPLINE_API_TOKEN_KING}`,
          'Content-Type': 'application/json'
        }
      });
      console.log("update order status success"); 
    }
  }
  catch(error) {
    logger.log('error', { message: 'update order status error', error});
    console.log("error:", error);
  }
}

const batchUpdateOrderStatus = async (transaction_start, transaction_end) => {
  try {
    const { client, cursor } = await getCursor(transaction_start, transaction_end);
    let row = await cursor.read(1);
    while (row.length) {
      console.log('row[0].交易平台交易序號:', row[0].交易平台交易序號);
      const transaction_unique_id = row[0].交易平台交易序號;
      await updateOrderStatus(transaction_unique_id);
      await new Promise(resolve => setTimeout(resolve, 200));
      row = await cursor.read(1);
    }
    cursor.close(() => {
      console.log('cursor.close');
      client.release()
    });
  } catch (error) {
    console.log(error);
  }
}

// 更新付款狀態：PATCH https://open.shopline.io/v1/orders/:id/order_payment_status
// shopline付款狀態：pending 未付款, completed 已付款, refunding 退款中, refunded 已退款
// 付款日期：是否有值，但是"貨到付款"不會寫入付款日期
// 付款日期 -> 是否有
// 如果有 -> 訂單狀態交易終結 -> 已付款
// 如果有 -> 訂單狀態已取消 -> 已退款
// 如果沒有 -> 訂單狀態交易終結 -> 已付款
// 如果沒有 -> 訂單狀態已取消 -> 未付款
const updatePaymentStatus = async (transaction_unique_id) => {
  try{
    const orderRows = await getOrderData(transaction_unique_id);
    if(orderRows.length > 0) {
      const { shopline_id, '付款日期': payment_date, '訂單狀態': order_status } = orderRows[0];
      let payment_status = '';
      if(payment_date && payment_date !== '') {
        if(order_status === '已取消') {
          payment_status = 'refunded';
        }
        else {
          payment_status = 'completed';
        }
      }
      else {
        if(order_status === '交易終結') {
          payment_status = 'completed';
        }
        else{
          payment_status = 'pending';
        }
      }
      console.log('payment_status:', payment_status);
      const response = await axios.patch(`https://open.shopline.io/v1/orders/${shopline_id}/order_payment_status`, {
        status: payment_status
      }, {
        headers: {
          'Authorization': `Bearer ${SHOPLINE_API_TOKEN_KING}`,
          'Content-Type': 'application/json'
        }
      });
      console.log("response.data:", response.data); 
    }
  }
  catch(error) {
    logger.log('error', { message: 'update payment status error', error});
    console.log("error:", error.response.data);
  }
}

const batchUpdatePaymentStatus = async (transaction_start, transaction_end) => {
  try {
    const { client, cursor } = await getCursor(transaction_start, transaction_end);
    let row = await cursor.read(1);
    while (row.length) {
      console.log('row[0].交易平台交易序號:', row[0].交易平台交易序號);
      const transaction_unique_id = row[0].交易平台交易序號;
      await updatePaymentStatus(transaction_unique_id);
      await new Promise(resolve => setTimeout(resolve, 200));
      row = await cursor.read(1);
    }
    cursor.close(() => {
      console.log('cursor.close');
      client.release()
    });
  } catch (error) {
    console.log(error);
  }
}

// 更新物流狀態：PATCH https://open.shopline.io/v1/orders/:id/order_delivery_status
// shopline物流狀態：pending 備貨中, shipping 發貨中, shipped 已發貨, arrived 已到達, collected 已取貨, returned 已退回, returning 退回中 
const orderStatusMapDeliveryStatus = {
  '交易終結': 'arrived',
  '出貨中': 'shipping',
  '已出貨': 'shipped',
  // '已取消': '',
  '新訂單': 'pending'
}
const updateDeliveryStatus = async (transaction_unique_id) => {
  try{
    const orderRows = await getOrderData(transaction_unique_id);
    if(orderRows.length > 0) {
      const { shopline_id, '出貨日期': delivery_date, '訂單狀態': order_status } = orderRows[0];
      let delivery_status = '';
      if(order_status === '已取消') {
        if(delivery_date && delivery_date !== '') {
          delivery_status = 'returned';
        }
        else {
          delivery_status = 'pending'; 
        }
      }
      else if(orderStatusMapDeliveryStatus[order_status]) {
        delivery_status = orderStatusMapDeliveryStatus[order_status];
      }
      else {
        logger.log('error', { message: 'update delivery status error', error: 'delivery status 不存在'});
        console.log('delivery status 不存在:', transaction_unique_id );
        return;
      }
      console.log('delivery_status:', delivery_status);
      const response = await axios.patch(`https://open.shopline.io/v1/orders/${shopline_id}/order_delivery_status`, {
        status: delivery_status
      }, {
        headers: {
          'Authorization': `Bearer ${SHOPLINE_API_TOKEN_KING}`,
          'Content-Type': 'application/json'
        }
      });
      console.log("response.data:", response.data); 
    }
  }
  catch(error) {
    logger.log('error', { message: 'update delivery status error', error});
    console.log("error:", error.response.data);
  }
}

const batchUpdateDeliveryStatus = async (transaction_start, transaction_end) => {
  try {
    const { client, cursor } = await getCursor(transaction_start, transaction_end);
    let row = await cursor.read(1);
    while (row.length) {
      console.log('row[0].交易平台交易序號:', row[0].交易平台交易序號);
      const transaction_unique_id = row[0].交易平台交易序號;
      await updateDeliveryStatus(transaction_unique_id);
      await new Promise(resolve => setTimeout(resolve, 200));
      row = await cursor.read(1);
    }
    cursor.close(() => {
      console.log('cursor.close');
      client.release()
    });
  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  updateOrderStatus,
  batchUpdateOrderStatus,
  updatePaymentStatus,
  batchUpdatePaymentStatus,
  updateDeliveryStatus,
  batchUpdateDeliveryStatus
}