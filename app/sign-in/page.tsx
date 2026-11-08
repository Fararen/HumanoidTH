import Link from "next/link";
import { signIn } from "./actions";
export default async function SignInPage({ searchParams }: { searchParams: Promise<{ from?: string; error?: string }> }) {
  const query = await searchParams;
  return <div className="platform-page"><h1>เข้าสู่ระบบ · Sign in</h1>
    {query.error && <p role="alert">อีเมลหรือรหัสผ่านไม่ถูกต้อง / Account already exists or registration details are invalid.</p>}
    <form action={signIn} className="platform-form">
      <input type="hidden" name="from" value={query.from || "/me"} />
      <label>Email<input name="email" type="email" required autoComplete="username" /></label>
      <label>Password<input name="password" type="password" required autoComplete="current-password" /></label>
      <button>เข้าสู่ระบบ · Sign in</button>
    </form><Link href="/register">สร้างบัญชี · Create account</Link>
    {process.env.LOCAL_DEMO_MODE === "1" && <p><Link href="/demo">เลือกบทบาทเดโมในเครื่องนี้ · Local demo roles</Link></p>}
  </div>;
}
