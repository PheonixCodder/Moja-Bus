import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createReverseGeocoder,
  formatNominatimAddress,
} from "../reverse-geocode";

function jsonResponse(body: unknown, ok = true): Response {
  return {
    ok,
    status: ok ? 200 : 503,
    json: async () => body,
  } as Response;
}

describe("formatNominatimAddress", () => {
  it("builds 'house_number road, locality' from structured parts", () => {
    assert.equal(
      formatNominatimAddress({
        address: {
          house_number: "12",
          road: "Rue du Commerce",
          neighbourhood: "Adjamé",
        },
      }),
      "12 Rue du Commerce, Adjamé",
    );
  });

  it("omits the house number when missing", () => {
    assert.equal(
      formatNominatimAddress({
        address: { road: "Boulevard de Marseille", suburb: "Cocody" },
      }),
      "Boulevard de Marseille, Cocody",
    );
  });

  it("falls back to the display name when no address parts exist", () => {
    assert.equal(
      formatNominatimAddress({
        display_name: "Rue du Commerce, Adjamé, Abidjan, Côte d'Ivoire",
      }),
      "Rue du Commerce, Adjamé, Abidjan, Côte d'Ivoire",
    );
  });

  it("returns null when there is nothing to format", () => {
    assert.equal(formatNominatimAddress({}), null);
  });
});

describe("createReverseGeocoder", () => {
  it("returns the formatted address from Nominatim", async () => {
    let called = false;
    const fetchMock = async (url: string) => {
      called = true;
      assert.match(String(url), /nominatim\.openstreetmap\.org\/reverse/);
      assert.match(String(url), /accept-language=fr/);
      return jsonResponse({
        display_name: "Rue du Commerce, Adjamé, Abidjan, Côte d'Ivoire",
        address: { road: "Rue du Commerce", suburb: "Adjamé" },
      });
    };

    const reverseGeocode = createReverseGeocoder({
      fetch: fetchMock as typeof fetch,
    });
    const address = await reverseGeocode({
      latitude: 5.351,
      longitude: -4.021,
    });
    assert.equal(address, "Rue du Commerce, Adjamé");
    assert.ok(called);
  });

  it("caches identical rounded coordinates (single fetch)", async () => {
    let calls = 0;
    const fetchMock = async () => {
      calls++;
      return jsonResponse({ address: { road: "Rue A" } });
    };

    const reverseGeocode = createReverseGeocoder({
      fetch: fetchMock as typeof fetch,
    });
    await reverseGeocode({ latitude: 5.35111, longitude: -4.02111 });
    await reverseGeocode({ latitude: 5.35113, longitude: -4.02114 });
    assert.equal(calls, 1);
  });

  it("returns null on HTTP error", async () => {
    const reverseGeocode = createReverseGeocoder({
      fetch: async () => jsonResponse({ error: "unavailable" }, false),
    });
    assert.equal(
      await reverseGeocode({ latitude: 5.35, longitude: -4.02 }),
      null,
    );
  });

  it("returns null on network failure", async () => {
    const reverseGeocode = createReverseGeocoder({
      fetch: async () => {
        throw new Error("socket hang up");
      },
    });
    assert.equal(
      await reverseGeocode({ latitude: 5.35, longitude: -4.02 }),
      null,
    );
  });

  it("returns null when rate-limited (limiter denies)", async () => {
    const reverseGeocode = createReverseGeocoder({
      fetch: async () => jsonResponse({ address: { road: "Rue A" } }),
      limiter: () => ({ ok: false, retryAfterMs: 800 }),
    });
    assert.equal(
      await reverseGeocode({ latitude: 5.35, longitude: -4.02 }),
      null,
    );
  });

  it("returns null when the response has no address", async () => {
    const reverseGeocode = createReverseGeocoder({
      fetch: async () => jsonResponse({ error: "Unable to geocode" }),
    });
    assert.equal(
      await reverseGeocode({ latitude: 5.35, longitude: -4.02 }),
      null,
    );
  });

  it("returns null when the request times out", async () => {
    const reverseGeocode = createReverseGeocoder({
      timeoutMs: 10,
      fetch: async (_url, init) => {
        await new Promise((resolve) => {
          const signal = init?.signal as AbortSignal | undefined;
          signal?.addEventListener("abort", () => resolve(undefined));
          setTimeout(resolve, 200, undefined);
        });
        throw new Error("AbortError: This operation was aborted");
      },
    });
    assert.equal(
      await reverseGeocode({ latitude: 5.35, longitude: -4.02 }),
      null,
    );
  });

  it("uses the REVERSE_GEOCODE_BASE_URL override", async () => {
    let target = "";
    const fetchMock = async (url: string) => {
      target = String(url);
      return jsonResponse({ address: { road: "Rue B" } });
    };
    const reverseGeocode = createReverseGeocoder({
      baseUrl: "https://geo.internal.example",
      fetch: fetchMock as typeof fetch,
    });
    await reverseGeocode({ latitude: 5.35, longitude: -4.02 });
    assert.ok(target.startsWith("https://geo.internal.example/reverse"));
  });
});
