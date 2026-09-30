import { describe, expect, it } from 'vitest'
import { dueLabel, formatBytes, initials } from './format'
import { csvCell, toCsv } from './csv'

describe('format', () => {
  const now = new Date('2026-03-10T09:00:00')
  it('describes deadlines relative to today', () => {
    expect(dueLabel(new Date('2026-03-10T17:00:00'), now)).toBe('Due today')
    expect(dueLabel(new Date('2026-03-11T17:00:00'), now)).toBe('Due tomorrow')
    expect(dueLabel(new Date('2026-03-15T17:00:00'), now)).toBe('Due in 5 days')
    expect(dueLabel(new Date('2026-03-07T17:00:00'), now)).toBe('3 days overdue')
  })

  it('formats sizes', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(1536)).toBe('1.5 KB')
    expect(formatBytes(15 * 1024 * 1024)).toBe('15 MB')
  })

  it('builds initials', () => {
    expect(initials('Dr. R. Meena')).toBe('DM')
    expect(initials('Arjun')).toBe('AR')
  })
})

describe('csv', () => {
  it('escapes quotes, commas and newlines', () => {
    expect(csvCell('a "b", c')).toBe('"a ""b"", c"')
  })

  it('neutralises spreadsheet formulas', () => {
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`)
  })

  it('writes a header row', () => {
    expect(toCsv([{ Team: 'Aurora', Marks: 18 }])).toBe('Team,Marks\r\nAurora,18')
  })
})
