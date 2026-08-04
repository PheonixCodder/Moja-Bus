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

  it("rejects a dropdown-picked city (cuid) against a same-named chip (no id)", () => {
    // Popular chips / history hints submit id:"" — a chip "Abidjan" must be
    // recognized as the same city as a dropdown-picked "Abidjan" (cuid).
    assert.equal(
      validateSearchPair(
        { id: "cmn3f..." + "0".repeat(16), text: "Abidjan" },
        { id: "", text: "Abidjan" },
      ),
      "sameCity",
    );
  });

  it("rejects a chip against a dropdown-picked city with accent differences", () => {
    // Normalized-text comparison must be accent-insensitive: the dropdown
    // renders "San-Pédro", the chip stores "San Pedro".
    assert.equal(
      validateSearchPair(
        { id: "", text: "San Pedro" },
        { id: "csp...", text: "San-Pédro" },
      ),
      "sameCity",
    );
  });

  it("allows a chip when it names a genuinely different city", () => {
    assert.equal(
      validateSearchPair(
        { id: "c1", text: "Bouaké" },
        { id: "", text: "Abidjan" },
      ),
      null,
    );
  });

  it("allows a dropdown-picked city (cuid) against a different-named chip", () => {
    assert.equal(
      validateSearchPair(
        { id: "c1", text: "Abidjan" },
        { id: "", text: "Yamoussoukro" },
      ),
      null,
    );
  });

  it("allows same city when the chip names a refined quarter", () => {
    // "Abidjan (Cocody - Riviera 3)" chip vs city-level dropdown pick is a
    // one-sided refinement → valid urban search.
    assert.equal(
      validateSearchPair(
        { id: "c1", text: "Abidjan" },
        { id: "", text: "Abidjan (Cocody - Riviera 3)" },
      ),
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
