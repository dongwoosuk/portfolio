export type ProjectSlide = {
  src: string;
  alt: string;
  title: string;
  detail: string;
};

export type ProjectGalleryGroup = {
  label: string;
  detail: string;
  from: number;
  to: number;
  startColumn?: number;
};

export type ProjectStep = {
  label: string;
  title: string;
  detail: string;
};

export type ProjectScope = {
  label: string;
  title: string;
  detail: string;
};

export type ProjectResultPoint = {
  label: string;
  text: string;
};

export type ProjectClip = {
  src: string;
  poster: string;
  title: string;
  detail: string;
};

export type ProjectFollowOn = {
  title: string;
  detail: string;
  images: { src: string; alt: string; label: string }[];
};

export type Project = {
  slug: string;
  role: "featured" | "supporting";
  number: string;
  category: string;
  title: string;
  deck: string;
  context: string;
  contribution: string;
  outcome: string;
  tools: string;
  cover: string;
  coverAlt: string;
  video?: string;
  videoPoster?: string;
  videoCaption?: string;
  leadImage?: { src: string; alt: string; caption: string };
  overviewImage?: { src: string; alt: string; caption: string };
  question: string;
  approach: string;
  result: string;
  resultPoints?: ProjectResultPoint[];
  caveat: string;
  scope?: ProjectScope[];
  galleryIntro?: string;
  processHeading: string;
  processIntro: string;
  processSteps: ProjectStep[];
  slides: ProjectSlide[];
  galleryGroups?: ProjectGalleryGroup[];
  clips?: ProjectClip[];
  followOns?: ProjectFollowOn[];
  secondVideo?: { src: string; caption: string; label: string; title: string };
};

