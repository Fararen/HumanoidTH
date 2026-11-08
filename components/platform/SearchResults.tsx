import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { LESSONS } from "@/lib/platform-catalog";
export default async function PlatformSearchResults({ query, filter }: { query: string; filter: string }) {
  if (query.length < 2) return null;
  const matches = ["all","competitions","results"].includes(filter) ? await prisma.platformRecord.findMany({ where: { isPublished: true, kind: { in: filter === "competitions" ? ["COMPETITION"] : filter === "results" ? ["EVALUATION","RUN"] : ["COMPETITION","EVALUATION","RUN"] }, title: { contains: query, mode: "insensitive" } }, take: 20 }) : [];
  const posts = ["all","community"].includes(filter) ? await prisma.communityPost.findMany({ where: { visibilityStatus: "PUBLISHED", OR: [{ title: { contains: query, mode: "insensitive" } }, { content: { contains: query, mode: "insensitive" } }] }, take: 12, select: { id: true, title: true, type: true } }) : [];
  const lessons = ["all","lessons"].includes(filter) ? LESSONS.filter(lesson => `${lesson.title} ${lesson.goal} ${lesson.body.join(" ")}`.toLowerCase().includes(query.toLowerCase())) : [];
  const companies = ["all","companies"].includes(filter) ? await prisma.companyModelEvaluation.findMany({ where: { isPublished: true, workflowStatus: "PUBLISHED", safetyStatus: "PASSED", OR: [{ modelName: { contains: query, mode: "insensitive" } }, { companyName: { contains: query, mode: "insensitive" } }] }, select: { id: true, modelName: true, version: true, companyName: true }, take: 12 }) : [];
  return <section className="platform-page"><h2>บทเรียน ชุมชน และงานที่เผยแพร่ · Platform results</h2><div className="platform-grid">
    {["all","competitions","results"].includes(filter) && matches.map(record => <Link className="platform-card" key={record.id} href={record.kind === "COMPETITION" ? `/competitions/${record.id}` : `/results/${record.id}`}><small>{record.kind}</small><h3>{record.title}</h3></Link>)}
    {posts.map(post => <Link className="platform-card" key={post.id} href={`/community/${post.id}`}><small>{post.type}</small><h3>{post.title}</h3></Link>)}
    {lessons.map(lesson => <Link className="platform-card" key={lesson.id} href={`/learn/${lesson.id}`}><h3>{lesson.title}</h3><p>{lesson.goal}</p></Link>)}
    {companies.map(model => <Link className="platform-card" key={model.id} href={`/robots/${model.id}`}><small>{model.companyName}</small><h3>{model.modelName} · {model.version}</h3></Link>)}
  </div>{!matches.length && !posts.length && !lessons.length && !companies.length && <p>No matching public platform records. Try another keyword or type.</p>}</section>;
}
