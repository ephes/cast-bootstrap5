// Search APIs are same-origin endpoints; redirects (including login pages) are failures.
export async function fetchSearchResponse(value: string, signal: AbortSignal): Promise<Response> {
  const url = new URL(value, window.location.href);
  if (!['http:', 'https:'].includes(url.protocol) || url.origin !== window.location.origin
      || url.username || url.password) {
    throw new Error('Invalid search endpoint');
  }
  url.hash = '';
  const response = await fetch(url.href, { signal, redirect: 'error' });
  if (!response.ok || response.redirected || (response.url && response.url !== url.href)) {
    // Refusal retires the transfer even after the caller clears its deadline.
    // Cancellation must neither delay nor replace the original refusal.
    void response.body?.cancel().catch(() => undefined);
    throw new Error('Invalid search response endpoint');
  }
  return response;
}
