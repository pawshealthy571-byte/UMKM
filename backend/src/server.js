import express from 'express'
import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { initializeDatabase, pool } from './db.js'

const app = express()
const port = Number(process.env.PORT) || 3000
const scrypt = promisify(scryptCallback)
const incomeCategories = ['Penjualan', 'Jasa', 'Modal', 'Lainnya']
const expenseCategories = ['Bahan baku', 'Operasional', 'Gaji', 'Transportasi', 'Pemasaran', 'Lainnya']
app.use(express.json({ limit: '32kb' }))

const hashToken = (token) => createHash('sha256').update(token).digest('hex')
const publicUser = (row) => ({ id: row.id, name: row.name, email: row.email, businessName: row.business_name, openingBalance: Number(row.opening_balance), minimumBalance: Number(row.minimum_balance) })
const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)

async function authenticate(req, res, next) {
  const token = req.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return res.status(401).json({ message: 'Silakan masuk untuk melanjutkan.' })
  const [rows] = await pool.execute(`SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at > NOW()`, [hashToken(token)])
  if (!rows.length) return res.status(401).json({ message: 'Sesi berakhir. Silakan masuk kembali.' })
  req.user = publicUser(rows[0])
  next()
}

async function seedDemoAccount() {
  if (process.env.DEMO_ENABLED !== 'true') return
  const email = process.env.DEMO_EMAIL
  const password = process.env.DEMO_PASSWORD
  if (!email || !password) throw new Error('DEMO_EMAIL and DEMO_PASSWORD are required when DEMO_ENABLED=true')
  const normalizedEmail = email.trim().toLowerCase()
  const [existing] = await pool.execute('SELECT id FROM users WHERE email=?', [normalizedEmail])
  if (existing.length) return

  const salt = randomBytes(16).toString('hex')
  const passwordHash = `${salt}:${(await scrypt(password, salt, 64)).toString('hex')}`
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [result] = await connection.execute('INSERT INTO users (name,email,password_hash,business_name,opening_balance,minimum_balance) VALUES (?,?,?,?,?,?)', ['Demo LKUMKM', normalizedEmail, passwordHash, 'DEMO — Kedai Pagi (Data Simulasi)', 500000, 1200000])
    for (let offset = 29; offset >= 0; offset -= 1) {
      const day = new Date()
      day.setUTCDate(day.getUTCDate() - offset)
      const date = day.toISOString().slice(0, 10)
      await connection.execute('INSERT INTO transactions (user_id,type,amount,category,description,transaction_date) VALUES (?,?,?,?,?,?)', [result.insertId, 'expense', 50000, 'Operasional', 'SIMULASI • Biaya operasional harian', date])
      if (offset % 3 === 0) await connection.execute('INSERT INTO transactions (user_id,type,amount,category,description,transaction_date) VALUES (?,?,?,?,?,?)', [result.insertId, 'income', 200000, 'Penjualan', 'SIMULASI • Penjualan harian', date])
    }
    await connection.commit()
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'lkumkm-backend' }))

app.post('/api/auth/register', asyncRoute(async (req, res) => {
  const { name, email, password, businessName } = req.body || {}
  if (!name?.trim() || !/^\S+@\S+\.\S+$/.test(email || '') || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ message: 'Isi nama, email yang valid, dan kata sandi minimal 8 karakter.' })
  }
  const salt = randomBytes(16).toString('hex')
  const passwordHash = `${salt}:${(await scrypt(password, salt, 64)).toString('hex')}`
  const [result] = await pool.execute('INSERT INTO users (name,email,password_hash,business_name) VALUES (?,?,?,?)', [name.trim(), email.trim().toLowerCase(), passwordHash, businessName?.trim() || 'Usaha Saya'])
  const token = randomBytes(32).toString('base64url')
  await pool.execute('INSERT INTO sessions (token_hash,user_id,expires_at) VALUES (?,?,DATE_ADD(NOW(), INTERVAL 30 DAY))', [hashToken(token), result.insertId])
  const [[user]] = await pool.execute('SELECT * FROM users WHERE id=?', [result.insertId])
  res.status(201).json({ token, user: publicUser(user) })
}))

