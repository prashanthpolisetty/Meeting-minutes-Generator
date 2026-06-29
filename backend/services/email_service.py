"""
Email Service
Handles sending meeting minutes via SMTP email.
"""

import smtplib
import asyncio
import logging
from email.message import EmailMessage
from backend.config.settings import settings

logger = logging.getLogger(__name__)

def _send_email_sync(recipients: list, meeting_data: dict) -> bool:
    """Synchronous function to connect to SMTP and send the email."""
    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASS:
        logger.error("SMTP credentials are not fully configured in environment.")
        return False

    candidates = meeting_data.get("candidates", [])
    best_candidate_index = meeting_data.get("best_candidate_index", 0)
    best_candidate_reasoning = meeting_data.get("best_candidate_reasoning", "")

    if candidates:
        best = candidates[best_candidate_index]
        agenda = best.get("agenda", "No agenda provided.")
        summary = best.get("summary", "No summary provided.")
        action_items = best.get("action_items", [])
        key_decisions = best.get("key_decisions", [])
        best_model_name = best.get("model_name", "AI Model")
        best_provider = best.get("provider", "unknown").upper()
    else:
        agenda = meeting_data.get("agenda", "No agenda provided.")
        summary = meeting_data.get("summary", "No summary provided.")
        action_items = meeting_data.get("action_items", [])
        key_decisions = meeting_data.get("key_decisions", [])
        best_model_name = None
        best_provider = None

    # Format Action Items
    action_html = "<ul>"
    if action_items:
        for item in action_items:
            if isinstance(item, dict):
                task = item.get("task", "")
                assignee = item.get("assignee", "")
                deadline = item.get("deadline", "")
                assignee_str = f" (Assignee: {assignee})" if assignee else ""
                deadline_str = f" (Deadline: {deadline})" if deadline else ""
                action_html += f"<li><strong>{task}</strong>{assignee_str}{deadline_str}</li>"
            else:
                action_html += f"<li>{item}</li>"
    else:
        action_html += "<li>None</li>"
    action_html += "</ul>"
        
    # Format Key Decisions
    decision_html = "<ul>"
    if key_decisions:
        for item in key_decisions:
            decision_html += f"<li>{item}</li>"
    else:
        decision_html += "<li>None</li>"
    decision_html += "</ul>"

    # Create HTML Email Body (Only the best choice is included)
    html_content = f"""
    <html>
      <body style="font-family: 'Inter', Arial, sans-serif; color: #1e293b; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background-color: #4f46e5; color: white; padding: 28px 24px; border-radius: 16px 16px 0 0; text-align: center; box-shadow: 0 4px 10px rgba(79, 70, 229, 0.15);">
          <h2 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">Meeting Minutes</h2>
          <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">Official Summary, Decisions, and Action Items</p>
        </div>
        
        <div style="padding: 32px 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 16px 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <h3 style="color: #4f46e5; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-top: 0; margin-bottom: 12px;">Agenda</h3>
          <p style="color: #334155; font-size: 16px; margin-bottom: 28px; font-weight: 600;">{agenda}</p>

          <h3 style="color: #4f46e5; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-top: 0; margin-bottom: 12px;">Executive Summary</h3>
          <p style="color: #334155; font-size: 15px; margin-bottom: 28px; line-height: 1.7; white-space: pre-line;">{summary}</p>
          
          <h3 style="color: #0369a1; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-top: 0; margin-bottom: 12px;">Key Decisions</h3>
          <div style="color: #334155; font-size: 15px; margin-bottom: 28px; line-height: 1.7;">{decision_html}</div>
          
          <h3 style="color: #15803d; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-top: 0; margin-bottom: 12px;">Action Items</h3>
          <div style="color: #334155; font-size: 15px; line-height: 1.7;">{action_html}</div>
        </div>
        
        <br/><hr style="border: 1px solid #f1f5f9;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">Automated message sent from the Autonomous Meeting Minutes Generator AI.</p>
      </body>
    </html>
    """

    # Construct the Email
    msg = EmailMessage()
    msg['Subject'] = 'Meeting Minutes - Auto-Generated'
    msg['From'] = settings.SMTP_USER
    msg['To'] = ", ".join(recipients)
    msg.set_content("Please enable HTML to view this email.")
    msg.add_alternative(html_content, subtype='html')

    logger.info(f"Connecting to SMTP server at {settings.SMTP_HOST}:{settings.SMTP_PORT}...")
    try:
        # Connect and authenticate
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASS)
        
        # Send email
        server.send_message(msg)
        server.quit()
        logger.info(f"Successfully sent meeting minutes to: {recipients}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        return False

async def send_meeting_email(recipients: list, meeting_data: dict) -> bool:
    """Send formatted meeting minutes to a list of email recipients asynchronously."""
    if not recipients:
        logger.warning("No email recipients provided. Skipping email delivery.")
        return False

    loop = asyncio.get_running_loop()
    # Run the blocking SMTP operations in a background thread pool executor
    success = await loop.run_in_executor(None, _send_email_sync, recipients, meeting_data)
    return success
