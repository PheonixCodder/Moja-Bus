export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference") ?? searchParams.get("trxref");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Payment Complete</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; margin: 0; background: #f5f5f7;
      color: #1d1d1f;
    }
    .card {
      background: white; border-radius: 20px; padding: 40px 32px;
      text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      max-width: 320px;
    }
    .checkmark {
      width: 56px; height: 56px; border-radius: 50%;
      background: #34c759; color: white; font-size: 28px;
      line-height: 56px; margin: 0 auto 16px;
    }
    h1 { font-size: 20px; font-weight: 600; margin: 0 0 8px; }
    p { font-size: 14px; color: #6e6e73; margin: 0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="checkmark">&#10003;</div>
    <h1>Payment Complete</h1>
    <p>${reference ? `Reference: ${reference}` : "Returning to your wallet..."}</p>
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
