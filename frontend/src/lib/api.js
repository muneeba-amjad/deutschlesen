// ─────────────────────────────────────────────────────
// lib/api.js
// ALL backend calls live here. Change BASE_URL once
// and every page picks it up automatically.
// ─────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

// ── Helper: attach auth token to every request ───────
function authHeaders() {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('dl_token')
    : null
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }
}

async function request(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: authHeaders(),
    ...(body ? { body: JSON.stringify(body) } : {})
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

// ── Auth ─────────────────────────────────────────────
export const api = {
  auth: {
    register: (body) => request('POST', '/api/auth/register', body),
    login:    (body) => request('POST', '/api/auth/login',    body),
  },

  // ── Stories ────────────────────────────────────────
  stories: {
    getAll:   (params = '') => request('GET', `/api/stories${params}`),
    getOne:   (id)          => request('GET', `/api/stories/${id}`),
    getToday: ()            => request('GET', '/api/stories/today'),
  },

  // ── Words ──────────────────────────────────────────
  words: {
    translate: (word)        => request('GET',  `/api/words/translate/${encodeURIComponent(word)}`),
    save:      (vocabularyId) => request('POST', '/api/words/save', { vocabularyId }),
    getSaved:  ()            => request('GET',  '/api/words/saved'),
  },

  // ── User ───────────────────────────────────────────
  user: {
    profile: () => request('GET', '/api/user/profile'),
  }
}
