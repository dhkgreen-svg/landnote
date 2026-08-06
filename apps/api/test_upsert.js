require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase
    .from('matches')
    .upsert(
      [{
        agent_id: '573c8d18-0721-4e60-bd45-65516ffa7b49',
        inquiry_id: 'aeefe446-8807-4742-bbd7-2a5d26117979',
        property_id: '8b48f828-d7e9-4822-8aee-6ce98e9fa95a',
        score: 0.999
      }],
      { onConflict: 'inquiry_id,property_id' }
    ).select();
  console.log("Data:", data);
  console.log("Error:", error);
}
run();
