import { NextRequest } from 'next/server';
import { getTenantBySlug } from '@/lib/queries';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, { params }: Props) {
  const resolvedParams = await params;
  const { searchParams } = new URL(request.url);
  const size = parseInt(searchParams.get('size') || '192', 10);
  const tenant = await getTenantBySlug(resolvedParams.slug);

  if (!tenant) {
    return new Response('Not found', { status: 404 });
  }

  const letter = tenant.name.charAt(0).toUpperCase();
  const color = tenant.primary_color || '#d946ef';

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color}CC;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad)"/>
      <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" 
            font-family="system-ui, sans-serif" font-size="${size * 0.45}" 
            font-weight="bold" fill="white">${letter}</text>
    </svg>
  `;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}