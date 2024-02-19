const { pool } = require('../config/pg');
const fs = require('fs');
const path = require('path');
const { parse } = require('json2csv'); // shopline不支援csv qq

const exportFolder = path.join(process.cwd(), 'data', 'customers_csv');
const csvFields = [
  { label: 'Full Name', value: 'full_name' },
  { label: 'Email Address', value: 'email_address' },
  { label: 'Country Calling Code', value: 'country_calling_code' },
  { label: 'Mobile Number', value: 'mobile_number' },
  { label: 'Gender', value: 'gender' },
  { label: 'Birthday', value: 'birthday' },
  { label: 'Language', value: 'language' },
  { label: 'Is Member', value: 'is_member' },
  { label: 'Accepts Marketing', value: 'accepts_marketing' },
  { label: 'Tags', value: 'tags' },
  { label: 'Note', value: 'note' },
  { label: 'Register From', value: 'register_from' },
  { label: 'Register Store ID', value: 'register_store_id' },
  { label: 'Register Date', value: 'register_date' },
  { label: 'Total Spend', value: 'total_spend' },
  { label: 'Order Is Accumulation', value: 'order_is_accumulation' },
  { label: 'Membership Tier', value: 'membership_tier' },
  { label: 'Store Credits', value: 'store_credits' },
  { label: 'Reason for adding Credits', value: 'reason_for_adding_credits' },
  { label: 'Expiry Date of Credits', value: 'expiry_date_of_credits' },
  { label: 'Member Points', value: 'member_points' },
  { label: 'Reason for adding Points', value: 'reason_for_adding_points' },
  { label: 'Country Calling Code of Contact Phone', value: 'country_calling_code_of_contact_phone' },
  { label: 'Contact Phone', value: 'contact_phone' },
  { label: 'Address - Recipient Name', value: 'address_recipient_name' },
  { label: 'Address - Country Calling Code of Recipient Phone Number', value: 'address_country_calling_code_of_recipient_phone_number' },
  { label: 'Address - Recipient Phone Number', value: 'address_recipient_phone_number' },
  { label: 'Address - 1', value: 'address_1' },
  { label: 'Address - 2', value: 'address_2' },
  { label: 'Address - City', value: 'address_city' },
  { label: 'Address - District/State/Province', value: 'address_district_state_province' },
  { label: 'Address - Postcode', value: 'address_postcode' },
  { label: 'Address - Country', value: 'address_country' },
  // { label: '', value: 'original_address' },
];

const getCSVValues = (array) => {
  let values = '';
  for (let i = 0; i < array.length; i++) {
    values += array[i].value;
    if (i < array.length - 1) {
      values += ',';
    }
  }
  return values;
}

async function exportDataToCSV() {
  const client = await pool.connect();
  try {
    const query = `
    SELECT 
    full_name,email_address,country_calling_code,mobile_number,gender,birthday,language,is_member,accepts_marketing,tags,note,register_from,register_store_id,register_date,total_spend,order_is_accumulation,membership_tier,store_credits,reason_for_adding_credits,expiry_date_of_credits,member_points,reason_for_adding_points,country_calling_code_of_contact_phone,contact_phone,address_recipient_name,address_country_calling_code_of_recipient_phone_number,address_recipient_phone_number,address_1,address_2,address_city,address_district_state_province,address_postcode,address_country
    FROM public.customers_shopline ORDER BY email_address LIMIT 100 OFFSET 0`;
    const result = await client.query(query);
    const csvOptions = { fields: csvFields };

    const csv = parse(result.rows, csvOptions); // 將欄位名稱轉換為shopline指定的csv標題
    const fileName = `customers_shopline.csv`;
    const filePath = path.join(exportFolder, fileName);

    fs.writeFileSync(filePath, csv);


    // 將資料分割成每3000筆一組
    // const batchSize = 3000;
    // for (let i = 0; i < result.rows.length; i += batchSize) {
    //   const batch = result.rows.slice(i, i + batchSize);

    //   // 將批次資料轉換成CSV格式
    //   const csv = parse(batch);

    //   // 寫入CSV檔案
    //   const fileName = `batch_${i / batchSize + 1}.csv`;
    //   fs.writeFileSync(fileName, csv);
    //   console.log(`Batch ${i / batchSize + 1} exported to ${fileName}`);
    // }


    console.log('Export completed.');
  } catch (error) {
    console.error('Error exporting data:', error);
  } finally {
    client.release(); // 釋放連線回連線池
  }
}

module.exports = exportDataToCSV;



// -- 设置参数
// copy (
//     SELECT *
    // FROM public.customers_shopline
    // ORDER BY email_address 
    // LIMIT 3000 OFFSET 0
// ) TO '/Users/marina/Downloads/king_hello_data/customers_export_from_dbeaver' WITH CSV HEADER;

// --\copy (
// --    SELECT *
// --    FROM public.customers_shopline
// --    ORDER BY full_name
// --    LIMIT 3000 OFFSET 3000
// --) TO '/path/to/export/customers_shopline_2.csv' WITH CSV HEADER;

// -- 重复此步骤，直到您导出所有的数据