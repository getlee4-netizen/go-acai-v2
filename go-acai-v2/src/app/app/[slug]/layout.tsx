import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTenantBySlug } from '@/lib/queries';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const tenant = await getTenantBySlug(resolvedParams.slug);
  
  if (!tenant) {
    return { title: 'Loja não encontrada' };
  }

  return {
    title: `${tenant.name} - GO AÇAÍ`,
    description: `Peça seu açaí e sorvetes na ${tenant.name}`,
    manifest: `/app/${resolvedParams.slug}/manifest`,
  };
}

export default async function AppLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const tenant = await getTenantBySlug(resolvedParams.slug);

  if (!tenant) {
    notFound();
  }

  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href={`/app/${resolvedParams.slug}/icon?size=192`} sizes="192x192" />
        <link rel="icon" href={`/app/${resolvedParams.slug}/icon?size=512`} sizes="512x512" />
        <link rel="apple-touch-icon" href={`/app/${resolvedParams.slug}/icon?size=192`} />
        <link rel="manifest" href={`/app/${resolvedParams.slug}/manifest`} />
        <meta name="theme-color" content={tenant.primary_color} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={tenant.name} />
      </head>
      <body className="min-h-screen bg-white">
        {children}
      </body>
    </html>
  );
}