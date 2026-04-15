/** 401 után redirect mellett a hívók ne kapjanak null-t (res.ok / res.json() biztonságos). */
export function syntheticUnauthorizedResponse() {
  return new Response(JSON.stringify({ detail: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
