# การส่งผลงานแข่งขัน

## งานที่ทำแล้ว

- ฟอร์ม `/challenges/[id]` รอผลตอบกลับจาก API ก่อนแจ้งว่ารับผลงานแล้ว และแสดงเลขรับผลงานจากฐานข้อมูล
- ข้อผิดพลาดไม่ล้างฟอร์ม การกดซ้ำระหว่างส่งถูกปิดไว้ และ retry ด้วยข้อมูลเดิมใช้ request ID เดิม
- API ผูกผลงานกับ user ID และอีเมลของบัญชีปัจจุบัน ไม่รับเจ้าของ คะแนน หรือสถานะอนุมัติจาก client
- ประวัติแสดงเฉพาะ user ID ของบัญชีที่เรียก สูงสุด 50 รายการล่าสุด โดยไม่ส่งอีเมลติดต่อกลับไปใน response
- ใช้ `videoUrl` แยกจาก `dockerImage`; ข้อมูลเดิมไม่ถูกย้ายโดยคาดเดาประเภท
- รับเฉพาะการแข่งขันที่มีอยู่ สถานะ ACTIVE และยังไม่พ้นสิ้นวันปิดรับตาม Asia/Bangkok
- ไม่มีการสุ่มคะแนน อนุมัติอัตโนมัติ หรือโหลดรายการส่งที่เก็บไว้ใน localStorage เดิม
- แค็ตตาล็อกและ Leaderboard เดิมยังเป็นข้อมูลตัวอย่าง มีป้ายระบุในหน้ารวมและหน้ารายละเอียด ประวัติผลงานที่บันทึกแสดงแยกไว้ ไม่ถูกนำไปจัดอันดับอัตโนมัติ

## API

`GET /api/challenges/:id/submit` อ่านประวัติของบัญชีปัจจุบัน

`POST /api/challenges/:id/submit` รับ `requestId` (UUID), `teamName`, `solutionTitle`, `description`, `repoUrl` และ `videoUrl`

คำขอสำเร็จคืน `{ success: true, entry: { id, solutionTitle, teamName, status, submittedAt } }` โดยเริ่มสถานะ `SUBMITTED` และคะแนนในฐานข้อมูลเป็น null

รหัสข้อผิดพลาด: `SIGN_IN` (401), `REAL_ACCOUNT_REQUIRED` (403), `NOT_FOUND` (404), `INVALID` (400), `CLOSED` / `REQUEST_CONFLICT` (409), `UNAVAILABLE` (503)

request key ผูกกับบัญชี การส่งคำขอเดิมซ้ำคืนใบรับเดิม แม้การแข่งขันปิดรับแล้ว หากใช้ key เดิมกับเนื้อหาอื่นจะปฏิเสธ ไม่แก้ไขรายการเดิม

## ฐานข้อมูล

เพิ่ม migration `20261108020000_challenge_entry_receipts` และความสัมพันธ์ `User.challengeSubmissions`

ตาราง ChallengeSubmission เดิมอยู่ใน Prisma schema แต่ไม่มีใน migration เริ่มต้น จึงใช้ `CREATE TABLE IF NOT EXISTS` ก่อนเพิ่ม `videoUrl`, `requestKey` และ `submittedById` เพื่อรองรับฐานข้อมูลที่เคยใช้ `db push` และรักษาแถวเดิม

รายการเดิมไม่มี user ID จะไม่ปรากฏในประวัติส่วนตัว ห้ามผูกเจ้าของย้อนหลังโดยใช้อีเมลที่ client เคยส่งมาเพียงอย่างเดียว

ก่อนใช้กับฐานข้อมูลจริง ให้ตรวจ migration history และ schema ที่ใช้อยู่ โดย migration บริษัทก่อนหน้านี้อ้างอิง `CompanyModelEvaluation` ซึ่งไม่มีใน initial migration เช่นกัน ฐานข้อมูลว่างจึงต้องจัดการ baseline ของระบบเดิมก่อนใช้ `prisma migrate deploy` ทั้งชุด งานนี้ไม่ได้รัน migration กับฐานข้อมูลจริง

## การทดสอบ

- `pnpm test`: validation, วันปิดรับเวลาไทย และเงื่อนไขการ retry รวม tests เดิม
- `pnpm typecheck` และ `pnpm exec prisma validate`
- `pnpm exec playwright test tests-node/challenge-entries.spec.ts`: API ปฏิเสธผู้ไม่ได้เข้าสู่ระบบ/บัญชีทดลอง/การแข่งขันที่ไม่มีอยู่; browser เก็บฟอร์มเมื่อบันทึกล้มเหลว, retry, โหลดประวัติใหม่ และปิดรับผลงานบนมือถือ
- Browser test ของการบันทึกสำเร็จใช้การควบคุม HTTP response เพื่อทดสอบ UI โดยไม่อ้างว่าได้บันทึกลง PostgreSQL จริง

## งานถัดไป

พัฒนาคิวตรวจผลงานและผลประเมินจริง แล้วเชื่อม Leaderboard กับข้อมูลที่เผยแพร่ได้ รวมถึงย้ายแค็ตตาล็อกออกจากข้อมูลตัวอย่าง ระบบ session เดิมยังต้องปรับให้ยืนยันเจ้าของบัญชีได้ก่อนใช้กับการแข่งขันจริงหรือข้อมูลส่วนตัว; ฟีเจอร์นี้ใช้กลไก session ของแอปเดิม
