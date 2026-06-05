import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  subject: z.string().trim().min(3).max(180),
  message: z.string().trim().min(10).max(5000),
});

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function POST(request: NextRequest) {
  try {
    const validation = contactSchema.safeParse(await request.json());

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Invalid contact message" },
        { status: 400 }
      );
    }

    const contact = await db.contactMessage.create({
      data: validation.data,
    });

    const supportEmail = process.env.SUPPORT_EMAIL;
    if (supportEmail) {
      await sendEmail({
        to: supportEmail,
        subject: `AcademIQ contact: ${validation.data.subject}`,
        html: `
          <h2>New AcademIQ contact message</h2>
          <p><strong>From:</strong> ${escapeHtml(validation.data.name)} (${escapeHtml(validation.data.email)})</p>
          <p><strong>Subject:</strong> ${escapeHtml(validation.data.subject)}</p>
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap;">${escapeHtml(validation.data.message)}</p>
          <p><strong>Message ID:</strong> ${contact.id}</p>
        `,
        text: `New AcademIQ contact message

From: ${validation.data.name} <${validation.data.email}>
Subject: ${validation.data.subject}

${validation.data.message}

Message ID: ${contact.id}`,
      });
    }

    return NextResponse.json({
      message: "Message sent successfully",
      id: contact.id,
    });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
