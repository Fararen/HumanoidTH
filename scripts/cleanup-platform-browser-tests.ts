import { config } from "dotenv";
config({path:".env.local",override:true,quiet:true});
const url=new URL(process.env.DATABASE_URL!);
if(process.env.LOCAL_DEMO_MODE!=="1"||url.hostname!=="127.0.0.1"||url.port!=="5433")throw new Error("Cleanup is restricted to the isolated local demo database");
const {prisma}=await import("../lib/prisma");
// These names are reserved by tests-node/platform.spec.ts. Never match ordinary demo/user records.
const reserved=/(?:^|Run )\[browser [0-9a-f]{8}\]/;
const records=(await prisma.platformRecord.findMany({where:{title:{contains:"[browser "}},select:{id:true,title:true}})).filter(record=>reserved.test(record.title));
const models=(await prisma.companyModelEvaluation.findMany({where:{isDemoData:true,modelName:{startsWith:"[browser "}},select:{id:true,modelName:true}})).filter(model=>reserved.test(model.modelName));
const posts=(await prisma.communityPost.findMany({where:{title:{startsWith:"[browser "}},select:{id:true,title:true}})).filter(post=>reserved.test(post.title));
const accounts=(await prisma.user.findMany({where:{email:{startsWith:"browser-",endsWith:"@example.test"},name:"Browser registration test"},select:{id:true,email:true}})).filter(user=>/^browser-[0-9a-f-]{36}@example\.test$/.test(user.email));
await prisma.$transaction(async tx=>{
  await tx.platformEvent.deleteMany({where:{recordId:{in:records.map(record=>record.id)}}});
  await tx.platformRecord.deleteMany({where:{id:{in:records.map(record=>record.id)}}});
  await tx.communityPost.deleteMany({where:{id:{in:posts.map(post=>post.id)}}});
  await tx.companyModelEvaluation.deleteMany({where:{id:{in:models.map(model=>model.id)}}});
  await tx.user.deleteMany({where:{id:{in:accounts.map(user=>user.id)}}});
});
console.log(`Removed browser fixtures only: ${records.length} workflow records, ${models.length} company versions, ${posts.length} posts, ${accounts.length} test accounts.`);
await prisma.$disconnect();
