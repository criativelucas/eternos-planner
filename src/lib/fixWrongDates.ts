/**
 * Automatic date rewriting was removed: it overwrote real payment history and
 * used a fixed wedding date. Kept as a no-op so old imports keep working.
 */
export async function fixWrongDates(_configId: string): Promise<boolean> {
  return false;
}
