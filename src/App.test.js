import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "./App";
import { createDefaultDashboardDocument } from "./data/dashboard";
import {
  createFallbackDashboardDocument,
  getGistConfigError,
  loadDashboard,
  saveDashboard,
} from "./storage/gist-dashboard-storage";

jest.mock("./storage/gist-dashboard-storage", () => ({
  createFallbackDashboardDocument: jest.fn(),
  getGistConfigError: jest.fn(),
  loadDashboard: jest.fn(),
  saveDashboard: jest.fn(),
}));

function createTestDocument() {
  return createDefaultDashboardDocument();
}

describe("App dashboard behavior", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getGistConfigError.mockReturnValue(null);
    createFallbackDashboardDocument.mockImplementation(() => createTestDocument());
    loadDashboard.mockResolvedValue(createTestDocument());
    saveDashboard.mockResolvedValue(undefined);
  });

  test("loads active tracks from storage and reveals context when a track is opened", async () => {
    render(<App />);

    expect(await screen.findByText("RAES & MeFighter")).toBeInTheDocument();
    expect(
      screen.getByText("Read one paper or build one small experiment on conversation state this week")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText("RAES & MeFighter"));

    expect(
      await screen.findByText("Conversational AI cognition, picking up language cues, model limitations")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Deep, compounds over time. Pair reading with small builds. Output = decisions made inside the product.")
    ).toBeInTheDocument();
  });

  test("keeps each track next action grouped with the track summary for faster scanning", async () => {
    render(<App />);

    const trackName = await screen.findByText("RAES & MeFighter");
    const nextAction = screen.getByText(
      "Read one paper or build one small experiment on conversation state this week"
    );
    const trackSummary = trackName.closest(".track-main");

    expect(trackSummary).toContainElement(nextAction);
  });

  test("keeps the interviews and opportunities label in the default dashboard", async () => {
    render(<App />);

    expect(await screen.findByText("Interviews & Opportunities")).toBeInTheDocument();
  });

  test("uses a fixed controls column so next-action text stays aligned across rows", async () => {
    render(<App />);

    await screen.findByText("RAES & MeFighter");

    const dashboardStyles = Array.from(document.querySelectorAll("style")).find((node) =>
      node.textContent.includes(".track-header")
    );

    expect(dashboardStyles.textContent).toMatch(
      /\.track-header\s*\{[\s\S]*grid-template-columns:\s*80px minmax\(0, 1fr\) 132px;/
    );
  });

  test("saves edited track content back through the storage layer", async () => {
    render(<App />);

    await screen.findByText("RAES & MeFighter");

    fireEvent.click(screen.getByRole("button", { name: "Edit Dashboard" }));

    const nextActionField = screen.getByDisplayValue(
      "Read one paper or build one small experiment on conversation state this week"
    );

    fireEvent.change(nextActionField, {
      target: { value: "Draft a short note on conversation state trade-offs for this week" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(saveDashboard).toHaveBeenCalledWith(
        expect.objectContaining({
          version: 1,
          tracks: expect.arrayContaining([
            expect.objectContaining({
              id: "raes-mefighter",
              nextAction: "Draft a short note on conversation state trade-offs for this week",
            }),
          ]),
        })
      );
    });
  });

  test("shows fallback content and an error when storage loading fails", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    loadDashboard.mockRejectedValue(new Error("network down"));

    render(<App />);

    expect(
      await screen.findByText((content) =>
        content.includes("Could not load from Gist (network down). Showing defaults")
      )
    ).toBeInTheDocument();
    expect(screen.getByText("RAES & MeFighter")).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  test("shows open opportunities with next action and overdue follow-up state", async () => {
    const document = createTestDocument();

    document.opportunities = [
      {
        id: "button-devops",
        company: "Button",
        role: "DevOps Engineer",
        stage: "Phone Screen",
        status: "follow-up",
        nextAction: "Send the follow-up note and finalize talking points",
        followUpBy: "2026-06-15",
        notes: "",
      },
      {
        id: "ryan-platform",
        company: "Ryan Coyne",
        role: "Platform Engineer",
        stage: "Intro Call",
        status: "prepare",
        nextAction: "Draft three questions about role depth and company seriousness",
        followUpBy: "",
        notes: "",
      },
      {
        id: "closed-role",
        company: "Closed Role Co",
        role: "Engineer",
        stage: "Offer",
        status: "done",
        nextAction: "Archive notes",
        followUpBy: "2026-06-10",
        notes: "",
      },
    ];

    loadDashboard.mockResolvedValue(document);

    render(<App />);

    expect(await screen.findByText("Open Opportunities")).toBeInTheDocument();
    expect(screen.getAllByText("Button").length).toBeGreaterThan(0);
    expect(screen.getByText("Phone Screen")).toBeInTheDocument();
    expect(
      screen.getByText("Send the follow-up note and finalize talking points")
    ).toBeInTheDocument();
    expect(screen.getByText("Follow-up Due")).toBeInTheDocument();

    expect(screen.getByText("Ryan Coyne")).toBeInTheDocument();
    expect(screen.getByText("Intro Call")).toBeInTheDocument();
    expect(
      screen.getByText("Draft three questions about role depth and company seriousness")
    ).toBeInTheDocument();

    expect(screen.queryByText("Closed Role Co")).not.toBeInTheDocument();
  });

  test("shows a compact review summary with stale items and due follow-ups", async () => {
    const document = createTestDocument();

    document.tracks = document.tracks.map((track) =>
      track.id === "networking" ? { ...track, nextAction: "" } : track
    );
    document.opportunities = [
      {
        id: "button-devops",
        company: "Button",
        role: "DevOps Engineer",
        stage: "Phone Screen",
        status: "follow-up",
        nextAction: "Send follow-up",
        followUpBy: "2026-06-15",
        notes: "",
      },
      {
        id: "ryan-platform",
        company: "Ryan Coyne",
        role: "Platform Engineer",
        stage: "Intro Call",
        status: "prepare",
        nextAction: "Draft questions",
        followUpBy: "",
        notes: "",
      },
    ];

    loadDashboard.mockResolvedValue(document);

    render(<App />);

    const reviewTitle = await screen.findByText("Review Pulse");
    const reviewShell = reviewTitle.closest(".review-shell");

    expect(reviewTitle).toBeInTheDocument();
    expect(reviewShell).toHaveTextContent("2");
    expect(reviewShell).toHaveTextContent(/active opportunities/i);
    expect(reviewShell).toHaveTextContent("1");
    expect(reviewShell).toHaveTextContent(/follow-up due/i);
    expect(reviewShell).toHaveTextContent(/stale items/i);
    expect(reviewShell).toHaveTextContent("Networking");
    expect(reviewShell).toHaveTextContent("Button");
  });
});
