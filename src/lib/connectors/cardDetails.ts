const label = (key: string) => {
  const words = key.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
  return words[0].toUpperCase() + words.slice(1);
};

function format(value: unknown): string | null {
  if (value === null || value === undefined || value === "" || value === false) return null;
  if (value === true) return "Yes";
  if (Array.isArray(value)) {
    const items = value.map(format).filter(Boolean);
    return items.length ? items.join(", ") : null;
  }
  if (typeof value === "object") return JSON.stringify(value);
  // Dates arrive as ISO strings from the browser.
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(value)) {
    return `${value.slice(0, 10)} ${value.slice(11, 16)} UTC`;
  }
  return String(value);
}

/** A card's parsed data as readable "Label: value" lines for a spreadsheet cell. Empty fields are left out. */
export function cardDetails(data: Record<string, unknown>) {
  return Object.entries(data)
    .map(([key, value]) => {
      const v = format(value);
      return v === null ? null : `${label(key)}: ${v}`;
    })
    .filter(Boolean)
    .join("\n");
}
