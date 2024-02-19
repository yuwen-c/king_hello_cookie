const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const client = require('../pg')

// 獲取當前的工作目錄
const currentWorkingDirectory = process.cwd();
const filePath = './data/csv/king_products_selected_columns_partial.csv';
const csvFilePath = path.join(currentWorkingDirectory, filePath);
// console.log("csvFilePath: ", csvFilePath);

// 讀取CSV檔案，並將資料寫入資料庫
// 在裡面加上連線、終止，有非同步問題，會錯誤，所以取消client.connect()，改成在pg.js連線，而且也不關掉連線
// 直接在執行完後，手動在terminal kill
const writeProductToDatabase = () => {
  // client.connect();
  fs.createReadStream(csvFilePath)
  .pipe(csv())
  .on('data', (row) => {
    // console.log('row: ', row); // 全部的row先讀完
    const query = {
      text: 'INSERT INTO products_mailbic(product_handle, product_name, style, flavor, quantity, price) VALUES($1, $2, $3, $4, $5, $6)',
      values: [row['商品編號'], row['商品名稱'], row['樣式'], row['尺寸'], row['實際庫存(可用庫存+配貨)'], row['售價']],
    };
    client.query(query, (err, res) => {
      // console.log('query: ', query);
      if (err) {
        console.error(err);
      }
    });
  })
  .on('end', () => {
    console.log('CSV檔案處理完成，資料已寫入資料庫。');
  });
  // client.end();
}


// 连接到PostgreSQL数据库
// client.connect()
//   .then(() => {
//     console.log('Connected to PostgreSQL database');

//     // 读取CSV文件
//     fs.createReadStream(csvFilePath)
//       .pipe(csv())
//       .on('data', (row) => {
//         // 处理每一行数据，将其插入到PostgreSQL数据库中
//         insertDataIntoPostgres(row);
//       })
//       .on('end', () => {
//         // 关闭PostgreSQL连接
//         client.end();
//         console.log('CSV file successfully processed and data inserted into PostgreSQL.');
//       });
//   })
//   .catch((err) => {
//     console.error('Error connecting to PostgreSQL database:', err);
//   });

// 插入数据到PostgreSQL数据库的函数，可以搭配client.connect()使用 還是不行
// function insertDataIntoPostgres(data) {
//   const query = 'INSERT INTO products_mailbic(product_handle, product_name, style, flavor, quantity, price) VALUES($1, $2, $3, $4, $5, $6)';

//   const values = [
//     data['商品編號'],
//     data['商品名稱'],
//     data['樣式'],
//     data['尺寸'],
//     parseInt(data['實際庫存(可用庫存+配貨)']),
//     parseInt(data['售價']),
//   ];

//   // 执行查询
//   client.query(query, values)
//     .then(() => {
//       console.log(`Data inserted for 商品編號: ${data['商品編號']}`);
//     })
//     .catch((err) => {
//       console.error(`Error inserting data for 商品編號: ${data['商品編號']}`, err);
//     });
// }




module.exports = writeProductToDatabase;
