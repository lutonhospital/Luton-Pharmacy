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
