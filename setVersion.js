const fs = require('node:fs')
const path = require('node:path')

const FILE_PATH = path.join(__dirname, './scripts/Bili Garb/script.json')
const version = process.argv.slice(2)[0] // 1.0.0
const data = JSON.parse(fs.readFileSync(FILE_PATH, 'utf-8'))
data.version = version
fs.writeFileSync(FILE_PATH, JSON.stringify(data), 'utf-8')
