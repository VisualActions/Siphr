import { NextResponse } from "next/server";
import { getOrgByName, listOrgMembers } from "@/lib/orgs";
import { listRepos } from "@/lib/store";

export const runtime = "nodejs";

type Params = { params: Promise<{ name: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { name } = await params;
  const org = await getOrgByName(name);
  if (!org) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const [members, repos] = await Promise.all([
    listOrgMembers(org.id),
    listRepos().then((all) => all.filter((r) => r.owner === org.name)),
  ]);
  return NextResponse.json({
    org,
    members,
    repos: repos.map((r) => ({
      id: r.id,
      name: r.name,
      visibility: r.visibility,
      description: r.description,
      createdAt: r.createdAt,
    })),
  });
}
