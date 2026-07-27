import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');

    if (!tenantId) {
      return NextResponse.json({ error: 'tenant_id required' }, { status: 400 });
    }

    const supabase = createServerSupabase();

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ orders: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenant_id, customer_id, customer_name, customer_phone, items, subtotal, delivery_fee, total, address, payment_method, payment_status, status, notes } = body;

    if (!tenant_id || !items || !subtotal || !total) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    const supabase = createServerSupabase();

    const { data, error } = await supabase
      .from('orders')
      .insert({
        tenant_id,
        customer_id: customer_id || null,
        customer_name: customer_name || 'Cliente',
        customer_phone: customer_phone || '',
        items,
        subtotal,
        delivery_fee: delivery_fee || 0,
        total,
        address: address || {},
        payment_method: payment_method || 'pix',
        payment_status: payment_status || 'pending',
        status: status || 'pending',
        notes: notes || '',
      })
      .select()
      .single();

    if (error) {
      console.error('Order insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, order: data });
  } catch (error: any) {
    console.error('Order API error:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
