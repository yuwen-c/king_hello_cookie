const { getRemark, getDeliveryAddress, getItems, getBonus, checkPoint, checkIfSubtotalIsFloat, removeDuplicates } = require('./utils');

const modifyOrder = (orderRows) => {
  const orderRowsWithoutDuplicates = removeDuplicates(orderRows);
  const oneRow = orderRowsWithoutDuplicates[0];
  const { '交易金額': total, '折扣總額': discount_total, '會員帳號':customer_email, '商品小計': items_subtotal, '運費': delivery_cost } =  oneRow;
  // checkIfSubtotalIsFloat(oneRow); // 發現有商品單價也會有小數點，此檢查無效。
  let order = {};
  order.delivery_option_id = '65cd79a1092890002080690c'; // wavenet後台用：'65aa39988fc496001a9c8133';  // 後台新增：匯入訂單專用送貨方式
  order.payment_method_id = '65cd79db7538ef0011094d49'; // wavenet後台用：'65b0ad99ad226600204b904a';  // 後台新增：匯入訂單專用付款方式
  order.customer_email = customer_email;  // 
  // 修正紅利點數
  const bonus = getBonus(oneRow);
  // const point = checkPoint(oneRow);

  order.subtotal = parseInt(total) + parseInt(discount_total) + parseInt(bonus); // *訂單小計 包含所有商品總價 
  order.total = parseInt(total); // *付款總金額,為訂單小計扣除購物金與折扣 // 付款總金額,包含附加費與運費 扣除discount 1000 = 1100 - 100
  order.items = getItems(orderRowsWithoutDuplicates, bonus); // fix: 新增紅利點數的折扣進去

  // 修正小數點：
  /**
   * 1. subtotal = 商品小計(1位小數點)+運費
   * 2. discount(寫在商品裡面) = 折扣總額+紅利點數，但是紅利點數要用算的
   * 3. total = 交易總額
   */
  // order.subtotal = parseFloat(items_subtotal) + parseFloat(delivery_cost);

  order.delivery_address = getDeliveryAddress(oneRow);
  order.order_remarks = getRemark(oneRow);
  // console.log('order.total:', order.total, "order.subtotal:", order.subtotal);
  return order;
}

module.exports = modifyOrder;