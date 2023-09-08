const createRoom = async () => {
  const expiry = Math.round(Date.now() / 1000) + 60 * 60;
  const roomRes = await fetch('/api/rooms', {
    method: 'POST',
    body: JSON.stringify({
      properties: {
        enable_prejoin_ui: false,
        start_audio_off: true,
        exp: expiry,
      },
    }),
  });
  const { room } = await roomRes.json();
  if (roomRes.status !== 200) {
    throw new Error(room.error);
  }
  return room;
};

const createToken = async ({ isOwner, roomName }) => {
  const expiry = Math.round(Date.now() / 1000) + 60 * 60;
  const tokenRes = await fetch('/api/tokens', {
    method: 'POST',
    body: JSON.stringify({
      properties: { room_name: roomName, exp: expiry, is_owner: isOwner },
    }),
  });
  const tokenData = await tokenRes.json();

  if (tokenRes.status !== 200) {
    throw new Error(tokenData.error);
  }
  return tokenData.token;
};

const api = {
  createToken,
  createRoom,
};

export default api;
