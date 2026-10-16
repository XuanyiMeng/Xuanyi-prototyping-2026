/** Vercel's request headers provide a city-level fallback when device GPS fails. */
export function GET(request: Request) {
  const latitude = Number.parseFloat(request.headers.get("x-vercel-ip-latitude") ?? "");
  const longitude = Number.parseFloat(request.headers.get("x-vercel-ip-longitude") ?? "");

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
      Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return Response.json({ error: "Approximate location unavailable" }, {
      status: 404,
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  return Response.json({ latitude, longitude }, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
