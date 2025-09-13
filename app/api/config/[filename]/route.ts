import { promises as fs } from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

const WRITABLE_CONFIG_DIR = path.join('/tmp', 'configs');
const READONLY_CONFIG_DIR = path.join(process.cwd(), 'configs');

// Ensure the writable config directory exists
async function ensureWritableConfigDir() {
  try {
    await fs.mkdir(WRITABLE_CONFIG_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create writable config directory:', error);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  await ensureWritableConfigDir();
  const { filename } = params;
  const writableConfigPath = path.join(WRITABLE_CONFIG_DIR, `${filename}.json`);
  const readonlyConfigPath = path.join(READONLY_CONFIG_DIR, `${filename}.json`);

  try {
    // Try reading from the writable directory first
    const configContent = await fs.readFile(writableConfigPath, 'utf-8');
    return NextResponse.json(JSON.parse(configContent));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // If not found, fall back to the readonly directory
      try {
        const configContent = await fs.readFile(readonlyConfigPath, 'utf-8');
        return NextResponse.json(JSON.parse(configContent));
      } catch (fallbackError) {
        if ((fallbackError as NodeJS.ErrnoException).code === 'ENOENT') {
          return NextResponse.json({ error: 'Config file not found' }, { status: 404 });
        }
        console.error(`Error reading config file ${filename} from readonly dir:`, fallbackError);
        return NextResponse.json({ error: 'Failed to read config file' }, { status: 500 });
      }
    }
    console.error(`Error reading config file ${filename} from writable dir:`, error);
    return NextResponse.json({ error: 'Failed to read config file' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  await ensureWritableConfigDir();
  const { filename } = params;
  const configPath = path.join(WRITABLE_CONFIG_DIR, `${filename}.json`);

  try {
    const configData = await request.json();
    await fs.writeFile(configPath, JSON.stringify(configData, null, 2), 'utf-8');
    return NextResponse.json({ message: `Config ${filename} saved successfully` });
  } catch (error) {
    console.error(`Error writing config file ${filename}:`, error);
    return NextResponse.json({ error: 'Failed to save config file' }, { status: 500 });
  }
}
