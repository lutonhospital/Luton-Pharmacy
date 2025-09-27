import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY environment variable not set - email functionality will be disabled");
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailParams {
  to: string;
  from?: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('Email not sent - SendGrid API key not configured:', params.subject);
    return false;
  }
  
  try {
    await mailService.send({
      to: params.to,
      from: params.from || 'pharmacy@lutonhospital.nhs.uk',
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export async function sendPrescriptionStatusEmail(
  patientEmail: string,
  patientName: string,
  medicationName: string,
  status: string,
  orderNumber?: string
): Promise<boolean> {
  const statusMessages = {
    approved: 'Your prescription has been approved and is being prepared.',
    ready_for_pickup: 'Your prescription is ready for pickup at Luton Hospital Pharmacy.',
    dispensed: 'Your prescription has been dispensed.',
  };

  const subject = `Prescription Update - ${medicationName}`;
  const message = statusMessages[status as keyof typeof statusMessages] || 'Your prescription status has been updated.';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Luton Hospital Pharmacy</h2>
      <p>Dear ${patientName},</p>
      <p>${message}</p>
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Medication:</strong> ${medicationName}</p>
        ${orderNumber ? `<p><strong>Order Number:</strong> ${orderNumber}</p>` : ''}
        <p><strong>Status:</strong> ${status.replace('_', ' ').toUpperCase()}</p>
      </div>
      <p>If you have any questions, please contact our pharmacy at pharmacy@lutonhospital.nhs.uk or call 01582 491122.</p>
      <p>Best regards,<br>Luton Hospital Pharmacy Team</p>
    </div>
  `;

  return await sendEmail({
    to: patientEmail,
    from: 'pharmacy@lutonhospital.nhs.uk',
    subject,
    html,
  });
}

export async function sendOrderConfirmationEmail(
  patientEmail: string,
  patientName: string,
  orderNumber: string,
  totalAmount: string,
  items: Array<{ medicationName: string; quantity: number; price: string }>
): Promise<boolean> {
  const subject = `Order Confirmation - ${orderNumber}`;

  const itemsHtml = items.map(item => 
    `<tr>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.medicationName}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">£${item.price}</td>
    </tr>`
  ).join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Luton Hospital Pharmacy</h2>
      <p>Dear ${patientName},</p>
      <p>Thank you for your order. Your payment has been processed successfully.</p>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Order Details</h3>
        <p><strong>Order Number:</strong> ${orderNumber}</p>
        <p><strong>Total Amount:</strong> £${totalAmount}</p>
        
        <table style="width: 100%; margin-top: 15px; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #e5e7eb;">
              <th style="padding: 8px; text-align: left;">Medication</th>
              <th style="padding: 8px; text-align: center;">Quantity</th>
              <th style="padding: 8px; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
      </div>
      
      <p>Your prescription is now being prepared and you will receive another notification when it's ready for pickup or delivery.</p>
      <p>If you have any questions, please contact our pharmacy at pharmacy@lutonhospital.nhs.uk or call 01582 491122.</p>
      <p>Best regards,<br>Luton Hospital Pharmacy Team</p>
    </div>
  `;

  return await sendEmail({
    to: patientEmail,
    from: 'pharmacy@lutonhospital.nhs.uk',
    subject,
    html,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetUrl: string
): Promise<boolean> {
  const subject = "Password Reset - Luton Hospital Pharmacy";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #059669;">Luton Hospital Pharmacy</h2>
      <p>Dear ${name},</p>
      <p>We received a request to reset your password for your Luton Hospital Pharmacy account.</p>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <p style="margin-bottom: 20px;">Click the button below to reset your password:</p>
        <a href="${resetUrl}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
          Reset Password
        </a>
      </div>
      
      <p><strong>Important:</strong> This link will expire in 1 hour for security reasons.</p>
      <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
      <p>For security reasons, if you're having trouble with the button above, you can copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #6b7280;">${resetUrl}</p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
      <p style="font-size: 14px; color: #6b7280;">
        If you have any questions, please contact our pharmacy at pharmacy@lutonhospital.nhs.uk or call 01582 491122.
      </p>
      <p style="font-size: 14px; color: #6b7280;">
        Best regards,<br>Luton Hospital Pharmacy Team
      </p>
    </div>
  `;

  return await sendEmail({
    to: email,
    from: 'pharmacy@lutonhospital.nhs.uk',
    subject,
    html,
  });
}

export async function sendAdminPasswordResetEmail(
  email: string,
  name: string,
  resetUrl: string
): Promise<boolean> {
  const subject = "Admin Password Reset - Luton Hospital Pharmacy";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #059669;">🔐 Luton Hospital Pharmacy - Admin Portal</h2>
      <p>Dear ${name},</p>
      <p>We received a request to reset your admin password for the Luton Hospital Pharmacy management system.</p>
      
      <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #92400e; font-weight: bold;">⚠️ Admin Access Reset Request</p>
        <p style="margin: 10px 0 0 0; color: #92400e;">This is a security-sensitive operation for administrative access.</p>
      </div>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <p style="margin-bottom: 20px;">Click the button below to reset your admin password:</p>
        <a href="${resetUrl}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
          Reset Admin Password
        </a>
      </div>
      
      <p><strong>Important:</strong> This link will expire in 1 hour for security reasons.</p>
      <p><strong>Security Notice:</strong> If you didn't request this admin password reset, please contact the IT administrator immediately.</p>
      <p>For security reasons, if you're having trouble with the button above, you can copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #6b7280;">${resetUrl}</p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
      <p style="font-size: 14px; color: #6b7280;">
        For administrative support, contact IT at admin@lutonhospital.nhs.uk
      </p>
      <p style="font-size: 14px; color: #6b7280;">
        Best regards,<br>Luton Hospital IT Security Team
      </p>
    </div>
  `;

  return await sendEmail({
    to: email,
    from: 'admin@lutonhospital.nhs.uk',
    subject,
    html,
  });
}