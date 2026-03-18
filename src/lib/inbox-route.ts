export interface InboxRouteState {
  accountId?: string;
  starred?: boolean;
  search?: string;
  mailId?: string;
}

function normalizeSearch(search?: string) {
  const value = search?.trim();
  return value ? value : undefined;
}

export function buildInboxHref(state?: InboxRouteState) {
  const params = new URLSearchParams();
  const search = normalizeSearch(state?.search);

  if (state?.accountId) params.set("account", state.accountId);
  if (state?.starred) params.set("starred", "1");
  if (search) params.set("search", search);
  if (state?.mailId) params.set("mail", state.mailId);

  const query = params.toString();
  return query ? `/?${query}` : "/";
}

export function buildMailDetailHref(
  id: string,
  state?: Omit<InboxRouteState, "mailId">
) {
  const params = new URLSearchParams();
  const search = normalizeSearch(state?.search);

  if (state?.accountId) params.set("account", state.accountId);
  if (state?.starred) params.set("starred", "1");
  if (search) params.set("search", search);

  const query = params.toString();
  return query ? `/mail/${id}?${query}` : `/mail/${id}`;
}

export function buildComposeHref(accountId?: string) {
  const params = new URLSearchParams();
  if (accountId) params.set("account", accountId);

  const query = params.toString();
  return query ? `/compose?${query}` : "/compose";
}

export function buildSentHref(accountId?: string) {
  const params = new URLSearchParams();
  if (accountId) params.set("account", accountId);

  const query = params.toString();
  return query ? `/sent?${query}` : "/sent";
}

export function buildSentDetailHref(id: string, accountId?: string) {
  const sentHref = buildSentHref(accountId);
  if (!accountId) return `/sent/${id}`;
  return `/sent/${id}${sentHref.slice("/sent".length)}`;
}