const architecturalProjects: Project[] = [
  {
    "slug": "cal-poly-facade",
    "role": "featured",
    "number": "01",
    "category": "PROJECT STUDY / FACADE SYSTEMS",
    "title": "Cal Poly Student Housing — Building C Facade",
    "deck": "Solar-informed facade design, developed as a parametric panel system.",
    "context": "Cal Poly Student Housing — Building C · Steinberg Hart",
    "contribution": "Solar analysis, scripted facade modeling, and panel classification",
    "outcome": "Orientation-specific details and a classified building-scale facade model.",
    "tools": "Rhino · Grasshopper · Python · Ladybug",
    "cover": "/work/facade/renderings/0922_VIEW_A%20copy.jpg",
    "coverAlt": "Cal Poly Student Housing — Building C project visualization showing the entrance and articulated facade",
    "leadImage": {
        "src": "/work/facade/renderings/0922_VIEW_A%20copy.jpg",
        "alt": "Cal Poly Student Housing — Building C entrance and facade project visualization",
        "caption": "Cal Poly Student Housing — Building C / project visualization"
    },
    "question": "How can solar conditions inform a coherent facade?",
    "approach": "Use solar studies to guide window-edge geometry, then develop the facade through scripted parts.",
    "result": "The study connects environmental conditions, local details, and the overall panel composition.",
    "resultPoints": [
        {
            "label": "01 / SOLAR ALTITUDE",
            "text": "Sun below 50° accounts for 63% of summer incident radiation on upper glazing in this study."
        },
        {
            "label": "02 / ASYMMETRIC EDGES",
            "text": "Jamb depth and flare respond to the direction of incoming sun."
        },
        {
            "label": "03 / BUILDING SCALE",
            "text": "Scripted geometry brings the details into a repeatable panel system."
        }
    ],
    "caveat": "Design-stage studies and project visualizations. Radiation results describe modeled exposure, not measured building performance.",
    "galleryIntro": "Panel types, profiles, and quantities make the assembled model easier to review.",
    "processHeading": "From exposure to expression.",
    "processIntro": "Read the exposure, shape the parts, and review the assembled facade.",
    "processSteps": [
        {
            "label": "01 / READ",
            "title": "Read the exposure.",
            "detail": "Compare orientation, sun altitude, and incident radiation."
        },
        {
            "label": "02 / SHAPE",
            "title": "Shape the parts.",
            "detail": "Adjust jamb depth and flare through parametric geometry."
        },
        {
            "label": "03 / COMPOSE",
            "title": "Compose the facade.",
            "detail": "Review panel rhythm, projecting bays, and ground-floor frontage together."
        },
        {
            "label": "04 / ORGANIZE",
            "title": "Classify the panels.",
            "detail": "Group repeated conditions and inspect unique types."
        }
    ],
    "slides": [
        {
            "src": "/work/facade/kit-of-parts/26-0914_CalPoly%20Bldg%20C%20Facade%20Design_Kit%20of%20Parts_05.png",
            "alt": "Facade panel types with top and bottom profiles and a quantity distribution chart",
            "title": "Kit of parts",
            "detail": "Panel profiles and quantity distribution across 17 types."
        }
    ]
},
  {
    slug: "adg-massing-pilot",
    role: "featured",
    number: "02",
    category: "INTERNAL PILOT / CONSTRAINT-DRIVEN DESIGN",
    title: "ADG Pilot: Unit Layout & Facade",
    deck: "Turn a shared massing into unit and facade options that designers can compare under planning and opening constraints.",
    context: "Steinberg Hart · ADG internal pilot",
    contribution: "Grasshopper script for circulation, unit layouts, opening studies, and panel options",
    outcome: "A building-scale pilot connecting circulation, unit alternatives, opening studies, and facade panels.",
    tools: "Rhino 8 · Grasshopper · Python 3",
    cover: "/work/adg/sep29-building-result.png",
    coverAlt: "ADG pilot building model with facade panels across the elevations",
    video: "/work/adg/ADG_Teaser_v3.mp4",
    videoPoster: "/work/adg/ADG_Teaser_v3_Poster.jpg",
    videoCaption: "Workflow teaser — circulation, cores, unit layouts, opening allowances, and facade options",
    overviewImage: { src: "/work/adg/6%20PERSPECTIVE_05.png", alt: "Street-level perspective of the full ADG pilot building and facade", caption: "PROJECT OVERVIEW / ADG PILOT" },
    question: "How can a shared massing become testable unit and facade options while keeping the designer's judgment visible?",
    approach: "The team's massing provides the starting geometry. Corridor and core inputs guide unit placement; opening limits and partitions guide facade options.",
    result: "Three connected outputs support design review.",
    resultPoints: [
      { label: "01 / CORE OPTIONS", text: "For the given massing, core layouts were screened against egress criteria for core count, travel distance, and dead-end limits. Only qualifying options were retained." },
      { label: "02 / UNIT MIX", text: "The team's FAR 4.0 massing set a unit-mix target from maximum GFA. Fitting units to the massing and core locations shifted the counts and produced distinct corner units, including a new 3BD type." },
      { label: "03 / FACADE OPENINGS", text: "The FSD study of property and imaginary property lines established each zone's opening allowance. Only panel options within those limits were shown." },
    ],
    caveat: "Concept-stage internal pilot. Egress and opening checks support design review, not code certification; panel ratios alone do not establish zone-wide compliance. Adoption and time savings were not measured. Environmental analysis and Revit tests are team work; AI imagery is conceptual.",
    scope: [
      { label: "01 / TEAM INPUT", title: "Base massing", detail: "The team provided the base massing and program data." },
      { label: "02 / MY CONTRIBUTION", title: "Layout to facade", detail: "I developed the Grasshopper workflow from circulation and units to facade options." },
      { label: "03 / TEAM CONTINUATION", title: "Further integration", detail: "The team explored sustainability, BIM handoff, and visualization as further applications." },
    ],
    galleryIntro: "Follow the shared massing through circulation, unit layouts, and facade options. Select a frame to inspect it.",
    processHeading: "From massing to decisions.",
    processIntro: "Set the inputs, generate alternatives, and inspect the resulting layouts and panels.",
    processSteps: [
      { label: "01 / CIRCULATION", title: "Set corridors and cores.", detail: "Set corridor geometry to establish unit depth, then place cores and check travel paths." },
      { label: "02 / UNIT OPTIONS", title: "Compare four layout modes.", detail: "Set typical unit sizes and target ratios; generate Random, Alternate, Band, and Corner layouts to compare mix and unique corners." },
      { label: "03 / OPENING LIMITS", title: "Map allowable openings.", detail: "Use property and imaginary property lines to calculate FSD and assign opening limits to facade zones." },
      { label: "04 / PANEL CHOICES", title: "Compose the facade.", detail: "Generate 4 ft and 8 ft panel combinations within the opening limits. Compare four composition modes, partition alignment, and vertical stacking." },
    ],
    slides: [
      { src: "/work/adg/0_MASSING.png", alt: "Stepped base massing used as the input to the ADG pilot", title: "Begin with the team massing", detail: "The team's massing study supplied shared base geometry and program data for the later script." },
      { src: "/work/adg/1_CORRIDOR.png", alt: "Pink circulation lines on the ADG pilot massing", title: "Set corridor geometry", detail: "Corridor paths and widths establish the unit depth before distribution begins." },
      { src: "/work/adg/2_CORE.png", alt: "Three pink core volumes within the ADG pilot massing", title: "Test core locations", detail: "The pilot tests core positions with corridor geometry across the building floors." },
      { src: "/work/adg/2_CORE_PlAN.png", alt: "Diagram of a pilot core with elevators, hall, and stair", title: "Inspect a core module", detail: "A plan-level core diagram makes the space reserved for elevators, circulation, and stair visible." },
      { src: "/work/adg/egress-overview.png", alt: "Core placement and egress route overview", title: "Check egress conditions", detail: "The diagram checks travel distance, dead ends, and exit separation for the three-core option; it is not code certification." },
      { src: "/work/adg/3_UNIT%20LAYOUT_02.png", alt: "Dimensioned studio, one-bedroom, two-bedroom, and penthouse unit types", title: "Define unit size assumptions", detail: "The pilot charts studio, 1BD, 2BD, and penthouse width, depth, and area assumptions before distributing them on the floor plate." },
      { src: "/work/adg/eight-layout-modes.png", alt: "Eight unit layouts across Random, Alternate, Band and Corner modes", title: "Compare four layout modes", detail: "Two recorded seeds for each mode show how choices change the same floor plates. Open the full image to inspect the plans." },
      { src: "/work/adg/3_UNIT%20LAYOUT_03.png", alt: "Bedroom and living-area bands within five pilot unit types", title: "Break units into room bands", detail: "Bedroom and living-area bands show how the unit widths can be subdivided; these are concept-stage room allowances." },
      { src: "/work/adg/3_UNIT%20INTERIOR%20PROGRAMS.png", alt: "Room-level plans within the ADG typical and penthouse unit layouts", title: "Place rooms on the floor plate", detail: "Typical and penthouse plans bring the room bands back to unit frontage and circulation; these remain concept layouts." },
      { src: "/work/adg/sep29-corner-units.png", alt: "Typical and penthouse corner-unit plans from the ADG presentation", title: "Inspect corner-unit layouts", detail: "The presentation snapshot shows actual mix and corner conditions for a typical floor and penthouse; it is an option, not a final building plan." },
      { src: "/work/adg/opening-sw-final.png", alt: "Three-dimensional allowable-opening facade view", title: "Map opening allowances", detail: "An isometric view maps the modeled opening-allowance bands across the facade." },
      { src: "/work/adg/sep29-panel-library.png", alt: "Isometric library of 26 four-foot and eight-foot typical panel types from the ADG presentation", title: "Review the panel library", detail: "The presentation shows 26 typical types: fourteen 4 ft and twelve 8 ft options, including solid panels." },
      { src: "/work/adg/04_Panels.png", alt: "Thirty-six-foot two-bedroom frontage with seven selected panel types and interior wall lines", title: "Coordinate panels and partitions", detail: "A 36 ft two-bedroom example holds interior partitions while swapping 4 ft and 8 ft facade panels." },
      { src: "/work/adg/2BD_36ft_Panel_Stack_L2-L7.png", alt: "A 36-foot two-bedroom facade bay stacked from level 2 to level 7", title: "Check the vertical stack", detail: "The same frontage is reviewed across levels 2–7 to see how panel choices align in elevation." },
      { src: "/work/adg/sep29-building-result.png", alt: "Building-scale ADG facade model shown in the team presentation", title: "Review the building-scale result", detail: "The presentation brings the unit and panel work back to an overall building view; it remains a concept-stage pilot." },
    ],
    galleryGroups: [
      { label: "Base", detail: "Shared massing input", from: 0, to: 1 },
      { label: "Circulation", detail: "Corridors, cores, egress", from: 1, to: 5 },
      { label: "Interiors", detail: "Unit layouts and rooms", from: 5, to: 10, startColumn: 4 },
      { label: "Exteriors", detail: "Openings, panels, building", from: 10, to: 15, startColumn: 8 },
    ],
    clips: [
      { src: "/work/adg/ADG_Corridor_Outline_Centerline_Width_Extend.mp4", poster: "/work/adg/1_CORRIDOR.png", title: "Corridor geometry", detail: "See the corridor outline develop from its centerline, width, and extension controls before core and unit options are tested." },
      { src: "/work/adg/ADG_Core_ALT_12_Return_To_Start.mp4", poster: "/work/adg/2_CORE.png", title: "Core alternatives", detail: "Compare core positions against the corridor network in the same base massing." },
      { src: "/work/adg/ADG_Egress_Final.mp4", poster: "/work/adg/egress-overview.png", title: "Egress review", detail: "Visualize pilot travel-path and exit-separation assumptions; this is a design check, not code approval." },
      { src: "/work/adg/unit-eight-options.mp4", poster: "/work/adg/eight-layout-modes.png", title: "Unit layout alternatives", detail: "Compare Random, Alternate, Band, and Corner distribution modes with two recorded seeds each." },
      { src: "/work/adg/opening-plan-to-facade.mp4", poster: "/work/adg/opening-sw-final.png", title: "Opening allowances", detail: "Follow plan-side opening limits and design caps into a building-scale facade study." },
      { src: "/work/adg/ADG_2BD_Two_8ft_Panel_Swap.mp4", poster: "/work/adg/04_Panels.png", title: "Panel combinations", detail: "Swap 4 ft and 8 ft panels along a 36 ft frontage while keeping the interior wall locations visible." },
      { src: "/work/adg/2BD_AXON_ALT_Synced.mp4", poster: "/work/adg/2BD_36ft_Panel_Stack_L2-L7.png", title: "Rooms to elevation", detail: "See the same two-bedroom frontage in axon as the panel pattern changes across several levels." },
      { src: "/work/adg/ADG_Panel_Seed_1_to_3_Ranked.mp4", poster: "/work/adg/poster.png", title: "Panel-pattern seeds", detail: "Three recorded seeds change the facade distribution and panel-type counts; these are alternatives, not ranked performance results." },
    ],
    followOns: [
      { title: "Environmental review", detail: "The team compared incident radiation on a reference facade and an overhang option.", images: [
        { src: "/work/adg/Panel_Reference_Radiation_SE.png", alt: "Annual solar-radiation visualization of a reference ADG facade", label: "REFERENCE VIEW" },
        { src: "/work/adg/Panel_With_Overhangs_SE.png", alt: "Annual solar-radiation visualization of an ADG overhang option", label: "OVERHANG STUDY" },
      ] },
      { title: "Rhino-to-Revit test", detail: "The team tested a loadable-family handoff from Rhino to Revit.", images: [
        { src: "/work/adg/ADG_Loadable_Handoff_Test_sw.jpg", alt: "Revit axonometric view of the ADG loadable-family handoff test", label: "REVIT MODEL" },
        { src: "/work/adg/ADG_Loadable_Handoff_Test_s%20elevation.jpg", alt: "Revit elevation view of the ADG loadable-family handoff test", label: "REVIT ELEVATION" },
      ] },
      { title: "AI visualization", detail: "An AI-assisted concept view explores the facade at street level.", images: [
        { src: "/work/adg/AI%20Visualization.jpg", alt: "AI-assisted streetscape visualization of the ADG pilot building and facade", label: "ILLUSTRATIVE CONCEPT VISUALIZATION" },
      ] },
    ],
  },
  {
    slug: "five-by-five-bim",
    role: "supporting",
    number: "03",
    category: "WORKFLOW STUDY / RHINO.INSIDE.REVIT",
    title: "5×5 Building: Concept to BIM",
    deck: "Carry parametric geometry and its organization into Revit.",
    context: "5×5 Building workflow study",
    contribution: "Parametric modeling and Rhino.Inside.Revit workflow",
    outcome: "An organized module system transferred into Revit and reviewed in plan, elevation, and model views.",
    tools: "Rhino · Grasshopper · Rhino.Inside.Revit · Revit",
    cover: "/work/revit-study.jpg",
    coverAlt: "5x5 Building parametric facade geometry",
    video: "/work/five-by-five/animation.mp4",
    videoCaption: "Parametric massing sequence — modules respond to design controls",
    question: "How can a model made for exploration become organized BIM geometry?",
    approach: "The study develops a grid-based module system, keeps its components organized in Grasshopper, and places the result into Revit through Rhino.Inside.Revit.",
    result: "The sequence can be followed from Rhino geometry to Revit views and documentation studies.",
    caveat: "Workflow study; no measured delivery-time or data-loss claim is made.",
    processHeading: "From concept to BIM.",
    processIntro: "Define the modules, organize the geometry, and review the result in Revit.",
    processSteps: [
      { label: "01 / CONCEPT MODEL", title: "Control the modules.", detail: "Develop a grid-based building form with parametric pieces that can change together." },
      { label: "02 / MODEL STRUCTURE", title: "Organize the geometry.", detail: "Keep the Grasshopper definition and component groups legible before transfer." },
      { label: "03 / BIM HANDOFF", title: "Place the system in Revit.", detail: "Use Rhino.Inside.Revit to carry the modeled components into a BIM environment." },
      { label: "04 / REVIEW", title: "Check more than a perspective.", detail: "Inspect the result in Revit views, plan, and elevation as a workflow study." },
    ],
    slides: [
      { src: "/work/five-by-five/rhino.jpg", alt: "5x5 Building model in Rhino", title: "Parametric geometry", detail: "The starting model remains editable as a system of modules." },
      { src: "/work/five-by-five/grasshopper.jpg", alt: "Grasshopper data workflow", title: "Organized definition", detail: "The Grasshopper graph organizes the geometry for handoff." },
      { src: "/work/five-by-five/revit.jpg", alt: "5x5 Building facade in Revit", title: "Revit model", detail: "The parametric components appear in a BIM view." },
      { src: "/work/five-by-five/elevation.jpg", alt: "5x5 Building elevation", title: "Elevation", detail: "Review the system as a building elevation." },
      { src: "/work/five-by-five/plan.jpg", alt: "5x5 Building floor plan", title: "Plan", detail: "Inspect the workflow beyond the perspective view." },
    ],
    secondVideo: { src: "/work/five-by-five/diagram.mp4", label: "05 / ASSEMBLY", title: "Watch the handoff.", caption: "Assembly diagram — a second look at how the pieces enter the Revit model" },
  },
];

