// filepath: api/google-maps-proxy.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  const { endpoint, ...params } = req.query;

  // Replace this with your actual Google Maps API key
  const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

  if (!endpoint) {
    return res.status(400).json({ error: 'Missing endpoint parameter' });
  }

  const url = `https://maps.googleapis.com/maps/api/${endpoint}?key=${GOOGLE_MAPS_API_KEY}&${new URLSearchParams(
    params
  ).toString()}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching Google Maps API:', error);
    res.status(500).json({ error: 'Failed to fetch Google Maps API' });
  }
}