const axios = require('axios');
const { pool } = require('../config/pg');
const Cursor = require('pg-cursor')
const { updateCustomerTagsLogger } = require('../config/log_dynamic_path');

const SHOPLINE_API_TOKEN_KING = process.env.SHOPLINE_API_TOKEN_KING;
const SHOPLINE_USER_AGENT_KING = process.env.SHOPLINE_USER_AGENT_KING;

/**
 * 改用這隻API: Add or Remove Customer tags, PATCH
 */
const updateTags = async (customer_id, tags) => {
  console.log('updateTags: ', customer_id, tags);
  try{          
  const URL = `https://open.shopline.io/v1/customers/${customer_id}/tags`;
  console.log("URL", URL);
  const headers = {
    'Accept': 'application/json',
    'Authorization': `Bearer ${SHOPLINE_API_TOKEN_KING}`,
    'Content-Type': 'application/json'
  };
  const data = {
    tags: tags,
    update_mode: 'add'
  };
  console.log("data", data);
  const response = await axios.patch(URL, data, { headers });
  console.log('updateTags response: ', response.data);
  return response.data;
  }
  catch(error){
    console.log('updateTags error: ', error.response.data);
    updateCustomerTagsLogger.error(`${customer_id}updateTags: ${tags}`, error);
    return error;
  }
};

module.exports = {
  updateTags
};

