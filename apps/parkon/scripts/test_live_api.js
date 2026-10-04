async function testApi() {
  try {
    const res = await fetch('https://www.parkgolfallinone.com/api/round/room?roomId=live_check_room_1');
    console.log('API_GET_STATUS:', res.status);
    const json = await res.json();
    console.log('API_GET_RESPONSE:', json);
  } catch (err) {
    console.error('API test error:', err);
  }
}

testApi();
