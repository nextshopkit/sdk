import { FilterGroup } from "../types/products";
import { safeParseArray } from "./safeParseArray";

export function formatAvailableFilters(rawFilters: any[]): FilterGroup[] {
  return rawFilters.map((group) => ({
    id: group.id,
    label: group.label,
    values: safeParseArray(group.values).map((value: any) => ({
      id: value.id,
      label: value.label,
      count: value.count,
    })),
  }));
}