app.post('/api/auth/login', asyncRoute(async (req, res) => {
  const { email, password } = req.body || {}
  const [rows] = await pool.execute('SELECT * FROM users WHERE email=?', [String(email || '').trim().toLowerCase()])
  if (!rows.length || typeof password !== 'string') return res.status(401).json({ message: 'Email atau kata sandi tidak cocok.' })
  const [salt, saved] = rows[0].password_hash.split(':')
  const candidate = await scrypt(password, salt, 64)
  if (!timingSafeEqual(candidate, Buffer.from(saved, 'hex'))) return res.status(401).json({ message: 'Email atau kata sandi tidak cocok.' })
  const token = randomBytes(32).toString('base64url')
  await pool.execute('INSERT INTO sessions (token_hash,user_id,expires_at) VALUES (?,?,DATE_ADD(NOW(), INTERVAL 30 DAY))', [hashToken(token), rows[0].id])
  res.json({ token, user: publicUser(rows[0]) })
}))

app.use('/api', asyncRoute(authenticate))

app.post('/api/auth/logout', asyncRoute(async (req, res) => {
  const token = req.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (token) await pool.execute('DELETE FROM sessions WHERE token_hash=?', [hashToken(token)])
  res.json({ status: 'ok' })
}))

app.get('/api/me', (req, res) => res.json({ user: req.user }))

app.get('/api/settings', (req, res) => res.json({ user: req.user, incomeCategories, expenseCategories }))
app.put('/api/settings', asyncRoute(async (req, res) => {
  const { name, businessName, openingBalance, minimumBalance } = req.body || {}
  if (!name?.trim() || !businessName?.trim() || !Number.isFinite(Number(openingBalance)) || Number(openingBalance) < 0 || !Number.isFinite(Number(minimumBalance)) || Number(minimumBalance) < 0) return res.status(400).json({ message: 'Periksa kembali profil, saldo awal, dan batas minimum kas.' })
  await pool.execute('UPDATE users SET name=?,business_name=?,opening_balance=?,minimum_balance=? WHERE id=?', [name.trim(), businessName.trim(), Number(openingBalance), Number(minimumBalance), req.user.id])
  const [[user]] = await pool.execute('SELECT * FROM users WHERE id=?', [req.user.id])
  res.json({ user: publicUser(user) })
}))

app.get('/api/transactions', asyncRoute(async (req, res) => {
  const conditions = ['user_id=?']
  const params = [req.user.id]
  if (req.query.from) { conditions.push('transaction_date >= ?'); params.push(req.query.from) }
  if (req.query.to) { conditions.push('transaction_date <= ?'); params.push(req.query.to) }
  if (req.query.category) { conditions.push('category = ?'); params.push(req.query.category) }
  if (req.query.type) { conditions.push('type = ?'); params.push(req.query.type) }
  if (req.query.q) { conditions.push('description LIKE ?'); params.push(`%${String(req.query.q).slice(0, 100)}%`) }
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1)
  const pageSize = Math.min(50, Math.max(1, Number.parseInt(req.query.pageSize, 10) || 20))
  const sortColumns = { date: 'transaction_date', amount: 'amount', category: 'category', type: 'type' }
  const sort = sortColumns[req.query.sort] || 'transaction_date'
  const direction = req.query.direction === 'asc' ? 'ASC' : 'DESC'
  const [countRows] = await pool.execute(`SELECT COUNT(*) AS total FROM transactions WHERE ${conditions.join(' AND ')}`, params)
  const [rows] = await pool.execute(`SELECT id,type,amount,category,description,transaction_date AS date FROM transactions WHERE ${conditions.join(' AND ')} ORDER BY ${sort} ${direction},id DESC LIMIT ? OFFSET ?`, [...params, pageSize, (page - 1) * pageSize])
  res.json({ transactions: rows.map((r) => ({ ...r, amount: Number(r.amount) })), page, pageSize, total: Number(countRows[0].total), pages: Math.max(1, Math.ceil(Number(countRows[0].total) / pageSize)) })
}))

app.post('/api/transactions', asyncRoute(async (req, res) => {
  const { type, amount, category, description = '', date } = req.body || {}
  const categories = type === 'income' ? incomeCategories : expenseCategories
  if (!['income','expense'].includes(type) || !Number.isFinite(Number(amount)) || Number(amount) <= 0 || !categories.includes(category) || !/^\d{4}-\d{2}-\d{2}$/.test(date || '') || typeof description !== 'string' || description.length > 255) return res.status(400).json({ message: 'Periksa jenis, nominal, kategori, tanggal, dan catatan transaksi.' })
  const [result] = await pool.execute('INSERT INTO transactions (user_id,type,amount,category,description,transaction_date) VALUES (?,?,?,?,?,?)', [req.user.id, type, Number(amount), category, description.trim(), date])
  const [[row]] = await pool.execute('SELECT id,type,amount,category,description,transaction_date AS date FROM transactions WHERE id=? AND user_id=?', [result.insertId, req.user.id])
  res.status(201).json({ transaction: { ...row, amount: Number(row.amount) } })
}))

