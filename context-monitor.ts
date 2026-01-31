#!/usr/bin/env npx tsx

/**
 * Context Monitor
 * 
 * Background process that monitors context usage and triggers context-saver at threshold.
 * Run: npx tsx context-monitor.ts
 * 
 * Or as daemon: nohup npx tsx context-monitor.ts > /tmp/context-monitor.log 2>&1 &
 */

import { execSync } from 'child_process'

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:18789'
const GATEWAY_TOKEN = process.env.GATEWAY_AUTH_TOKEN || '5ee455ff15edac93cd01e51869803658081a228454cf737d'
const CHECK_INTERVAL_MS = 60_000  // Check every 60 seconds
const THRESHOLD_PERCENT = 80      // Trigger at 80%
const COOLDOWN_MS = 300_000       // 5 min cooldown after save

let lastSaveTime = 0

interface SessionStatus {
  context?: {
    used: number
    max: number
    percent: number
  }
}

async function getSessionStatus(): Promise<SessionStatus | null> {
  try {
    const response = await fetch(`${GATEWAY_URL}/api/sessions/main/status`, {
      headers: {
        'Authorization': `Bearer ${GATEWAY_TOKEN}`
      }
    })
    
    if (!response.ok) {
      console.error(`[${timestamp()}] Failed to get session status: ${response.status}`)
      return null
    }
    
    const data = await response.json()
    
    // Parse context from status response
    // Looking for pattern like "100k/200k (50%)"
    const statusText = data.status || ''
    const contextMatch = statusText.match(/Context:\s*([\d.]+)k\/([\d.]+)k\s*\((\d+)%\)/)
    
    if (contextMatch) {
      return {
        context: {
          used: parseFloat(contextMatch[1]) * 1000,
          max: parseFloat(contextMatch[2]) * 1000,
          percent: parseInt(contextMatch[3])
        }
      }
    }
    
    return null
  } catch (err) {
    console.error(`[${timestamp()}] Error fetching status:`, err)
    return null
  }
}

function timestamp(): string {
  return new Date().toISOString().replace('T', ' ').split('.')[0]
}

function runContextSaver(): void {
  console.log(`[${timestamp()}] 🚨 Running context-saver...`)
  
  try {
    execSync(
      `cd ~/clawd/skills/context-saver && npx tsx context-saver.ts --session "Main" --notes "Auto-save triggered by context monitor (threshold reached)"`,
      { stdio: 'inherit' }
    )
    lastSaveTime = Date.now()
    console.log(`[${timestamp()}] ✅ Context saved successfully`)
  } catch (err) {
    console.error(`[${timestamp()}] ❌ Failed to run context-saver:`, err)
  }
}

async function check(): Promise<void> {
  const status = await getSessionStatus()
  
  if (!status?.context) {
    console.log(`[${timestamp()}] Could not get context info`)
    return
  }
  
  const { percent } = status.context
  console.log(`[${timestamp()}] Context: ${percent}%`)
  
  // Check if we need to save
  if (percent >= THRESHOLD_PERCENT) {
    const timeSinceLastSave = Date.now() - lastSaveTime
    
    if (timeSinceLastSave < COOLDOWN_MS) {
      console.log(`[${timestamp()}] ⏳ In cooldown (${Math.round((COOLDOWN_MS - timeSinceLastSave) / 1000)}s remaining)`)
      return
    }
    
    console.log(`[${timestamp()}] 🚨 Context at ${percent}% (threshold: ${THRESHOLD_PERCENT}%)`)
    runContextSaver()
  }
}

async function main(): Promise<void> {
  console.log(`[${timestamp()}] 🔍 Context Monitor started`)
  console.log(`[${timestamp()}] Checking every ${CHECK_INTERVAL_MS / 1000}s, threshold: ${THRESHOLD_PERCENT}%`)
  
  // Initial check
  await check()
  
  // Regular interval
  setInterval(check, CHECK_INTERVAL_MS)
}

main()
