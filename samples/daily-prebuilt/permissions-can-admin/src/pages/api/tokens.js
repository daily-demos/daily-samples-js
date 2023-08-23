export default async function handler(req, res) {
  try {
    switch (req.method) {
      case "POST":
        const options = JSON.parse(req.body);
        // Make request to Daily's REST API /meeting-tokens endpoint
        // https://docs.daily.co/reference/rest-api/meeting-tokens/create-meeting-token
        const dailyTokenRes = await fetch(
          "https://api.daily.co/v1/meeting-tokens",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + process.env.DAILY_API_KEY,
            },
            body: JSON.stringify(options),
          }
        );

        const token = await dailyTokenRes.json();
        res.status(200).json({ token });
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
