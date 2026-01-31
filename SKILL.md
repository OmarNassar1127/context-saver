# Context Saver Skill

Save important conversation context before compaction hits. Feeds into the three-layer memory system.

## When to Use

- Conversation feels deep or important
- Multiple decisions being made
- Learning new facts about people/projects/companies
- Before ending a long session
- When prompted by context pressure

## How to Invoke

Say "save context" or "context save" in conversation, or invoke manually when you sense the need.

## What It Does

1. **Scans recent conversation** for:
   - Decisions made
   - Questions answered  
   - Tasks assigned or completed
   - New facts about entities (people, companies, projects)
   - Lessons learned
   - Preferences expressed

2. **Writes to the right places:**
   - Session events → `memory/YYYY-MM-DD.md` (under session header)
   - Entity facts → `~/life/areas/[type]/[name]/items.json`
   - Preferences/lessons → `MEMORY.md`

3. **Confirms what was saved**

## Output Format

### Daily Memory Entry
```markdown
## Session: [Source] ([Time])

### Key Points
- Decision: [what was decided]
- Completed: [what got done]
- Learned: [new information]

### Action Items
- [ ] Task if any

### Notes
Any other relevant context
```

### Entity Fact (items.json)
```json
{
  "id": "[entity]-XXX",
  "fact": "The actual fact",
  "category": "relationship|milestone|status|preference",
  "timestamp": "YYYY-MM-DD",
  "source": "conversation",
  "status": "active",
  "supersededBy": null
}
```

## Integration

- Uses existing three-layer memory paths
- Embeddings index automatically picks up new content
- Fact extraction cron skips already-saved items
- Works WITH the system, not parallel

## Example

**Trigger:** "save context"

**Output:**
```
Context saved to memory/2026-01-31.md:
- 3 decisions captured
- 2 entity facts extracted (Omar, LeadPilot)
- 1 lesson added to MEMORY.md

Safe to continue or let compaction happen.
```
