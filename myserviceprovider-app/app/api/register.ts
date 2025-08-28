import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Simple local JSON DB for demonstration (replace with real DB in production)
const dbPath = path.join(process.cwd(), 'app', 'api', 'users.json');

export async function POST(request: NextRequest) {
  try {
    const { discord_id, username, wallet_address, telegram_id, twitter_id } = await request.json();
    if (!wallet_address) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }
    // Load existing users
    let users = [];
    try {
      const data = await fs.readFile(dbPath, 'utf-8');
      users = JSON.parse(data);
    } catch (e) {
      users = [];
    }
    // Update or add user by wallet address
    const idx = users.findIndex(u => u.wallet_address === wallet_address);
    const user = {
      discord_id,
      username,
      wallet_address,
      telegram_id,
      twitter_id,
      registered_at: new Date().toISOString(),
    };
    if (idx >= 0) {
      users[idx] = user;
    } else {
      users.push(user);
    }
    await fs.writeFile(dbPath, JSON.stringify(users, null, 2));
    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 500 });
  }
}
