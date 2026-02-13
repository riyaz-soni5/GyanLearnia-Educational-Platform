import { http } from "./http";

export type CategoryDTO = { id: string; name: string; slug: string };
export type CategoriesResponse = { items: CategoryDTO[] };

export async function fetchCategories() {
  return http<CategoriesResponse>("/api/categories");
}