import { Metadata } from 'next';
import { getTenantBySlug } from '@/lib/queries';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function GET(request: Request, { params }: Props) {
  const resolvedParams = await params;
  const tenant = await getTenantBySlug(resolvedParams.slug);

  if (!tenant) {
    return new Response('Not found', { status: 404 });
  }

  const manifest = {
    name: tenant.name,
    short_name: tenant.name.slice(0, 12),
    description: `Peça seu açaí e sorvetes na ${tenant.name}`,
    start_url: `/app/${tenant.slug}`,
    display: 'standalone',
    background_color: tenant.primary_color,
    theme_color: tenant.primary_color,
    orientation: 'portrait-primary',
    icons: [
      {
        src: `/app/${tenant.slug}/icon?size=192`,
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any maskable',
      },
      {
        src: `/app/${tenant.slug}/icon?size=512`,
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any maskable',
      },
    ],
    categories: ['food', 'shopping', 'lifestyle'],
    screenshots: [],
    shortcuts: [
      {
        name: 'Fazer Pedido',
        short_name: 'Pedido',
        url: `/app/${tenant.slug}`,
        description: 'Fazer um novo pedido',
      },
    ],
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}