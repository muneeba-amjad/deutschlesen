import bcrypt from 'bcryptjs'
import jwt    from 'jsonwebtoken'
import prisma from '../config/db.js'

// ── Register ──────────────────────────────────
export async function register(req, res) {
  try {
    const { name, email, password } = req.body

    // 1. Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(409).json({ error: 'Email already registered.' })
    }

    // 2. Hash the password (never store plain text!)
    const hashed = await bcrypt.hash(password, 12)

    // 3. Create the user in the database
    const user = await prisma.user.create({
      data: { name, email, password: hashed }
    })

    // 4. Create a streak record for the user
    await prisma.streak.create({ data: { userId: user.id } })

    // 5. Generate a JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    )

    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: { id: user.id, name: user.name, email: user.email }
    })

  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
}

// ── Login ─────────────────────────────────────
export async function login(req, res) {
  try {
    const { email, password } = req.body

    // 1. Find user by email
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    // 2. Compare password with hashed version
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    // 3. Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    )

    res.json({
      message: 'Logged in successfully!',
      token,
      user: { id: user.id, name: user.name, email: user.email }
    })

  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
}
