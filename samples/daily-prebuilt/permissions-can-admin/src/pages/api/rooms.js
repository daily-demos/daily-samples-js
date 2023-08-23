export default async function handler(req, res) {
  try {
    switch (req.method) {
      case "POST":
        const options = JSON.parse(req.body);
        // Make request to Daily's REST API /rooms endpoint
        // https://docs.daily.co/reference/rest-api/rooms/create-room
        const dailyRoomRes = await fetch("https://api.daily.co/v1/rooms/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + process.env.DAILY_API_KEY,
          },
          body: JSON.stringify(options),
        });
        const room = await dailyRoomRes.json();
        res.status(200).json({ room });
        break;
      default:
        res.status(405).end(`${method} Not Allowed`);
        break;
    }
  } catch (error) {
    res.status(500).json({
      error,
    });
  }
}
