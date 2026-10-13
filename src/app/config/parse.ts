import { envVars } from "./env";

const SCRAPER_ID = "9380e1b0-fae2-4340-9056-3d416f86c775";
const BASE_URL = `https://api.parse.bot/scraper/${SCRAPER_ID}`;

type ParseParams = Record<string, string | number | boolean | undefined>;

const callParseApi = async (
  endpoint: string,
  params: ParseParams = {},
): Promise<unknown> => {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();
  const url = `${BASE_URL}/${encodeURIComponent(endpoint)}${query ? `?${query}` : ""}`;
  const response = await fetch(url, {
    headers: { "X-API-Key": envVars.PARSE_API_KEY },
  });

  if (!response.ok) {
    throw new Error(
      `Parse API ${endpoint} failed (${response.status}): ${await response.text()}`,
    );
  }

  return response.json();
};

export const searchParseMedicines = (query: string) =>
  callParseApi("search_medicines", { query });

export const getParseMedicineDetails = (medicineId: string) =>
  callParseApi("get_medicine_details", { medicine_id: medicineId });
