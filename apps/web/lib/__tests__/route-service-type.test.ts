import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveRouteServiceType } from "../route-service-type";

describe("resolveRouteServiceType", () => {
  it("derives URBAN when both endpoints share a city and no type requested", () => {
    const res = resolveRouteServiceType({
      originCityId: "c1",
      destCityId: "c1",
      originCityName: "Abidjan",
      destCityName: "Abidjan",
      requestedServiceType: undefined,
    });
    assert.deepEqual(res, { ok: true, serviceType: "URBAN" });
  });

  it("derives INTERCITY when endpoints are in different cities", () => {
    const res = resolveRouteServiceType({
      originCityId: "c1",
      destCityId: "c2",
      originCityName: "Abidjan",
      destCityName: "Bouaké",
      requestedServiceType: undefined,
    });
    assert.deepEqual(res, { ok: true, serviceType: "INTERCITY" });
  });

  it("accepts an explicit matching URBAN toggle", () => {
    const res = resolveRouteServiceType({
      originCityId: "c1",
      destCityId: "c1",
      originCityName: "Abidjan",
      destCityName: "Abidjan",
      requestedServiceType: "URBAN",
    });
    assert.deepEqual(res, { ok: true, serviceType: "URBAN" });
  });

  it("accepts an explicit matching INTERCITY toggle", () => {
    const res = resolveRouteServiceType({
      originCityId: "c1",
      destCityId: "c2",
      originCityName: "Abidjan",
      destCityName: "Bouaké",
      requestedServiceType: "INTERCITY",
    });
    assert.deepEqual(res, { ok: true, serviceType: "INTERCITY" });
  });

  it("rejects INTERCITY on a same-city pair with the intercity rule error", () => {
    const res = resolveRouteServiceType({
      originCityId: "c1",
      destCityId: "c1",
      originCityName: "Abidjan",
      destCityName: "Abidjan",
      requestedServiceType: "INTERCITY",
    });
    assert.equal(res.ok, false);
    if (!res.ok) {
      assert.match(
        res.message,
        /An intercity route must connect terminals in different cities\. Both endpoints are in Abidjan — choose Urban or change a terminal\./,
      );
    }
  });

  it("rejects URBAN on a cross-city pair with the urban rule error", () => {
    const res = resolveRouteServiceType({
      originCityId: "c1",
      destCityId: "c2",
      originCityName: "Abidjan",
      destCityName: "Bouaké",
      requestedServiceType: "URBAN",
    });
    assert.equal(res.ok, false);
    if (!res.ok) {
      assert.match(
        res.message,
        /An urban route requires all stops in the same city\. Origin is in Abidjan and destination is in Bouaké — choose Intercity or change a terminal\./,
      );
    }
  });

  it("falls back to city ids when names are missing", () => {
    const res = resolveRouteServiceType({
      originCityId: "c1",
      destCityId: "c1",
      originCityName: null,
      destCityName: undefined,
      requestedServiceType: "INTERCITY",
    });
    assert.equal(res.ok, false);
    if (!res.ok) {
      assert.match(res.message, /Both endpoints are in c1/);
    }
  });
});