app.put('/api/transactions/:id', asyncRoute(async (req, res) => {
  const { type, amount, category, description = '', date } = req.body || {}
  const categories = type === 'income' ? incomeCategories : expenseCategories
  if (!['income','expense'].includes(type) || !Number.isFinite(Number(amount)) || Number(amount) <= 0 || !categories.includes(category) || !/^\d{4}-\d{2}-\d{2}$/.test(date || '') || typeof description !== 'string' || description.length > 255) return res.status(400).json({ message: 'Periksa kembali data transaksi.' })
  const [result] = await pool.execute('UPDATE transactions SET type=?,amount=?,category=?,description=?,transaction_date=? WHERE id=? AND user_id=?', [type, Number(amount), category, description.trim(), date, req.params.id, req.user.id])
  if (!result.affectedRows) return res.status(404).json({ message: 'Transaksi tidak ditemukan.' })
  res.json({ status: 'ok' })
}))

app.delete('/api/transactions/:id', asyncRoute(async (req, res) => {
  const [result] = await pool.execute('DELETE FROM transactions WHERE id=? AND user_id=?', [req.params.id, req.user.id])
  if (!result.affectedRows) return res.status(404).json({ message: 'Transaksi tidak ditemukan.' })
  res.json({ status: 'ok' })
}))

async function financialSummary(userId, from, to) {
  const [[totals]] = await pool.execute(`SELECT COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END),0) income, COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END),0) expense FROM transactions WHERE user_id=? AND transaction_date BETWEEN ? AND ?`, [userId, from, to])
  return { income: Number(totals.income), expense: Number(totals.expense), profit: Number(totals.income) - Number(totals.expense) }
}

app.get('/api/dashboard', asyncRoute(async (req, res) => {
  const today = new Date().toISOString().slice(0, 10)
  const start = new Date(); start.setDate(start.getDate() - 29)
  const from = start.toISOString().slice(0, 10)
  const [allRows] = await pool.execute('SELECT type,amount,transaction_date AS date FROM transactions WHERE user_id=? AND transaction_date<=? ORDER BY transaction_date,id', [req.user.id, today])
  const [recentRows] = await pool.execute('SELECT id,type,amount,category,description,transaction_date AS date FROM transactions WHERE user_id=? ORDER BY transaction_date DESC,id DESC LIMIT 6', [req.user.id])
  const totals = await financialSummary(req.user.id, `${today.slice(0,7)}-01`, today)
  const currentBalance = req.user.openingBalance + allRows.reduce((sum, row) => sum + (row.type === 'income' ? 1 : -1) * Number(row.amount), 0)
  const dailyNet = new Map()
  const dailyIncome = new Map()
  const dailyExpense = new Map()
  for (const row of allRows) {
    const amount = Number(row.amount)
    dailyNet.set(row.date, (dailyNet.get(row.date) || 0) + (row.type === 'income' ? amount : -amount))
    const target = row.type === 'income' ? dailyIncome : dailyExpense
    target.set(row.date, (target.get(row.date) || 0) + amount)
  }
  const days = Array.from({ length: 30 }, (_, index) => { const d = new Date(); d.setDate(d.getDate() - 29 + index); return d.toISOString().slice(0, 10) })
  const dailyAverage = days.reduce((sum, day) => sum + (dailyNet.get(day) || 0), 0) / 30
  const averageIncome = days.reduce((sum, day) => sum + (dailyIncome.get(day) || 0), 0) / 30
  const averageExpense = days.reduce((sum, day) => sum + (dailyExpense.get(day) || 0), 0) / 30
  const forecast = [7,14,30].map((horizon) => ({ days: horizon, balance: currentBalance + dailyAverage * horizon, expectedIncome: averageIncome * horizon, expectedExpense: averageExpense * horizon }))
  const historyDays = days.filter((day) => dailyNet.has(day)).length
  const sufficientHistory = historyDays >= 7
  const warning = sufficientHistory ? forecast.map((f) => ({ ...f, shortfall: req.user.minimumBalance - f.balance })).filter((f) => f.shortfall > 0).sort((a,b) => a.days - b.days)[0] : null
  if (warning) warning.days = currentBalance < req.user.minimumBalance ? 0 : Math.max(1, Math.ceil((currentBalance - req.user.minimumBalance) / -dailyAverage))
  const alert = warning ? { reason: `Saldo diproyeksikan berada di bawah batas aman Rp ${req.user.minimumBalance.toLocaleString('id-ID')}.`, date: new Date(Date.now() + warning.days * 86400000).toISOString().slice(0, 10), urgency: warning.shortfall > req.user.minimumBalance * 0.5 ? 'Tinggi' : 'Perlu diperhatikan', projectedBalance: warning.balance } : null
  const recent = recentRows.map((r) => ({ ...r, amount: Number(r.amount) }))
  const chart = days.map((day) => ({ date: day, net: dailyNet.get(day) || 0, income: dailyIncome.get(day) || 0, expense: dailyExpense.get(day) || 0 }))
  res.json({ currentBalance, ...totals, forecast, sufficientHistory, historyDays, alert, activeWarnings: alert ? 1 : 0, chart, recent, period: { from, to: today } })
}))

