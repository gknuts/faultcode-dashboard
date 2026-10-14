#!/usr/bin/env node
// Merges all doc/fc_occurences_*.json → public/data/faults.json

import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const docDir = resolve(root, 'doc')
const outputPath = resolve(root, 'public/data/faults.json')

const files = readdirSync(docDir)
  .filter(f => /^fc_occurences_.*\.json$/.test(f))
  .sort()

if (files.length === 0) {
  console.error('No fc_occurences_*.json files found in doc/')
  process.exit(1)
}

console.log(`Found ${files.length} file(s): ${files.join(', ')}`)

const assetMap = new Map()   // id → label
const fcMap = new Map()      // code → description
const groupSet = new Set()   // group ids (strings)
const allRows = []

for (const file of files) {
  const rows = JSON.parse(readFileSync(resolve(docDir, file), 'utf8'))
  for (const row of rows) {
    const assetId = row.locomotive.replace(/ /g, '')
    assetMap.set(assetId, row.locomotive)
    if (!fcMap.has(row.fault_code)) {
      fcMap.set(row.fault_code, row.name)
    }
    if (row.correlation_group_id != null) {
      groupSet.add(String(row.correlation_group_id))
    }
    allRows.push(row)
  }
}

const assets = [...assetMap.entries()]
  .map(([id, label]) => ({ id, label }))
  .sort((a, b) => a.id.localeCompare(b.id))

const faultCodes = [...fcMap.entries()]
  .map(([code, description]) => ({ code, description }))
  .sort((a, b) => a.code.localeCompare(b.code))

const groups = [...groupSet]
  .map(id => ({ id }))
  .sort((a, b) => Number(a.id) - Number(b.id))

const occurrences = allRows.map(row => {
  const occ = {
    assetId: row.locomotive.replace(/ /g, ''),
    faultCode: row.fault_code,
    date: row.date,
    count: row.occurences,
    status: row.is_anomalous ? 'abnormal' : 'normal',
  }
  if (row.correlation_group_id != null) {
    occ.groupId = String(row.correlation_group_id)
  }
  return occ
})

const output = { assets, faultCodes, groups, occurrences }
writeFileSync(outputPath, JSON.stringify(output, null, 2))

console.log(`Assets: ${assets.length}`)
console.log(`Fault codes: ${faultCodes.length}`)
console.log(`Groups: ${groups.length}`)
console.log(`Occurrences: ${occurrences.length}`)
console.log(`Written → ${outputPath}`)
