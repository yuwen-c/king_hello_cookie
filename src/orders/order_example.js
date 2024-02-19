const orderExample = {
  // order_number: '10002724', // 還在等shopline回覆怎麼寫入訂單編號
  delivery_option_id: '65aa39988fc496001a9c8133', // 出貨方式之ID* 要設定一個0元的送貨方式
  payment_method_id: '65a5eae71f602c000e6a5906', // 付款方式之ID* 要從後台看
  subtotal: 1050, // *訂單小計 包含所有商品總價 1100 = 900 + 200
  total: 800, // *付款總金額,為訂單小計扣除購物金與折扣 // 付款總金額,包含附加費與運費 扣除discount 1000 = 1100 - 100
  items:[
    {
      item_type: "CustomProduct", // 
      // item_id: "65a60515d259630001711963", // 要從後台看確切商品
      item_price: 900,
      item_data: {
        name: "歷史訂單-國王你好餅乾禮盒",
        price: "900"
      },
      quantity: 1,
      total: 900
    },
    {
      item_type: "CustomProduct",
      item_price: 0.5,
      item_data: {
        name: "歷史訂單-國王你好禮盒包裝",
        price: "0.5"
      },
      quantity: 1,
      total: 0.5
    },
    {
      "item_type": "CustomDiscount",
      "item_price": 250,
      "total": 250,
      "item_data": {
        "name": "折扣"
      }
    },
    {
      item_type: "CustomProduct", 
      item_price: 150,
      item_data: {
        name: "運費",
        price: "150"
      },
      quantity: 1,
      total: 150
    },
    {
      item_type: "CustomProduct", 
      item_price: 0,
      item_data: {
        name: "舊站訂單-10002724",
        price: "0"
      },
      quantity: 1,
      total: 0
    },
  ], // *商品
  customer_email: 'yuwen.chiu@wavenet.com.tw',  // *email
  delivery_address: {
    city: "台北市", // 一定要有
    postcode: "105",
    address_2: "",
    address_1: "台北市光復北路11巷44號14樓",
    recipient_name: "邱郁文",
    recipient_phone: "0227423966",
    country: "台灣",
    country_code: "TW"
  }, // *收件人資訊
  order_remarks: "測試訂單", // 備註
  // user_credit: 30, // 訂單所使用之折抵購物金 User credit_balance is not enough
  // member_point: 120, // 已使用會員點數 
  // tags: ["舊站-交易序號-10002724", "舊站訂單"]  // 無法寫入
}

module.exports = orderExample;