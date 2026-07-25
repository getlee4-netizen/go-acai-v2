import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId');

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
  }

  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from('banner_configs')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found, return defaults
      return NextResponse.json({
        is_active: false,
        title: '',
        subtitle: '',
        background_color: '#d946ef',
        text_color: '#ffffff',
        image_url: null,
        link_url: null,
        step_messages: {},
        item_icons: {},
        item_prices: {},
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = createServerSupabase();
  const body = await request.json();

  const { data, error } = await supabase
    .from('banner_configs')
    .upsert({
      ...body,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}