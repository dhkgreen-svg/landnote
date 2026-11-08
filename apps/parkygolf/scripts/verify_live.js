async function checkLive() {
  try {
    const res = await fetch('https://www.parkgolfallinone.com');
    console.log('HTTP_STATUS:', res.status);
    console.log('VERCEL_ID:', res.headers.get('x-vercel-id'));
    const text = await res.text();
    console.log('HTML_LENGTH:', text.length);
    console.log('CONTAINS_PARKY:', text.includes('파크골프') || text.includes('PARKY'));
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

checkLive();
