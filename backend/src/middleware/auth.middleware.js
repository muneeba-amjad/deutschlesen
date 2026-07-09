import jwt from 'jsonwebtoken'

// This middleware runs BEFORE protected route handlers
// It checks the Authorization header for a valid JWT token

export function authenticate(req, res, next) {
  // 1. Get the token from the header
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ error: 'No token provided. Please log in.' })
  }

  // 2. Verify the token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded   // attach user info to request
    next()               // move to the actual route handler
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token. Please log in again.' })
  }
}
