"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GRID_TASK } from "@/lib/platform-catalog";
export default function RunReplay({ events, pending }: { events: { seq: number; x: number; y: number; action: string }[]; pending: boolean }) {
  const [index, setIndex] = useState(0); const router = useRouter();
  useEffect(() => { if (!pending) return; const timer = setInterval(() => router.refresh(), 1500); return () => clearInterval(timer); }, [pending, router]);
  const event = events[Math.min(index, events.length - 1)] || { x: 0, y: 0, action: "START" };
  return <section className="platform-card" aria-label="Simulation replay"><h2>เส้นทางจำลอง · Grid replay</h2><p>ตาราง {GRID_TASK.size} × {GRID_TASK.size} · เวอร์ชัน {GRID_TASK.version} · จุดหมาย (4,4)</p>
    <svg viewBox="0 0 250 250" width="300" style={{ maxWidth: "100%" }} role="img" aria-label={`Robot at ${event.x}, ${event.y}; ${event.action}`}>
      {Array.from({ length: 25 }, (_, cell) => { const x = cell % 5, y = Math.floor(cell / 5); const obstacle = GRID_TASK.obstacles.some(([ox,oy]) => ox === x && oy === y); return <rect key={cell} x={x*50} y={y*50} width="49" height="49" fill={obstacle ? "#344b42" : x === 4 && y === 4 ? "#f3d98b" : "#e9f1ec"} stroke="white" />; })}
      <polyline points={events.slice(0,index+1).map(item => `${item.x*50+25},${item.y*50+25}`).join(" ")} stroke="#1b7660" fill="none" strokeWidth="3" />
      <circle cx={event.x*50+25} cy={event.y*50+25} r="14" fill="#2557c4" /><text x="225" y="230" textAnchor="middle" fontSize="10">GOAL</text>
    </svg>
    {events.length > 0 && <label>เหตุการณ์ · Step {index} / {events.length-1}<input type="range" min="0" max={events.length-1} value={index} onChange={event => setIndex(Number(event.target.value))} /></label>}
    <p role="status">{pending ? "Waiting for the queue worker…" : `(${event.x}, ${event.y}) · ${event.action}`}</p>
  </section>;
}
