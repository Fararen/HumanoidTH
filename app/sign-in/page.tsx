import Link from "next/link";
import { signIn } from "./actions";
import { publicDemoModeEnabled } from "@/lib/demo-mode";
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
    <p><Link href="/try">ทดลองใช้งานโดยไม่ต้องเข้าสู่ระบบ · Try without signing in</Link></p>
    {(process.env.LOCAL_DEMO_MODE === "1" || publicDemoModeEnabled()) && <p><Link href="/demo">บัญชีทดลอง · Demo accounts</Link></p>}
  </div>;
}
