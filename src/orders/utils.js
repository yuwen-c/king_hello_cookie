const { log } = require("winston");
const { logger } = require('../config/log');

const ORDER_TABLE_MAPPING = {
  first: {
    ID_PLATFORM: 'orders_id_platform',
    ORDERS: 'orders_malbic'
  },
  second: {
    ID_PLATFORM: 'orders_id_platform_2',
    ORDERS: 'orders_malbic_2'
  },
  third: {
    ID_PLATFORM: 'orders_id_platform_3',
    ORDERS: 'orders_malbic_3'
  },
  fourth: {
    ID_PLATFORM: 'orders_id_platform_4',
    ORDERS: 'orders_malbic_4'
  }
}

const getRemark = (orderRow) => {
  const { '店家備註': shop_remark, '取消原因': cancel_reason, 
  '買家備註': customer_remark, '建立時間': build_time, 
  '出貨備註': delivery_remark, '訂單狀態': order_status,
  '付款資訊': payment_info, '付款日期':payment_date, 
  '配貨時間': delivery_date, '配送狀態': delivery_status,
  '出貨類型': delivery_type
 } =  orderRow;
  let remark = '';
  if (shop_remark) {
    remark += `店家備註: ${shop_remark}。`;
  }
  if (cancel_reason) {
    remark += `取消原因: ${cancel_reason}。`;
  }
  if (customer_remark) {
    remark += `買家備註: ${customer_remark}。`;
  }
  if (delivery_remark) {
    remark += `出貨備註: ${delivery_remark}。`;
  }
  if (build_time) {
    remark += `建立時間: ${build_time}。`;
  }
  if (order_status) {
    remark += `訂單狀態: ${order_status}。`;
  }
  if (payment_info) {
    remark += `付款資訊: ${payment_info}。`;
  }
  if (payment_date) {
    remark += `付款日期: ${payment_date}。`;
  }
  if (delivery_date) {
    remark += `配貨時間: ${delivery_date}。`;
  }
  if (delivery_status) {
    remark += `配送狀態: ${delivery_status}。`;
  }
  if (delivery_type) {
    remark += `出貨類型: ${delivery_type}。`;
  }
  return remark;
}

const getDeliveryAddress = (orderRow) => {
  let delivery_address = {};
  delivery_address.recipient_name = orderRow['收件者姓名'];
  if(orderRow['收件者手機']){
    delivery_address.recipient_phone = orderRow['收件者手機'];
  }
  else{
    delivery_address.recipient_phone = '0000000000'; // 寫假電話進去
  }
  if(orderRow['收件者縣市']){
    delivery_address.address_1 = orderRow['收件者地址'];
    delivery_address.postcode = orderRow['郵遞區號'];
    delivery_address.city = orderRow['收件者縣市'];
    delivery_address.country_code = 'TW';
  }
  return delivery_address;
}

// 莫比克訂單沒有紅利點數欄位，要用算的
const getBonus = (orderRow) => {
  const {'交易金額': total, '商品小計': items_subtotal, '折扣總額': discount_total, '運費': delivery_cost } = orderRow;
  // 正確的算式：交易金額 + 紅利點數 + 折扣總額 = 商品小計 + 運費
  // 紅利點數 = 商品小計 + 運費 - 交易金額 - 折扣總額
  // -> return紅利點數
  console.log("items_subtotal:", items_subtotal, "delivery_cost:", delivery_cost, "total:", total, "discount_total:", discount_total);
  const bonus = parseFloat(items_subtotal) + parseInt(delivery_cost) - parseInt(total) - parseInt(discount_total);
  console.log("getBonus:", bonus);  // -0.5
  return bonus > 0 ? bonus : 0;
}

// 如果商品小計有小數點，判斷是否四捨五入，把調整加到items
const checkPoint = (orderRow) => {
  const { '商品小計': items_subtotal } = orderRow;
  if(items_subtotal.includes('.')){
    let parts = items_subtotal.split('.');
    let decimalPart = parseFloat('0.' + parts[1]);
    console.log('decimalPart:', decimalPart);
    return decimalPart;
  }
  return 0;
}

const checkIfSubtotalIsFloat = (orderRow) => {
  const { '商品小計': items_subtotal, '交易平台交易序號': transaction_unique_id  } = orderRow;
  if(items_subtotal.includes('.')){
    logger.log('info', { message: '商品小計有小數點', 交易平台交易序號: transaction_unique_id});
  }
}

