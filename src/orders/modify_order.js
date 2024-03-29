const { getRemark, getDeliveryAddress, getItems, getBonus, checkPoint, checkIfSubtotalIsFloat, removeDuplicates } = require('./utils');

const modifyOrder = (orderRows) => {
  const orderRowsWithoutDuplicates = removeDuplicates(orderRows);
  const oneRow = orderRowsWithoutDuplicates[0];
  const { '交易金額': total, '折扣總額': discount_total, '會員帳號':customer_email, '商品小計': items_subtotal, '運費': delivery_cost } =  oneRow;
  // checkIfSubtotalIsFloat(oneRow); // 發現有商品單價也會有小數點，此檢查無效。
  let order = {};
  order.delivery_option_id = '65cd79a1092890002080690c'; // wavenet後台用：'65aa39988fc496001a9c8133';  // 後台新增：匯入訂單專用送貨方式
  order.payment_method_id = '65cd79db7538ef0011094d49'; // wavenet後台用：'65b0ad99ad226600204b904a';  // 後台新增：匯入訂單專用付款方式
  // 有些訂單沒有會員帳號，所以要給一個假的email
  order.customer_email = customer_email && customer_email !== '' && !customer_email.includes('註銷本帳號') ? customer_email : 'fakeUser@gmail.com'
  console.log("customer_email:", customer_email, "order.customer_email:", order.customer_email);
  // 修正紅利點數
  const bonus = getBonus(oneRow);
  // const point = checkPoint(oneRow);

  order.subtotal = parseInt(total) + parseInt(discount_total) + parseInt(bonus); // *訂單小計 包含所有商品總價 
  order.total = parseInt(total); // *付款總金額,為訂單小計扣除購物金與折扣 // 付款總金額,包含附加費與運費 扣除discount 1000 = 1100 - 100
  order.items = getItems(orderRowsWithoutDuplicates, bonus); // fix: 新增紅利點數的折扣進去

  order.delivery_address = getDeliveryAddress(oneRow);
  order.order_remarks = getRemark(oneRow);
  console.log('modify order - ', 'order.total:', order.total, "order.subtotal:", order.subtotal);
  return order;
}

module.exports = modifyOrder;