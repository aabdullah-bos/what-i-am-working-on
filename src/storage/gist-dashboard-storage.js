import {
  createDefaultDashboardDocument,
  normalizeDashboardDocument,
} from "../data/dashboard";

const GIST_ID = process.env.REACT_APP_GIST_ID;
const GITHUB_TOKEN = process.env.REACT_APP_GITHUB_TOKEN;
const GIST_FILENAME = "dashboard-tracks.json";

function gistUrl() {
  return process.env.NODE_ENV === "production"
    ? `https://api.github.com/gists/${GIST_ID}`
    : `/gists/${GIST_ID}`;
}

export function getGistConfigError() {
  if (!GIST_ID || !GITHUB_TOKEN) {
    return "Missing REACT_APP_GIST_ID or REACT_APP_GITHUB_TOKEN — check your .env file.";
  }

  return null;
}

export function createFallbackDashboardDocument() {
  return createDefaultDashboardDocument();
}

function parseDashboardContent(file) {
  if (!file) {
    throw new Error("Gist file not found");
  }

  if (file.truncated) {
    throw new Error("Gist file is truncated and cannot be loaded safely");
  }

  if (!file.content) {
    throw new Error("Gist file not found");
  }

  try {
    return JSON.parse(file.content);
  } catch (error) {
    throw new Error("Gist file contains invalid dashboard JSON");
  }
}

export async function loadDashboard() {
  const res = await fetch(gistUrl(), {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!res.ok) {
    throw new Error(`Gist fetch failed: ${res.status}`);
  }

  const data = await res.json();
  const file = data.files?.[GIST_FILENAME];

  return normalizeDashboardDocument(parseDashboardContent(file));
}

export async function saveDashboard(document) {
  const normalizedDocument = normalizeDashboardDocument(document);

  const res = await fetch(gistUrl(), {
    method: "PATCH",
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      files: {
        [GIST_FILENAME]: {
          content: JSON.stringify(normalizedDocument, null, 2),
        },
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Gist save failed: ${res.status}`);
  }
}
