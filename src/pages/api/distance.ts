import { NextApiRequest, NextApiResponse } from "next";

const OPENROUTE_API_KEY = process.env.NEXT_PUBLIC_OPEN_ROUTE_DISTANCE;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { start, end } = req.query;

  if (!start || !end) {
    return res.status(400).json({ error: "Missing start or end coordinates" });
  }

  try {
    const url = new URL(
      "https://api.openrouteservice.org/v2/directions/driving-car"
    );
    url.searchParams.set("api_key", OPENROUTE_API_KEY);
    url.searchParams.set("start", start as string);
    url.searchParams.set("end", end as string);
    url.searchParams.set("preference", "fastest");
    url.searchParams.set("units", "m");
    url.searchParams.set("language", "es");
    url.searchParams.set("instructions", "true");
    url.searchParams.set("geometry", "true");

    const response = await fetch(url.toString());

    if (!response.ok) {
      console.error(
        `OpenRouteService error: ${response.status} ${response.statusText}`
      );
      return res.status(response.status).json({
        error: `OpenRouteService error: ${response.status}`,
      });
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error in distance API:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
