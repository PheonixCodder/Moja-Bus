export const runtime = "nodejs";

/**
 * Mobile WebView return URL after Paystack.
 * Must not claim "Payment Complete" without verify/confirm (P1-8).
 * Traveler booking callback remains deferred (D6); this page is honest processing UX.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference") ?? searchParams.get("trxref");
  const cancelled = searchParams.get("cancel") === "1";

  const title = cancelled ? "Payment cancelled" : "Payment processing";
  const heading = cancelled ? "Payment cancelled" : "Confirming your payment…";
  const body = cancelled
    ? "You can close this window and try again from the app."
    : reference
      ? "We are confirming with your payment provider. This page does not complete the booking by itself — keep the app open until your booking appears."
      : "Returning to the app…";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
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
    .icon {
      width: 56px; height: 56px; border-radius: 50%;
      background: ${cancelled ? "#ff3b30" : "#007aff"}; color: white; font-size: 28px;
      line-height: 56px; margin: 0 auto 16px;
    }
    h1 { font-size: 20px; font-weight: 600; margin: 0 0 8px; }
    p { font-size: 14px; color: #6e6e73; margin: 0; line-height: 1.4; }
    .ref { margin-top: 12px; font-size: 12px; color: #8e8e93; word-break: break-all; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${cancelled ? "&#10005;" : "&#8230;"}</div>
    <h1>${heading}</h1>
    <p>${body}</p>
    ${reference && !cancelled ? `<p class="ref">Reference: ${reference}</p>` : ""}
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
