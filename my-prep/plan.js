// Amin's SAA-C03 sprint: Thu 29 Oct -> exam Tue 10 Nov 2026.
// Single source of truth for the plan. Used by the dashboard, the studybook and the home page.
// Task ticks are stored by the studybook under saa-studybook-v1 -> tasks["<date>:<index>"].
window.EXAM_DATE = "2026-11-10";
window.EXAM_LABEL = "Tue 10 Nov 2026";
window.MOCK_TARGET = 75;   // ready-to-sit signal on the last 2-3 mocks
window.MOCK_REVIEW = 65;   // below this -> spend the next review day on the 2 weakest modules
window.PASS_MARK = 72;     // ~720/1000 scaled

window.PLAN = [
  { date: "2026-10-29", label: "Thu 29 Oct", kind: "learn", title: "Application Integration + Monitoring", hours: "4–5 h SAA",
    domain: "Resilient + Secure", topics: ["integration", "monitor"], drill: ["Application Integration", "Monitoring"],
    playbooks: ["integration", "monitoring"],
    cantrill: ["Serverless & Application Services (SQS, SNS, EventBridge, Step Functions, API Gateway)", "CloudWatch, CloudTrail and Config lessons"],
    repo: ["08 Application Integration", "09 Monitoring"],
    tasks: [
      "Integration playbook: lessons 1–6, then the game and the quiz.",
      "Monitoring playbook: all lessons, game and quiz.",
      "Repo: read 08 and 09 FAST-LEARN, then do both PRACTICE-QUESTIONS files.",
      "Studybook: drill Application Integration + Monitoring, 20 questions each.",
      "Flashcards: Integration + Monitoring decks until every card is 'Got it'."
    ] },
  { date: "2026-10-30", label: "Fri 30 Oct", kind: "learn", title: "Migration & Transfer", hours: "4 h SAA",
    domain: "Resilient + Cost", topics: ["migration", "blockfile"], drill: ["Migration"],
    playbooks: ["migration"],
    cantrill: ["Hybrid Environments & Migration (DMS, SCT, MGN, DataSync, Snow, Transfer Family)"],
    repo: ["10 Migration"],
    tasks: [
      "Migration playbook: all lessons, the transfer-time calculator, game and quiz.",
      "Know the 7 Rs and which AWS service fits each one without notes.",
      "Repo: 10 Migration FAST-LEARN + PRACTICE-QUESTIONS.",
      "Studybook: drill Migration (both banks).",
      "Review: yesterday's missed Integration/Monitoring questions."
    ] },
  { date: "2026-10-31", label: "Sat 31 Oct", kind: "learn", title: "Analytics + Cost Optimization", hours: "4–5 h SAA",
    domain: "Performant + Cost", topics: ["analytics", "cost"], drill: ["Analytics", "Cost Optimization"],
    playbooks: ["analytics", "cost"],
    cantrill: ["Kinesis, Athena, Glue, Redshift, EMR lessons", "Billing, Budgets, Savings Plans lessons"],
    repo: ["11 Analytics", "13 Cost Optimization"],
    tasks: [
      "Analytics playbook: redo the quiz; target 16/20. Re-read lesson 2 if not.",
      "Cost Optimization playbook: all lessons, game and quiz.",
      "Repo: 11 Analytics + 11 AWS-ML-SERVICES-NOTES (10 min) + 13 Cost Optimization FAST-LEARN.",
      "Studybook: drill Analytics + Cost Optimization (both banks).",
      "All modules covered. Log module confidence on the dashboard."
    ] },
  { date: "2026-11-01", label: "Sun 1 Nov", kind: "mock", mock: 1, title: "Mock #1 + first review", hours: "3–3.5 h SAA · 2 h chess",
    domain: "All four", topics: ["exam"], drill: [],
    playbooks: [],
    cantrill: ["Only lessons behind the questions you miss"],
    repo: ["14 Practice"],
    tasks: [
      "Tutorials Dojo timed set 1: 65 questions, 130 min, exam conditions.",
      "Log the score and per-domain result on the dashboard.",
      "Quick pass over wrong answers (deep review is tomorrow).",
      "Flashcards: 'Again' pile, 15 min."
    ] },
  { date: "2026-11-02", label: "Mon 2 Nov", kind: "review", title: "Deep review of mock #1", hours: "2.5–3 h SAA · 2 h chess",
    domain: "Weak areas", topics: ["exam"], drill: [],
    playbooks: [],
    cantrill: ["Lessons for the 2 weakest modules"],
    repo: ["14 Practice", "exam-reviews"],
    tasks: [
      "Every wrong AND guessed answer: write one line on why the right option wins.",
      "Open the playbook for your weakest module; redo its quiz.",
      "If mock #1 < 65%: drill the 2 weakest modules 'Missed only' in the studybook.",
      "Flashcards: 'Again' pile."
    ] },
  { date: "2026-11-03", label: "Tue 3 Nov", kind: "mock", mock: 2, title: "Mock #2", hours: "3–3.5 h SAA · 2 h chess",
    domain: "All four", topics: ["exam"], drill: [],
    playbooks: [],
    cantrill: [],
    repo: ["14 Practice"],
    tasks: [
      "Tutorials Dojo timed set 2: 65 questions, 130 min.",
      "Log the score and per-domain result on the dashboard.",
      "Quick pass over wrong answers."
    ] },
  { date: "2026-11-04", label: "Wed 4 Nov", kind: "review", title: "Review #2 + serverless & containers", hours: "3 h SAA · 2 h chess",
    domain: "Weak areas + Compute", topics: ["compute"], drill: ["Compute"],
    playbooks: ["serverless"],
    cantrill: ["Containers & ECS, Lambda lessons (only if the playbook quiz < 75%)"],
    repo: ["03 Compute"],
    tasks: [
      "Deep review of mock #2 wrong + guessed answers.",
      "Serverless & Containers playbook: Lambda limits, ECS vs EKS vs Fargate, game and quiz.",
      "Weakest module playbook: redo its quiz.",
      "Flashcards: 'Again' pile."
    ] },
  { date: "2026-11-05", label: "Thu 5 Nov", kind: "mock", mock: 3, title: "Mock #3 (Mock Exam A)", hours: "3–3.5 h SAA · 2 h chess",
    domain: "All four", topics: ["exam"], drill: [],
    playbooks: ["mock-a"],
    cantrill: [],
    repo: ["14 Practice"],
    tasks: [
      "Mock Exam A (original questions, fresh): 65 questions, 130 min.",
      "It saves its own result; also log it on the dashboard.",
      "Quick pass over wrong answers."
    ] },
  { date: "2026-11-06", label: "Fri 6 Nov", kind: "review", title: "Review #3 + weakest domain", hours: "3 h SAA · 2 h chess",
    domain: "Weak areas", topics: ["exam", "dr"], drill: ["Architecture Patterns"],
    playbooks: ["architecture"],
    cantrill: ["Lessons for the 2 weakest modules"],
    repo: ["12 Architecture Patterns"],
    tasks: [
      "Deep review of mock #3 wrong + guessed answers.",
      "Architecture playbook: DR strategy picker + quiz (HA/DR shows up everywhere).",
      "Dashboard: check the domain trend. Drill the lowest domain 'Missed only'.",
      "Decoder: run through every entry once."
    ] },
  { date: "2026-11-07", label: "Sat 7 Nov", kind: "mock", mock: 4, title: "Mock #4", hours: "3–3.5 h SAA · 2 h chess",
    domain: "All four", topics: ["exam"], drill: [],
    playbooks: [],
    cantrill: [],
    repo: ["14 Practice"],
    tasks: [
      "Tutorials Dojo timed set 3: 65 questions, 130 min.",
      "Log the score and per-domain result on the dashboard.",
      "Review wrong + guessed answers the same day."
    ] },
  { date: "2026-11-08", label: "Sun 8 Nov", kind: "mock", mock: 5, title: "Mock #5 + go / no-go", hours: "3.5 h SAA · 1 h chess",
    domain: "All four", topics: ["exam"], drill: [],
    playbooks: [],
    cantrill: [],
    repo: ["14 Practice"],
    tasks: [
      "Morning: Tutorials Dojo timed set 4 (or Studybook mock).",
      "Log it, review wrong + guessed answers.",
      "Go / no-go: mocks #4 and #5 both ≥ 72% → go. Both < 65% → reschedule today (must be > 24 h before the appointment).",
      "Check Pearson VUE confirmation, ID, system test if online."
    ] },
  { date: "2026-11-09", label: "Mon 9 Nov", kind: "light", title: "Light review, then stop", hours: "2 h, stop by 18:00 · no chess",
    domain: "Everything, lightly", topics: ["exam"], drill: [],
    playbooks: [],
    cantrill: [],
    repo: ["docs/reference/QUICK-REFERENCE.md"],
    tasks: [
      "Flashcards: 'Again' pile only.",
      "Read the cheat sheet at the end of each playbook (13 × ~3 min).",
      "Re-read Exam strategy in the studybook Notes.",
      "Stop by 18:00. Eat, walk, sleep 8 h."
    ] }
];

