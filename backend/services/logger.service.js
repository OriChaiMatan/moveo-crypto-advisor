import fs from 'fs'
import path from 'path'

const LOGS_DIR = path.resolve('logs')
const LOG_FILE = path.join(LOGS_DIR, 'backend.log')

if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true })

// Never pass a password, a token, a cookie, an api key or a raw request body to
// these. Log an id or a short message instead.
export const logger = {
    debug(...args) {
        // Debug lines are for local work, and would only be noise in production
        if (process.env.NODE_ENV === 'production') return
        _log('DEBUG', args)
    },
    info(...args) {
        _log('INFO', args)
    },
    warn(...args) {
        _log('WARN', args)
    },
    error(...args) {
        _log('ERROR', args)
    },
}

function _log(level, args) {
    const line = `${new Date().toISOString()} - ${level} - ${args.map(_toText).join(' | ')}\n`

    console.log(line.trimEnd())

    try {
        // Written synchronously, so a line logged just before the process exits
        // still reaches the file. The traffic here is far too low for that to cost
        // anything, and a lost startup error is much more expensive.
        fs.appendFileSync(LOG_FILE, line)
    } catch (err) {
        // A log write must never take the server down, so the failure is only reported
        console.error('Cannot write to the log file:', err.message)
    }
}

function _toText(arg) {
    if (typeof arg === 'string') return arg
    if (arg instanceof Error) return arg.stack || arg.message

    try {
        return JSON.stringify(arg)
    } catch {
        // A circular or otherwise unserializable value must not throw here
        return '[unserializable value]'
    }
}