const technologyProjects: Project[] = [
  {
    "slug": "joseki",
    "role": "featured",
    "number": "00",
    "category": "DESIGN TECHNOLOGY / TOOL DEVELOPMENT",
    "title": "joseki: reusable design knowledge",
    "deck": "Recover useful logic from past projects, understand where it came from, and bring reviewed functions into the next Grasshopper workflow.",
    "context": "Independent development for architectural practice",
    "contribution": "Library workflow, source tracking, package preparation, scoped execution checks, and onboarding",
    "outcome": "A browsable library that connects reusable functions to their source, evidence, and insertion workflow.",
    "tools": "Python 3 / Grasshopper / Rhino.Inside / WPF",
    "cover": "/work/tools/joseki-library.png",
    "coverAlt": "The working joseki Library interface with reusable Moves, source definitions, and insertion controls",
    "question": "How can a team reuse a useful definition without losing its context or assuming it has been tested?",
    "approach": "I separate discovery, archive preparation, execution checks, and reviewed reuse. Source identity and versioned evidence stay attached to each candidate. Independent-user setup keeps the application separate from the user library.",
    "result": "Recorded onboarding acceptance covered preparation, example opening, insertion, and reopening. Three supported functions passed thirteen fixture cases in the recorded distribution check.",
    "caveat": "MVP with scoped acceptance and prerequisites. Prepared packages are not all execution-tested or Ready. These records do not establish firm-wide adoption or a clean-PC installation.",
    "processHeading": "From need to implementation.",
    "processIntro": "The development decisions behind the working tool.",
    "processSteps": [
      {
        "label": "01 / DEVELOPMENT",
        "title": "Find the source.",
        "detail": "Index existing definitions and retain repository and source identity."
      },
      {
        "label": "02 / DEVELOPMENT",
        "title": "Prepare without overclaiming.",
        "detail": "Archive-only preparation preserves scripts and internal connections without executing source components."
      },
      {
        "label": "03 / DEVELOPMENT",
        "title": "Review before reuse.",
        "detail": "Bind supported function reviews to package versions and execution evidence; keep untested packages separate."
      },
      {
        "label": "04 / DEVELOPMENT",
        "title": "Make onboarding repeatable.",
        "detail": "Provide independent library storage, runtime setup, and an extracted application distribution."
      }
    ],
    "slides": [
      {
        "src": "/work/tools/joseki-library.png",
        "alt": "joseki library interface",
        "title": "joseki library interface",
        "detail": "Library workspace showing the reuse workflow."
      },
      {
        "src": "/work/tools/joseki-prepare.png",
        "alt": "Recorded package preparation",
        "title": "Recorded package preparation",
        "detail": "Preparation screenshot from the October 27 onboarding acceptance."
      },
      {
        "src": "/work/tools/joseki-insert.png",
        "alt": "Recorded insertion into Grasshopper",
        "title": "Recorded insertion into Grasshopper",
        "detail": "Insertion screenshot from the same scoped acceptance run."
      }
    ]
  },
  {
    "slug": "rhino-grasshopper-mcp",
    "role": "featured",
    "number": "00",
    "category": "DESIGN TECHNOLOGY / OPEN-SOURCE DEVELOPMENT",
    "title": "Rhino / Grasshopper MCP",
    "deck": "Connect AI assistants to Rhino and Grasshopper for script execution, model generation, and editable parametric workflows.",
    "context": "Self-directed tool development / open-source extension",
    "contribution": "Rhino / Grasshopper MCP integration, scripting workflows, definition analysis, and canvas organization",
    "outcome": "A bridge from conversational modeling requests to Rhino geometry and editable Grasshopper definitions.",
    "tools": "Python / MCP / Grasshopper SDK / RhinoCommon",
    "cover": "/work/mcp/tower-options.jpg",
    "coverAlt": "Tower massing options produced through a Claude Skill and MCP workflow",
    "video": "/work/mcp/graph-demo.mp4",
    "videoCaption": "AI-assisted Rhino and Grasshopper workflow",
    "question": "How can a modeling request become a working Rhino model or Grasshopper definition?",
    "approach": "MCP connects the AI assistant to a live Rhino and Grasshopper session to execute scripts, generate geometry, and edit definitions.",
    "result": "The resulting geometry, parameters, and scripts remain available for continued design work.",
    "caveat": "Building reconstructions are modeling studies of existing architecture. The tower massing workflow also uses a saved Claude Skill. Layout learning and measured port alignment are separate parts of the implementation.",
    "processHeading": "Connect the request to the design tool.",
    "processIntro": "Requests and execution results pass between the assistant and the design tools through the MCP server.",
    "processSteps": [
        {
            "label": "01 / CONNECT",
            "title": "Connect to the session.",
            "detail": "Connect to the live Rhino and Grasshopper session."
        },
        {
            "label": "02 / INSPECT",
            "title": "Read the working context.",
            "detail": "Read model state, component ports, and existing connections."
        },
        {
            "label": "03 / EXECUTE",
            "title": "Run the modeling operation.",
            "detail": "Run scripts or construct connected components."
        },
        {
            "label": "04 / CONTINUE",
            "title": "Keep the result editable.",
            "detail": "Review the result and revise its parameters or logic."
        }
    ],
    "slides": []
},
  {
    "slug": "design-intelligence-platform",
    "role": "featured",
    "number": "00",
    "category": "DESIGN TECHNOLOGY / TOOL DEVELOPMENT",
    "title": "Design Intelligence Platform",
    "deck": "Connect parametric design data to a shared database and a web interface.",
    "context": "Independent development for architectural practice",
    "contribution": "Grasshopper integration, database-backed workflows, and web dashboard development",
    "outcome": "A platform prototype combining a script warehouse, design exploration, and project data.",
    "tools": "Grasshopper / Supabase / PostgreSQL / Next.js / TypeScript",
    "cover": "/work/tools/dip.png",
    "coverAlt": "Design Intelligence Platform overview",
    "question": "How can design parameters remain useful after a Grasshopper session ends?",
    "approach": "The platform connects Grasshopper save and restore workflows to Supabase and a web dashboard. A script warehouse exposes parameters and compatibility; a workflow builder and node canvas explore how scripts can be composed.",
    "result": "The documented interfaces demonstrate a route from design-authoring data to persistent storage and browser-based exploration.",
    "caveat": "Platform development case documented in the technical portfolio. Screenshots do not establish production adoption, security certification, or measured business impact.",
    "processHeading": "From need to implementation.",
    "processIntro": "The development decisions behind the working tool.",
    "processSteps": [
      {
        "label": "01 / DEVELOPMENT",
        "title": "Persist the design state.",
        "detail": "Connect design parameters to a queryable database rather than leaving each iteration in a standalone file."
      },
      {
        "label": "02 / DEVELOPMENT",
        "title": "Expose the information.",
        "detail": "Build dashboard views and script details that make inputs and compatibility readable."
      },
      {
        "label": "03 / DEVELOPMENT",
        "title": "Explore composition.",
        "detail": "Use a workflow builder and node canvas to explore combinations of reusable scripts."
      }
    ],
    "slides": [
      {
        "src": "/work/tools/dip.png",
        "alt": "Design Intelligence Platform overview",
        "title": "Design Intelligence Platform overview",
        "detail": "Documented platform overview connecting design tools and a web interface."
      },
      {
        "src": "/work/tools/dip-builder.png",
        "alt": "Workflow builder interface",
        "title": "Workflow builder interface",
        "detail": "A development interface for decomposing a goal into workflow steps."
      }
    ]
  }
];
export const selectedProjectSlugs = ["adg-massing-pilot", "cal-poly-facade", "joseki", "five-by-five-bim", "rhino-grasshopper-mcp"];
const orderedSlugs = [...selectedProjectSlugs, "design-intelligence-platform"];
export const projects: Project[] = [...architecturalProjects, ...technologyProjects]
  .sort((a, b) => orderedSlugs.indexOf(a.slug) - orderedSlugs.indexOf(b.slug))
  .map((project, index) => ({ ...project, number: String(index + 1).padStart(2, "0"), role: selectedProjectSlugs.includes(project.slug) ? "featured" : "supporting" }));
export const navigationProjects = projects.filter((project) => project.slug !== "design-intelligence-platform");
export function getNextProject(slug: string) {
  const index = navigationProjects.findIndex((project) => project.slug === slug);
  return navigationProjects[(index + 1) % navigationProjects.length];
}