window.EXAM_DAY = [
  "No new material. 20 minutes on the Decoder and 'Again' flashcards at most.",
  "Arrive 30 min early with ID (online: clear desk, run check-in early).",
  "Pass 1: answer everything, flag anything over ~2.5 min. Pass 2: flags. Never leave a blank.",
  "Read the last sentence first and anchor on the qualifier: cost, least overhead, availability, performance."
];

// Playbook registry: id -> file, title, modules, storage prefix.
window.PLAYBOOKS = [
  { id: "iam",          file: "playbooks/iam.html",          title: "IAM",                    module: "02", prefix: "iampb",  lessons: 8, quiz: 12 },
  { id: "security",     file: "playbooks/security.html",     title: "Security",               module: "07", prefix: "secpb",  lessons: 9, quiz: 17 },
  { id: "networking",   file: "playbooks/networking.html",   title: "Networking",             module: "06", prefix: "netpb",  lessons: 8, quiz: 18 },
  { id: "storage",      file: "playbooks/storage.html",      title: "Storage",                module: "04", prefix: "stopb",  lessons: 9, quiz: 20 },
  { id: "ec2",          file: "playbooks/ec2.html",          title: "EC2 & scaling",          module: "03", prefix: "ec2pb",  lessons: 8, quiz: 20 },
  { id: "serverless",   file: "playbooks/serverless.html",   title: "Serverless & containers",module: "03", prefix: "srvpb",  lessons: 7, quiz: 20 },
  { id: "database",     file: "playbooks/database.html",     title: "Database",               module: "05", prefix: "dbpb",   lessons: 7, quiz: 20 },
  { id: "integration",  file: "playbooks/integration.html",  title: "App Integration",        module: "08", prefix: "intpb",  lessons: 8, quiz: 20 },
  { id: "monitoring",   file: "playbooks/monitoring.html",   title: "Monitoring",             module: "09", prefix: "monpb",  lessons: 7, quiz: 20 },
  { id: "migration",    file: "playbooks/migration.html",    title: "Migration & Transfer",   module: "10", prefix: "migpb",  lessons: 7, quiz: 20 },
  { id: "analytics",    file: "playbooks/analytics.html",    title: "Analytics",              module: "11", prefix: "anapb",  lessons: 6, quiz: 20 },
  { id: "architecture", file: "playbooks/architecture.html", title: "Architecture patterns",  module: "12", prefix: "archpb", lessons: 8, quiz: 20 },
  { id: "cost",         file: "playbooks/cost.html",         title: "Cost Optimization",      module: "13", prefix: "costpb", lessons: 7, quiz: 20 }
];

window.MODULES = [
  ["01", "AWS Fundamentals", "01-AWS-Fundamentals"], ["02", "IAM", "02-IAM"], ["03", "Compute", "03-Compute"],
  ["04", "Storage", "04-Storage"], ["05", "Database", "05-Database"], ["06", "Networking", "06-Networking"],
  ["07", "Security", "07-Security"], ["08", "Application Integration", "08-Application-Integration"],
  ["09", "Monitoring", "09-Monitoring"], ["10", "Migration & Transfer", "10-Migration"], ["11", "Analytics", "11-Analytics"],
  ["12", "Architecture Patterns", "12-Architecture-Patterns"], ["13", "Cost Optimization", "13-Cost-Optimization"],
  ["14", "Practice", "14-Practice"]
];
