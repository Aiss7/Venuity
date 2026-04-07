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
// Both the Docs and Drive scopes are requested so we can move the document
// into the target shared folder after creation.
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
    // Drive scope required to move the document into the shared folder.
    scopes: [
      'https://www.googleapis.com/auth/documents',
      'https://www.googleapis.com/auth/drive',
    ],
  });
}

// ---------------------------------------------------------------------------
// Server Action
// ---------------------------------------------------------------------------

/**
 * Creates a new Google Doc titled after the given venue name, then moves it
 * into the shared Drive folder specified by GOOGLE_DRIVE_FOLDER_ID.
 *
 * @param venueName - The venue name used as the document title.
 * @returns { data: { documentId, url } } on success, { error } on failure.
 *
 * Note: The service account must have:
 *   - Google Docs API enabled
 *   - Google Drive API enabled
 *   - Editor access on the target Drive folder (GOOGLE_DRIVE_FOLDER_ID)
 */
export async function createVenueReport(
  venueName: string,
): Promise<CreateVenueReportResult> {
  if (!venueName || venueName.trim().length === 0) {
    return { data: null, error: 'venueName must be a non-empty string.' };
  }

  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId) {
    return {
      data: null,
      error:
        'Missing GOOGLE_DRIVE_FOLDER_ID. Set it in .env.local to specify the target Drive folder.',
    };
  }

  try {
    const auth = buildAuthClient();
    const docsClient = google.docs({ version: 'v1', auth });
    const driveClient = google.drive({ version: 'v3', auth });

    // 1. Create the document via the Docs API.
    const createResponse = await docsClient.documents.create({
      requestBody: {
        title: `Venue Report — ${venueName.trim()}`,
      },
    });

    const documentId = createResponse.data.documentId;

    if (!documentId) {
      return {
        data: null,
        error: 'Google Docs API returned a document without an ID.',
      };
    }

    // 2. Move the document into the target folder using the Drive API.
    //    We must supply the current parent(s) in `removeParents` so Drive
    //    replaces rather than adds the new parent.
    const metaResponse = await driveClient.files.get({
      fileId: documentId,
      fields: 'parents',
    });

    const previousParents = (metaResponse.data.parents ?? []).join(',');

    await driveClient.files.update({
      fileId: documentId,
      addParents: folderId,
      removeParents: previousParents,
      fields: 'id, parents',
    });

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

    console.error('[createVenueReport] Google API error:', message);

    return { data: null, error: message };
  }
}
