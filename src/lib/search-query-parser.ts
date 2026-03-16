export interface ParsedSearchQuery {
  raw: string;
  textTerms: string[];
  accountTerms: string[];
  fromTerms: string[];
  subjectTerms: string[];
  flags: {
    read?: boolean;
    starred?: boolean;
    done?: boolean;
    archived?: boolean;
    snoozed?: boolean;
  };
}

function tokenizeSearchQuery(input: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let quote: '"' | "'" | null = null;

  for (const char of input.trim()) {
    if ((char === '"' || char === "'") && !quote) {
      quote = char;
      continue;
    }

    if (quote && char === quote) {
      quote = null;
      continue;
    }

    if (!quote && /\s/.test(char)) {
      if (current) {
        tokens.push(current);
        current = "";
      }
      continue;
    }

    current += char;
  }

  if (current) {
    tokens.push(current);
  }

  return tokens;
}

export function parseSearchQuery(input: string): ParsedSearchQuery {
  const parsed: ParsedSearchQuery = {
    raw: input,
    textTerms: [],
    accountTerms: [],
    fromTerms: [],
    subjectTerms: [],
    flags: {},
  };

  for (const token of tokenizeSearchQuery(input)) {
    const separatorIndex = token.indexOf(":");
    if (separatorIndex <= 0) {
      parsed.textTerms.push(token);
      continue;
    }

    const key = token.slice(0, separatorIndex).toLowerCase();
    const value = token.slice(separatorIndex + 1).trim();
    if (!value) continue;

    switch (key) {
      case "account":
        parsed.accountTerms.push(value.toLowerCase());
        break;
      case "from":
        parsed.fromTerms.push(value);
        break;
      case "subject":
        parsed.subjectTerms.push(value);
        break;
      case "is": {
        const normalized = value.toLowerCase();
        if (normalized === "read") parsed.flags.read = true;
        if (normalized === "unread") parsed.flags.read = false;
        if (normalized === "star" || normalized === "starred") parsed.flags.starred = true;
        if (normalized === "unstarred") parsed.flags.starred = false;
        if (normalized === "done") parsed.flags.done = true;
        if (normalized === "undone") parsed.flags.done = false;
        if (normalized === "archived") parsed.flags.archived = true;
        if (normalized === "active") parsed.flags.archived = false;
        if (normalized === "snoozed") parsed.flags.snoozed = true;
        if (normalized === "unsnoozed") parsed.flags.snoozed = false;
        break;
      }
      default:
        parsed.textTerms.push(token);
        break;
    }
  }

  return parsed;
}
