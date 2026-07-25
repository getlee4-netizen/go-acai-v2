import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, customerId, subscription } = body;

    if (!tenantId || !subscription) {
      return NextResponse.json({ error: 'tenantId e subscription são obrigatórios' }, { status: 400 });
    }

    const supabase = createServerSupabase();

    const { data, error } = await supabase
      .from('push_subscriptions')
      .insert({
        tenant_id: tenantId,
        customer_id: customerId || null,
        subscription: subscription,
        user_agent: request.headers.get('user-agent') || '',
      })
      .select()
      .single();

    if (error) {
      console.error('Push subscribe error:', error);
      return NextResponse.json({ error: 'Erro ao salvar subscription' }, { status: 500 });
    }

    return NextResponse.json({ success: true, subscription: data });
  } catch (error) {
    console.error('Push subscribe error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}