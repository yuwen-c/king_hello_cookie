// const { Client } = require('pg');
const { Pool } = require('pg');

const config = {
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE
}
console.log("config: ", config);

// const client = new Client(config);
// client.connect();

// client.connect(err => {
  //   if (err) {
    //     console.error('connection error', err.stack);
    //   } else {
      //     console.log('connected');
      //   }
// });
      
// 改用pool連線
const pool = new Pool(config);

// 測試pool連線
// pool.connect((err, client, release) => {
//   if (err) {
//     return console.error('Error acquiring client', err.stack)
//   }
//   client.query('SELECT NOW()', (err, result) => {
//     release()
//     if (err) {
//       return console.error('Error executing query', err.stack)
//     }
//     console.log(result.rows)
//   })
// })

module.exports = {
  // client
  pool
};
