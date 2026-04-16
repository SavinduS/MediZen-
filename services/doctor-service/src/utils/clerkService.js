// clerkService.js
// Utility for interacting with Clerk authentication API

const axios = require('axios');

const CLERK_API_URL = process.env.CLERK_API_URL;
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

async function createClerkUser(email, password) {
  try {
    const res = await axios.post(
      `${CLERK_API_URL}/v1/users`,
      { email_address: email, password },
      { headers: { Authorization: `Bearer ${CLERK_SECRET_KEY}` } }
    );
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.errors?.[0]?.message || 'Failed to create Clerk user');
  }
}

module.exports = { createClerkUser };