const getItems = (orderRows, bonus, point) => {
  const { '交易金額': total, '運費': delivery_cost, '折扣總額': discount_total, '商品小計': items_subtotal, '交易平台':platform, '交易序號':transaction_id, '交易平台交易序號': transaction_unique_id } = orderRows[0];
  let items = [];
  // ====== 原來版本的 ======
  // orderRows.forEach((orderRow) => {
  //   const { '商品編號': id, '商品資訊': name, '商品單價': price, '小計數量': quantity } = orderRow;
  //   let item = {};
  //   item.item_type = 'CustomProduct';
  //   item.item_price = parseFloat(price);
  //   item.item_data = {
  //     name: id + '-' + name,
  //     price: price.toString()
  //   };
  //   item.quantity = parseInt(quantity);
  //   item.total = parseFloat(price) * parseInt(quantity);
  //   items.push(item);
  // });

  // ========= 最後要匯入10幾筆小數點訂單 不確定bonus那邊的小數點會不會有問題？=========
  // 1. 將商品單價四捨五入取整數
  let adjustedItemSum = 0;
  orderRows.forEach((orderRow) => {
    const { '商品編號': id, '商品資訊': name, '商品單價': price, '小計數量': quantity } = orderRow;
    let item = {};
    item.item_type = 'CustomProduct';
    item.item_price = parseFloat(price);
    const priceRoundToInt = Math.round(price);
    adjustedItemSum += priceRoundToInt;
    item.item_price = (priceRoundToInt);
    item.item_data = {
      name: id + '-' + name,
      price: priceRoundToInt.toString()
    };
    item.quantity = parseInt(quantity);
    item.total = priceRoundToInt * parseInt(quantity);
    items.push(item);
  });

  console.log('adjustedItemSum:', adjustedItemSum, 'items_subtotal:', items_subtotal);
  // 2. 比對商品單價全部四捨五入後的「總和」，與商品小計(取到的是number，需要四捨五入)
  // 3. 如果少了，就加一個diffItem商品，名稱為「差額」，價格為diff；如果多了，就要從剛剛push進去的最後一個商品中扣掉
  const diff = Math.round(items_subtotal) - adjustedItemSum;
  console.log('diff:', diff);
  let diffItem = {};
  if(diff > 0) {
    diffItem.item_type = 'CustomProduct';
    diffItem.item_price = diff;
    diffItem.item_data = {
      name: '差額',
      price: diff.toString()
    };
    diffItem.quantity = 1;
    diffItem.total = diff;
    items.push(diffItem);
  }
  else if(diff < 0) {
    // 從最後一個商品中扣掉
    items[items.length-1].item_price += diff;
    items[items.length-1].total += diff;
  }
  else {
    console.log('商品小計與商品單價全部四捨五入後的「總和」相等');
  }

  // ========= 以上 ======== 調整四捨五入 最後要匯入10幾筆小數點訂單 =========

  // 運費
  let deliveryItem = {};
  deliveryItem.item_type = 'CustomProduct';
  deliveryItem.item_price = parseInt(delivery_cost);
  deliveryItem.item_data = {
    name: '運費',
    price: delivery_cost.toString()
  };
  deliveryItem.quantity = 1;
  deliveryItem.total = parseInt(delivery_cost);
  items.push(deliveryItem);

  // 折扣
  let discountItem = {};
  discountItem.item_type = 'CustomDiscount';
  discountItem.item_price = parseInt(discount_total) + parseInt(bonus);
  discountItem.item_data = {
    name: '折扣及紅利點數'
  };
  discountItem.total = parseInt(discount_total) + parseInt(bonus);
  items.push(discountItem);

  // 訂單編號
  let infoItem = {};
  infoItem.item_type = 'CustomProduct';
  infoItem.item_price = 0;
  infoItem.item_data = {
    name: '舊站訂單-' + transaction_unique_id,
    price: '0'
  };
  infoItem.quantity = 1;
  infoItem.total = 0;
  items.push(infoItem);
  // console.log("items:", items)
  return items;
}

// 發現2023/01~2023/06的訂單重複匯入
/**
 * 如果讀到的訂單，是在這個區間，就將拿到的rows，用"訂單編號"判斷唯一的row
 * 讀到的時間是這個字串：2023/03/17 21:26:29
 * 需要判斷是否在2023/01~2023/06的區間
 */
const removeDuplicates = (orderRows) => {
  console.log("original orderRows:", orderRows.length);
  const { '建立時間': build_time } = orderRows[0];
  const build_time_parts = build_time.split(' ');
  const build_date = build_time_parts[0];
  const build_date_parts = build_date.split('/');
  const build_year = parseInt(build_date_parts[0]);
  const build_month = parseInt(build_date_parts[1]);
  if(build_year === 2023 && build_month >= 1 && build_month <= 6) {
    // 用訂單編號判斷唯一的row
    const uniqueRows = [];
    const uniqueIds = [];
    orderRows.forEach((orderRow) => {
      const { '訂單編號': order_id } = orderRow;
      if(!uniqueIds.includes(order_id)) {
        uniqueIds.push(order_id);
        uniqueRows.push(orderRow);
      }
    });
    console.log("uniqueRows:", uniqueRows.length);
    return uniqueRows;
  }
  return orderRows;
}

module.exports = {
  getRemark,
  getDeliveryAddress,
  getItems,
  getBonus,
  checkPoint,
  checkIfSubtotalIsFloat,
  removeDuplicates,
  ORDER_TABLE_MAPPING
}