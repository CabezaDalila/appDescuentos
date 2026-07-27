import { describe, expect, it } from "vitest";
import { parseMembershipsToCredentials } from "@/utils/membership-parsing";

describe("parseMembershipsToCredentials", () => {
  it("deriva una credencial de una tarjeta de banco válida", () => {
    const result = parseMembershipsToCredentials([
      {
        name: "Banco Galicia",
        membershipCategory: "banco",
        isCard: true,
        card: { type: "Crédito", brand: "Visa", level: "Gold" },
      },
    ]);

    expect(result.memberships).toEqual(["Banco Galicia"]);
    expect(result.credentials).toEqual([
      { bank: "Banco Galicia", type: "Crédito", brand: "Visa", level: "Gold" },
    ]);
  });

  it("registra la membresía pero no credencial cuando no es tarjeta", () => {
    const result = parseMembershipsToCredentials([
      { name: "Club La Nación", membershipCategory: "club", isCard: false },
    ]);

    expect(result.memberships).toEqual(["Club La Nación"]);
    expect(result.credentials).toEqual([]);
  });

  it("descarta tarjetas con brand/level/type inválidos", () => {
    const result = parseMembershipsToCredentials([
      {
        name: "Banco X",
        membershipCategory: "banco",
        isCard: true,
        card: { type: "Crédito", brand: "MarcaInexistente", level: "Gold" },
      },
    ]);

    expect(result.credentials).toEqual([]);
  });

  it("procesa el variante con array de cards", () => {
    const result = parseMembershipsToCredentials([
      {
        name: "Banco Nación",
        cards: [
          { type: "Crédito", brand: "Visa", level: "Platinum" },
          { type: "Débito", brand: "Mastercard", level: "Classic" },
        ],
      },
    ]);

    expect(result.credentials).toHaveLength(2);
    expect(result.credentials[1]).toEqual({
      bank: "Banco Nación",
      type: "Débito",
      brand: "Mastercard",
      level: "Classic",
    });
  });

  it("deduplica nombres de membresía repetidos", () => {
    const result = parseMembershipsToCredentials([
      { name: "Banco Galicia", membershipCategory: "banco", isCard: false },
      { name: "Banco Galicia", membershipCategory: "banco", isCard: false },
    ]);

    expect(result.memberships).toEqual(["Banco Galicia"]);
  });

  it("acepta membershipName como alias de name", () => {
    const result = parseMembershipsToCredentials([
      { membershipName: "OSDE", membershipCategory: "salud" },
    ]);

    expect(result.memberships).toEqual(["OSDE"]);
  });

  it("devuelve vacío para lista vacía", () => {
    expect(parseMembershipsToCredentials([])).toEqual({
      memberships: [],
      credentials: [],
    });
  });
});
