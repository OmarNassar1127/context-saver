# Context Saver

A memory preservation system for Clawdbot that saves conversation context before compaction wipes it out.

## The Problem

Clawdbot compacts (summarizes) old conversation when context hits ~100%. The auto-generated summary often loses important details: decisions made, tasks completed, lessons learned.

## The Solution

Context Saver:
1. **Detects** when context is getting full (80% threshold)
2. **Saves** meaningful information to structured memory files
3. **Logs** every run for verification

## Components

### 1. context-saver.ts
The core script that saves context to your memory system.

```bash
npx tsx context-saver.ts \
  --session "Main" \
  --trigger "manual" \
  --decisions "Chose React over Vue|Decided on PostgreSQL" \
  --completed "Built auth system|Deployed to prod" \
  --learned "Caching reduces API calls by 80%" \
  --notes "Working on user dashboard next"
```

**Arguments:**
- `--session` - Session name (default: "Main")
- `--trigger` - What triggered the save (manual, context-guard, cron, heartbeat)
- `--decisions` - Pipe-separated list of decisions made
- `--completed` - Pipe-separated list of completed items
- `--learned` - Pipe-separated list of things learned
- `--actions` - Pipe-separated list of action items/todos
- `--notes` - Freeform notes
- `--fact` - Entity facts in format `type:name:category:fact` (can repeat)

**Output:**
- Appends to `~/clawd/memory/YYYY-MM-DD.md` (daily memory file)
- Appends to `~/clawd/memory/context-saver-log.md` (run log)
- Creates entity entries in `~/life/areas/` (if using facts)

### 2. context-guard hook
A Clawdbot hook that monitors context usage and triggers saves automatically.

**Location:** `~/clawd/hooks/context-guard/`

**How it works:**
1. Runs after every agent reply
2. Checks if context >= 80%
3. If threshold hit AND session not already saved:
   - Runs context-saver with a note
   - Marks session as saved (prevents duplicates)
   - Injects alert message to conversation

**Configuration:**
Set `CONTEXT_GUARD_THRESHOLD` environment variable to change threshold (default: 80).

### 3. Log file
Every context-saver run is logged to `~/clawd/memory/context-saver-log.md`:

```
| Timestamp | Session | Trigger | Saved |
|-----------|---------|---------|-------|
| 2026-01-31 14:29:07 | Main | context-guard (82%) | 3 items |
| 2026-01-31 15:10:22 | Main | manual | 5 items |
```

## Setup

### 1. Install in your Clawdbot workspace

```bash
cd ~/clawd/skills
git clone https://github.com/OmarNassar1127/context-saver.git
cd context-saver
npm install
```

### 2. Enable the hook

Copy the hook to your hooks directory:

```bash
cp -r ~/clawd/skills/context-saver/hooks/context-guard ~/clawd/hooks/
```

Or create the hook manually (see `hooks/context-guard/handler.ts`).

### 3. Test it

```bash
cd ~/clawd/skills/context-saver
npx tsx context-saver.ts --session "Test" --trigger "manual test" --notes "Testing installation"
```

Check the log:
```bash
cat ~/clawd/memory/context-saver-log.md
```

## How Context Management Works in Clawdbot

Understanding the full picture:

### Compaction
- Triggers automatically at ~100% context
- Summarizes old conversation into a compact entry
- Summary quality varies (sometimes garbage)
- Counter shown in `/status`: `🧹 Compactions: N`

### Session Pruning
- Trims old **tool results** from in-memory context
- Happens per-request, transparently
- Reduces context bloat from file reads, command outputs
- Does NOT touch conversation history

### Context Saver (this tool)
- Proactive save BEFORE compaction
- Preserves decisions, completed items, learnings
- Agent can recover context from memory files after compaction

## Best Practices

1. **Don't rely only on auto-save**: The hook saves a note, but can't extract meaningful content from conversation. The agent should save real context when alerted.

2. **Check the log**: If context-saver-log.md shows runs but memory files are empty, the saves aren't capturing useful content.

3. **Use triggers**: Always pass `--trigger` so you know what caused each save (debugging).

4. **Entity facts for people/projects**: Use `--fact` for durable information about people, companies, or projects that should persist long-term.

## Three-Layer Memory System

Context Saver integrates with a three-layer memory architecture:

1. **Layer 1: Knowledge Graph** (`~/life/areas/`)
   - Entity-based storage (people, companies, projects)
   - `summary.md` + `items.json` per entity
   - Use `--fact` to add entries

2. **Layer 2: Daily Notes** (`~/clawd/memory/YYYY-MM-DD.md`)
   - Session logs, what happened when
   - Context-saver appends here by default

3. **Layer 3: Long-term Memory** (`~/clawd/MEMORY.md`)
   - Curated patterns, preferences, lessons
   - Manually maintained, not auto-updated

## Troubleshooting

**Hook not firing:**
- Check hook is in `~/clawd/hooks/context-guard/`
- Verify `handler.ts` exports default function
- Check Clawdbot logs for hook errors

**Context still lost after compaction:**
- Hook only saves a generic note
- Agent needs to save meaningful content when alerted
- Consider upgrading to automated sub-agent extraction

**Log shows runs but no useful data:**
- The hook can't access conversation content
- Only the agent can save decisions/completed/learned
- Hook is an alert system, not a content extractor

## License

MIT
