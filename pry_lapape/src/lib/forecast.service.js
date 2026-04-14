import { api } from "@/lib/api";

function withQuery(path, params = {}) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, value);
  });

  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

export async function getCommercialForecast(filters) {
  return api(withQuery("/forecast/commercial", filters), { method: "GET" });
}
