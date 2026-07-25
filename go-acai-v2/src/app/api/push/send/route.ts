import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import webPush from 'web-push';

webPush.setVapidDetails(
  'mailto:admin@goacai.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, title, body: message, icon, badge, vibrate, data, targetPhones } = body;

    if (!tenantId || !title || !message) {
      return NextResponse.json({ error: 'Campos obrigatórios: tenantId, title, body' }, { status: 400 });
    }

    const supabase = createServerSupabase();

    let query = supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('tenant_id', tenantId);

    if (targetPhones && Array.isArray(targetPhones) && targetPhones.length > 0) {
      query = query.in('phone', targetPhones);
    }

    const { data: subscriptions, error } = await query;

    if (error) {
      console.error('Query subscriptions error:', error);
      return NextResponse.json({ error: 'Erro ao buscar subscriptions' }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ sent: 0, message: 'Nenhuma subscription encontrada' });
    }

    const payload = JSON.stringify({
      title,
      body: message,
      icon: icon || '/icons/icon-192.svg',
      badge: badge || '/icons/icon-192.svg',
      vibrate: vibrate || [200, 100, 200],
      data: data || {},
      tag: `go-acai-${Date.now()}`,
      requireInteraction: true,
    });

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      try {
        await webPush.sendNotification(sub.subscription, payload);
        sent++;
      } catch (err: any) {
        console.error('Push send failed:', err);
        failed++;
        // Remove invalid subscriptions (410 Gone)
        if (err.statusCode === 410) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('subscription.endpoint', sub.subscription.endpoint);
        }
      }
    }

    return NextResponse.json({ sent, failed });
  } catch (error) {
    console.error('Push send error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}