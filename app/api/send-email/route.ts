import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { to, subject, html, type } = body

    if (!to || !subject) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if RESEND_API_KEY is configured
    const apiKey = process.env.RESEND_API_KEY

    if (apiKey) {
      // Send real email via Resend
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "Gestion Tareas <tareas@tudominio.com>",
          to: [to],
          subject,
          html,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        console.error("[v0] Resend error:", error)
        return NextResponse.json({ sent: false, method: "resend_error", error }, { status: 500 })
      }

      const data = await response.json()
      return NextResponse.json({ sent: true, method: "resend", id: data.id })
    }

    // No API key - log the email that would be sent
    console.log("[v0] Email notification (no API key configured):")
    console.log(`  To: ${to}`)
    console.log(`  Subject: ${subject}`)
    console.log(`  Type: ${type}`)

    return NextResponse.json({
      sent: false,
      method: "simulated",
      message: "Email simulated. Configure RESEND_API_KEY to send real emails.",
      preview: { to, subject, type },
    })
  } catch (error) {
    console.error("[v0] Email API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
