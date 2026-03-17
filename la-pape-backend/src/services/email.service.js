// src/services/email.service.js
import {
  TransactionalEmailsApi,
  TransactionalEmailsApiApiKeys,
} from "@getbrevo/brevo";

const apiKey = (process.env.BREVO_API_KEY || "").trim();
const fromEmail = (process.env.MAIL_FROM_EMAIL || "").trim();
const fromName = (process.env.MAIL_FROM_NAME || "La Pape").trim();

const hasAPI = Boolean(apiKey && fromEmail);

let brevoApi = null;

if (hasAPI) {
  brevoApi = new TransactionalEmailsApi();
  brevoApi.setApiKey(TransactionalEmailsApiApiKeys.apiKey, apiKey);
  console.log("📧 Brevo API habilitada (sin SMTP).");
} else {
  console.log(
    "📭 Brevo API NO configurada. MODO DEV: los códigos se imprimirán en consola."
  );
}

export async function sendMail({ to, subject, html, devLog }) {
  const toEmail = (to || "").trim();

  if (!toEmail) {
    throw new Error("sendMail: Falta el correo destino (to).");
  }

  if (!hasAPI) {
    console.log("\n----- DEV MAIL (SIN BREVO API) -----");
    console.log("FROM:", `${fromName} <${fromEmail || "no-from-email"}>`);
    console.log("TO:", toEmail);
    console.log("SUBJECT:", subject);
    if (devLog) console.log("DEV LOG:", devLog);
    console.log("HTML:\n", html);
    console.log("------------------------------------\n");
    return { messageId: "dev-mail" };
  }

  try {
    const sendSmtpEmail = {
      sender: { email: fromEmail, name: fromName },
      to: [{ email: toEmail }],
      subject,
      htmlContent: html,
    };

    const data = await brevoApi.sendTransacEmail(sendSmtpEmail);

    console.log("\n✅ Email enviado con Brevo API");
    console.log("FROM:", `${fromName} <${fromEmail}>`);
    console.log("TO:", toEmail);
    console.log("SUBJECT:", subject);
    console.log("BREVO RESPONSE:", data?.messageId || JSON.stringify(data));
    console.log("------------------------------------\n");

    return data;
  } catch (error) {
    // ✅ Logs completos para ver la causa REAL del 401
    console.error("\n❌ Error enviando email con Brevo API");
    console.error("STATUS:", error?.response?.status);
    console.error("DATA:", error?.response?.data);
    console.error("TEXT:", error?.response?.text);
    console.error("HEADERS:", error?.response?.headers);
    console.error("MESSAGE:", error?.message);
    console.error("------------------------------------\n");
    throw error;
  }
}

export const templates = {
  otp: (code, title = "Tu código de seguridad") => `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
      <h2>${title}</h2>
      <p>Tu código es:</p>
      <p style="font-size:24px;font-weight:bold;letter-spacing:4px">${code}</p>
      <p>Este código expira en 10 minutos.</p>
      <p>Si tú no solicitaste este código, ignora este correo.</p>
    </div>
  `,
  accountVerified: (nombre) => `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
      <h2>¡Hola ${nombre}!</h2>
      <p>Tu cuenta en <strong>La Pape</strong> ha sido verificada correctamente.</p>
      <p>Ya puedes iniciar sesión y continuar usando la plataforma.</p>
    </div>
  `,
};