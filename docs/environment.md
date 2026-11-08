# ตั้งค่า .env

สำหรับเว็บนำร่องที่เพิ่มตาม Roadmap ใช้ `pnpm demo` หรือบนเครื่องนี้ `.\scratch\tooling\node.exe scripts/dev-platform.mjs` ตัวช่วยจะสร้าง `.env.local` สำหรับฐานข้อมูลในเครื่องและ `SESSION_SECRET` แบบสุ่ม โดยเก็บ `.env` เดิมไว้ ดูเส้นทางและบทบาทใน [platform-pilot.md](platform-pilot.md)

บัญชีใหม่ต้องมีรหัสผ่าน และ session ที่ลงลายเซ็นต้องใช้ `SESSION_SECRET` อย่างน้อย 32 ตัวอักษรที่คงเดิมข้ามการรีสตาร์ต ตั้งค่านี้ใน environment จริงเมื่อ deploy; `LOCAL_DEMO_MODE=1` ใช้เฉพาะเว็บเดโมที่ bind กับ loopback เพื่อเปิด `/demo` สำหรับเลือกบทบาท

เว็บ sandbox สาธารณะต้อง deploy เป็น Vercel project แยกชื่อ `humanoid-th-demo` โดยตั้ง `PUBLIC_DEMO_MODE=1`, `DEMO_SANDBOX_MODE=1`, `DATABASE_URL` ให้ชี้ไปฐานข้อมูล sandbox แยกต่างหาก และ `SESSION_SECRET` ใหม่ ห้ามใช้ฐานข้อมูล Production จริงกับ demo project เพราะผู้เข้าชมเลือกบทบาททดลองได้ รวมถึง ADMIN ใน sandbox เท่านั้น ถ้าต้องการลิงก์จากเว็บหลัก ให้ตั้ง `NEXT_PUBLIC_DEMO_URL` เป็น URL ของ demo project; หน้าเว็บหลักจะไม่เปิดบัญชีทดลองบนฐานข้อมูล Production

สำหรับเตรียมฐานข้อมูล sandbox ให้ใส่ connection string ลง `.env.demo` แล้วรัน `pnpm seed:demo-sandbox` คำสั่งนี้ใช้ migration และข้อมูลตัวอย่างที่ติดป้าย demo พร้อมตรวจว่าฐานข้อมูล sandbox ไม่ใช่ database เดียวกับ `.env` ถ้ามี `DIRECT_DATABASE_URL` ให้ชี้ไปยัง direct endpoint ของ sandbox เดียวกัน คำสั่งนี้ต้องรันในเครื่องและปฏิเสธการทำงานใน Production environment

กรอกค่าที่ไฟล์ `.env` ในรากโปรเจกต์ ซึ่งถูก Git ignore ไว้ ส่วน `.env.example` เป็นแม่แบบที่แชร์ได้และต้องไม่มี key จริง

| ตัวแปร | ใช้ทำอะไร |
| --- | --- |
| `DATABASE_URL` | PostgreSQL สำหรับแอปหลัก ต้องแก้ user/password/host/database ให้ตรงกับฐานข้อมูลของคุณ |
| `DIRECT_DATABASE_URL` | การเชื่อมต่อโดยตรงสำหรับ Prisma migration หาก URL หลักเป็น pooled connection; ไม่ใช้ให้คงเป็น comment |
| `ADMIN_BASIC_USER` | อีเมลสำหรับล็อกอินแอดมิน |
| `ADMIN_BASIC_PASSWORD` | รหัสผ่านแอดมินและยืนยันการแก้สมาชิก; .env ที่สร้างให้มีรหัสสุ่มแล้ว สามารถเปลี่ยนได้ |
| `GEMINI_API_KEY` | วิเคราะห์บทความและจัดกลุ่มตำแหน่งด้วย Gemini |
| `YOUTUBE_API_KEY` | ดึงวิดีโอผ่าน YouTube Data API |
| `GITHUB_TOKEN` | ยืนยันตัวตนสำหรับค้นหา GitHub repositories |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | แผนที่ Live Map; เป็น key ฝั่ง browser ให้จำกัดโดเมนและ API ที่ใช้งาน |
| `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SITE_URL` | URL เว็บไซต์สำหรับ sitemap/robots/metadata ตั้งทั้งสองตัวให้เหมือนกัน |
| `NETWORK_GRAPH_SOURCE` | เลือก `auto`, `file`, `database` หรือ `hybrid` |
| `NETWORK_GRAPH_IMPORT_FILE_PATH` | ตำแหน่งไฟล์ข้อมูลสำหรับกราฟ |
| `PRISMA_LOG_LEVEL` | ใช้ `silent` เพื่อปิด Prisma logs หรือ `error` เพื่อแสดง errors ตามปกติ |

เริ่มจากกรอก `DATABASE_URL` และอีเมลแอดมิน แล้วเติมเฉพาะ API keys ที่ต้องใช้ ค่า API ที่ไม่ใช้ให้ว่างไว้ ไม่ใส่ข้อความตัวอย่างแทน key เพราะโค้ดอาจมองว่าเปิดบริการนั้นแล้ว

ใช้ URL PostgreSQL แบบ `postgresql://` หรือ `postgres://` ตาม adapter ปัจจุบัน ไม่ใช้ URL แบบ `prisma+postgres://` หากรหัสผ่านฐานข้อมูลมีอักขระพิเศษให้ URL-encode ส่วนนั้น และใช้การตั้งค่า SSL ตามผู้ให้บริการฐานข้อมูล

Next.js โหลด `.env` ให้เอง และ Prisma CLI โหลดผ่าน `dotenv/config` รีสตาร์ต dev server หลังแก้ค่า; ค่าที่ขึ้นต้น `NEXT_PUBLIC_` ต้อง build/deploy ใหม่เมื่อแก้ใน production ไฟล์ `.env.local` หรือ environment ของเครื่องที่ตั้งไว้แล้วอาจมีลำดับความสำคัญเหนือ `.env` ใน Next.js

การสร้าง `.env` ไม่ได้สร้างฐานข้อมูล บัญชีผู้ให้บริการ หรือเปิด API ให้อัตโนมัติ ระบบชำระเงินและอีเมลยังไม่ได้เชื่อมต่อ จึงยังไม่มี key สำหรับบริการเหล่านั้นในแม่แบบ

อย่านำ URL PostgreSQL นี้ไปใช้กับ Python รุ่นเก่าใน `src/` ซึ่งรองรับ SQLite และมี settings แยกจากแอปหลัก
