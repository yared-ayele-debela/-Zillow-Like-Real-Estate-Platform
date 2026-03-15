/**
 * Get the public route identifier for a property (uuid preferred, fallback to id for backward compatibility).
 * Use for /properties/:slug, edit, stats, compare ids, and API calls that accept uuid or id.
 */
export function propertySlug(property) {
  if (!property) return '';
  return property.uuid ?? property.id ?? '';
}
