CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_org (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO users (username, password_hash, created_at, last_login)
VALUES (
    'admin',
    '$2b$12$K8tGZhooHIGU4TEBmvJfNOwry5wc01j3fZj9wCtRX5OqB77GSZ9ta',
    NOW(),
    NOW()
)
ON CONFLICT (username) DO NOTHING;
