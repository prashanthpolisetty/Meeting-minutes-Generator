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

    summary = meeting_data.get("summary", "No summary provided.")
    action_items = meeting_data.get("action_items", [])
    key_decisions = meeting_data.get("key_decisions", [])
    
    # Format Action Items
    action_html = "<ul>"
    if action_items:
        for item in action_items:
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

    # Create HTML Email Body
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <h2 style="color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 5px;">Meeting Minutes</h2>
        <p><strong>Summary:</strong><br/>{summary}</p>
        
        <h3 style="color: #2980b9;">Key Decisions:</h3>
        {decision_html}
        
        <h3 style="color: #27ae60;">Action Items:</h3>
        {action_html}
        
        <br/><hr style="border: 1px solid #eee;" />
        <p style="font-size: 12px; color: #777;">Automated message sent from the Autonomous Meeting Minutes Generator AI.</p>
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
