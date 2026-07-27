import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface WelcomeEmailData {
  to: string;
  storeName: string;
  slug: string;
  email: string;
  password: string;
}

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
  const { to, storeName, slug, email, password } = data;

  const appUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://go-acai-v2.vercel.app'}/app/${slug}`;
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://go-acai-v2.vercel.app'}/login`;

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo ao GO AÇAÍ</title>
</head>
<body style="margin:0;padding:0;background-color:#f8f7ff;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f7ff;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#9333ea,#d946ef);padding:40px 30px;border-radius:24px 24px 0 0;text-align:center;">
              <div style="width:60px;height:60px;background:rgba(255,255,255,0.2);border-radius:16px;display:inline-block;line-height:60px;font-size:28px;color:#fff;font-weight:bold;">G</div>
              <h1 style="color:#fff;font-size:28px;margin:20px 0 5px;font-weight:800;">GO AÇAÍ</h1>
              <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:0;">Sistema de Delivery Completo</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:40px 30px;">
              <h2 style="color:#1a1a2e;font-size:22px;margin:0 0 8px;">Olá! Seja bem-vindo 👋</h2>
              <p style="color:#64748b;font-size:15px;line-height:1.6;margin:0 0 24px;">
                Sua loja <strong style="color:#9333ea;">${storeName}</strong> foi criada com sucesso! Abaixo estão seus dados de acesso:
              </p>

              <!-- Credentials Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f7ff;border:1px solid #e9e5ff;border-radius:16px;padding:24px;margin-bottom:24px;">
                <tr>
                  <td>
                    <p style="color:#9333ea;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">Dados de Acesso</p>
                    
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:8px 0;">
                          <span style="color:#64748b;font-size:13px;">Email</span><br>
                          <span style="color:#1a1a2e;font-size:15px;font-weight:600;">${email}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;">
                          <span style="color:#64748b;font-size:13px;">Senha</span><br>
                          <span style="color:#1a1a2e;font-size:15px;font-weight:600;font-family:monospace;background:#eee;padding:4px 10px;border-radius:6px;">${password}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;">
                          <span style="color:#64748b;font-size:13px;">Sua Loja</span><br>
                          <span style="color:#1a1a2e;font-size:15px;font-weight:600;">${storeName}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Buttons -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center" style="padding:0 0 12px;">
                    <a href="${dashboardUrl}" style="display:inline-block;background:linear-gradient(135deg,#9333ea,#d946ef);color:#fff;text-decoration:none;padding:14px 32px;border-radius:14px;font-size:15px;font-weight:700;width:80%;text-align:center;">
                      🖥️ Acessar Painel Admin
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <a href="${appUrl}" style="display:inline-block;background:transparent;color:#9333ea;text-decoration:none;padding:14px 32px;border-radius:14px;font-size:15px;font-weight:700;border:2px solid #e9e5ff;width:80%;text-align:center;">
                      📱 Ver Loja do Cliente
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Links -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border-radius:12px;padding:16px;">
                <tr>
                  <td>
                    <p style="color:#94a3b8;font-size:12px;margin:0 0 6px;">LINKS RÁPIDOS</p>
                    <p style="color:#64748b;font-size:13px;margin:0 0 4px;">
                      🔗 Painel Admin: <a href="${dashboardUrl}" style="color:#9333ea;">${dashboardUrl}</a>
                    </p>
                    <p style="color:#64748b;font-size:13px;margin:0;">
                      🔗 Loja do Cliente: <a href="${appUrl}" style="color:#9333ea;">${appUrl}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#1a1a2e;padding:24px 30px;border-radius:0 0 24px 24px;text-align:center;">
              <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:0;">
                GO AÇAÍ © ${new Date().getFullYear()} — Sistema de Delivery para Açaí e Sorveterias
              </p>
              <p style="color:rgba(255,255,255,0.35);font-size:11px;margin:8px 0 0;">
                Guarde seus dados de acesso. Em caso de dúvida, entre em contato.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    await transporter.sendMail({
      from: `"GO AÇAÍ" <${process.env.SMTP_USER}>`,
      to,
      subject: `Bem-vindo ao GO AÇAÍ — Seus dados de acesso`,
      html,
    });
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
}
