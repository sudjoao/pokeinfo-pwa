/**
 * Como `Promise.all(items.map(run))`, mas com no máximo `limit` chamadas em andamento ao mesmo
 * tempo. Mantém a ordem do resultado e rejeita no primeiro erro, como o Promise.all.
 */
export async function mapLimit<T, R>(
  items: readonly T[],
  limit: number,
  run: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = []
  let next = 0
  async function worker(): Promise<void> {
    while (next < items.length) {
      const index = next++
      results[index] = await run(items[index]!)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}
