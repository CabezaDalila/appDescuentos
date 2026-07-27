import { describe, expect, it } from "vitest";
import type { UserCredential } from "@/types/credentials";
import {
  credentialMatches,
  isUserEligibleForDiscountRestrictions,
  normalizeBankKey,
} from "@/utils/membership-match";

const galiciaVisaGold: UserCredential = {
  bank: "Banco Galicia",
  type: "Crédito",
  brand: "Visa",
  level: "Gold",
};

describe("normalizeBankKey", () => {
  it("quita el prefijo 'Banco ' y normaliza acentos/mayúsculas", () => {
    expect(normalizeBankKey("Banco Galicia")).toBe("galicia");
    expect(normalizeBankKey("Nación")).toBe("nacion");
  });
});

describe("credentialMatches", () => {
  it("matchea ignorando el prefijo 'Banco' entre perfil y admin", () => {
    expect(
      credentialMatches(galiciaVisaGold, {
        bank: "Galicia",
        type: "Crédito",
        brand: "Visa",
        level: "Gold",
      })
    ).toBe(true);
  });

  it("trata valores comodín (vacío / 'Otro' / 'Todas') como wildcard", () => {
    expect(
      credentialMatches(galiciaVisaGold, {
        bank: "Galicia",
        type: "",
        brand: "Todas",
        level: "Otro",
      })
    ).toBe(true);
  });

  it("no matchea si el banco difiere", () => {
    expect(
      credentialMatches(galiciaVisaGold, {
        bank: "Santander",
        type: "Crédito",
        brand: "Visa",
        level: "Gold",
      })
    ).toBe(false);
  });

  it("no matchea si el nivel difiere y no es wildcard", () => {
    expect(
      credentialMatches(galiciaVisaGold, {
        bank: "Galicia",
        type: "Crédito",
        brand: "Visa",
        level: "Black",
      })
    ).toBe(false);
  });
});

describe("isUserEligibleForDiscountRestrictions", () => {
  it("sin restricciones => elegible (modo flexible)", () => {
    expect(isUserEligibleForDiscountRestrictions([], [], {})).toBe(true);
  });

  it("sin restricciones + requireRestrictions => no elegible", () => {
    expect(
      isUserEligibleForDiscountRestrictions([], [], {}, {
        requireRestrictions: true,
      })
    ).toBe(false);
  });

  it("elegible por credencial cuando el usuario tiene la tarjeta requerida", () => {
    expect(
      isUserEligibleForDiscountRestrictions([], [galiciaVisaGold], {
        availableCredentials: [galiciaVisaGold],
      })
    ).toBe(true);
  });

  it("elegible por membresía (availableMemberships)", () => {
    expect(
      isUserEligibleForDiscountRestrictions(["OSDE"], [], {
        availableMemberships: ["OSDE"],
      })
    ).toBe(true);
  });

  it("elegible por lista legacy de bancos", () => {
    expect(
      isUserEligibleForDiscountRestrictions(["Banco Galicia"], [], {
        bancos: ["Galicia"],
      })
    ).toBe(true);
  });

  it("strictPriority: con credenciales requeridas exige match de credencial", () => {
    // Tiene la membresía pero NO la credencial exacta => no elegible en estricto.
    expect(
      isUserEligibleForDiscountRestrictions(["Banco Galicia"], [], {
        availableCredentials: [galiciaVisaGold],
        availableMemberships: ["Banco Galicia"],
      }, { strictPriority: true })
    ).toBe(false);
  });

  it("membershipOnly: ignora credenciales de tarjeta", () => {
    expect(
      isUserEligibleForDiscountRestrictions([], [galiciaVisaGold], {
        availableCredentials: [galiciaVisaGold],
      }, { membershipOnly: true, requireRestrictions: true })
    ).toBe(false);
  });
});
