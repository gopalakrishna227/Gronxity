// ====================================================================
// Seed Script – populates dummy data for local development
// --------------------------------------------------------------------
// Collections seeded:
//   • users        (50 students, across 10 skill archetypes)
//   • recruiters   (10 recruiters)
//   • jobs         (50 published jobs, role-specific skills)
//   • jobapplications (50 applications linking students → jobs)
//   • courses      (50 courses, owned by random students)
//   • posts        (50 posts, owned by random students)
//
// Run:
//   node seed.js
//
// Flags:
//   --drop    Wipe all seeded collections before inserting (safe re-run)
// ====================================================================

/*require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const DROP = process.argv.includes("--drop");
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/gronxtiy";

// ─── helpers ─────────────────────────────────────────────────────────
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pickN = (arr, n) =>
  [...arr].sort(() => Math.random() - 0.5).slice(0, n);
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// ─── name / company pools ─────────────────────────────────────────────
const FIRST_NAMES = [
  "Aarav","Aditi","Amit","Ananya","Arjun","Bhavya","Chirag","Deepika",
  "Divya","Gaurav","Harsha","Ishaan","Kavya","Kiran","Lakshmi","Manoj",
  "Meera","Nisha","Om","Pooja","Priya","Rahul","Ravi","Ritika","Rohit",
  "Sakshi","Sanjay","Sara","Sneha","Sonu","Suresh","Swathi","Tanvi",
  "Uday","Uma","Varun","Vidya","Vijay","Vishal","Yash",
];
const LAST_NAMES = [
  "Sharma","Verma","Patel","Kumar","Reddy","Nair","Iyer","Gupta","Singh",
  "Mehta","Joshi","Rao","Desai","Chopra","Mishra","Pillai","Bose","Das",
  "Kapoor","Trivedi",
];
const COMPANIES = [
  "TechNova","Infosys","Wipro","HCL Technologies","Tata Consultancy Services",
  "Accenture India","Cognizant","Capgemini","Mindtree","Mphasis",
];

// ─── role-specific job definitions ───────────────────────────────────
// Each entry: title, department, skills (required), responsibilities, qualifications, description snippet
const JOB_DEFINITIONS = [
  {
    title: "Frontend Developer",
    department: "Engineering",
    skills: ["React","JavaScript","TypeScript","HTML","CSS","Next.js","Redux"],
    coreSkill: "React",
    responsibilities: [
      "Build responsive, accessible UI components with React",
      "Collaborate with designers to translate Figma mockups into code",
      "Optimise page load performance and Core Web Vitals",
      "Write unit and integration tests using Jest and React Testing Library",
    ],
    qualifications: [
      "Strong proficiency in React and modern JavaScript (ES6+)",
      "Experience with TypeScript and CSS-in-JS / Tailwind",
      "Familiarity with REST APIs and browser developer tools",
      "Eye for pixel-perfect, accessible UI",
    ],
  },
  {
    title: "React Developer",
    department: "Engineering",
    skills: ["React","JavaScript","TypeScript","Next.js","Redux","HTML","CSS","GraphQL"],
    coreSkill: "React",
    responsibilities: [
      "Develop and maintain React-based single-page applications",
      "Implement state management with Redux or Zustand",
      "Integrate GraphQL APIs and REST endpoints",
      "Participate in sprint planning and code reviews",
    ],
    qualifications: [
      "2+ years of React development experience",
      "Solid understanding of component lifecycle and hooks",
      "Experience with Next.js and server-side rendering",
      "Ability to write clean, reusable code",
    ],
  },
  {
    title: "Backend Developer",
    department: "Engineering",
    skills: ["Node.js","Express","Python","PostgreSQL","MongoDB","Redis","REST API","Docker"],
    coreSkill: "Node.js",
    responsibilities: [
      "Design and build RESTful and GraphQL APIs",
      "Optimise database queries and schema for performance",
      "Implement authentication, authorization, and rate limiting",
      "Containerise services with Docker and deploy to cloud",
    ],
    qualifications: [
      "Strong proficiency in Node.js or Python backend frameworks",
      "Experience with relational and NoSQL databases",
      "Understanding of caching strategies with Redis",
      "Familiarity with CI/CD and containerisation",
    ],
  },
  {
    title: "Node.js Developer",
    department: "Engineering",
    skills: ["Node.js","Express","JavaScript","TypeScript","MongoDB","PostgreSQL","REST API","Redis"],
    coreSkill: "Node.js",
    responsibilities: [
      "Develop high-performance Node.js microservices",
      "Design RESTful API contracts and OpenAPI specs",
      "Implement event-driven architecture with message queues",
      "Monitor service health and resolve production incidents",
    ],
    qualifications: [
      "Proficiency in Node.js and Express or Fastify",
      "Experience with MongoDB and PostgreSQL",
      "Knowledge of asynchronous patterns and streams",
      "Understanding of 12-factor app principles",
    ],
  },
  {
    title: "Full Stack Developer",
    department: "Engineering",
    skills: ["React","Node.js","JavaScript","TypeScript","MongoDB","PostgreSQL","Express","Docker"],
    coreSkill: "React",
    responsibilities: [
      "Build end-to-end features across React frontend and Node.js backend",
      "Design database schemas and REST API contracts",
      "Set up Docker Compose environments for local development",
      "Conduct code reviews and mentor junior team members",
    ],
    qualifications: [
      "Proficiency in both React and Node.js",
      "Experience designing MongoDB or PostgreSQL schemas",
      "Familiarity with Docker and cloud deployment",
      "Strong problem-solving and communication skills",
    ],
  },
  {
    title: "Python Developer",
    department: "Engineering",
    skills: ["Python","Django","Flask","PostgreSQL","REST API","Celery","Redis","Docker"],
    coreSkill: "Python",
    responsibilities: [
      "Build and maintain Django/Flask web applications and APIs",
      "Design PostgreSQL schemas and write optimised ORM queries",
      "Implement background tasks with Celery and Redis",
      "Write comprehensive test suites with pytest",
    ],
    qualifications: [
      "Strong Python skills and experience with Django or Flask",
      "Proficiency with PostgreSQL and SQL",
      "Experience with asynchronous task queues",
      "Familiarity with REST API design principles",
    ],
  },
  {
    title: "Data Scientist",
    department: "Data Science",
    skills: ["Python","Pandas","NumPy","Scikit-learn","TensorFlow","SQL","Jupyter","Matplotlib"],
    coreSkill: "Python",
    responsibilities: [
      "Develop and validate machine learning models for business problems",
      "Perform exploratory data analysis and feature engineering",
      "Build data pipelines using Pandas and SQL",
      "Communicate model insights and metrics to stakeholders",
    ],
    qualifications: [
      "Strong Python skills with Pandas, NumPy, and Scikit-learn",
      "Experience building and evaluating ML models",
      "Proficiency with SQL for data extraction",
      "Ability to visualise results with Matplotlib or Seaborn",
    ],
  },
  {
    title: "Machine Learning Engineer",
    department: "Data Science",
    skills: ["Python","TensorFlow","PyTorch","Scikit-learn","Pandas","NumPy","Docker","Kubernetes"],
    coreSkill: "Python",
    responsibilities: [
      "Design, train, and deploy deep learning and classical ML models",
      "Build MLOps pipelines for model versioning, monitoring, and retraining",
      "Optimise model inference latency for production serving",
      "Collaborate with data scientists to productionise experiments",
    ],
    qualifications: [
      "Strong proficiency in Python, TensorFlow, and/or PyTorch",
      "Experience with Scikit-learn and Pandas for data preprocessing",
      "Knowledge of model serving and containerisation with Docker",
      "Understanding of statistical modelling and evaluation metrics",
    ],
  },
  {
    title: "Data Analyst",
    department: "Analytics",
    skills: ["SQL","Python","Tableau","Power BI","Excel","Pandas","Data Analysis","Statistics"],
    coreSkill: "SQL",
    responsibilities: [
      "Write complex SQL queries to extract and transform business data",
      "Build interactive dashboards in Tableau and Power BI",
      "Perform statistical analysis to identify trends and patterns",
      "Present findings to non-technical stakeholders",
    ],
    qualifications: [
      "Advanced SQL proficiency (window functions, CTEs)",
      "Experience with Tableau or Power BI dashboard creation",
      "Familiarity with Python or R for data wrangling",
      "Strong analytical and storytelling skills",
    ],
  },
  {
    title: "Business Analyst",
    department: "Product",
    skills: ["SQL","Tableau","Power BI","Agile","Scrum","JIRA","Excel","Data Analysis"],
    coreSkill: "SQL",
    responsibilities: [
      "Gather and document business requirements from stakeholders",
      "Analyse operational data and produce actionable reports",
      "Manage product backlog and facilitate sprint ceremonies",
      "Bridge communication between business and engineering teams",
    ],
    qualifications: [
      "Proficiency in SQL and business intelligence tools",
      "Experience working in Agile/Scrum environments",
      "Strong documentation and requirement-gathering skills",
      "Excellent communication and stakeholder management",
    ],
  },
  {
    title: "DevOps Engineer",
    department: "DevOps",
    skills: ["Docker","Kubernetes","AWS","Linux","CI/CD","Terraform","Ansible","Git"],
    coreSkill: "Kubernetes",
    responsibilities: [
      "Design and maintain CI/CD pipelines with GitHub Actions or Jenkins",
      "Manage Kubernetes clusters and Helm chart deployments",
      "Provision cloud infrastructure using Terraform",
      "Monitor system health, set up alerting, and handle incidents",
    ],
    qualifications: [
      "Hands-on experience with Docker and Kubernetes",
      "Proficiency in cloud platforms (AWS, GCP, or Azure)",
      "Experience writing infrastructure-as-code with Terraform",
      "Strong Linux administration and scripting skills",
    ],
  },
  {
    title: "Cloud Engineer",
    department: "Cloud Infrastructure",
    skills: ["AWS","GCP","Azure","Kubernetes","Docker","Terraform","Linux","Networking"],
    coreSkill: "AWS",
    responsibilities: [
      "Architect and implement scalable cloud infrastructure across AWS/GCP/Azure",
      "Implement security best practices, IAM policies, and compliance controls",
      "Optimise cloud costs through right-sizing and reserved instances",
      "Automate provisioning and configuration with Terraform and Ansible",
    ],
    qualifications: [
      "Cloud certification (AWS Solutions Architect or GCP Professional preferred)",
      "Experience with multi-cloud or hybrid cloud architectures",
      "Proficiency in Terraform and containerised deployments",
      "Knowledge of networking, VPCs, and load balancers",
    ],
  },
  {
    title: "UI/UX Designer",
    department: "Design",
    skills: ["Figma","Adobe XD","HTML","CSS","User Research","Prototyping","Wireframing","Accessibility"],
    coreSkill: "Figma",
    responsibilities: [
      "Create wireframes, prototypes, and high-fidelity designs in Figma",
      "Conduct user research, usability testing, and A/B tests",
      "Develop and maintain a consistent design system",
      "Collaborate with frontend engineers to ensure pixel-perfect implementation",
    ],
    qualifications: [
      "Strong portfolio demonstrating UI/UX design process",
      "Proficiency in Figma and/or Adobe XD",
      "Experience with user research methodologies",
      "Basic HTML/CSS knowledge for design handoff",
    ],
  },
  {
    title: "Mobile Developer (Flutter)",
    department: "Mobile",
    skills: ["Flutter","Dart","Firebase","REST API","Android SDK","iOS SDK","Riverpod","Bloc"],
    coreSkill: "Flutter",
    responsibilities: [
      "Build cross-platform mobile apps for Android and iOS using Flutter",
      "Integrate Firebase for authentication, Firestore, and push notifications",
      "Implement state management with Riverpod or Bloc",
      "Optimise app performance and reduce bundle size",
    ],
    qualifications: [
      "Strong Dart and Flutter proficiency",
      "Experience publishing apps to Google Play and App Store",
      "Familiarity with Firebase services",
      "Understanding of mobile UX guidelines (Material Design & HIG)",
    ],
  },
  {
    title: "Android Developer",
    department: "Mobile",
    skills: ["Kotlin","Java","Android SDK","Jetpack Compose","Firebase","REST API","MVVM","Coroutines"],
    coreSkill: "Kotlin",
    responsibilities: [
      "Develop native Android applications using Kotlin and Jetpack Compose",
      "Implement MVVM architecture with LiveData and ViewModel",
      "Integrate RESTful APIs using Retrofit and coroutines",
      "Profile and optimise app performance and battery usage",
    ],
    qualifications: [
      "Proficiency in Kotlin and Android SDK",
      "Experience with Jetpack libraries (Compose, Navigation, Room)",
      "Understanding of the Android app lifecycle",
      "Published apps on Google Play preferred",
    ],
  },
  {
    title: "iOS Developer",
    department: "Mobile",
    skills: ["Swift","Objective-C","iOS SDK","SwiftUI","Firebase","REST API","CoreData","Xcode"],
    coreSkill: "Swift",
    responsibilities: [
      "Build native iOS applications using Swift and SwiftUI",
      "Integrate backend services with REST APIs using URLSession or Alamofire",
      "Implement data persistence with CoreData or Realm",
      "Ensure compatibility across multiple iOS versions and device sizes",
    ],
    qualifications: [
      "Strong Swift and iOS SDK knowledge",
      "Experience with SwiftUI and UIKit",
      "Familiarity with Apple Human Interface Guidelines",
      "Published apps on the App Store preferred",
    ],
  },
  {
    title: "Java Developer",
    department: "Engineering",
    skills: ["Java","Spring Boot","Microservices","PostgreSQL","REST API","Maven","Kafka","Docker"],
    coreSkill: "Java",
    responsibilities: [
      "Design and build Java Spring Boot microservices",
      "Implement event-driven communication with Kafka",
      "Write performant PostgreSQL queries and manage migrations",
      "Ensure code quality through unit and integration tests",
    ],
    qualifications: [
      "Strong Java proficiency (Java 11+ features)",
      "Experience with Spring Boot and Spring Security",
      "Familiarity with microservices patterns",
      "Knowledge of PostgreSQL and JPA/Hibernate",
    ],
  },
  {
    title: "Software Engineer",
    department: "Engineering",
    skills: ["JavaScript","Python","Java","Data Structures","Algorithms","Git","REST API","SQL"],
    coreSkill: "Python",
    responsibilities: [
      "Design, implement, and maintain software systems",
      "Write clean, well-tested code following SOLID principles",
      "Participate in technical design discussions and architecture reviews",
      "Collaborate across teams to deliver product features end-to-end",
    ],
    qualifications: [
      "Strong fundamentals in data structures and algorithms",
      "Proficiency in at least one of: JavaScript, Python, or Java",
      "Experience with REST API integration",
      "Good understanding of SQL databases",
    ],
  },
  {
    title: "QA Engineer",
    department: "Quality Assurance",
    skills: ["Selenium","Cypress","Python","JavaScript","SQL","API Testing","Jest","Test Automation"],
    coreSkill: "Selenium",
    responsibilities: [
      "Design and maintain automated test suites with Selenium and Cypress",
      "Build API test coverage using Postman and RestAssured",
      "Define test strategies and write detailed test plans",
      "Identify, document, and track bugs through the SDLC",
    ],
    qualifications: [
      "Experience with Selenium WebDriver or Cypress",
      "Proficiency in Python or JavaScript for test scripting",
      "Knowledge of API testing tools",
      "Understanding of SDLC and Agile QA practices",
    ],
  },
  {
    title: "Product Manager",
    department: "Product",
    skills: ["Agile","Scrum","JIRA","Product Strategy","User Research","Roadmapping","Analytics","SQL"],
    coreSkill: "Agile",
    responsibilities: [
      "Define product vision, strategy, and roadmap",
      "Gather and prioritise customer and stakeholder requirements",
      "Write detailed user stories, acceptance criteria, and PRDs",
      "Drive go-to-market launches and measure feature adoption",
    ],
    qualifications: [
      "Experience owning a product roadmap in an Agile environment",
      "Strong analytical skills and comfort with product metrics",
      "Excellent written and verbal communication skills",
      "Cross-functional collaboration with design, engineering, and business teams",
    ],
  },
];

// ─── student archetypes (10 coherent profiles) ───────────────────────
// Each archetype maps cleanly to specific job titles for recommendation testing.
const STUDENT_ARCHETYPES = [
  {
    label: "Frontend / React",
    skills: ["React","JavaScript","TypeScript","HTML","CSS","Next.js","Redux","GraphQL"],
    topSkill: "React",
    bestArea: "Engineering",
    headline: "Frontend Developer | React & Next.js",
    about: "Passionate UI engineer who loves building fast, accessible web experiences with React and TypeScript. Strong eye for design systems and component architecture.",
    careerGoal: "To become a senior frontend architect and lead the UI platform at a product-first company.",
    yearsOfExperience: "1-3 Years",
    relatedTitles: ["Frontend Developer","React Developer","Full Stack Developer"],
  },
  {
    label: "Backend / Node.js",
    skills: ["Node.js","Express","JavaScript","TypeScript","MongoDB","PostgreSQL","REST API","Redis"],
    topSkill: "Node.js",
    bestArea: "Engineering",
    headline: "Backend Developer | Node.js & APIs",
    about: "API-focused engineer experienced in building high-throughput Node.js services. Comfortable with both MongoDB and relational databases, and loves clean REST design.",
    careerGoal: "To architect scalable microservices platforms that serve millions of users reliably.",
    yearsOfExperience: "1-3 Years",
    relatedTitles: ["Backend Developer","Node.js Developer","Full Stack Developer"],
  },
  {
    label: "Full Stack / MERN",
    skills: ["React","Node.js","JavaScript","TypeScript","MongoDB","Express","Docker","Git"],
    topSkill: "React",
    bestArea: "Engineering",
    headline: "Full Stack Developer | MERN Stack",
    about: "Full-stack engineer equally comfortable on the frontend and backend. Builds complete features end-to-end using React and Node.js, with a DevOps mindset.",
    careerGoal: "To join an early-stage startup as a founding engineer and shape the product from scratch.",
    yearsOfExperience: "1-3 Years",
    relatedTitles: ["Full Stack Developer","React Developer","Backend Developer"],
  },
  {
    label: "Python / Backend",
    skills: ["Python","Django","Flask","PostgreSQL","REST API","Celery","Redis","Docker"],
    topSkill: "Python",
    bestArea: "Engineering",
    headline: "Python Developer | Django & Flask",
    about: "Python backend developer with deep experience in Django and Flask. Skilled in building secure REST APIs and background task systems with Celery.",
    careerGoal: "To build impactful backend systems and eventually move into a tech lead role.",
    yearsOfExperience: "1-3 Years",
    relatedTitles: ["Python Developer","Backend Developer","Software Engineer"],
  },
  {
    label: "Data Science / ML",
    skills: ["Python","TensorFlow","PyTorch","Scikit-learn","Pandas","NumPy","SQL","Jupyter"],
    topSkill: "Python",
    bestArea: "Data Science",
    headline: "ML Engineer | TensorFlow & PyTorch",
    about: "Machine learning practitioner skilled in the full model development lifecycle — from data cleaning with Pandas to training deep learning models with PyTorch and deploying with Docker.",
    careerGoal: "To work on cutting-edge NLP and computer vision research at a top AI lab or product company.",
    yearsOfExperience: "0-1 Year",
    relatedTitles: ["Machine Learning Engineer","Data Scientist","Python Developer"],
  },
  {
    label: "Data Analytics",
    skills: ["SQL","Python","Tableau","Power BI","Excel","Pandas","Statistics","Data Analysis"],
    topSkill: "SQL",
    bestArea: "Analytics",
    headline: "Data Analyst | SQL & Tableau Dashboards",
    about: "Data analyst who turns raw data into actionable insights. Skilled at writing complex SQL, building Tableau dashboards, and presenting findings to business stakeholders.",
    careerGoal: "To grow into a data engineering or analytics engineering role and own data infrastructure.",
    yearsOfExperience: "0-1 Year",
    relatedTitles: ["Data Analyst","Business Analyst","Data Scientist"],
  },
  {
    label: "DevOps / Cloud",
    skills: ["Docker","Kubernetes","AWS","Linux","CI/CD","Terraform","Ansible","Git"],
    topSkill: "Kubernetes",
    bestArea: "DevOps",
    headline: "DevOps Engineer | Kubernetes & AWS",
    about: "Infrastructure and platform engineer with strong Kubernetes and AWS experience. Passionate about reliability, automation, and developer productivity through great CI/CD tooling.",
    careerGoal: "To build world-class platform engineering teams and drive zero-downtime deployments at scale.",
    yearsOfExperience: "1-3 Years",
    relatedTitles: ["DevOps Engineer","Cloud Engineer","Software Engineer"],
  },
  {
    label: "Mobile / Flutter",
    skills: ["Flutter","Dart","Firebase","REST API","Android SDK","iOS SDK","Riverpod","Bloc"],
    topSkill: "Flutter",
    bestArea: "Mobile",
    headline: "Mobile Developer | Flutter & Firebase",
    about: "Cross-platform mobile developer specialised in Flutter. Has published apps on both Google Play and the App Store, with strong Firebase integration skills.",
    careerGoal: "To lead a mobile team and ship a consumer product used by millions.",
    yearsOfExperience: "0-1 Year",
    relatedTitles: ["Mobile Developer (Flutter)","Android Developer","iOS Developer"],
  },
  {
    label: "Java / Spring Boot",
    skills: ["Java","Spring Boot","Microservices","PostgreSQL","REST API","Kafka","Docker","Maven"],
    topSkill: "Java",
    bestArea: "Engineering",
    headline: "Java Developer | Spring Boot Microservices",
    about: "Enterprise Java developer with hands-on experience building Spring Boot microservices at scale. Comfortable with Kafka event streaming and PostgreSQL performance tuning.",
    careerGoal: "To become a solutions architect designing large-scale distributed systems.",
    yearsOfExperience: "3-6 Years",
    relatedTitles: ["Java Developer","Backend Developer","Software Engineer"],
  },
  {
    label: "UI/UX Design",
    skills: ["Figma","Adobe XD","HTML","CSS","User Research","Prototyping","Wireframing","Accessibility"],
    topSkill: "Figma",
    bestArea: "Design",
    headline: "UI/UX Designer | Figma & Design Systems",
    about: "User-centred designer who bridges research and implementation. Builds detailed prototypes in Figma, runs usability studies, and collaborates closely with engineering for precise handoff.",
    careerGoal: "To lead a design system team and define the visual language for a global consumer product.",
    yearsOfExperience: "1-3 Years",
    relatedTitles: ["UI/UX Designer","Product Manager","Frontend Developer"],
  },
];

const LOCATIONS = [
  "Bangalore","Hyderabad","Chennai","Mumbai","Pune","Kolkata",
  "Delhi","Noida","Gurgaon","Ahmedabad",
];
const EXP_LEVELS = [
  "Fresher","0-1 Year","1-3 Years","3-6 Years","6-9 Years",
];
const JOB_TYPES = ["Full-time","Part-time","Contract","Internship"];
const EDU_LEVELS = [
  "B.Tech","B.Sc","Bachelor's Degree","Master's Degree","MCA","MBA","Diploma",
];
const SALARY_RANGES = [
  "2-4 LPA","4-6 LPA","6-8 LPA","8-12 LPA","12-16 LPA","16-20 LPA",
];
const COURSE_TITLES = [
  "Complete React Developer in 2025","Node.js & Express Masterclass",
  "Python for Data Science and Machine Learning","Docker & Kubernetes for Developers",
  "AWS Solutions Architect – Complete Guide","Full Stack MERN Development",
  "TypeScript Deep Dive","System Design Interview Prep",
  "Flutter & Dart – Complete Mobile Dev","GraphQL with Node.js & React",
  "Advanced JavaScript: Closures, Async & More","Next.js 14 – Full Stack Framework",
  "MongoDB Complete Developer's Guide","DevOps Bootcamp with Jenkins & GitHub Actions",
  "Machine Learning A-Z","Data Structures & Algorithms in JavaScript",
  "Vue.js 3 – The Complete Guide","Spring Boot Microservices",
  "Git & GitHub for Beginners","UI/UX Design with Figma",
];
const POST_CONTENTS = [
  "Just built my first full-stack app using React and Node.js! Excited to share the journey. 🚀 #webdev #react",
  "Landed my first tech internship! Hard work pays off. Thanks to everyone who supported me. 🙏",
  "5 tips for cracking technical interviews:\n1. Practice DSA daily\n2. Mock interviews\n3. Understand system design\n4. Communicate your thought process\n5. Stay consistent",
  "New blog post: 'Why I switched from Vue to React' – link in bio. #javascript #frontend",
  "Open to work! Looking for frontend developer roles in Bangalore or remote. DM me if you have a referral 🙌",
  "The best way to learn programming is to build projects. Stop watching tutorials endlessly. Ship code! 💻",
  "Just got my AWS Solutions Architect certification! 6 months of preparation, totally worth it. ☁️",
  "Gratitude post: 1 year ago I didn't know what React was. Today I'm building production apps. Growth is real.",
  "Database design tip: Normalise early, denormalise later when performance demands it. #mongodb #sql",
  "Hot take: TypeScript is not optional anymore for serious frontend development. Change my mind.",
];
const BENEFITS = [
  "Health insurance",
  "Flexible working hours",
  "Work from home options",
  "Annual performance bonus",
  "Learning & development budget",
  "Stock options / ESOPs",
  "5-day work week",
  "Paid parental leave",
];

const NOTICE_PERIODS = [
  "Immediate", "15 Days", "30 Days", "60 Days", "90 Days",
];

// One or two showcase projects per student archetype
const PROJECT_TEMPLATES = {
  "Frontend / React": [
    { title: "Portfolio Website", techStack: "React, TypeScript, Tailwind CSS", description: "Personal portfolio with animated sections and dark-mode support, deployed on Vercel." },
    { title: "Task Manager App", techStack: "Next.js, Redux Toolkit, Firebase", description: "Real-time task board with drag-and-drop, user auth, and Firebase sync." },
  ],
  "Backend / Node.js": [
    { title: "REST API Boilerplate", techStack: "Node.js, Express, MongoDB, JWT", description: "Production-ready REST API with auth, rate-limiting, and Swagger docs." },
    { title: "Chat Service", techStack: "Node.js, Socket.io, Redis", description: "Scalable real-time chat backend using Socket.io rooms and Redis pub/sub." },
  ],
  "Full Stack / MERN": [
    { title: "Job Board Platform", techStack: "React, Node.js, MongoDB, Express", description: "Full-stack job board with recruiter and applicant dashboards." },
    { title: "Blog CMS", techStack: "Next.js, Node.js, PostgreSQL", description: "Headless CMS with Markdown editor, SSG, and role-based admin panel." },
  ],
  "Python / Backend": [
    { title: "URL Shortener API", techStack: "Python, FastAPI, PostgreSQL, Redis", description: "High-performance URL shortener with analytics and custom slugs." },
    { title: "E-commerce Backend", techStack: "Django, PostgreSQL, Celery, Stripe", description: "Full-featured Django backend with async order processing and Stripe payments." },
  ],
  "Data Science / ML": [
    { title: "Sentiment Analyser", techStack: "Python, PyTorch, Hugging Face, FastAPI", description: "Fine-tuned BERT model for product review sentiment, served via FastAPI." },
    { title: "Image Classifier", techStack: "Python, TensorFlow, Keras, OpenCV", description: "CNN trained on a custom dataset achieving 94% accuracy on test split." },
  ],
  "Data Analytics": [
    { title: "Sales Dashboard", techStack: "Python, Pandas, Tableau, SQL", description: "Interactive Tableau dashboard visualising monthly sales trends from a PostgreSQL warehouse." },
    { title: "Customer Churn Model", techStack: "Python, Scikit-learn, Pandas, Matplotlib", description: "Logistic regression model predicting churn with 87% recall; business report included." },
  ],
  "DevOps / Cloud": [
    { title: "Kubernetes Cluster Setup", techStack: "Kubernetes, Helm, Terraform, AWS EKS", description: "Fully automated EKS cluster provisioning with Terraform and GitOps via ArgoCD." },
    { title: "CI/CD Pipeline", techStack: "GitHub Actions, Docker, AWS ECR, ECS", description: "Zero-downtime blue-green deployment pipeline with smoke-test gates." },
  ],
  "Mobile / Flutter": [
    { title: "Expense Tracker App", techStack: "Flutter, Dart, Firebase, Riverpod", description: "Cross-platform personal finance app with charts and cloud sync, published on Play Store." },
    { title: "Food Delivery UI", techStack: "Flutter, Dart, REST API, Bloc", description: "Pixel-perfect food delivery clone with location tracking and Razorpay integration." },
  ],
  "Java / Spring Boot": [
    { title: "Microservices E-commerce", techStack: "Java, Spring Boot, Kafka, PostgreSQL", description: "Event-driven e-commerce backend with 6 microservices orchestrated via Kafka." },
    { title: "Banking API", techStack: "Java, Spring Security, JPA, PostgreSQL", description: "Secure banking REST API with JWT auth, transaction history, and audit logging." },
  ],
  "UI/UX Design": [
    { title: "Design System", techStack: "Figma, Storybook, HTML, CSS", description: "Component library and design system documentation used across a SaaS product." },
    { title: "Mobile App Redesign", techStack: "Figma, Adobe XD, Prototyping", description: "End-to-end redesign of a fintech app — improved task completion rate by 30% in usability tests." },
  ],
};

// ─── schemas (mirrors server.js) ─────────────────────────────────────
const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, default: "student" },
    isVerified: { type: Boolean, default: true },
    headline: { type: String, default: "" },
    location: { type: String, default: "" },
    openTo: { type: String, default: "Open to Work" },
    profileType: { type: String, default: "Student" },
    mainSkills: { type: [String], default: [] },
    noticePeriod: { type: String, default: "Immediate" },
    yearsOfExperience: { type: String, default: "" },
    preferredLocations: { type: [String], default: [] },
    about: { type: String, default: "" },
    careerGoal: { type: String, default: "" },
    avatar: { type: String, default: "" },
    coverImage: { type: String, default: "" },
    skills: { type: [String], default: [] },
    topSkill: { type: String, default: "" },
    bestArea: { type: String, default: "" },
    experience: { type: Array, default: [] },
    projects: { type: Array, default: [] },
    education: { type: Array, default: [] },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    connections: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const RecruiterSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    company: String,
    phone: { type: String, default: "" },
    password: String,
    role: { type: String, default: "recruiter" },
    isVerified: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const JobSchema = new mongoose.Schema(
  {
    title: String,
    department: String,
    location: String,
    jobType: String,
    experienceLevel: String,
    educationLevels: [String],
    salaryRange: String,
    description: String,
    responsibilities: [String],
    qualifications: [String],
    benefits: [String],
    skills: [String],
    imageUrl: { type: String, default: "" },
    imageFile: { type: String, default: "" },
    status: { type: String, default: "published" },
    recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: "Recruiter" },
  },
  { timestamps: true }
);

const JobApplicationSchema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
    recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: "Recruiter" },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, default: "applied" },
    atsResumeHtml: { type: String, default: "" },
    studentSnapshot: {
      name: String,
      email: String,
      headline: String,
      location: String,
      about: String,
      careerGoal: String,
      avatar: String,
      mainSkills: [String],
      skills: [String],
      topSkill: String,
      bestArea: String,
      noticePeriod: String,
      yearsOfExperience: String,
      preferredLocations: [String],
      experience: { type: Array, default: [] },
      education: { type: Array, default: [] },
      projects: { type: Array, default: [] },
    },
  },
  { timestamps: true }
);

JobApplicationSchema.index({ jobId: 1, studentId: 1 }, { unique: true });

const CourseSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    title: String,
    description: { type: String, default: "" },
    profileName: { type: String, default: "" },
    author: { type: String, default: "" },
    profileImage: { type: String, default: "" },
    videoUrl: { type: String, default: "https://www.w3schools.com/html/mov_bbb.mp4" },
    thumbnail: { type: String, default: "https://picsum.photos/seed/course/640/360" },
    views: { type: Number, default: 0 },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [],
    sharesCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const PostSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    author: { type: String, default: "" },
    profileImage: { type: String, default: "" },
    content: { type: String, default: "" },
    postType: { type: String, default: "text" },
    imageUrl: { type: String, default: "" },
    videoUrl: { type: String, default: "" },
    thumbnail: { type: String, default: "" },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [],
  },
  { timestamps: true }
);

// ─── model registration ───────────────────────────────────────────────
const UserModel =
  mongoose.models.User || mongoose.model("User", UserSchema);
const Recruiter =
  mongoose.models.Recruiter || mongoose.model("Recruiter", RecruiterSchema);
const Job =
  mongoose.models.Job || mongoose.model("Job", JobSchema);
const JobApplication =
  mongoose.models.JobApplication ||
  mongoose.model("JobApplication", JobApplicationSchema);
const Course =
  mongoose.models.Course || mongoose.model("Course", CourseSchema);
const Post =
  mongoose.models.Post || mongoose.model("Post", PostSchema);

// insertMany that swallows duplicate-key errors and returns inserted docs.
async function safeInsert(Model, docs) {
  try {
    return await Model.insertMany(docs, { ordered: false });
  } catch (err) {
    if (err.code === 11000 || err.name === "BulkWriteError") {
      const inserted = err.insertedDocs || [];
      console.warn(`   ⚠️  ${err.writeErrors?.length || 0} duplicates skipped`);
      return inserted;
    }
    throw err;
  }
}

// ─── seed ─────────────────────────────────────────────────────────────
async function seed() {
  console.log(`\n🔗  Connecting to ${MONGO_URI}`);
  await mongoose.connect(MONGO_URI);
  console.log("✅  Connected\n");

  console.log("🗑   Clearing seed collections before inserting…");
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  const names = new Set(collections.map((c) => c.name));

  const del = async (colName, filter) => {
    if (!names.has(colName)) return;
    const r = await db.collection(colName).deleteMany(filter);
    console.log(`   deleted ${r.deletedCount} from ${colName}`);
  };

  await del("users",      { email: /@gronxtiy\.dev$/ });
  await del("recruiters", { email: /@gronxtiy\.dev$/ });
  await del("jobs",       { description: /\[SEED\]/ });
  await del("posts",      { content:     /\[SEED\]/ });
  if (DROP) {
    await del("jobapplications", {});
    await del("courses",         {});
  }
  console.log("✅  Collections cleared\n");

  const hashedPassword = await bcrypt.hash("Seed@1234", 10);

  // ── 1. Students (50, 5 per archetype) ─────────────────────────────
  console.log("👤  Creating 50 students (5 per archetype)…");
  const studentDocs = Array.from({ length: 50 }, (_, i) => {
    const archetype = STUDENT_ARCHETYPES[i % STUDENT_ARCHETYPES.length];
    const firstName = pick(FIRST_NAMES);
    const lastName = pick(LAST_NAMES);
    const name = `${firstName} ${lastName}`;

    // Skills: archetype core skills + small random variation
    const skills = [...archetype.skills];
    const mainSkills = skills.slice(0, 3);

    const isFresher = archetype.yearsOfExperience === "Fresher" ||
                      archetype.yearsOfExperience === "0-1 Year";
    const experience = isFresher
      ? []
      : [
          {
            id: `exp${i}`,
            role: pick(archetype.relatedTitles),
            company: pick(COMPANIES),
            period: "2022 - 2024",
            description: `Worked as a ${pick(archetype.relatedTitles)} building production systems using ${archetype.topSkill} and related technologies.`,
            tags: skills.slice(0, 3),
          },
        ];

    const education = [
      {
        id: `edu${i}`,
        school: `${lastName} Institute of Technology`,
        degree: pick(EDU_LEVELS),
        period: "2019 - 2023",
        grade: `${rand(65, 95)}%`,
      },
    ];

    const projects = (PROJECT_TEMPLATES[archetype.label] || []).map((p, pi) => ({
      id: `proj${i}_${pi}`,
      ...p,
    }));

    return {
      name,
      email: `seed_student${i + 1}@gronxtiy.dev`,
      password: hashedPassword,
      role: "student",
      isVerified: true,
      headline: archetype.headline,
      location: pick(LOCATIONS),
      openTo: "Open to Work",
      profileType: "Student",
      mainSkills,
      skills,
      topSkill: archetype.topSkill,
      bestArea: archetype.bestArea,
      noticePeriod: isFresher ? pick(["Immediate", "15 Days"]) : pick(NOTICE_PERIODS),
      yearsOfExperience: archetype.yearsOfExperience,
      preferredLocations: pickN(LOCATIONS, 2),
      about: archetype.about,
      careerGoal: archetype.careerGoal,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=128`,
      experience,
      education,
      projects,
    };
  });

  const students = await safeInsert(UserModel, studentDocs);
  console.log(`   ✅  ${students.length} students created`);

  // ── 2. Recruiters ─────────────────────────────────────────────────
  console.log("🏢  Creating 10 recruiters…");
  const recruiterDocs = Array.from({ length: 10 }, (_, i) => ({
    name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
    email: `seed_recruiter${i + 1}@gronxtiy.dev`,
    company: COMPANIES[i % COMPANIES.length],
    phone: `98765${String(i).padStart(5, "0")}`,
    password: hashedPassword,
    role: "recruiter",
    isVerified: true,
  }));

  const recruiters = await safeInsert(Recruiter, recruiterDocs);
  console.log(`   ✅  ${recruiters.length} recruiters created`);

  // ── 3. Jobs (50, cycling through all 20 role definitions × 2-3 each) ─
  console.log("💼  Creating 50 jobs with role-specific skills…");
  const jobDocs = Array.from({ length: 50 }, (_, i) => {
    const def = JOB_DEFINITIONS[i % JOB_DEFINITIONS.length];
    const recruiter = recruiters[i % recruiters.length];
    // Each job posting uses 5-7 of the role's skills (varied per posting)
    const jobSkills = pickN(def.skills, rand(5, Math.min(7, def.skills.length)));
    return {
      title: def.title,
      department: def.department,
      location: pick(LOCATIONS),
      jobType: pick(JOB_TYPES),
      experienceLevel: pick(EXP_LEVELS),
      educationLevels: pickN(EDU_LEVELS, rand(1, 3)),
      salaryRange: pick(SALARY_RANGES),
      description:
        `[SEED] We are looking for a talented ${def.title} to join ${recruiter.company}. ` +
        `You will work closely with cross-functional teams to deliver high-quality solutions. ` +
        `Core stack: ${jobSkills.join(", ")}.`,
      responsibilities: def.responsibilities,
      qualifications: def.qualifications,
      benefits: pickN(BENEFITS, rand(3, 5)),
      skills: jobSkills,
      imageUrl: `https://picsum.photos/seed/job${i}/200/200`,
      status: "published",
      recruiterId: recruiter._id,
    };
  });

  const jobs = await safeInsert(Job, jobDocs);
  console.log(`   ✅  ${jobs.length} jobs created`);

  // ── 4. Applications ───────────────────────────────────────────────
  // Each student applies to 3 archetype-matched jobs + 1 stretch job.
  // Target: ~200 applications → each job gets ~4 applicants on average,
  // giving the recruiter console enough data to show meaningful rankings.
  console.log("📋  Creating ~200 applications (skill-aligned, multi-apply)…");
  const applicationDocs = [];
  const seen = new Set();

  const makeSnapshot = (s) => ({
    name: s.name,
    email: s.email,
    headline: s.headline,
    location: s.location,
    about: s.about,
    careerGoal: s.careerGoal,
    avatar: s.avatar,
    mainSkills: s.mainSkills,
    skills: s.skills,
    topSkill: s.topSkill,
    bestArea: s.bestArea,
    noticePeriod: s.noticePeriod || "Immediate",
    yearsOfExperience: s.yearsOfExperience || "",
    preferredLocations: s.preferredLocations || [],
    experience: s.experience || [],
    education: s.education || [],
    projects: s.projects || [],
  });

  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const archetypeIdx = i % STUDENT_ARCHETYPES.length;
    const archetype = STUDENT_ARCHETYPES[archetypeIdx];

    // 3 jobs whose title matches the student's archetype (primary match)
    const matchingJobs = jobs.filter((j) =>
      archetype.relatedTitles.includes(j.title)
    );
    const primaryJobs = pickN(matchingJobs, Math.min(3, matchingJobs.length));

    // 1 stretch job from a different role family
    const otherJobs = jobs.filter((j) => !archetype.relatedTitles.includes(j.title));
    const stretchJob = otherJobs.length > 0 ? pick(otherJobs) : null;

    const targetJobs = stretchJob ? [...primaryJobs, stretchJob] : primaryJobs;

    for (const job of targetJobs) {
      const key = `${job._id}_${student._id}`;
      if (seen.has(key)) continue;
      seen.add(key);

      applicationDocs.push({
        jobId: job._id,
        recruiterId: job.recruiterId,
        studentId: student._id,
        status: pick(["applied", "reviewing", "shortlisted", "rejected", "selected"]),
        studentSnapshot: makeSnapshot(student),
      });
    }
  }

  const applications = await safeInsert(JobApplication, applicationDocs);
  console.log(`   ✅  ${applications.length} applications created`);

  // ── 5. Courses ────────────────────────────────────────────────────
  console.log("🎓  Creating 50 courses…");
  const courseDocs = Array.from({ length: 50 }, (_, i) => {
    const author = students[i % students.length];
    const title = COURSE_TITLES[i % COURSE_TITLES.length];
    return {
      userId: author._id,
      title,
      description: `A comprehensive course covering ${title} from fundamentals to advanced concepts. Ideal for beginners and intermediate learners.`,
      profileName: author.name,
      author: author.name,
      profileImage: author.avatar,
      videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
      thumbnail: `https://picsum.photos/seed/course${i}/640/360`,
      views: rand(0, 5000),
      sharesCount: rand(0, 200),
    };
  });

  const courses = await safeInsert(Course, courseDocs);
  console.log(`   ✅  ${courses.length} courses created`);

  // ── 6. Posts ──────────────────────────────────────────────────────
  console.log("📝  Creating 50 posts…");
  const postDocs = Array.from({ length: 50 }, (_, i) => {
    const author = students[i % students.length];
    const content = POST_CONTENTS[i % POST_CONTENTS.length];
    return {
      userId: author._id,
      author: author.name,
      profileImage: author.avatar,
      content: `[SEED] ${content}`,
      postType: "text",
      likes: pickN(students, rand(0, 10)).map((s) => s._id),
      comments: [],
    };
  });

  const posts = await safeInsert(Post, postDocs);
  console.log(`   ✅  ${posts.length} posts created`);

  // ── Summary ───────────────────────────────────────────────────────
  console.log(`
┌───────────────────────────────────────────────────────────┐
│                   SEED COMPLETE ✅                         │
├────────────────────────┬──────────────────────────────────┤
│  Students              │  ${String(students.length).padEnd(34)}│
│  Recruiters            │  ${String(recruiters.length).padEnd(34)}│
│  Jobs                  │  ${String(jobs.length).padEnd(34)}│
│  Applications          │  ${String(applications.length).padEnd(34)}│
│  Courses               │  ${String(courses.length).padEnd(34)}│
│  Posts                 │  ${String(posts.length).padEnd(34)}│
├────────────────────────┴──────────────────────────────────┤
│  Student archetypes (5 students each):                    │
│    Frontend/React · Backend/Node · Full Stack · Python    │
│    ML/Data Science · Data Analytics · DevOps/Cloud        │
│    Mobile/Flutter · Java/SpringBoot · UI/UX Design        │
├───────────────────────────────────────────────────────────┤
│  Login with any seed account (password same for all):     │
│    Student   →  seed_student1@gronxtiy.dev  (1-50)        │
│    Recruiter →  seed_recruiter1@gronxtiy.dev (1-10)       │
│    Password  →  Seed@1234                                 │
└───────────────────────────────────────────────────────────┘
`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
}); */
