# Context Saver

Save conversation context to a three-layer memory system before compaction hits.

Built for [Clawdbot](https://github.com/clawdbot/clawdbot) AI assistants.

## The Problem

When AI conversation context gets too long, it compacts. Important details can be lost if not saved beforehand.

## The Solution

A tool that captures key conversation points and writes them to structured memory files:

1. **Daily memory** (`memory/YYYY-MM-DD.md`) for session events
2. **Knowledge graph** (`~/life/areas/[type]/[name]/`) for entity facts
3. **Long-term memory** (`MEMORY.md`) for preferences and lessons

## Usage

### As a CLI

```bash
npx tsx context-saver.ts \
  --session "Main (Omar)" \
  --decisions "Chose Option 1 for session format|Decided to build context-saver tool" \
  --completed "Updated AGENTS.md|Created cron job" \
  --learned "Compaction summaries can fail" \
  --actions "Deploy LeadPilot|Set up automated outreach" \
  --notes "Good progress today on memory systems"
```

### Adding Entity Facts

```bash
npx tsx context-saver.ts \
  --fact "projects:LeadPilot:milestone:Landing page completed" \
  --fact "people:Omar:preference:No dashes in writing"
```

### As a Clawdbot Skill

Copy `SKILL.md` to your Clawdbot skills directory and invoke with "save context".

## Output

### Daily Memory Entry

```markdown
## Session: Main (Omar) (14:30)

### Decisions
- Chose Option 1 for session format
- Decided to build context-saver tool

### Completed
- Updated AGENTS.md
- Created cron job

### Learned
- Compaction summaries can fail

### Action Items
- [ ] Deploy LeadPilot
- [ ] Set up automated outreach

### Notes
Good progress today on memory systems
```

### Entity Fact (items.json)

```json
{
  "id": "leadpilot-1706706600000-0",
  "fact": "Landing page completed",
  "category": "milestone",
  "timestamp": "2026-01-31",
  "source": "context-saver",
  "status": "active",
  "supersededBy": null
}
```

## Integration

Works with:
- Clawdbot's memory search (embeddings auto-index new content)
- Three-layer memory system (daily notes, knowledge graph, MEMORY.md)
- Fact extraction cron (skips already-saved items)

## Environment Variables

- `MEMORY_DIR`: Path to memory files (default: `~/clawd/memory`)
- `LIFE_AREAS`: Path to knowledge graph (default: `~/life/areas`)

## License

MIT
