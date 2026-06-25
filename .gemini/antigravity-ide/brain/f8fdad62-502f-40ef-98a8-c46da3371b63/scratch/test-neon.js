const { neon } = require('@neondatabase/serverless');

const connectionString = 'postgresql://neondb_owner:npg_El21wgZHTKPM@ep-delicate-cloud-aom4ffre-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function main() {
  try {
    console.log('Attempting to connect via Neon HTTP driver...');
    const sql = neon(connectionString);
    const result = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('Connected to Neon successfully.');
    console.log('Existing tables in public schema:');
    if (result.length === 0) {
      console.log('None');
    } else {
      result.forEach(row => console.log(`- ${row.table_name}`));
    }
  } catch (err) {
    console.error('Error connecting to Neon:', err);
  }
}

main();
