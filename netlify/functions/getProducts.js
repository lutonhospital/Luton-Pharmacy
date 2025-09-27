import { Client } from "pg";
export async function handler() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  try {
    const result = await client.query("SELECT * FROM products");
    return {
      statusCode: 200,
      body: JSON.stringify(result.rows)
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: "Database query failed" }) };
  } finally {
    await client.end();
  }
}
