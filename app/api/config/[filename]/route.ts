import { promises as fs } from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

const CONFIG_DIR = path.join(process.cwd(), 'configs');
const VERCEL_URL = process.env.VERCEL_URL || 'shopify-ai-chatbot-v2.vercel.app';

// Helper to ensure directory exists
async function ensureDir(dirPath: string) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    // Ignore if the directory already exists
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      console.error(`Failed to create directory ${dirPath}:`, error);
      throw error; // Rethrow if it's not a "directory exists" error
    }
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  const { filename } = params;

  if (process.env.NODE_ENV === 'production') {
    try {
      const response = await fetch(`https://${VERCEL_URL}/api/config/${filename}.json`);
      if (!response.ok) {
        throw new Error(`Failed to fetch config: ${response.statusText}`);
      }
      const config = await response.json();
      return NextResponse.json(config);
    } catch (error) {
      console.error(`Error fetching config file ${filename} from URL:`, error);
      return NextResponse.json({ error: 'Failed to fetch config file' }, { status: 500 });
    }
  } else {
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
}

export async function POST(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  const { filename } = params;

  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Saving configurations is disabled in production.' }, { status: 403 });
  } else {
    const configPath = path.join(CONFIG_DIR, `${filename}.json`);
    try {
      await ensureDir(CONFIG_DIR);
      const configData = await request.json();
      await fs.writeFile(configPath, JSON.stringify(configData, null, 2), 'utf-8');
      return NextResponse.json({ message: `Config ${filename} saved successfully` });
    } catch (error) {
      console.error(`Error writing config file ${filename}:`, error);
      return NextResponse.json({ error: 'Failed to save config file' }, { status: 500 });
    }
  }
}
