const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("Checking customer_inquiries status:");
  const { data: inq } = await supabase.from('customer_inquiries').select('id, status, category_codes, transaction_types, subcategory_codes').limit(5);
  console.log(JSON.stringify(inq, null, 2));

  console.log("\nChecking property_listings status:");
  const { data: listings } = await supabase.from('property_listings').select('id, status, category_codes, transaction_types, subcategory_codes').limit(5);
  console.log(JSON.stringify(listings, null, 2));
}

run();
