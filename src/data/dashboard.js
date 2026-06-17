export const DASHBOARD_VERSION = 1;

export const TRACK_URGENCY_OPTIONS = [
  "immediate",
  "sprint",
  "slow-burn",
  "recurring",
  "weekly",
];

export const OPPORTUNITY_STATUS_OPTIONS = [
  "prepare",
  "follow-up",
  "waiting",
  "done",
];

const defaultTracks = [
  {
    id: "raes-mefighter",
    label: "RAES & MeFighter",
    tag: "AI BUILDS",
    color: "#E8FF47",
    urgency: "slow-burn",
    focus: "Conversational AI cognition, picking up language cues, model limitations",
    nextAction: "Read one paper or build one small experiment on conversation state this week",
    writePrompt: "What's one thing I learned about conversational AI this week and how does it apply to RAES?",
    context: "Deep, compounds over time. Pair reading with small builds. Output = decisions made inside the product.",
  },
  {
    id: "dots",
    label: "DOTS Move",
    tag: "PERFORMANCE",
    color: "#FF6B35",
    urgency: "sprint",
    focus: "CSR vs SSR vs ISR, Core Web Vitals (FCP, LCP), industry benchmarks",
    nextAction: "Write a 1-page trade-off doc for DOTS: what rendering strategy fits the app's actual usage pattern?",
    writePrompt: "What did my benchmarking reveal, and what's the single biggest performance lever I haven't pulled yet?",
    context: "Bounded and learnable fast. A decision doc for your own app doubles as interview material.",
  },
  {
    id: "interviews",
    label: "Interviews & Opportunities",
    tag: "CAREER",
    color: "#00C2FF",
    urgency: "immediate",
    focus: "Button (DevOps) · Ryan Coyne options platform (tbd depth)",
    nextAction: "Button prep today. For Ryan: one conversation to assess seriousness before going deep on options.",
    writePrompt: "What's my narrative for why I'm the right person for this role, in two sentences?",
    context: "Two very different asks. Don't conflate them. Button is now. Ryan depends on deal seriousness.",
  },
  {
    id: "networking",
    label: "Networking",
    tag: "PIPELINE",
    color: "#B47FFF",
    urgency: "recurring",
    focus: "Finding people doing interesting things · Following up without friction",
    nextAction: "After every new contact: name + context + one follow-up action into Apple Notes within 24hrs",
    writePrompt: "Who did I meet this week, what are they building, and what's the one thing I can offer them?",
    context: "Fix the intake first. One note, fast capture, weekly triage. No CMS.",
  },
  {
    id: "writing",
    label: "Writing",
    tag: "LEVERAGE",
    color: "#FF3CAC",
    urgency: "weekly",
    focus: "\"What I'm building\" posts · Answer the what-do-you-do question publicly",
    nextAction: "Write one short post this week. Anchor it in a moment from one of your builds.",
    writePrompt: "What's one thing I'm building right now that surprised me, and why does it matter?",
    context: "This is your force multiplier. One post = interview prep + networking + thinking clarified.",
  },
];

function cloneTrack(track) {
  return { ...track };
}