app.get('/api/forecast', asyncRoute(async (req, res) => {
  const horizon = [7,14,30].includes(Number(req.query.days)) ? Number(req.query.days) : 7
  const today = new Date().toISOString().slice(0, 10)
  const [rows] = await pool.execute('SELECT type,amount,transaction_date AS date FROM transactions WHERE user_id=? AND transaction_date<=? ORDER BY transaction_date,id', [req.user.id, today])
  const byDay = new Map()
  for (const row of rows) {
    if (!byDay.has(row.date)) byDay.set(row.date, { income: 0, expense: 0 })
    byDay.get(row.date)[row.type] += Number(row.amount)
  }
  const days = Array.from({ length: 30 }, (_, index) => { const date = new Date(); date.setDate(date.getDate() - 29 + index); return date.toISOString().slice(0, 10) })
  const averageIncome = days.reduce((sum, day) => sum + (byDay.get(day)?.income || 0), 0) / 30
  const averageExpense = days.reduce((sum, day) => sum + (byDay.get(day)?.expense || 0), 0) / 30
  const currentBalance = req.user.openingBalance + rows.reduce((sum, row) => sum + (row.type === 'income' ? 1 : -1) * Number(row.amount), 0)
  const movementByDay = new Map()
  for (const row of rows) movementByDay.set(row.date, (movementByDay.get(row.date) || 0) + (row.type === 'income' ? 1 : -1) * Number(row.amount))
  let runningBalance = req.user.openingBalance
  const actualByDay = new Map()
  for (const day of [...new Set([...movementByDay.keys(), ...days])].sort()) {
    runningBalance += movementByDay.get(day) || 0
    actualByDay.set(day, runningBalance)
  }
  const projection = Array.from({ length: horizon }, (_, index) => ({
    date: new Date(Date.now() + (index + 1) * 86400000).toISOString().slice(0, 10),
    balance: currentBalance + (averageIncome - averageExpense) * (index + 1),
  }))
  const actual = days.slice(-7).map((date) => ({ date, balance: actualByDay.get(date) ?? req.user.openingBalance }))
  res.json({
    days: horizon,
    currentBalance,
    minimumBalance: req.user.minimumBalance,
    expectedIncome: averageIncome * horizon,
    expectedExpense: averageExpense * horizon,
    projectedBalance: currentBalance + (averageIncome - averageExpense) * horizon,
    sufficientHistory: days.filter((day) => byDay.has(day)).length >= 7,
    historyDays: days.filter((day) => byDay.has(day)).length,
    actual,
    projection,
  })
}))

