import { DASHBOARD_VERSION } from "../data/dashboard";
import { loadDashboard, saveDashboard } from "./gist-dashboard-storage";

describe("gist dashboard storage", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  test("loads and normalizes a legacy track array from gist content", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        files: {
          "dashboard-tracks.json": {
            content: JSON.stringify([
              {
                id: "legacy-track",
                label: "Legacy Track",
                tag: "LEGACY",
                color: "#123456",
                urgency: "immediate",
                focus: "Legacy focus",
                nextAction: "Legacy next action",
                writePrompt: "Legacy prompt",
                context: "Legacy context",
              },
            ]),
          },
        },
      }),
    });

    const document = await loadDashboard();

    expect(document).toEqual(
      expect.objectContaining({
        version: DASHBOARD_VERSION,
        opportunities: [],
        review: {},
        tracks: [
          expect.objectContaining({
            id: "legacy-track",
            label: "Legacy Track",
          }),
        ],
      })
    );
  });

  test("normalizes a partial dashboard document loaded from gist", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        files: {
          "dashboard-tracks.json": {
            content: JSON.stringify({
              version: DASHBOARD_VERSION,
              tracks: [
                {
                  id: "partial-track",
                  label: "Partial Track",
                },
              ],
            }),
          },
        },
      }),
    });

    const document = await loadDashboard();

    expect(document).toEqual(
      expect.objectContaining({
        version: DASHBOARD_VERSION,
        opportunities: [],
        review: {},
        tracks: [
          expect.objectContaining({
            id: "partial-track",
            label: "Partial Track",
            nextAction: expect.any(String),
          }),
        ],
      })
    );
  });

  test("throws a helpful error when gist content is truncated", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        files: {
          "dashboard-tracks.json": {
            truncated: true,
            content: "{\"version\":1",
          },
        },
      }),
    });

    await expect(loadDashboard()).rejects.toThrow(
      "Gist file is truncated and cannot be loaded safely"
    );
  });

  test("throws a helpful error when gist content is not valid JSON", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        files: {
          "dashboard-tracks.json": {
            content: "{invalid json",
          },
        },
      }),
    });

    await expect(loadDashboard()).rejects.toThrow(
      "Gist file contains invalid dashboard JSON"
    );
  });

  test("saves a normalized versioned dashboard document", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
    });

    await saveDashboard({
      tracks: [
        {
          id: "saved-track",
          label: "Saved Track",
        },
      ],
    });

    const [, request] = global.fetch.mock.calls[0];
    const payload = JSON.parse(request.body);
    const savedDocument = JSON.parse(payload.files["dashboard-tracks.json"].content);

    expect(request.method).toBe("PATCH");
    expect(savedDocument).toEqual(
      expect.objectContaining({
        version: DASHBOARD_VERSION,
        opportunities: [],
        review: {},
        tracks: [
          expect.objectContaining({
            id: "saved-track",
            label: "Saved Track",
          }),
        ],
      })
    );
  });
});
