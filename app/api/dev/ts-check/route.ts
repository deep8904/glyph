import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }
  try {
    await execAsync('npx tsc --noEmit')
    return NextResponse.json({ status: 'pass', errors: 0 })
  } catch (err: unknown) {
    const error = err as { stdout?: string; stderr?: string }
    const output = error.stdout || error.stderr || ''
    const errorCount = (output.match(/error TS/g) || []).length
    return NextResponse.json({ status: 'fail', errors: errorCount, output })
  }
}
