#!/usr/bin/env npx tsx

/**
 * Context Saver
 * 
 * Saves conversation context to the three-layer memory system.
 * Run: npx tsx context-saver.ts --session "Main" --summary "key points..."
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

const MEMORY_DIR = process.env.MEMORY_DIR || join(process.env.HOME!, 'clawd', 'memory')
const LIFE_AREAS = process.env.LIFE_AREAS || join(process.env.HOME!, 'life', 'areas')

interface ContextEntry {
  session: string
  timestamp: string
  decisions: string[]
  completed: string[]
  learned: string[]
  actionItems: string[]
  notes: string
}

interface EntityFact {
  id: string
  fact: string
  category: 'relationship' | 'milestone' | 'status' | 'preference'
  timestamp: string
  source: string
  status: 'active' | 'superseded'
  supersededBy: string | null
}

function getTodayFile(): string {
  const today = new Date().toISOString().split('T')[0]
  return join(MEMORY_DIR, `${today}.md`)
}

function formatEntry(entry: ContextEntry): string {
  const lines: string[] = []
  
  lines.push(`\n## Session: ${entry.session} (${entry.timestamp})\n`)
  
  if (entry.decisions.length > 0) {
    lines.push('### Decisions')
    entry.decisions.forEach(d => lines.push(`- ${d}`))
    lines.push('')
  }
  
  if (entry.completed.length > 0) {
    lines.push('### Completed')
    entry.completed.forEach(c => lines.push(`- ${c}`))
    lines.push('')
  }
  
  if (entry.learned.length > 0) {
    lines.push('### Learned')
    entry.learned.forEach(l => lines.push(`- ${l}`))
    lines.push('')
  }
  
  if (entry.actionItems.length > 0) {
    lines.push('### Action Items')
    entry.actionItems.forEach(a => lines.push(`- [ ] ${a}`))
    lines.push('')
  }
  
  if (entry.notes) {
    lines.push('### Notes')
    lines.push(entry.notes)
    lines.push('')
  }
  
  return lines.join('\n')
}

function appendToDaily(entry: ContextEntry): void {
  const filepath = getTodayFile()
  const today = new Date().toISOString().split('T')[0]
  
  let content = ''
  if (existsSync(filepath)) {
    content = readFileSync(filepath, 'utf-8')
  } else {
    content = `# ${today}\n`
  }
  
  content += formatEntry(entry)
  writeFileSync(filepath, content)
  console.log(`✓ Saved to ${filepath}`)
}

function addEntityFact(entityType: string, entityName: string, fact: EntityFact): void {
  const entityDir = join(LIFE_AREAS, entityType, entityName.toLowerCase().replace(/\s+/g, '-'))
  const itemsFile = join(entityDir, 'items.json')
  
  if (!existsSync(entityDir)) {
    mkdirSync(entityDir, { recursive: true })
    // Create summary.md placeholder
    writeFileSync(join(entityDir, 'summary.md'), `# ${entityName}\n\n*Summary pending weekly synthesis.*\n`)
  }
  
  let items: EntityFact[] = []
  if (existsSync(itemsFile)) {
    items = JSON.parse(readFileSync(itemsFile, 'utf-8'))
  }
  
  items.push(fact)
  writeFileSync(itemsFile, JSON.stringify(items, null, 2))
  console.log(`✓ Added fact to ${entityType}/${entityName}`)
}

function parseArgs(): { session: string; data: Partial<ContextEntry>; facts: Array<{ type: string; name: string; fact: string; category: string }> } {
  const args = process.argv.slice(2)
  const result: any = { session: 'Main', data: {}, facts: [] }
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    const value = args[i + 1]
    
    switch (arg) {
      case '--session':
        result.session = value
        i++
        break
      case '--decisions':
        result.data.decisions = value.split('|')
        i++
        break
      case '--completed':
        result.data.completed = value.split('|')
        i++
        break
      case '--learned':
        result.data.learned = value.split('|')
        i++
        break
      case '--actions':
        result.data.actionItems = value.split('|')
        i++
        break
      case '--notes':
        result.data.notes = value
        i++
        break
      case '--fact':
        // Format: type:name:category:fact
        const [type, name, category, ...factParts] = value.split(':')
        result.facts.push({ type, name, category, fact: factParts.join(':') })
        i++
        break
    }
  }
  
  return result
}

function main() {
  const { session, data, facts } = parseArgs()
  
  const timestamp = new Date().toLocaleTimeString('en-GB', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'Europe/Amsterdam'
  })
  
  const entry: ContextEntry = {
    session,
    timestamp,
    decisions: data.decisions || [],
    completed: data.completed || [],
    learned: data.learned || [],
    actionItems: data.actionItems || [],
    notes: data.notes || ''
  }
  
  // Only save to daily if there's actual content
  const hasContent = entry.decisions.length > 0 || 
                     entry.completed.length > 0 || 
                     entry.learned.length > 0 ||
                     entry.actionItems.length > 0 ||
                     entry.notes
  
  if (hasContent) {
    appendToDaily(entry)
  }
  
  // Process entity facts
  const today = new Date().toISOString().split('T')[0]
  facts.forEach((f, i) => {
    const entityFact: EntityFact = {
      id: `${f.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${i}`,
      fact: f.fact,
      category: f.category as any,
      timestamp: today,
      source: 'context-saver',
      status: 'active',
      supersededBy: null
    }
    addEntityFact(f.type, f.name, entityFact)
  })
  
  console.log('\n⚡ Context saved successfully')
}

main()
