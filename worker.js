export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders()
      });
    }

    if (url.pathname !== "/feed") {
      return new Response("OK: use /feed", { status: 200 });
    }

    const RSS_URL = "https://rss.blog.naver.com/dic-wannabe.xml";

    const rssRes = await fetch(RSS_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/rss+xml, application/xml;q=0.9, */*;q=0.8",
      }
    });

    if (!rssRes.ok) {
      return json({ error: "Failed to fetch RSS", status: rssRes.status }, 502);
    }

    const xmlText = await rssRes.text();

    return json({ xml: xmlText }, 200);
  }
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "*",
  };
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(),
      "Cache-Control": "public, max-age=300"
    }
  });
}
