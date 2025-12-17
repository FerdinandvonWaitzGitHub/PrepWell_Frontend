/**
 * API Utilities
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { ApiResponse } from '../types';

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * CORS Headers for API responses
 */
export function setCorsHeaders(res: VercelResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

/**
 * Handle OPTIONS request for CORS
 */
export function handleCors(req: VercelRequest, res: VercelResponse): boolean {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }

  return false;
}

/**
 * Send success response
 */
export function sendSuccess<T>(res: VercelResponse, data: T, status = 200): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };
  res.status(status).json(response);
}

/**
 * Send error response
 */
export function sendError(res: VercelResponse, error: string, status = 400): void {
  const response: ApiResponse<never> = {
    success: false,
    error,
  };
  res.status(status).json(response);
}

/**
 * Validate required fields
 */
export function validateRequired(obj: Record<string, unknown>, fields: string[]): string | null {
  for (const field of fields) {
    if (obj[field] === undefined || obj[field] === null || obj[field] === '') {
      return `Missing required field: ${field}`;
    }
  }
  return null;
}

/**
 * Parse query parameter as string
 */
export function getQueryString(query: VercelRequest['query'], key: string): string | undefined {
  const value = query[key];
  if (Array.isArray(value)) return value[0];
  return value;
}
