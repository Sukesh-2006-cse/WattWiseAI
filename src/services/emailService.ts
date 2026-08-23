/**
 * WattWise AI - Isolated Email Delivery Service Module
 *
 * All EmailJS communication is isolated here, exactly as Blynk traffic is
 * isolated in `blynkService.ts`. Hooks and components never construct provider
 * URLs, never see the service/template IDs, and never learn which provider is
 * in use - they hand over an `AlertEmailMessage` and get a result back.
 *
 * Switching to SendGrid, Resend, or a backend proxy means rewriting this file.
 */

import { EMAILJS_CONFIG, EMAILJS_PLACEHOLDERS } from '../constants/alerts';
import { AlertEmailMessage, EmailErrorCode } from '../types/alert';

/**
 * Custom Error Class for email delivery errors.
 */
export class EmailServiceError extends Error {
  public code: EmailErrorCode;

  constructor(message: string, code: EmailErrorCode) {
    super(message);
    this.name = 'EmailServiceError';
    this.code = code;
  }
}

/**
 * True only when every required EmailJS value is present and is not still one
 * of the `.env.example` placeholders.
 */
export function isEmailConfigured(): boolean {
  const required = [
    EMAILJS_CONFIG.SERVICE_ID,
    EMAILJS_CONFIG.TEMPLATE_ID,
    EMAILJS_CONFIG.PUBLIC_KEY,
  ];

  return required.every((value) => Boolean(value) && !EMAILJS_PLACEHOLDERS.includes(value));
}

/**
 * Executes a fetch with a hard timeout, so a hung request can never wedge the
 * alert pipeline.
 */
async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number = EMAILJS_CONFIG.TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err?.name === 'AbortError') {
      throw new EmailServiceError('Email request timed out.', 'TIMEOUT');
    }
    throw new EmailServiceError(
      'Network connection failed while sending the alert email.',
      'NETWORK_ERROR'
    );
  }
}

/**
 * Maps an EmailJS HTTP failure onto a stable error code + readable message.
 */
function mapResponseError(status: number, body: string): EmailServiceError {
  const detail = body.trim().slice(0, 200);

  if (status === 400) {
    // EmailJS returns 400 for unknown template variables and malformed payloads
    return new EmailServiceError(
      `EmailJS rejected the request: ${detail || 'check the template variables.'}`,
      'PROVIDER_ERROR'
    );
  }

  if (status === 401 || status === 403) {
    return new EmailServiceError(
      'EmailJS rejected the credentials. Verify the Public Key, and enable ' +
        '"API requests from non-browser applications" in EmailJS Account -> Security.',
      'UNAUTHORIZED'
    );
  }

  if (status === 404) {
    return new EmailServiceError(
      'EmailJS service or template not found. Check the Service ID and Template ID.',
      'PROVIDER_ERROR'
    );
  }

  if (status === 429) {
    return new EmailServiceError(
      'EmailJS rate limit reached. The alert was not sent.',
      'RATE_LIMITED'
    );
  }

  return new EmailServiceError(
    `EmailJS returned error status ${status}. ${detail}`.trim(),
    'PROVIDER_ERROR'
  );
}

/**
 * Sends one alert email through EmailJS.
 *
 * Template variables are passed flat so an EmailJS template can reference them
 * directly, e.g. `{{alert_level}}`, `{{power}}`, `{{message}}`.
 *
 * @throws EmailServiceError on any configuration, network, or provider failure.
 */
export async function sendAlertEmail(message: AlertEmailMessage): Promise<void> {
  if (!isEmailConfigured()) {
    throw new EmailServiceError(
      'Email alerts are not configured. Add your EXPO_PUBLIC_EMAILJS_* keys to the .env file.',
      'NOT_CONFIGURED'
    );
  }

  if (!message.recipientEmail || !message.recipientEmail.includes('@')) {
    throw new EmailServiceError(
      'The signed-in account has no valid email address to alert.',
      'INVALID_RECIPIENT'
    );
  }

  const payload = {
    service_id: EMAILJS_CONFIG.SERVICE_ID,
    template_id: EMAILJS_CONFIG.TEMPLATE_ID,
    user_id: EMAILJS_CONFIG.PUBLIC_KEY,
    template_params: {
      to_email: message.recipientEmail,
      to_name: message.recipientName,
      subject: message.subject,
      message: message.body,
      ...message.variables,
    },
  };

  const response = await fetchWithTimeout(EMAILJS_CONFIG.API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw mapResponseError(response.status, body);
  }
}
