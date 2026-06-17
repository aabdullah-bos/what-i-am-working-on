import {
  addOpportunity,
  createDefaultDashboardDocument,
  DASHBOARD_VERSION,
  getIncompleteOpportunities,
  getOpenOpportunities,
  getDueFollowUps,
  getReviewSummary,
  getStaleTracks,
  normalizeDashboardDocument,
  removeOpportunity,
  updateOpportunityField,
  updateTrackField,
} from "./dashboard";

describe("dashboard document helpers", () => {
  test("migrates a legacy track array into the versioned dashboard document", () => {
    const legacyTracks = [
      {
        id: "custom-track",
        label: "Custom Track",
        tag: "CUSTOM",
        color: "#123456",
        urgency: "immediate",
        focus: "Legacy focus",
        nextAction: "Legacy next action",
        writePrompt: "Legacy prompt",
        context: "Legacy context",
      },
    ];

    const document = normalizeDashboardDocument(legacyTracks);

    expect(document).toEqual(
      expect.objectContaining({
        version: DASHBOARD_VERSION,
        opportunities: [],
        review: {},
        tracks: [
          expect.objectContaining({
            id: "custom-track",
            label: "Custom Track",
            nextAction: "Legacy next action",
          }),
        ],
      })
    );
  });

  test("falls back to the default document when the loaded value is invalid", () => {
    const document = normalizeDashboardDocument(null);
    const defaults = createDefaultDashboardDocument();

    expect(document).toEqual(defaults);
  });

  test("updates one track field without changing the rest of the document shape", () => {
    const document = createDefaultDashboardDocument();

    const updated = updateTrackField(
      document,
      "raes-mefighter",
      "nextAction",
      "Write the conversation state note"
    );

    expect(updated).toEqual(
      expect.objectContaining({
        version: DASHBOARD_VERSION,
        opportunities: [],
        review: {},
      })
    );
    expect(updated.tracks.find((track) => track.id === "raes-mefighter")).toEqual(
      expect.objectContaining({
        nextAction: "Write the conversation state note",
      })
    );
    expect(updated.tracks.find((track) => track.id === "dots")).toEqual(
      expect.objectContaining({
        nextAction:
          "Write a 1-page trade-off doc for DOTS: what rendering strategy fits the app's actual usage pattern?",
      })
    );
  });

  test("normalizes opportunities into the versioned dashboard document", () => {
    const document = normalizeDashboardDocument({
      version: DASHBOARD_VERSION,
      tracks: [],
      opportunities: [
        {
          id: "button-devops",
          company: "Button",
          role: "DevOps Engineer",
          stage: "screen",
          status: "prepare",
          nextAction: "Draft interview prep notes",
        },
        {
          company: "Missing Id Co",
          role: "Platform Engineer",
        },
      ],
    });

    expect(document.opportunities).toEqual([
      expect.objectContaining({
        id: "button-devops",
        company: "Button",
        role: "DevOps Engineer",
        stage: "screen",
        status: "prepare",
        nextAction: "Draft interview prep notes",
        followUpBy: "",
        notes: "",
      }),
      expect.objectContaining({
        id: "opportunity-2",
        company: "Missing Id Co",
        role: "Platform Engineer",
        stage: "",
        status: "prepare",
        nextAction: "",
        followUpBy: "",
        notes: "",
      }),
    ]);
  });

  test("returns only open opportunities for the dashboard view", () => {
    const document = normalizeDashboardDocument({
      version: DASHBOARD_VERSION,
      tracks: [],
      opportunities: [
        {
          id: "button-devops",
          company: "Button",
          role: "DevOps Engineer",
          stage: "screen",
          status: "prepare",
        },
        {
          id: "old-process",
          company: "Old Process",
          role: "Engineer",
          stage: "closed",
          status: "done",
        },
      ],
    });

    expect(getOpenOpportunities(document)).toEqual([
      expect.objectContaining({
        id: "button-devops",
        status: "prepare",
      }),
    ]);
  });

  test("returns due follow-ups for open opportunities only", () => {
    const document = normalizeDashboardDocument({
      version: DASHBOARD_VERSION,
      tracks: [],
      opportunities: [
        {
          id: "button-devops",
          company: "Button",
          role: "DevOps Engineer",
          stage: "screen",
          status: "follow-up",
          followUpBy: "2026-06-15",
        },
        {
          id: "future-follow-up",
          company: "Future Co",
          role: "Engineer",
          stage: "screen",
          status: "follow-up",
          followUpBy: "2026-06-22",
        },
        {
          id: "done-opportunity",
          company: "Done Co",
          role: "Engineer",
          stage: "offer",
          status: "done",
          followUpBy: "2026-06-10",
        },
      ],
    });

    expect(getDueFollowUps(document, "2026-06-17")).toEqual([
      expect.objectContaining({
        id: "button-devops",
        followUpBy: "2026-06-15",
      }),
    ]);
  });

  test("updates one opportunity field without changing other collections", () => {
    const document = normalizeDashboardDocument({
      version: DASHBOARD_VERSION,
      tracks: [],
      opportunities: [
        {
          id: "button-devops",
          company: "Button",
          role: "DevOps Engineer",
          stage: "screen",
          status: "prepare",
        },
      ],
    });

    const updated = updateOpportunityField(
      document,
      "button-devops",
      "nextAction",
      "Draft post-interview follow-up"
    );

    expect(updated.tracks).toEqual(document.tracks);
    expect(updated.opportunities).toEqual([
      expect.objectContaining({
        id: "button-devops",
        nextAction: "Draft post-interview follow-up",
      }),
    ]);
  });

  test("adds a new opportunity with a default status and a unique generated id", () => {
    const document = normalizeDashboardDocument({
      version: DASHBOARD_VERSION,
      tracks: [],
      opportunities: [
        {
          id: "button-devops",
          company: "Button",
          role: "DevOps Engineer",
          stage: "Phone Screen",
          status: "prepare",
          nextAction: "Draft prep notes",
        },
        {
          id: "opportunity-3",
          company: "Existing Draft",
          role: "",
          stage: "",
          status: "waiting",
          nextAction: "Wait for reply",
        },
      ],
    });

    const updated = addOpportunity(document);
    const newOpportunity = updated.opportunities[updated.opportunities.length - 1];

    expect(newOpportunity).toEqual(
      expect.objectContaining({
        id: "opportunity-4",
        company: "",
        role: "",
        stage: "",
        status: "prepare",
        nextAction: "",
        followUpBy: "",
        notes: "",
      })
    );
  });

  test("removes a draft opportunity without changing the rest of the document", () => {
    const document = normalizeDashboardDocument({
      version: DASHBOARD_VERSION,
      tracks: [],
      opportunities: [
        {
          id: "button-devops",
          company: "Button",
          role: "DevOps Engineer",
          stage: "Phone Screen",
          status: "prepare",
          nextAction: "Draft prep notes",
        },
        {
          id: "opportunity-2",
          company: "",
          role: "",
          stage: "",
          status: "prepare",
          nextAction: "",
        },
      ],
    });

    const updated = removeOpportunity(document, "opportunity-2");

    expect(updated.opportunities).toEqual([
      expect.objectContaining({
        id: "button-devops",
      }),
    ]);
    expect(updated.tracks).toEqual(document.tracks);
  });

  test("identifies opportunities missing required company or next action fields", () => {
    const document = normalizeDashboardDocument({
      version: DASHBOARD_VERSION,
      tracks: [],
      opportunities: [
        {
          id: "complete-opportunity",
          company: "Button",
          role: "DevOps Engineer",
          stage: "Phone Screen",
          status: "prepare",
          nextAction: "Draft prep notes",
        },
        {
          id: "missing-company",
          company: "",
          role: "Platform Engineer",
          stage: "Intro Call",
          status: "prepare",
          nextAction: "Draft questions",
        },
        {
          id: "missing-next-action",
          company: "OpenAI",
          role: "Engineer",
          stage: "Screen",
          status: "prepare",
          nextAction: "   ",
        },
      ],
    });

    expect(getIncompleteOpportunities(document)).toEqual([
      expect.objectContaining({
        id: "missing-company",
      }),
      expect.objectContaining({
        id: "missing-next-action",
      }),
    ]);
  });

  test("returns tracks with missing next actions as stale", () => {
    const document = normalizeDashboardDocument({
      version: DASHBOARD_VERSION,
      tracks: [
        {
          id: "clear-track",
          label: "Clear Track",
          nextAction: "Finish the prep note",
        },
        {
          id: "stale-track",
          label: "Stale Track",
          nextAction: "",
        },
      ],
      opportunities: [],
    });

    expect(getStaleTracks(document)).toEqual([
      expect.objectContaining({
        id: "stale-track",
        label: "Stale Track",
      }),
    ]);
  });

  test("builds a compact review summary from stale items and due follow-ups", () => {
    const document = normalizeDashboardDocument({
      version: DASHBOARD_VERSION,
      tracks: [
        {
          id: "ready-track",
          label: "Ready Track",
          nextAction: "Do the next step",
        },
        {
          id: "stale-track",
          label: "Stale Track",
          nextAction: "",
        },
      ],
      opportunities: [
        {
          id: "button-devops",
          company: "Button",
          role: "DevOps Engineer",
          stage: "Phone Screen",
          status: "follow-up",
          nextAction: "Send follow-up",
          followUpBy: "2026-06-15",
        },
        {
          id: "ryan-platform",
          company: "Ryan Coyne",
          role: "Platform Engineer",
          stage: "Intro Call",
          status: "prepare",
          nextAction: "Draft questions",
        },
        {
          id: "done-role",
          company: "Done Co",
          role: "Engineer",
          stage: "Offer",
          status: "done",
          followUpBy: "2026-06-10",
        },
      ],
    });

    expect(getReviewSummary(document, "2026-06-17")).toEqual(
      expect.objectContaining({
        activeOpportunityCount: 2,
        dueFollowUpCount: 1,
        staleTrackCount: 1,
        staleOpportunityCount: 1,
      })
    );
  });
});
