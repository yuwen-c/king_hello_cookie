const { format, createLogger, transports } = require('winston');
const path = require('path');

// 配置不同動作所需要的log file
const logFileMapping = {
  CREATE_ORDER: 'create_order.log',
  UPDATE_ORDER_STATUS: 'update_order_status.log',
  UPDATE_PAYMENT_STATUS: 'update_payment_status.log',
  UPDATE_DELIVERY_STATUS: 'update_delivery_status.log',
  UPDATE_CUSTOMER: 'update_customer.log',
  DELETE_CUSTOMER: 'delete_customer.log',
  CANCEL_ORDER: 'cancel_order.log'
}

// 使用 'Asia/Taipei' 时区
const myCustomTimezone = () => {
  return new Date().toLocaleString("en-US", {timeZone: "Asia/Taipei"});
};

const createLoggerWithDynamicPath = (filename) => {
  return createLogger({
    level: 'info', // 只記錄info及以上等級的日誌，可以根據需要調整
    format: format.combine(
      format.timestamp({
        format: myCustomTimezone
      }),
      // format.printf((info) => {
      //   if (info instanceof Error) {
      //     console.log("error instance, received info: ", info.response.data);
      //     // return `${info.timestamp} ${info.level}: ${info.message} ${JSON.stringify(info.response.data, null, 2)}`;
      //     return `${JSON.stringify(Object.getOwnPropertyNames(info.response.data))}`;
      //   }
      //   console.log('not an instance')
      //   // return `${info.timestamp} ${info.level}: ${info.message}`;
      //   return `${JSON.stringify(info, null, 2)}`;
      // }),
      format.json()
    ),
    transports: [
      // new transports.Console(),
      new transports.File({ filename: path.join(process.cwd(), 'log', filename) })
    ]
  });
};

const createOrderLogger = createLoggerWithDynamicPath(logFileMapping.CREATE_ORDER);
const updateOrderStatusLogger = createLoggerWithDynamicPath(logFileMapping.UPDATE_ORDER_STATUS);
const updatePaymentStatusLogger = createLoggerWithDynamicPath(logFileMapping.UPDATE_PAYMENT_STATUS);
const updateCustomerLogger = createLoggerWithDynamicPath(logFileMapping.UPDATE_CUSTOMER);
const deleteCustomerLogger = createLoggerWithDynamicPath(logFileMapping.DELETE_CUSTOMER);
const cancelOrderLogger = createLoggerWithDynamicPath(logFileMapping.CANCEL_ORDER);

module.exports = {
  createOrderLogger,
  updateOrderStatusLogger,
  updatePaymentStatusLogger,
  updateCustomerLogger,
  deleteCustomerLogger,
  cancelOrderLogger
};






