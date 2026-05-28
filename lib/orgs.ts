/**
 * Organizations, team membership, and per-repo RBAC.
 *
 * Permission ladder (low -> high):
 *   read     - clone, browse, file issues
 *   write    - push, comment on issues
 *   maintain - manage labels, close/lock issues, edit non-sensitive settings
 *   admin    - rename/transfer/delete, manage collaborators
 *
 * The repo owner (an org or a user) is implicitly admin.
 */

import { pg } from "./supabase";
import type { StoredRepo } from "./store";

export type OrgRole = "owner" | "admin" | "member";
export type Permission = "read" | "write" | "maintain" | "admin";

export type StoredOrg = {
  id: string;
  name: string;
  displayName: string | null;
  description: string | null;
  avatarUrl: string | null;
  billingEmail: string | null;
  createdAt: string;
};

type OrgRow = {
  id: string;
  name: string;
  display_name: string | null;
  description: string | null;
  avatar_url: string | null;
  billing_email: string | null;
  created_at: string;
};

function orgFromRow(r: OrgRow): StoredOrg {
  return {
    id: r.id,
    name: r.name,
    displayName: r.display_name,
    description: r.description,
    avatarUrl: r.avatar_url,
    billingEmail: r.billing_email,
    createdAt: r.created_at,
  };
}

export async function getOrgByName(name: string): Promise<StoredOrg | null> {
  const rows = await pg<OrgRow[]>(
    "GET",
    `orgs?select=*&name=eq.${encodeURIComponent(name)}&limit=1`
  );
  return rows?.[0] ? orgFromRow(rows[0]) : null;
}

export async function findOrgCaseInsensitive(name: string): Promise<StoredOrg | null> {
  const rows = await pg<OrgRow[]>(
    "GET",
    `orgs?select=*&name=ilike.${encodeURIComponent(name)}&limit=1`
  );
  return rows?.[0] ? orgFromRow(rows[0]) : null;
}

export async function createOrg(args: {
  name: string;
  displayName?: string | null;
  description?: string | null;
  founderUsername: string;
}): Promise<StoredOrg> {
  const rows = await pg<OrgRow[]>(
    "POST",
    "orgs?select=*",
    [
      {
        name: args.name,
        display_name: args.displayName ?? null,
        description: args.description ?? null,
      },
    ],
    { prefer: "return=representation" }
  );
  const org = rows[0];
  await pg("POST", "org_members", [
    {
      org_id: org.id,
      user_username: args.founderUsername,
      role: "owner",
    },
  ]);
  return orgFromRow(org);
}

export type OrgMember = {
  orgId: string;
  username: string;
  role: OrgRole;
  createdAt: string;
};

type OrgMemberRow = {
  org_id: string;
  user_username: string;
  role: OrgRole;
  created_at: string;
};

function memberFromRow(r: OrgMemberRow): OrgMember {
  return {
    orgId: r.org_id,
    username: r.user_username,
    role: r.role,
    createdAt: r.created_at,
  };
}

export async function listOrgMembers(orgId: string): Promise<OrgMember[]> {
  const rows = await pg<OrgMemberRow[]>(
    "GET",
    `org_members?select=*&org_id=eq.${encodeURIComponent(orgId)}&order=role.asc,user_username.asc`
  );
  return (rows ?? []).map(memberFromRow);
}

export async function getOrgMember(
  orgId: string,
  username: string
): Promise<OrgMember | null> {
  const rows = await pg<OrgMemberRow[]>(
    "GET",
    `org_members?select=*&org_id=eq.${encodeURIComponent(orgId)}&user_username=eq.${encodeURIComponent(username)}&limit=1`
  );
  return rows?.[0] ? memberFromRow(rows[0]) : null;
}

export async function setOrgMember(args: {
  orgId: string;
  username: string;
  role: OrgRole;
}): Promise<void> {
  await pg(
    "POST",
    "org_members?on_conflict=org_id,user_username",
    [
      {
        org_id: args.orgId,
        user_username: args.username,
        role: args.role,
      },
    ],
    { prefer: "resolution=merge-duplicates,return=minimal" }
  );
}

export async function removeOrgMember(orgId: string, username: string): Promise<void> {
  await pg(
    "DELETE",
    `org_members?org_id=eq.${encodeURIComponent(orgId)}&user_username=eq.${encodeURIComponent(username)}`
  );
}