function isRecord(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function createDefaultTracks() {
  return defaultTracks.map(cloneTrack);
}

function createOpportunityRecord(id) {
  return {
    id,
    company: "",
    role: "",
    stage: "",
    status: "prepare",
    nextAction: "",
    followUpBy: "",
    notes: "",
  };
}

function createDefaultOpportunity(index = 0) {
  return createOpportunityRecord(`opportunity-${index + 1}`);
}

function getNextOpportunityId(opportunities) {
  const maxNumericId = opportunities.reduce((maxValue, opportunity) => {
    const match =
      typeof opportunity?.id === "string"
        ? opportunity.id.match(/^opportunity-(\d+)$/)
        : null;

    if (!match) {
      return maxValue;
    }

    return Math.max(maxValue, Number(match[1]));
  }, 0);

  return `opportunity-${maxNumericId + 1}`;
}

function normalizeTrack(track, fallbackTrack) {
  const source = isRecord(track) ? track : {};

  return {
    ...fallbackTrack,
    ...source,
    id: typeof source.id === "string" && source.id ? source.id : fallbackTrack.id,
    label: typeof source.label === "string" && source.label ? source.label : fallbackTrack.label,
  };
}

function normalizeOpportunity(opportunity, index) {
  const fallbackOpportunity = createDefaultOpportunity(index);
  const source = isRecord(opportunity) ? opportunity : {};
  const status = OPPORTUNITY_STATUS_OPTIONS.includes(source.status)
    ? source.status
    : fallbackOpportunity.status;

  return {
    ...fallbackOpportunity,
    ...source,
    id: typeof source.id === "string" && source.id ? source.id : fallbackOpportunity.id,
    company: typeof source.company === "string" ? source.company : fallbackOpportunity.company,
    role: typeof source.role === "string" ? source.role : fallbackOpportunity.role,
    stage: typeof source.stage === "string" ? source.stage : fallbackOpportunity.stage,
    status,
    nextAction:
      typeof source.nextAction === "string"
        ? source.nextAction
        : fallbackOpportunity.nextAction,
    followUpBy:
      typeof source.followUpBy === "string"
        ? source.followUpBy
        : fallbackOpportunity.followUpBy,
    notes: typeof source.notes === "string" ? source.notes : fallbackOpportunity.notes,
  };
}

function normalizeTracks(tracks) {
  if (!Array.isArray(tracks) || tracks.length === 0) {
    return createDefaultTracks();
  }

  return tracks.map((track, index) => {
    const source = isRecord(track) ? track : {};
    const fallbackTrack =
      (typeof source.id === "string" && source.id
        ? defaultTracks.find((candidate) => candidate.id === source.id)
        : null) || {
        id: `track-${index + 1}`,
        label: "Untitled Track",
        tag: "",
        color: "#666",
        urgency: "slow-burn",
        focus: "",
        nextAction: "",
        writePrompt: "",
        context: "",
      };

    return normalizeTrack(source, fallbackTrack);
  });
}

function normalizeOpportunities(opportunities) {
  if (!Array.isArray(opportunities) || opportunities.length === 0) {
    return [];
  }

  return opportunities.map((opportunity, index) =>
    normalizeOpportunity(opportunity, index)
  );
}

function isOpenOpportunity(opportunity) {
  return opportunity.status !== "done";
}

function normalizeDateInput(value) {
  if (typeof value !== "string" || !value) {
    return null;
  }

  return value;
}

function hasMeaningfulNextAction(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function createDefaultDashboardDocument() {
  return {
    version: DASHBOARD_VERSION,
    tracks: createDefaultTracks(),
    opportunities: [],
    review: {},
  };
}

export function normalizeDashboardDocument(value) {
  if (Array.isArray(value)) {
    return {
      ...createDefaultDashboardDocument(),
      tracks: normalizeTracks(value),
    };
  }

  if (!value || typeof value !== "object") {
    return createDefaultDashboardDocument();
  }

  return {
    version: DASHBOARD_VERSION,
    tracks: normalizeTracks(value.tracks),
    opportunities: normalizeOpportunities(value.opportunities),
    review: isRecord(value.review) ? value.review : {},
  };
}

export function updateTrackField(document, id, field, value) {
  return {
    ...document,
    tracks: document.tracks.map((track) =>
      track.id === id ? { ...track, [field]: value } : track
    ),
  };
}

export function updateOpportunityField(document, id, field, value) {
  return {
    ...document,
    opportunities: document.opportunities.map((opportunity) =>
      opportunity.id === id ? { ...opportunity, [field]: value } : opportunity
    ),
  };
}

export function addOpportunity(document) {
  return {
    ...document,
    opportunities: [
      ...document.opportunities,
      createOpportunityRecord(getNextOpportunityId(document.opportunities)),
    ],
  };
}

export function removeOpportunity(document, id) {
  return {
    ...document,
    opportunities: document.opportunities.filter(
      (opportunity) => opportunity.id !== id
    ),
  };
}

export function getIncompleteOpportunities(document) {
  return document.opportunities.filter(
    (opportunity) =>
      !hasMeaningfulNextAction(opportunity.company) ||
      !hasMeaningfulNextAction(opportunity.nextAction)
  );
}

export function getOpenOpportunities(document) {
  return document.opportunities.filter(isOpenOpportunity);
}

export function getDueFollowUps(document, today) {
  const todayValue = normalizeDateInput(today);

  if (!todayValue) {
    return [];
  }

  return document.opportunities.filter((opportunity) => {
    const followUpBy = normalizeDateInput(opportunity.followUpBy);

    return (
      isOpenOpportunity(opportunity) &&
      !!followUpBy &&
      followUpBy <= todayValue
    );
  });
}

export function getStaleTracks(document) {
  return document.tracks.filter((track) => !hasMeaningfulNextAction(track.nextAction));
}

export function getStaleOpportunities(document, today) {
  return getDueFollowUps(document, today);
}

export function getReviewSummary(document, today) {
  const activeOpportunityCount = getOpenOpportunities(document).length;
  const staleTracks = getStaleTracks(document);
  const staleOpportunities = getStaleOpportunities(document, today);
  const dueFollowUpCount = staleOpportunities.length;

  return {
    activeOpportunityCount,
    dueFollowUpCount,
    staleTrackCount: staleTracks.length,
    staleOpportunityCount: staleOpportunities.length,
    staleItemCount: staleTracks.length + staleOpportunities.length,
    staleTracks,
    staleOpportunities,
  };
}
