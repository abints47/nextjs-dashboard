import postgres from 'postgres';

// Ensure your .env file has POSTGRES_URL configured
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

async function listInvoices() {
  const data = await sql`
    SELECT invoices.amount, customers.name
    FROM invoices
    JOIN customers ON invoices.customer_id = customers.id
    WHERE invoices.amount = 666;
  `;

  return data;
}

export async function GET() {
  try {
    // This executes the query and sends the invoices back as a JSON response
    return Response.json(await listInvoices());
  } catch (error) {
    // If the database connection fails (like ECONNREFUSED), it catches it here
    return Response.json({ error: String(error) }, { status: 500 });
  }
}