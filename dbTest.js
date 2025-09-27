import { Client } from "pg";
const client = new Client({
  connectionString: "postgresql://neondb_owner:npg_DTAJX9a5sfSR@ep-lively-shape-adz7r2ck.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require",
  ssl: { rejectUnauthorized: false }
});

async function testConnection() {
  try {
    await client.connect();
    console.log("✅ Connected to Neon!");
    const res = await client.query("SELECT * FROM products");
    console.log(res.rows);
  } catch (err) {
    console.error("❌ DB connection failed:", err);
  } finally {
    await client.end();
  }
}

testConnection();
