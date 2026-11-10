// Verified facts with sources. Every entry was read from the linked page; dates are publication or event dates.
export const SRC = {
  cfbd: { n: "CollegeFootballData.com", u: "https://collegefootballdata.com", d: "pulled 2026-11-10" },
  ewTracker: { n: "Eleven Warriors portal tracker", u: "https://www.elevenwarriors.com/ohio-state-football/2026/01/160827/ohio-state-transfer-portal-tracker-quarterback-lincoln-kienholz-tight-end-jelani-thurman-and-defensive-back-bryce", d: "2026-01-28" },
  ewMartin: { n: "Eleven Warriors", u: "https://www.elevenwarriors.com/ohio-state-football-recruiting/2026/01/161074/former-maryland-and-ucla-quarterback-justyn-martin-transferring-to-ohio-state", d: "2026-01-12" },
  ewMoore: { n: "Eleven Warriors", u: "https://www.elevenwarriors.com/ohio-state-football-recruiting/2026/01/161116/former-duke-safety-terry-moore-transferring-to-ohio-state", d: "2026-01-12" },
  osuMoore: { n: "Ohio State roster · Terry Moore", u: "https://ohiostatebuckeyes.com/sports/football/roster/terry-moore/13352", d: "2026" },
  cleMoore: { n: "cleveland.com", u: "https://www.cleveland.com/osu/2026/10/ohio-state-football-adds-2-defensive-starters-to-injury-report-before-maryland-game.html", d: "2026-10-09" },
  ewDiomede: { n: "Eleven Warriors", u: "https://www.elevenwarriors.com/ohio-state-football-recruiting/2026/02/161536/ohio-state-adds-kicker-depth-with-notre-dame-walk-on-transfer-marcello-diomede", d: "2026-02-10" },
  bsbDiomede: { n: "Buckeye Sports Bulletin", u: "https://buckeyesports.com/ohio-state-kicker-marcello-diomede-sheds-black-stripe/", d: "2026-10-29" },
  tentv: { n: "10TV", u: "https://www.10tv.com/article/sports/football/ohio-state-football/julian-sayin-injury-ohio-state-indiana-ryan-day-luke-fahey/530-04e36e58-7ee5-4143-a0fd-162622f5b0c2", d: "2026-10-17" },
  athOct20: { n: "The Athletic", u: "https://www.nytimes.com/athletic/7707857/2026/10/20/ohio-state-julian-sayin-injury-update/", d: "2026-10-20" },
  rabin: { n: "Bill Rabinowitz (Substack)", u: "https://billrabinowitz.substack.com/p/exclusive-ive-learned-details-about", d: "Nov. 2026" },
  clutch: { n: "ClutchPoints", u: "https://clutchpoints.com/ncaa-football/ohio-state-football-rumors-julian-sayin-suffered-elbow-fracture-that-required-surgery", d: "2026-11-06" },
  heavyFahey: { n: "Heavy", u: "https://heavy.com/sports/college-football/ohio-state-buckeyes/when-julian-sayin-coming-back-injury-return-timeline-ohio-state-qb/", d: "2026-11-10" },
  dispatch: { n: "Columbus Dispatch", u: "https://www.dispatch.com/story/sports/college/football/2026/10/17/ohio-state-responds-to-luke-fahey-replacing-julian-sayin-after-indiana-injury/92231885007/", d: "2026-10-17" },
  cleScout: { n: "cleveland.com", u: "https://www.cleveland.com/osu/2026/09/why-ohio-state-football-is-considering-a-package-to-get-its-scout-team-quarterback-on-the-field.html", d: "2026-09-25" },
  staubWire: { n: "Buffaloes Wire (USA Today)", u: "https://coloradobuffaloeswire.usatoday.com/story/sports/college/buffaloes/football/2026/01/09/ryan-staub-transfer-portal-ohio-state-kentucky-cincinnati/88102190007", d: "2026-01-09" },
  staub247: { n: "247Sports", u: "https://247sports.com/college/tennessee/article/ryan-staub-tennessee-recruiting-colorado-qb-transfer-commits-to-ut-excited-to-be-a-vol-271511136/", d: "2026-01-18" },
  potter247: { n: "247Sports", u: "https://247sports.com/player/jaxon-potter-46102064/college-354637", d: "2026-01-09" },
  ncaaWin: { n: "NCAA transfer windows (PDF)", u: "https://ncaaorg.s3.amazonaws.com/compliance/d1/D1Comp_UndergraduateTransferWindows.pdf", d: "2026" },
  athNov10: { n: "The Athletic", u: "https://www.nytimes.com/athletic/7768863/2026/11/10/ohio-state-oregon-takeaways-ryan-day/", d: "2026-11-10" },
  day247: { n: "247Sports", u: "https://247sports.com/college/ohio-state/article/ryan-day-goes-in-depth-on-julian-sayin-tavien-st-clair-rest-of-ohio-states-qb-room-273225224/", d: "2026-02-04" },
};

