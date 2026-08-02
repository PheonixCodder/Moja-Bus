import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateSearchPair } from "../validate-search-pair";
import { isUrban, placeMatchesTerminal } from "../places";

const city = (id: string) => ({ id, text: "Abidjan", level: "city" as const });

describe("validateSearchPair", () => {
  it("rejects identical unresolved names", () => {
    assert.equal(
      validateSearchPair({ id: "", text: "Abidjan" }, { id: "", text: "Abidjan" }),
      "sameCity",
    );
  });

  it("allows identical text when ids resolve to different cities", () => {
    assert.equal(
      validateSearchPair(city("c1"), city("c2")),
      null,
    );
  });

  it("rejects same city at city level on both sides", () => {
    assert.equal(validateSearchPair(city("c1"), city("c1")), "sameCity");
  });

  it("allows same city with one-sided municipality refinement", () => {
    assert.equal(
      validateSearchPair(
        city("c1"),
        { id: "c1", text: "Abidjan (Cocody)", municipalityId: "m1", level: "municipality" },
      ),
      null,
    );
  });

  it("allows same city with one-sided quarter refinement", () => {
    assert.equal(
      validateSearchPair(
        city("c1"),
        { id: "c1", text: "Abidjan (Cocody - Riviera 3)", municipalityId: "m1", quarterId: "q1", level: "quarter" },
      ),
      null,
    );
  });

  it("allows same city with different municipalities", () => {
    assert.equal(
      validateSearchPair(
        { id: "c1", text: "Abidjan (Cocody)", municipalityId: "m1", level: "municipality" },
        { id: "c1", text: "Abidjan (Yopougon)", municipalityId: "m2", level: "municipality" },
      ),
      null,
    );
  });

  it("rejects same city with the same municipality", () => {
    assert.equal(
      validateSearchPair(
        { id: "c1", text: "Abidjan (Cocody)", municipalityId: "m1", level: "municipality" },
        { id: "c1", text: "Abidjan (Cocody)", municipalityId: "m1", level: "municipality" },
      ),
      "sameCity",
    );
  });

  it("rejects same city with the same quarter", () => {
    assert.equal(
      validateSearchPair(
        { id: "c1", text: "Abidjan (Cocody - Riviera 3)", municipalityId: "m1", quarterId: "q1", level: "quarter" },
        { id: "c1", text: "Abidjan (Cocody - Riviera 3)", municipalityId: "m1", quarterId: "q1", level: "quarter" },
      ),
      "sameCity",
    );
  });

  it("rejects quarter vs municipality of the same municipality", () => {
    assert.equal(
      validateSearchPair(
        { id: "c1", text: "Abidjan (Cocody - Riviera 3)", municipalityId: "m1", quarterId: "q1", level: "quarter" },
        { id: "c1", text: "Abidjan (Cocody)", municipalityId: "m1", level: "municipality" },
      ),
      "sameCity",
    );
  });

  it("returns null when either end is empty", () => {
    assert.equal(
      validateSearchPair({ id: "", text: "" }, { id: "c1", text: "Bouaké" }),
      null,
    );
  });
});

describe("isUrban", () => {
  it("is urban when both places share a city", () => {
    assert.equal(
      isUrban(
        { cityId: "c1", level: "city" },
        { cityId: "c1", municipalityId: "m1", level: "municipality" },
      ),
      true,
    );
  });

  it("is intercity when cities differ", () => {
    assert.equal(
      isUrban(
        { cityId: "c1", level: "city" },
        { cityId: "c2", level: "city" },
      ),
      false,
    );
  });
});

describe("placeMatchesTerminal", () => {
  const terminal = { cityId: "c1", municipalityId: "m1", quarterId: "q1" };

  it("matches a city-level place by city only", () => {
    assert.equal(
      placeMatchesTerminal({ cityId: "c1", level: "city" }, { cityId: "c1", municipalityId: "m9", quarterId: "q9" }),
      true,
    );
  });

  it("narrows at municipality level", () => {
    assert.equal(
      placeMatchesTerminal({ cityId: "c1", municipalityId: "m1", level: "municipality" }, terminal),
      true,
    );
    assert.equal(
      placeMatchesTerminal({ cityId: "c1", municipalityId: "m2", level: "municipality" }, terminal),
      false,
    );
  });

  it("narrows at quarter level", () => {
    assert.equal(
      placeMatchesTerminal({ cityId: "c1", municipalityId: "m1", quarterId: "q1", level: "quarter" }, terminal),
      true,
    );
    assert.equal(
      placeMatchesTerminal({ cityId: "c1", municipalityId: "m1", quarterId: "q2", level: "quarter" }, terminal),
      false,
    );
  });

  it("rejects a different city even when refinement matches", () => {
    assert.equal(
      placeMatchesTerminal({ cityId: "c2", municipalityId: "m1", quarterId: "q1", level: "quarter" }, terminal),
      false,
    );
  });
});
