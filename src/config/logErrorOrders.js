const { format, createLogger, transports } = require('winston');
const path = require('path');

const logFilePath = path.join(process.cwd(), 'log', 'logfile-error-orders.log');

// 使用 'Asia/Taipei' 时区
const myCustomTimezone = () => {
  return new Date().toLocaleString("en-US", {timeZone: "Asia/Taipei"});
};

const loggerErrorOrders = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: myCustomTimezone 
    }),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: logFilePath })
  ]
});


module.exports = loggerErrorOrders;