// Per-player verified notes (transfer class). s = source keys.
export const NOTES = {
  "Justyn Martin": [["Committed Jan. 12, 2026 after a Jan. 10 visit; fifth-year senior; previous schools Maryland and UCLA.", ["ewTracker", "ewMartin"]], ["Coach Day wanted four scholarship quarterbacks; Martin fills the fourth spot.", ["ewMartin"]], ["Scout-team quarterback in September; Fahey was the backup and St. Clair third.", ["cleScout"]]],
  "Ja'Kobi Jackson": [["Committed Jan. 15, 2026. Seventh-year senior; granted an additional year for 2026.", ["ewTracker"]], ["Season-ending injury in 2025 after 27 carries for 98 yards in four games.", ["ewTracker"]]],
  "Devin McCuin": [["Committed Jan. 7, 2026. 726 receiving yards at UTSA in 2025.", ["ewTracker"]]],
  "Kyle Parker": [["Committed Jan. 16, 2026; joined his LSU receivers coach Cortez Hankton.", ["ewTracker"]]],
  "Hunter Welcing": [["Committed Jan. 12, 2026. Seventh-year senior with one year left; visited Jan. 9.", ["ewTracker"]]],
  "Mason Williams": [["Committed Jan. 4, 2026 after a transfer visit.", ["ewTracker"]]],
  "Vasean Washington": [["Committed Jan. 28, 2026. Fifth-year senior with one season left; started at right tackle in 2025 and also played guard.", ["ewTracker"]], ["Reported as allowing zero sacks in eight games (reported claim; not charted data we can verify).", ["ewTracker"]], ["Dartmouth is FCS; CFBD has no line stats for him.", ["cfbd"]]],
  "Qua Russaw": [["Committed Jan. 12, 2026 after visiting Jan. 8 with James Smith.", ["ewTracker"]], ["Listed EDGE in the portal and DE on the 2026 roster.", ["cfbd"]]],
  "James Smith": [["Committed Jan. 12, 2026 after visiting Jan. 8 with Qua Russaw.", ["ewTracker"]], ["Listed DL in the portal and DT on the 2026 roster.", ["cfbd"]]],
  "John Walker": [["Committed Jan. 6, 2026. Identified Jan. 5 as a remaining target after Horace Lockett withdrew from the portal; former top-100 recruit.", ["ewTracker"]]],
  "Christian Alliegro": [["Committed Jan. 8, 2026 after a Jan. 6 visit; had also visited Texas.", ["ewTracker"]], ["Listed questionable before the Maryland game (Oct. 10).", ["cleMoore"]]],
  "Cam Calhoun": [["Committed Jan. 15, 2026. Redshirt junior; previous schools Alabama, Utah, Michigan.", ["ewTracker"]], ["Listed as Cameron Calhoun in CFBD.", ["cfbd"]]],
  "Dominick Kelly": [["Committed Jan. 15, 2026. Sophomore, four-star prospect.", ["ewTracker"]]],
  "Earl Little Jr.": [["Committed Jan. 11, 2026. Second-team All-ACC in 2025; described as a likely replacement for Caleb Downs.", ["ewTracker"]]],
  "Terry Moore": [["Committed Jan. 12, 2026 with one year of eligibility.", ["ewMoore"]], ["Missed all of 2025 with a torn ACL suffered Jan. 2, 2025.", ["ewMoore"]], ["Described as a reserve and listed questionable before the Maryland game (Oct. 10).", ["cleMoore"]], ["Opener vs. Ball State: one tackle on 18 total plays (only snap count we found).", ["osuMoore"]]],
  "Connor Hawkins": [["Committed Jan. 13, 2026. 18 of 22 field goals as a redshirt freshman at Baylor, long of 54.", ["ewTracker"]]],
  "Marcello Diomede": [["Committed Feb. 10, 2026 as a walk-on from Notre Dame (not in the January tracker).", ["ewDiomede"]], ["Primary kickoff specialist: 48 kickoffs, 38 touchbacks through seven games.", ["bsbDiomede"]]],
  "Brady Young": [["Committed Jan. 21, 2026 as a walk-on punter; previous schools Houston Christian and Cincinnati.", ["ewTracker"]]],
  "Dalton Riggs": [["Committed Jan. 4, 2026 to replace long snapper John Ferlmann; previous schools UCF and BYU.", ["ewTracker"]], ["The same tracker also lists walk-on long snapper Landon Beal (Maine), who is not in the 19-player list.", ["ewTracker"]]],
};