export async function listOrgsForUser(username: string): Promise<StoredOrg[]> {
  const memberRows = await pg<{ org_id: string }[]>(
    "GET",
    `org_members?select=org_id&user_username=eq.${encodeURIComponent(username)}`
  );
  const ids = (memberRows ?? []).map((m) => m.org_id);
  if (ids.length === 0) return [];
  const inList = ids.map((i) => `"${i}"`).join(",");
  const orgs = await pg<OrgRow[]>(
    "GET",
    `orgs?select=*&id=in.(${inList})&order=name.asc`
  );
  return (orgs ?? []).map(orgFromRow);
}

// ---- collaborators ----

export type StoredCollaborator = {
  repoId: string;
  principalType: "user" | "team";
  principalId: string;
  permission: Permission;
  createdAt: string;
};

type CollabRow = {
  repo_id: string;
  principal_type: "user" | "team";
  principal_id: string;
  permission: Permission;
  created_at: string;
};

function collabFromRow(r: CollabRow): StoredCollaborator {
  return {
    repoId: r.repo_id,
    principalType: r.principal_type,
    principalId: r.principal_id,
    permission: r.permission,
    createdAt: r.created_at,
  };
}

export async function listCollaborators(repoId: string): Promise<StoredCollaborator[]> {
  const rows = await pg<CollabRow[]>(
    "GET",
    `repo_collaborators?select=*&repo_id=eq.${encodeURIComponent(repoId)}&order=created_at.asc`
  );
  return (rows ?? []).map(collabFromRow);
}

export async function upsertCollaborator(args: {
  repoId: string;
  principalType: "user" | "team";
  principalId: string;
  permission: Permission;
}): Promise<void> {
  await pg(
    "POST",
    "repo_collaborators?on_conflict=repo_id,principal_type,principal_id",
    [
      {
        repo_id: args.repoId,
        principal_type: args.principalType,
        principal_id: args.principalId,
        permission: args.permission,
      },
    ],
    { prefer: "resolution=merge-duplicates,return=minimal" }
  );
}

export async function removeCollaborator(
  repoId: string,
  principalType: "user" | "team",
  principalId: string
): Promise<void> {
  await pg(
    "DELETE",
    `repo_collaborators?repo_id=eq.${encodeURIComponent(repoId)}` +
      `&principal_type=eq.${encodeURIComponent(principalType)}` +
      `&principal_id=eq.${encodeURIComponent(principalId)}`
  );
}

// ---- permission resolution ----

const RANK: Record<Permission, number> = {
  read: 1,
  write: 2,
  maintain: 3,
  admin: 4,
};

/**
 * Resolve the effective permission a user has on a repo. Returns null if
 * they have no grant at all (and the repo is private), or 'read' if the
 * repo is public.
 */
export async function effectivePermission(
  username: string | null,
  repo: StoredRepo
): Promise<Permission | null> {
  // The repo owner is implicit admin.
  if (username && username === repo.owner) return "admin";

  // Org-owned repo: org owners + admins get admin permission on every repo.
  const ownerOrg = await getOrgByName(repo.owner);
  if (ownerOrg && username) {
    const member = await getOrgMember(ownerOrg.id, username);
    if (member && (member.role === "owner" || member.role === "admin")) {
      return "admin";
    }
  }

  if (!username) {
    return repo.visibility === "public" ? "read" : null;
  }

  // Direct user grants.
  const userGrants = await pg<{ permission: Permission }[]>(
    "GET",
    `repo_collaborators?select=permission` +
      `&repo_id=eq.${encodeURIComponent(repo.id)}` +
      `&principal_type=eq.user&principal_id=eq.${encodeURIComponent(username)}&limit=1`
  );

  // Team grants — find the teams this user is in, then any repo grants to those teams.
  const teamRows = await pg<{ team_id: string }[]>(
    "GET",
    `team_members?select=team_id&user_username=eq.${encodeURIComponent(username)}`
  );
  let teamGrants: { permission: Permission }[] = [];
  const teamIds = (teamRows ?? []).map((t) => t.team_id);
  if (teamIds.length > 0) {
    const inList = teamIds.map((i) => `"${i}"`).join(",");
    teamGrants = await pg<{ permission: Permission }[]>(
      "GET",
      `repo_collaborators?select=permission` +
        `&repo_id=eq.${encodeURIComponent(repo.id)}` +
        `&principal_type=eq.team&principal_id=in.(${inList})`
    );
  }

  const grants = [...(userGrants ?? []), ...teamGrants];
  if (grants.length === 0) {
    return repo.visibility === "public" ? "read" : null;
  }
  // Take the strongest grant.
  let best: Permission = "read";
  for (const g of grants) if (RANK[g.permission] > RANK[best]) best = g.permission;
  return best;
}

export function permissionAtLeast(actual: Permission | null, needed: Permission): boolean {
  if (actual === null) return false;
  return RANK[actual] >= RANK[needed];
}
