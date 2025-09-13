import { promises as fs } from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

const CONFIG_DIR = path.join(process.cwd(), 'configs');

// Ensure the config directory exists
async function ensureConfigDir() {
  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create config directory:', error);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  await ensureConfigDir();
  const { filename } = params;
  const configPath = path.join(CONFIG_DIR, `${filename}.json`);

  try {
    const configContent = await fs.readFile(configPath, 'utf-8');
    return NextResponse.json(JSON.parse(configContent));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json({ error: 'Config file not found' }, { status: 404 });
    }
    console.error(`Error reading config file ${filename}:`, error);
    return NextResponse.json({ error: 'Failed to read config file' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  await ensureConfigDir();
  const { filename } = params;
  const configPath = path.join(CONFIG_DIR, `${filename}.json`);

  try {
    const configData = await request.json();
    await fs.writeFile(configPath, JSON.stringify(configData, null, 2), 'utf-8');
    return NextResponse.json({ message: `Config ${filename} saved successfully` });
  } catch (error) {
    console.error(`Error writing config file ${filename}:`, error);
    return NextResponse.json({ error: 'Failed to save config file' }, { status: 500 });
  }
}