// Reported Ohio State pursuit (from public reporting only). Used for "acquisition feasibility".
export const PURSUIT = {
  qb: { "Justyn Martin": ["Signed", "Visited Jan. 10; committed Jan. 12", ["ewTracker"]], "Ryan Staub": ["Visit", "Scheduled visit Jan. 8; committed to Tennessee Jan. 18; reportedly looking to start", ["ewTracker", "staubWire", "staub247"]], "Jaxon Potter": ["Offer", "Announced an Ohio State offer Jan. 5; committed to Old Dominion Jan. 9", ["ewTracker", "potter247"]] },
  dl: {
    "Qua Russaw": ["Signed", "Visited Jan. 8; committed Jan. 12", ["ewTracker"]], "James Smith": ["Signed", "Visited Jan. 8; committed Jan. 12", ["ewTracker"]], "John Walker": ["Signed", "Named a target Jan. 5; committed Jan. 6", ["ewTracker"]],
    "Chaz Coleman": ["Visit", "Visited Jan. 6; committed to Tennessee over Ohio State Jan. 10", ["ewTracker"]], "Francis Brewu": ["Visit", "Visited Jan. 10; committed to Notre Dame Jan. 13", ["ewTracker"]], "Brandon Davis-Swain": ["Visit set", "Official visit set for Jan. 12; committed to Texas A&M Jan. 5", ["ewTracker"]],
    "Antonio O'Berry": ["Visit planned", "Planned Jan. 2 visit; committed to Kentucky Jan. 4", ["ewTracker"]], "Horace Lockett": ["Visit planned", "Withdrew from the portal Jan. 5 and stayed at UCF", ["ewTracker"]], "Sahir West": ["Interest", "Ohio State hoped to land him; chose UCLA", ["ewTracker"]],
    "Devan Thompkins": ["Interest", "Named Ohio State among five standouts Jan. 2", ["ewTracker"]], "Jayden Woods": ["Interest", "Ohio State among schools of interest Jan. 4", ["ewTracker"]], "Damon Wilson": ["Loose link", "Loosely connected", ["ewTracker"]], "Mandrell Desir": ["Loose link", "Loosely connected; did not visit", ["ewTracker"]], "Darryll Desir": ["Loose link", "Loosely connected; did not visit", ["ewTracker"]],
  },
};
