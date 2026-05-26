"use client";

import { useEffect, useState } from "react";

type Kind = "org" | "individual" | "bot";

type Props = {
  username: string;
  /** If provided, skips the network lookup. */
  verified?: boolean;
  verifiedAs?: string | null;
  verifiedKind?: Kind | null;
  size?: number;
  /** Show the verified display name ("Microsoft") inline after the badge. */
  showName?: boolean;
};

const cache = new Map<string, {
  verified: boolean;
  verifiedAs: string | null;
  verifiedKind: Kind | null;
}>();

export default function VerifiedBadge({
  username,
  verified,
  verifiedAs,
  verifiedKind,
  size = 14,
  showName = false,
}: Props) {
  const [state, setState] = useState<{
    verified: boolean;
    verifiedAs: string | null;
    verifiedKind: Kind | null;
  } | null>(
    verified !== undefined
      ? {
          verified: !!verified,
          verifiedAs: verifiedAs ?? null,
          verifiedKind: verifiedKind ?? null,
        }
      : cache.get(username) ?? null
  );

  useEffect(() => {
    if (verified !== undefined) return;
    if (cache.has(username)) {
      setState(cache.get(username)!);
      return;
    }
    let cancel = false;
    fetch(`/api/users/${username}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancel || !j) return;
        const v = {
          verified: !!j.verified,
          verifiedAs: j.verifiedAs ?? null,
          verifiedKind: (j.verifiedKind as Kind | null) ?? null,
        };
        cache.set(username, v);
        setState(v);
      })
      .catch(() => {});
    return () => {
      cancel = true;
    };
  }, [username, verified]);

  if (!state?.verified) return null;

  // Tones match the Siphr palette: copper for orgs, moss for individuals,
  // amber for bots — anti-corporate, never bootstrap blue/green.
  const color =
    state.verifiedKind === "bot"
      ? "#b88a24"
      : state.verifiedKind === "org"
      ? "#b25927"
      : "#1f5c3a";

  const title = state.verifiedAs
    ? `Verified ${state.verifiedKind ?? "account"} — ${state.verifiedAs}`
    : `Verified ${state.verifiedKind ?? "account"}`;

  return (
    <span className="inline-flex items-center gap-1 align-middle" title={title}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 22 22"
        aria-label={title}
        role="img"
      >
        <path
          d="M11 1.5 13.4 3.2 16.3 3 17 5.8 19.3 7.5 18.2 10 19.3 12.5 17 14.2 16.3 17 13.4 16.8 11 18.5 8.6 16.8 5.7 17 5 14.2 2.7 12.5 3.8 10 2.7 7.5 5 5.8 5.7 3 8.6 3.2Z"
          fill={color}
        />
        <path
          d="M7.5 11 L10 13.5 L14.5 8.5"
          stroke="#fff"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      {showName && state.verifiedAs && (
        <span style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--mono)" }}>
          {state.verifiedAs}
        </span>
      )}
    </span>
  );
}
