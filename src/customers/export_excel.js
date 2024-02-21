const { pool } = require('../config/pg');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

const exportFolder = path.join(process.cwd(), 'data', 'customers_xlsx');

const columnMapping = {
  full_name: 'Full Name',
  email_address: 'Email Address',
  country_calling_code: 'Country Calling Code',
  mobile_number: 'Mobile Number',
  gender: 'Gender',
  birthday: 'Birthday',
  language: 'Language',
  is_member: 'Is Member',
  accepts_marketing: 'Accepts Marketing',
  tags: 'Tags',
  note: 'Note',
  register_from: 'Register From',
  register_store_id: 'Register Store ID',
  register_date: 'Register Date',
  total_spend: 'Total Spend',
  order_is_accumulation: 'Order Is Accumulation',
  membership_tier: 'Membership Tier',
  store_credits: 'Store Credits',
  reason_for_adding_credits: 'Reason for adding Credits',
  expiry_date_of_credits: 'Expiry Date of Credits',
  member_points: 'Member Points',
  reason_for_adding_points: 'Reason for adding Points',
  country_calling_code_of_contact_phone: 'Country Calling Code of Contact Phone',
  contact_phone: 'Contact Phone',
  address_recipient_name: 'Address - Recipient Name',
  address_country_calling_code_of_recipient_phone_number: 'Address - Country Calling Code of Recipient Phone Number',
  address_recipient_phone_number: 'Address - Recipient Phone Number',
  address_1: 'Address - 1',
  address_2: 'Address - 2',
  address_city: 'Address - City',
  address_district_state_province: 'Address - District/State/Province',
  address_postcode: 'Address - Postcode',
  address_country: 'Address - Country'
}

// todo: 確認要從customers_shopline_2還是customers_shopline table匯出
const getData = async (pageLimit, page) => {
  const offset = (page - 1) * pageLimit;
  const client = await pool.connect();
  try {
    const query = `
    SELECT 
    full_name,email_address,country_calling_code,mobile_number,gender,birthday,language,is_member,accepts_marketing,tags,note,register_from,register_store_id,register_date,total_spend,order_is_accumulation,membership_tier,store_credits,reason_for_adding_credits,expiry_date_of_credits,member_points,reason_for_adding_points,country_calling_code_of_contact_phone,contact_phone,address_recipient_name,address_country_calling_code_of_recipient_phone_number,address_recipient_phone_number,address_1,address_2,address_city,address_district_state_province,address_postcode,address_country
    FROM public.customers_shopline_2 ORDER BY email_address LIMIT ${pageLimit} OFFSET ${offset}`;
    const result = await client.query(query);
    const rows = result.rows;
    return rows;
  }
  catch (error) {
    console.error('Error getting data:', error);
  } finally {
    client.release(); // Release the client back to the pool
  }
}

const writeExcel = async (rows, page) => {
  try {
    // 創建新的Excel工作簿和工作表
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');

    // 寫入表頭
    const tableColumns = Object.keys(columnMapping);
    worksheet.addRow(tableColumns.map(column => columnMapping[column]));
  
    // 寫入數據
    rows.forEach(row => {
      const rowData = tableColumns.map(column => row[column]);
      worksheet.addRow(rowData);
    });
  
    // 將Excel寫入文件
    const fileName = `customers_shopline_2-${page}.xlsx`;
    const filePath = path.join(exportFolder, fileName);
    await workbook.xlsx.writeFile(filePath);
  
    console.log('Excel file exported successfully.');
  } catch (error) {
    console.error('Error exporting to Excel:', error);
  } 
}

/**
 * todo: 
 * 過年後回來，產生所有檔案，一個一個手動匯入。
 */
const totalCustomerRows = 1229;
const rowsPerPage = 3000;
const totalPages = Math.ceil(totalCustomerRows / rowsPerPage);

const exportToExcel = async () => {
  for (let page = 1; page <= totalPages; page++) {
    const rows = await getData(rowsPerPage, page);
    await writeExcel(rows, page);
  }
}

module.exports = exportToExcel;