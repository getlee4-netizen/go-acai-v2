import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, storeName, plan } = body;

    if (!email || !password || !storeName) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    const slug = generateSlug(storeName);

    // Check if slug already exists
    const { data: existing } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Já existe uma loja com esse nome. Tente outro.' }, { status: 400 });
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user.id;

    // Create tenant
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert({
        slug,
        name: storeName,
        primary_color: '#d946ef',
        delivery_fee: 5.00,
        minimum_order: 15.00,
        installments: 3,
        price_per_km: 2.00,
        working_hours: {
          segunda: { open: '10:00', close: '22:00', closed: false },
          terca: { open: '10:00', close: '22:00', closed: false },
          quarta: { open: '10:00', close: '22:00', closed: false },
          quinta: { open: '10:00', close: '22:00', closed: false },
          sexta: { open: '10:00', close: '23:00', closed: false },
          sabado: { open: '10:00', close: '23:00', closed: false },
          domingo: { open: '10:00', close: '22:00', closed: false },
        },
      })
      .select()
      .single();

    if (tenantError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: tenantError.message }, { status: 400 });
    }

    // Link user to tenant
    const { error: linkError } = await supabaseAdmin
      .from('tenant_users')
      .insert({ user_id: userId, tenant_id: tenant.id, role: 'admin' });

    if (linkError) {
      await supabaseAdmin.from('tenants').delete().eq('id', tenant.id);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: linkError.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      user: { id: authData.user.id, email: authData.user.email },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
