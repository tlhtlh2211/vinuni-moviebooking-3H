import { NextResponse } from 'next/server';
import { readdirSync, statSync } from 'fs';
import path from 'path';

// Helper function to list directories and files recursively
function listDirectoryContents(dir: string, basePath: string = '') {
  try {
    const result: {
      path: string;
      type: 'file' | 'directory';
      children?: any[];
    }[] = [];
    
    const items = readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const relativePath = path.join(basePath, item);
      const stats = statSync(fullPath);
      
      if (stats.isDirectory()) {
        result.push({
          path: relativePath,
          type: 'directory',
          children: listDirectoryContents(fullPath, relativePath)
        });
      } else {
        result.push({
          path: relativePath,
          type: 'file'
        });
      }
    }
    
    return result;
  } catch (error) {
    console.error(`Error listing directory ${dir}:`, error);
    return [{ error: String(error), path: dir }];
  }
}

export async function GET() {
  const routeDir = path.join(process.cwd(), 'app/api');
  let directoryContents;
  
  try {
    directoryContents = listDirectoryContents(routeDir, '/api');
  } catch (error) {
    directoryContents = { error: String(error) };
  }
  
  const diagnosticData = {
    nodejs: {
      version: process.version,
      env: process.env.NODE_ENV
    },
    nextjs: {
      routes: directoryContents
    },
    timestamp: new Date().toISOString()
  };
  
  console.log('[API DIAGNOSTIC] Route structure:', JSON.stringify(diagnosticData, null, 2));
  
  return NextResponse.json({
    status: 'success',
    data: diagnosticData
  });
} 