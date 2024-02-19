const { format, createLogger, transports } = require('winston');
const path = require('path');

const logFilePath = path.join(process.cwd(), 'log', 'logfile-fire-timestamp.log');
const loggerFire = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss' // 添加時間戳，會轉換成目前的時區
    }),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: logFilePath })
  ]
});


module.exports = loggerFire;