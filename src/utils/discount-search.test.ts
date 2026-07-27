import { describe, expect, it } from "vitest";
import { filterDiscountsByCategories } from "@/utils/discount-search";

const d = (id: string, category?: string) => ({ id, category });

describe("filterDiscountsByCategories", () => {
  const noFavs = new Set<string>();

  it("sin categorías devuelve la lista tal cual", () => {
    const list = [d("1", "gastronomia"), d("2", "moda")];
    expect(filterDiscountsByCategories(list, [], noFavs)).toBe(list);
  });

  it("lista vacía devuelve lista vacía", () => {
    const list: ReturnType<typeof d>[] = [];
    expect(filterDiscountsByCategories(list, ["gastronomia"], noFavs)).toBe(
      list
    );
  });

  it("filtra por categoría coincidente", () => {
    const list = [d("1", "gastronomia"), d("2", "moda")];
    const result = filterDiscountsByCategories(list, ["gastronomia"], noFavs);
    expect(result.map((r) => r.id)).toEqual(["1"]);
  });

  it("filtra solo por favoritos cuando 'favoritos' es la única categoría", () => {
    const list = [d("1", "gastronomia"), d("2", "moda"), d("3", "tech")];
    const favs = new Set(["2"]);
    const result = filterDiscountsByCategories(list, ["favoritos"], favs);
    expect(result.map((r) => r.id)).toEqual(["2"]);
  });

  it("combina favoritos OR categoría", () => {
    const list = [d("1", "gastronomia"), d("2", "moda"), d("3", "tech")];
    const favs = new Set(["3"]);
    const result = filterDiscountsByCategories(
      list,
      ["favoritos", "gastronomia"],
      favs
    );
    expect(result.map((r) => r.id).sort()).toEqual(["1", "3"]);
  });

  it("excluye descuentos sin categoría cuando se filtra por categoría", () => {
    const list = [d("1"), d("2", "gastronomia")];
    const result = filterDiscountsByCategories(list, ["gastronomia"], noFavs);
    expect(result.map((r) => r.id)).toEqual(["2"]);
  });
});
