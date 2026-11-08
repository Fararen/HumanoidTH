import { GRID_TASK } from "./platform-catalog";
export function runGridProgram(program: string) {
  const commands = program.trim().toUpperCase().split(/\s+/).filter(Boolean);
  if (!commands.length || commands.length > GRID_TASK.maxSteps || commands.some(command => !["F", "L", "R"].includes(command))) throw new Error("Use 1–100 commands, separated by spaces: F, L or R");
  const directions = [[1,0],[0,1],[-1,0],[0,-1]];
  let x = 0, y = 0, direction = 0;
  const events = [{ seq: 0, x, y, direction, action: "START" }];
  for (const command of commands) {
    if (command === "R") direction = (direction + 1) % 4;
    if (command === "L") direction = (direction + 3) % 4;
    if (command === "F") {
      const [dx, dy] = directions[direction];
      const nextX = x + dx, nextY = y + dy;
      if (nextX < 0 || nextY < 0 || nextX >= GRID_TASK.size || nextY >= GRID_TASK.size || GRID_TASK.obstacles.some(([ox,oy]) => ox === nextX && oy === nextY)) {
        events.push({ seq: events.length, x, y, direction, action: "COLLISION" });
        return { succeeded: false, reason: "Collision with wall or obstacle", steps: events.length - 1, score: 0, events };
      }
      x = nextX; y = nextY;
    }
    events.push({ seq: events.length, x, y, direction, action: command });
  }
  const succeeded = x === GRID_TASK.goal[0] && y === GRID_TASK.goal[1];
  return { succeeded, reason: succeeded ? null : "Program ended before reaching the goal", steps: commands.length, score: succeeded ? Math.max(0, 100 - Math.max(0, commands.length - 9)) : 0, events };
}
