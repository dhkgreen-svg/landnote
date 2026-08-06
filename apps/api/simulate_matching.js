const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const MATCH_WEIGHTS = { category: 0.60, price: 0.20, area: 0.10, location: 0.10 };

function ensureArray(arr) {
  return Array.isArray(arr) ? arr : (typeof arr === 'string' ? [arr] : []);
}

function priceScore(cond, listing) {
  let score = 0;
  let checked = 0;

  const calcFlexibleScore = (actual, max) => {
    if (actual <= max) return 1.0;
    if (actual > max * 2) return 0.0;
    return 1.0 - ((actual - max) / max);
  };

  if (listing.price_sale && cond?.price_max) {
    score += calcFlexibleScore(listing.price_sale, cond.price_max);
    checked++;
  }
  if (listing.monthly_rent && cond?.monthly_rent_max) {
    score += calcFlexibleScore(listing.monthly_rent, cond.monthly_rent_max);
    checked++;
  }
  if (listing.deposit && cond?.deposit_max) {
    score += calcFlexibleScore(listing.deposit, cond.deposit_max);
    checked++;
  }

  if (checked === 0) return 0.8;
  return score / checked;
}

function score(inquiry, listing) {
  const cond = inquiry.detailed_conditions || {};
  const bd = { category: 0, price: 0, area: 0, location: 0 };

  let txMultiplier = 1.0;
  const inqTx = ensureArray(inquiry.transaction_types).map(t => t.toLowerCase());
  const listTx = ensureArray(listing.transaction_types).map(t => t.toLowerCase());
  
  if (inqTx.length > 0 && listTx.length > 0) {
    const hasTxMatch = inqTx.some(t => listTx.includes(t));
    if (!hasTxMatch) {
      txMultiplier = 0.6;
    }
  }

  const inqSub = ensureArray(inquiry.subcategory_codes).map(s => s.toLowerCase());
  const listSub = ensureArray(listing.subcategory_codes).map(s => s.toLowerCase());
  const inqTags = ensureArray(inquiry.tags).map(t => t.toLowerCase());
  const listTags = ensureArray(listing.tags).map(t => t.toLowerCase());

  const subcatMatch = inqSub.some(c => listSub.includes(c)) || inqTags.some(t => listTags.includes(t));

  const inqCat = ensureArray(inquiry.category_codes).map(c => c.toLowerCase());
  const listCat = ensureArray(listing.category_codes).map(c => c.toLowerCase());
  const catMatch = inqCat.some(c => listCat.includes(c));

  if (subcatMatch) {
    bd.category = MATCH_WEIGHTS.category;
  } else if (catMatch) {
    bd.category = MATCH_WEIGHTS.category;
  } else if (inqCat.length === 0 || listCat.length === 0) {
    bd.category = MATCH_WEIGHTS.category * 0.50;
  } else {
    bd.category = MATCH_WEIGHTS.category * 0.25;
  }

  bd.price = priceScore(cond, listing) * MATCH_WEIGHTS.price;

  if (cond?.area_min && listing.area_exclusive) {
    if (listing.area_exclusive >= cond.area_min) {
      const withinMax = !cond.area_max || listing.area_exclusive <= cond.area_max;
      bd.area = withinMax ? MATCH_WEIGHTS.area : MATCH_WEIGHTS.area * 0.7;
    } else if (listing.area_exclusive >= cond.area_min * 0.7) {
      bd.area = MATCH_WEIGHTS.area * 0.5;
    } else {
      bd.area = MATCH_WEIGHTS.area * 0.2;
    }
  } else {
    bd.area = MATCH_WEIGHTS.area * 0.8;
  }

  if (cond?.preferred_dong && listing.dong_name) {
    const preferred = Array.isArray(cond.preferred_dong) ? cond.preferred_dong : [cond.preferred_dong];
    const dongMatch = preferred.some(d => listing.dong_name?.includes(d) || d.includes(listing.dong_name));
    if (dongMatch) bd.location = MATCH_WEIGHTS.location;
    else bd.location = MATCH_WEIGHTS.location * 0.3;
  } else {
    bd.location = MATCH_WEIGHTS.location * 0.5;
  }

  bd.category *= txMultiplier;
  bd.price *= txMultiplier;

  return bd;
}

async function run() {
  const { data: agents } = await supabase.from('agents').select('id');
  if (!agents || agents.length === 0) return console.log("No agent found");

  for (const agent of agents) {
    const agentId = agent.id;
    const { data: inquiries } = await supabase.from('customer_inquiries').select('*').eq('agent_id', agentId).neq('status', 'closed');
    const { data: listings } = await supabase.from('property_listings').select('*').eq('agent_id', agentId).eq('status', 'active');
    
    if (!inquiries || !listings || inquiries.length === 0 || listings.length === 0) {
      continue;
    }
    console.log(`\n\n=== Agent ${agentId}: found ${inquiries.length} inquiries and ${listings.length} active listings ===`);
    
    for (const inquiry of inquiries) {
      console.log(`\n--- INQUIRY: ${inquiry.customer_name} (${inquiry.id}) ---`);
      console.log(`Type: ${inquiry.inquiry_type}, Cats: ${inquiry.category_codes}, Tx: ${inquiry.transaction_types}`);
      
      const results = [];
      for (const listing of listings) {
        const breakdown = score(inquiry, listing);
        const total = breakdown.category + breakdown.price + breakdown.area + breakdown.location;
        
        results.push({
          listing_id: listing.id,
          listing_address: listing.address_full || 'No Addr',
          listing_cats: listing.category_codes,
          total_score: total,
          breakdown,
          pass: total >= 0.15
        });
      }
      
      results.sort((a,b) => b.total_score - a.total_score);
      console.log(JSON.stringify(results.filter(r => r.pass), null, 2));
      const failCount = results.filter(r => !r.pass).length;
      console.log(`... and ${failCount} listings failed to match (score < 0.15)`);
    }
  }
}

run();