app.get('/api/alerts', asyncRoute(async (req, res) => {
  const today = new Date().toISOString().slice(0, 10)
  const [allRows] = await pool.execute('SELECT type,amount,transaction_date AS date FROM transactions WHERE user_id=? AND transaction_date<=?', [req.user.id, today])
  const currentBalance = req.user.openingBalance + allRows.reduce((sum, row) => sum + (row.type === 'income' ? 1 : -1) * Number(row.amount), 0)
  const start = new Date(); start.setDate(start.getDate() - 29)
  const days = Array.from({ length: 30 }, (_, index) => { const date = new Date(); date.setDate(date.getDate() - 29 + index); return date.toISOString().slice(0, 10) })
  const daily = new Map()
  for (const row of allRows) if (days.includes(row.date)) daily.set(row.date, (daily.get(row.date) || 0) + (row.type === 'income' ? 1 : -1) * Number(row.amount))
  const average = days.reduce((sum, day) => sum + (daily.get(day) || 0), 0) / 30
  const candidates = [7,14,30].map((horizon) => ({ days: horizon, balance: currentBalance + average * horizon, shortfall: req.user.minimumBalance - (currentBalance + average * horizon) }))
  const historyDays = days.filter((day) => daily.has(day)).length
  const risk = historyDays >= 7 ? candidates.filter((item) => item.shortfall > 0).sort((a,b) => a.days - b.days)[0] : null
  const alerts = risk ? [{
    id: `cash-${req.user.id}-${risk.days}`,
    title: 'Potensi Kekurangan Kas',
    severity: risk.shortfall > req.user.minimumBalance * 0.5 ? 'Tinggi' : 'Sedang',
    detectedAt: today,
    expectedDate: new Date(Date.now() + (currentBalance < req.user.minimumBalance ? 0 : Math.max(1, Math.ceil((currentBalance - req.user.minimumBalance) / -average))) * 86400000).toISOString().slice(0, 10),
    projectedBalance: risk.balance,
    threshold: req.user.minimumBalance,
    reason: `Jika rata-rata arus kas 30 hari terakhir berlanjut, saldo diperkirakan melewati batas minimum sekitar ${risk.days === 0 ? 'hari ini' : `dalam ${risk.days} hari`}. Ini perkiraan sederhana, bukan tanggal pasti.`,
    suggestions: ['Tinjau pengeluaran yang dapat ditunda.', 'Tindak lanjuti piutang yang belum diterima.', 'Evaluasi rencana pembelian stok.'],
    status: 'Aktif',
  }] : []
  res.json({ alerts, sufficientHistory: historyDays >= 7, historyDays })
}))

app.get('/api/reports', asyncRoute(async (req, res) => {
  const from = /^\d{4}-\d{2}-\d{2}$/.test(req.query.from || '') ? req.query.from : `${new Date().toISOString().slice(0,7)}-01`
  const to = /^\d{4}-\d{2}-\d{2}$/.test(req.query.to || '') ? req.query.to : new Date().toISOString().slice(0,10)
  const summary = await financialSummary(req.user.id, from, to)
  const [[balance]] = await pool.execute(`SELECT COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE -amount END),0) AS movement FROM transactions WHERE user_id=? AND transaction_date <= ?`, [req.user.id, to])
  const periodDays = Math.max(1, Math.round((new Date(`${to}T00:00:00Z`) - new Date(`${from}T00:00:00Z`)) / 86400000) + 1)
  const comparisonEnd = new Date(`${from}T00:00:00Z`)
  comparisonEnd.setUTCDate(comparisonEnd.getUTCDate() - 1)
  const comparisonStart = new Date(comparisonEnd)
  comparisonStart.setUTCDate(comparisonStart.getUTCDate() - 29)
  const comparisonFrom = comparisonStart.toISOString().slice(0, 10)
  const comparisonTo = comparisonEnd.toISOString().slice(0, 10)
  const baseline = await financialSummary(req.user.id, comparisonFrom, comparisonTo)
  const forecastProfit = baseline.profit / 30 * periodDays
  const [rows] = await pool.execute('SELECT id,type,amount,category,description,transaction_date AS date FROM transactions WHERE user_id=? AND transaction_date BETWEEN ? AND ? ORDER BY transaction_date DESC,id DESC', [req.user.id, from, to])
  const [categoryRows] = await pool.execute(`SELECT category, SUM(amount) AS total FROM transactions WHERE user_id=? AND type='expense' AND transaction_date BETWEEN ? AND ? GROUP BY category ORDER BY total DESC`, [req.user.id, from, to])
  const [dailyRows] = await pool.execute(`SELECT transaction_date AS date, type, SUM(amount) AS total FROM transactions WHERE user_id=? AND transaction_date BETWEEN ? AND ? GROUP BY transaction_date,type ORDER BY transaction_date`, [req.user.id, from, to])
  res.json({ from, to, summary: { ...summary, endingBalance: req.user.openingBalance + Number(balance.movement) }, comparison: { forecastProfit, actualProfit: summary.profit, variance: summary.profit - forecastProfit }, expenseBreakdown: categoryRows.map((r) => ({ category: r.category, total: Number(r.total) })), daily: dailyRows.map((r) => ({ date: r.date, type: r.type, total: Number(r.total) })), transactions: rows.map((r) => ({ ...r, amount: Number(r.amount) })) })
}))

app.use((error, _req, res, _next) => {
  if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Email tersebut sudah terdaftar.' })
  console.error(error)
  res.status(500).json({ message: 'Terjadi gangguan pada server. Silakan coba lagi.' })
})

await initializeDatabase()
await seedDemoAccount()
app.listen(port, '0.0.0.0', () => console.log(`LKUMKM API listening on port ${port}`))
