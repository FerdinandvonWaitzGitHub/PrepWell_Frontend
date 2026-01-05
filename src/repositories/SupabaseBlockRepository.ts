/**
 * Supabase Block Repository
 * Data access layer for BlockAllocations using Supabase
 */

import { supabase } from '../services/supabase';
import type {
  BlockAllocation,
  CreateBlockAllocationDTO,
  UpdateBlockAllocationDTO,
} from '../types/calendar';
import type { BlockRepository } from './types';

const TABLE_NAME = 'calendar_blocks';

/**
 * Maps database row to BlockAllocation type
 */
function mapRowToBlock(row: Record<string, unknown>): BlockAllocation {
  return {
    id: row.id as string,
    date: row.date as string,
    kind: row.kind as BlockAllocation['kind'],
    size: row.size as BlockAllocation['size'],
    content_id: row.content_id as string | undefined,
    subject_id: row.subject_id as string | undefined,
    topic_id: row.topic_id as string | undefined,
    source: row.source as BlockAllocation['source'],
    user_id: row.user_id as string,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

/**
 * Maps CreateBlockAllocationDTO to database insert format
 */
function mapDtoToInsert(
  dto: CreateBlockAllocationDTO,
  userId: string
): Record<string, unknown> {
  return {
    date: dto.date,
    kind: dto.kind,
    size: dto.size,
    content_id: dto.content_id,
    subject_id: dto.subject_id,
    topic_id: dto.topic_id,
    source: dto.source || 'manual',
    user_id: userId,
  };
}

/**
 * Supabase implementation of BlockRepository
 */
export class SupabaseBlockRepository implements BlockRepository {
  async getAll(userId: string): Promise<BlockAllocation[]> {
    if (!supabase) {
      console.warn('Supabase not configured, returning empty array');
      return [];
    }

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching blocks:', error);
      throw new Error(error.message);
    }

    return (data || []).map(mapRowToBlock);
  }

  async getById(id: string): Promise<BlockAllocation | null> {
    if (!supabase) {
      return null;
    }

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Error fetching block:', error);
      throw new Error(error.message);
    }

    return data ? mapRowToBlock(data) : null;
  }

  async getByDate(userId: string, date: string): Promise<BlockAllocation[]> {
    if (!supabase) {
      return [];
    }

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('user_id', userId)
      .eq('date', date);

    if (error) {
      console.error('Error fetching blocks by date:', error);
      throw new Error(error.message);
    }

    return (data || []).map(mapRowToBlock);
  }

  async getByDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<BlockAllocation[]> {
    if (!supabase) {
      return [];
    }

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching blocks by date range:', error);
      throw new Error(error.message);
    }

    return (data || []).map(mapRowToBlock);
  }

  async create(
    dto: CreateBlockAllocationDTO,
    userId: string
  ): Promise<BlockAllocation> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const insertData = mapDtoToInsert(dto, userId);

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating block:', error);
      throw new Error(error.message);
    }

    return mapRowToBlock(data);
  }

  async update(id: string, dto: UpdateBlockAllocationDTO): Promise<BlockAllocation> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (dto.kind !== undefined) updateData.kind = dto.kind;
    if (dto.size !== undefined) updateData.size = dto.size;
    if (dto.content_id !== undefined) updateData.content_id = dto.content_id;
    if (dto.subject_id !== undefined) updateData.subject_id = dto.subject_id;
    if (dto.topic_id !== undefined) updateData.topic_id = dto.topic_id;

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating block:', error);
      throw new Error(error.message);
    }

    return mapRowToBlock(data);
  }

  async delete(id: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id);

    if (error) {
      console.error('Error deleting block:', error);
      throw new Error(error.message);
    }
  }
}

// Singleton instance
let blockRepositoryInstance: SupabaseBlockRepository | null = null;

export function getBlockRepository(): BlockRepository {
  if (!blockRepositoryInstance) {
    blockRepositoryInstance = new SupabaseBlockRepository();
  }
  return blockRepositoryInstance;
}
