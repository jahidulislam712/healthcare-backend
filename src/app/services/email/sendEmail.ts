/* eslint-disable @typescript-eslint/no-explicit-any */
import nodemailer from "nodemailer";
import { envVars } from "../../config/env";
import path from "node:path";
import ejs from "ejs"

const transporter = nodemailer.createTransport({
  host: envVars.SMTP_HOST,
  port: envVars.SMTP_PORT,
  secure: false,
  auth: {
    user: envVars.SMTP_USER,
    pass: envVars.SMTP_PASS,
  },
});

export interface sendEmailOptions{
  to: string;
  subject: string;
  templateName: string;
  templateData: Record<string, any>;
}

console.log(__dirname, "dirname")

export const sendEmail = async ({
  to,
  subject,
  templateName,
  templateData
}: sendEmailOptions) => {
  try {
    
    // const templatePath = path.join(__dirname, '../../templates/auth',`${templateName}.ejs`)
    const templatePath = path.resolve(process.cwd(), `src/app/templates/auth/${templateName}.ejs`);
    const html = await ejs.renderFile(templatePath, templateData)

    const info = await transporter.sendMail({
      from: envVars.SMTP_FROM,
      to,
      subject,
      html
    });

    console.log("Envelope used:", info.envelope);
  } catch (error) {
    console.log(error);
    throw error;
  }
};
