'use server';

import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CreateVenueReportSuccess = {
  data: { documentId: string; url: string };
  error: null;
};

type CreateVenueReportError = {
  data: null;
  error: string;
};

type CreateVenueReportResult = CreateVenueReportSuccess | CreateVenueReportError;

// ---------------------------------------------------------------------------
// Auth helper — builds a GoogleAuth instance from env vars (no JSON file).
// The private key stored in .env.local uses literal "\n" which must be
// decoded back to real newlines before the RSA key is valid.
// ---------------------------------------------------------------------------

function buildAuthClient(): GoogleAuth {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    throw new Error(
      'Missing Google Service Account credentials. ' +
        'Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY in .env.local.',
    );
  }

  return new GoogleAuth({
    credentials: {
      type: 'service_account',
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/documents'],
  });
}

// ---------------------------------------------------------------------------
// Server Action
// ---------------------------------------------------------------------------

/**
 * Creates a new Google Doc titled after the given venue name.
 *
 * @param venueName - The venue name used as the document title.
 * @returns { data: { documentId, url } } on success, { error } on failure.
 *
 * Note: The service account must have the Google Docs API enabled in your
 * Google Cloud project. The document is created in the service account's
 * Drive; to view it you must share it or move it to a shared folder.
 */
export async function createVenueReport(
  venueName: string,
): Promise<CreateVenueReportResult> {
  if (!venueName || venueName.trim().length === 0) {
    return { data: null, error: 'venueName must be a non-empty string.' };
  }

  try {
    const auth = buildAuthClient();
    const docsClient = google.docs({ version: 'v1', auth });

    const response = await docsClient.documents.create({
      requestBody: {
        title: `Venue Report — ${venueName.trim()}`,
      },
    });

    const documentId = response.data.documentId;

    if (!documentId) {
      return {
        data: null,
        error: 'Google Docs API returned a document without an ID.',
      };
    }

    return {
      data: {
        documentId,
        url: `https://docs.google.com/document/d/${documentId}/edit`,
      },
      error: null,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'An unexpected error occurred.';

    console.error('[createVenueReport] Google Docs API error:', message);

    return { data: null, error: message };
  }
}
