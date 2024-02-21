// const { Client } = require('pg');
const { Pool } = require('pg');

const config = {
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE
}
// console.log("config: ", config);

const config_vm = {
  host: process.env.PG_HOST_VM,
  port: process.env.PG_PORT_VM,
  user: process.env.PG_USER_VM,
  password: process.env.PG_PASSWORD_VM,
  database: process.env.PG_DATABASE_VM
}

console.log("config_vm: ", config_vm);

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
// const pool = new Pool(config);
const pool = new Pool(config_vm);

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
