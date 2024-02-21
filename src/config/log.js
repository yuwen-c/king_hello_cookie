const { format, createLogger, transports } = require('winston');
const path = require('path');

const logFilePath = path.join(process.cwd(), 'log', 'logfile.log');

// 使用 'Asia/Taipei' 时区
const myCustomTimezone = () => {
  return new Date().toLocaleString("en-US", {timeZone: "Asia/Taipei"});
};

const logger = createLogger({
  level: 'info',
  // format: winston.format.combine(
  //   winston.format.timestamp(), // 添加時間戳，但是不會有+8:00的時區
  //   winston.format.json()
  // ),
  // format: format.combine(
  //   format.timestamp({
  //     format: 'YYYY-MM-DD HH:mm:ss' // 添加時間戳，會轉換成目前的時區
  //   }),
  //   format.json()
  // ),
  format: format.combine(
    format.timestamp({
      format: myCustomTimezone // 因為vm時區不正確，需要自定義時區
    }),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: logFilePath })
  ]
});

// logger.log('info', '這是一條信息');
// logger.log('error', '這是一條錯誤信息');

module.exports = logger;