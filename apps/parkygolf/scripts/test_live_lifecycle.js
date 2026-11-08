async function testLiveRoundLifecycle() {
  const roomId = 'live_test_' + Date.now();
  console.log('1. Testing room creation on live server for roomId:', roomId);

  // POST create room
  const createRes = await fetch('https://www.parkgolfallinone.com/api/round/room', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'sync',
      roomId,
      leaderName: '김대희 대표님',
      courseId: 'course_1',
      courseName: '구미 동락 파크골프장',
      courseLetter: 'A',
      startHoleIndex: 1,
      playerCount: 4,
      players: [
        { id: 'p_1', name: '김대희 대표님', isLeader: true },
        { id: 'p_2', name: '동반자1', isLeader: false },
        { id: 'p_3', name: '동반자2', isLeader: false },
        { id: 'p_4', name: '동반자3', isLeader: false },
      ],
    }),
  });
  console.log('Create Response Status:', createRes.status);
  const createData = await createRes.json();
  console.log('Create Response Data:', createData);

  // GET fetch room
  console.log('2. Testing room fetch across serverless containers...');
  const getRes = await fetch(`https://www.parkgolfallinone.com/api/round/room?roomId=${roomId}`);
  console.log('Fetch Response Status:', getRes.status);
  const getData = await getRes.json();
  console.log('Fetch Response Data:', getData);

  // POST companion join
  console.log('3. Testing companion join...');
  const joinRes = await fetch('https://www.parkgolfallinone.com/api/round/room', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'join',
      roomId,
      playerName: '이프로',
      isGuest: false,
    }),
  });
  console.log('Join Response Status:', joinRes.status);
  const joinData = await joinRes.json();
  console.log('Join Response Data:', joinData);
}

testLiveRoundLifecycle();
