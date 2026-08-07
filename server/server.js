const dns = require('dns');
dns.setServers(['1.1.1.1', '8.8.8.8']); // Cloudflare & Google DNS
const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const nodemailer = require("nodemailer");
const path = require("path");
const cloudinary = require("./config/cloudinary");

const upload = require("./middleware/upload");
const cloudinaryTestRoute = require("./routes/cloudinaryTest");
const uploadToCloudinary = require("./utils/uploadToCloudinary");

// Hybrid job-recommendation engine (BGE-small semantic + BM25 lexical fusion).
// Modular code lives under ./recommender — see recommender/README.md.
const recommender = require("./recommender");

const http = require("http");
const { Server } = require("socket.io");


const app = express();
const server = http.createServer(app);

// ✅ Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
   origin: [
 "http://localhost:5176",  // student dev
    "http://localhost:5177",  // admin dev
    "https://www.gronxtiy.com", // student prod
    "https://admin.gronxtiy.com", // admin prod
    "https://gronxtiy-beta-git-main-gronxtiy.vercel.app"  // ✅ ADD THIS


],
    credentials: true,
  })
);



const io = new Server(server, {
  cors: {
    origin: [
 "http://localhost:5176",  // student dev
    "http://localhost:5177",  // admin dev
    "https://www.gronxtiy.com", // student prod
    "https://admin.gronxtiy.com", // admin prod
    "https://gronxtiy-beta-git-main-gronxtiy.vercel.app"  // ✅ ADD THIS


],
    credentials: true,
  },
});


io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join_course_notification_room", (userId) => {
    if (!userId) return;
    socket.join(`course_notify_${String(userId)}`);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});


// ✅ DB connection



mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
  })
  .catch((err) => {
    console.error("❌ MongoDB error:", err.message);
  });
  





  
app.use("/api/cloudinary", cloudinaryTestRoute);







// ✅ Schema

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, default: "student" },

    otp: String,
    otpExpiry: Date,
    isVerified: { type: Boolean, default: false },
    resetToken: String,
    resetTokenExpiry: Date,

    // profile basics
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

    introVideoUrl: { type: String, default: "" },
    introVideoDuration: { type: String, default: "" },
    introVideoViews: { type: Number, default: 0 },

    skills: { type: [String], default: [] },
    topSkill: { type: String, default: "" },
    bestArea: { type: String, default: "" },

    experience: [
      {
        id: { type: String, default: "" },
        role: { type: String, default: "" },
        company: { type: String, default: "" },
        period: { type: String, default: "" },
        description: { type: String, default: "" },
        tags: { type: [String], default: [] },
      },
    ],


    projects: [
  {
    id: { type: String, default: "" },
    title: { type: String, default: "" },
    techStack: { type: String, default: "" },
    period: { type: String, default: "" },
    description: { type: String, default: "" },
    link: { type: String, default: "" },
  }
],

    education: [
      {
        id: { type: String, default: "" },
        school: { type: String, default: "" },
        degree: { type: String, default: "" },
        period: { type: String, default: "" },
        grade: { type: String, default: "" },
      },
    ],

    reelsContent: [
  {
    id: { type: String, default: "" },
    title: { type: String, default: "" },
    thumbnail: { type: String, default: "" },
    type: { type: String, default: "reel" },
    views: { type: Number, default: 0 },
    duration: { type: String, default: "" },
  },
],


    recruiterProfileViews: [
  {
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recruiter",
    },
    viewedAt: {
      type: Date,
      default: Date.now,
    },
  },
],
    postsContent: [
      {
        id: { type: String, default: "" },
        title: { type: String, default: "" },
        thumbnail: { type: String, default: "" },
        type: { type: String, default: "post" },
        date: { type: String, default: "" },
      },
    ],




    achievements: [
      {
        id: { type: String, default: "" },
        title: { type: String, default: "" },
        thumbnail: { type: String, default: "" },
        type: { type: String, default: "achievement" },
        date: { type: String, default: "" },
      },
    ],

    savedPosts: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
  },
],



courseProfile: {
  name: { type: String, default: "" },
  about: { type: String, default: "" },

  avatar: { type: String, default: "" },
  avatarPublicId: { type: String, default: "" },

  backgroundImage: { type: String, default: "" },
  backgroundImagePublicId: { type: String, default: "" },

  instagram: { type: String, default: "" },
  linkedin: { type: String, default: "" },
  telegram: { type: String, default: "" },

  customLink1Label: { type: String, default: "" },
  customLink1Url: { type: String, default: "" },

  customLink2Label: { type: String, default: "" },
  customLink2Url: { type: String, default: "" },
},


coursesContent: [
  {
    id: { type: String, default: "" },
    title: { type: String, default: "" },
    thumbnail: { type: String, default: "" },
    type: { type: String, default: "course" },
    views: { type: Number, default: 0 },
  },
],


savedCourses: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
  },
],









    // social
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    connections: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);
const UserModel = mongoose.model("User", UserSchema);



// ================= SCHEMA =================
const RecruiterSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  company: String,
  phone: { type: String, default: "", trim: true }, // ✅ added
  password: String,
   role: { type: String, default: "recruiter" }, // add this
  otp: String,
  otpExpiry: Date,
  isVerified: { type: Boolean, default: false }
}, { timestamps: true });

const Recruiter = mongoose.model("Recruiter", RecruiterSchema);




// ================= AUTH MIDDLEWARE =================
const authMiddleware = (req, res, next) => {
  const token = req.cookies.token;

  if (!token)
    return res.status(401).json({ message: "Not authenticated" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
    req.user = decoded; // contains id & role
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};


// ================= REGISTER =================
app.post("/register", async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword)
      return res.status(400).json({ message: "All fields required" });

    if (password !== confirmPassword)
      return res.status(400).json({ message: "Passwords do not match" });

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;

    if (!passwordRegex.test(password))
      return res.status(400).json({
        message: "Password must contain uppercase, lowercase & special character"
      });


        const recruiterExists = await Recruiter.findOne({ email });
    if (recruiterExists) {
      return res.status(400).json({ message: "This email already exists as recruiter" });
    }


    const exists = await UserModel.findOne({ email });
    if (exists)
      return res.status(400).json({ message: "User already exists" });

    const hash = await bcrypt.hash(password, 10);

    // ✅ Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await UserModel.create({
      name,
      email,
      password: hash,
      role: "student",
      otp,
      otpExpiry: Date.now() + 60 * 1000 // 60 seconds
    });

    // ✅ Send OTP Email
    await transporter.sendMail({
      from: "bgopalakrishna745@gmail.com",
      to: email,
      subject: "Your OTP for Student Registration",
      html: `
        <h2>Your OTP Code</h2>
        <h1>${otp}</h1>
        <p>This OTP is valid for 60 seconds.</p>
      `,
    });

    res.json({ message: "OTP sent successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});








app.post("/api/student/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await UserModel.findOne({ email });

    if (!user)
      return res.status(400).json({ message: "Student not found" });

    if (user.otp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });

    if (user.otpExpiry < Date.now())
      return res.status(400).json({ message: "OTP expired" });

    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;

    await user.save();

    res.json({ message: "Student Registered Successfully ✅" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


app.post("/api/student/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await UserModel.findOne({ email });

    if (!user)
      return res.status(400).json({ message: "Student not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.otpExpiry = Date.now() + 60 * 1000;
    await user.save();

    await transporter.sendMail({
      from: "bgopalakrishna745@gmail.com",
      to: email,
      subject: "Resent OTP",
      html: `<h1>${otp}</h1><p>Valid for 60 seconds</p>`,
    });

    res.json({ message: "OTP Resent Successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});






// ================= EMAIL TRANSPORTER =================
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "bgopalakrishna745@gmail.com",
    pass: "sexwsxumyduvlvpr",
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// 🔥 ADD THIS EXACTLY HERE
transporter.verify((error, success) => {
  if (error) {
    console.log("Transporter Error:", error);
  } else {
    console.log("Server ready to send email");
  }
});
// =====================================================
// ================= REGISTER + SEND OTP ===============
// =====================================================

app.post("/api/recruiter/register", async (req, res) => {
  try {
    const { name, email, company, password } = req.body;

    if (!name || !email || !company || !password)
      return res.status(400).json({ message: "All fields required" });

    const studentExists = await UserModel.findOne({ email });
    if (studentExists) {
      return res.status(400).json({ message: "This email already exists as student" });
    }

    const existing = await Recruiter.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await Recruiter.create({
      name,
      email,
      company,
      password: hashedPassword,
      otp,
      otpExpiry: Date.now() + 60 * 1000, // 60 seconds
    });

    // Send OTP Email
    await transporter.sendMail({
      from: "bgopalakrishna745@gmail.com",
      to: email,
      subject: "Your OTP for Recruiter Registration",
      html: `
        <h2>Your OTP Code</h2>
        <h1>${otp}</h1>
        <p>This OTP is valid for 60 seconds.</p>
      `,
    });

    res.json({ message: "OTP sent successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= VERIFY OTP ========================

app.post("/api/recruiter/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const recruiter = await Recruiter.findOne({ email});

    if (!recruiter)
      return res.status(400).json({ message: "Recruiter not found" });

    if (recruiter.otp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });

    if (recruiter.otpExpiry < Date.now())
      return res.status(400).json({ message: "OTP expired" });

    recruiter.isVerified = true;
    recruiter.otp = null;
    recruiter.otpExpiry = null;

    await recruiter.save();

    res.json({ message: "Recruiter Registered Successfully ✅" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/recruiter/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;

    const recruiter = await Recruiter.findOne({ email });

    if (!recruiter)
      return res.status(400).json({ message: "Recruiter not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    recruiter.otp = otp;
    recruiter.otpExpiry = Date.now() + 60 * 1000;
    await recruiter.save();

    await transporter.sendMail({
      from: "bgopalakrishna745@gmail.com",
      to: email,
      subject: "Resent OTP",
      html: `<h1>${otp}</h1><p>Valid for 60 seconds</p>`,
    });

    res.json({ message: "OTP Resent Successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



// ================= LOGIN =================
app.post("/login", async (req, res) => {
  try {
const email = req.body.email.trim().toLowerCase();
const password = req.body.password;
    let user = await Recruiter.findOne({ email });
    let role = null;

    if (user) {
      role = "recruiter";
    } else {
      user = await UserModel.findOne({ email });
      if (user) role = "student";
    }

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: "Password incorrect" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: `${role} not verified. Please verify OTP.` });
    }

    const token = jwt.sign(
      { id: user._id, role },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "1d" }
    );

    console.log("LOGIN ROLE =", role);
    console.log("LOGIN USER ID =", user._id);

    res.cookie("token", token, {
  httpOnly: true,
  secure: true,
  sameSite: "none"
});
    res.json({
      message: "Login success",
      role,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});





app.post("/forgotpassword", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await UserModel.findOne({ email });
    if (!user) return res.json({ Status: "User not found" });

    const token = jwt.sign(
      { id: user._id },
      process.env.RESET_SECRET || "mysecret123",
      { expiresIn: "15m" }
    );

    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 15 * 60 * 1000;
    await user.save();
const resetLink =
  `https://www.gronxtiy.com/resetpassword/${user._id}/${encodeURIComponent(token)}`;

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: "bgopalakrishna745@gmail.com",
        pass: "sexwsxumyduvlvpr",
      },

 tls: {
    rejectUnauthorized: false,  
  },



    });

    await transporter.sendMail({
      from: "bgopalakrishna745@gmail.com",
      to: email,
      subject: "Reset Password",
      html: `
        <h3>Password Reset</h3>
        <p>Click below link to reset password:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>Valid for 15 minutes</p>
      `,
    });

    res.json({ Status: "Success" });

  } catch (err) {
    console.error("MAIL ERROR:", err);
    res.json({ Status: "Error sending mail", error: err.message });
  }
});



app.post("/resetpassword/:id/:token", async (req, res) => {
  const { id } = req.params;
  const token = decodeURIComponent(req.params.token);
  const { password } = req.body;

  try {
    const user = await UserModel.findById(id);
    if (!user) return res.json({ Status: "Invalid user" });

    if (!user.resetToken)
      return res.json({ Status: "Token missing" });

    if (user.resetTokenExpiry < Date.now())
      return res.json({ Status: "Token expired" });

    // ✅ Strong password validation
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;

if (!passwordRegex.test(password))
  return res.json({
    Status: "Password must be 8 characters, include uppercase, lowercase & special character"
  });

    jwt.verify(token, process.env.RESET_SECRET || "mysecret123");

    const hash = await bcrypt.hash(password, 10);

    user.password = hash;
    user.resetToken = null;
    user.resetTokenExpiry = null;

    await user.save();

    res.json({ Status: "Success" });

  } catch (err) {
    console.error("RESET ERROR:", err);
    res.json({ Status: "Error resetting password" });
  }
});



// =================logout ==============//

app.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });

  res.json({ message: "Logged out successfully" });
});













const JobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    department: {
      type: String,
      required: true,
      trim: true
    },
    location: {
      type: String,
      required: true,
      trim: true
    },
    jobType: {
      type: String,
      required: true,
      enum: ["Full-time", "Part-time", "Contract", "Internship"]
    },
    experienceLevel: {
      type: String,
      required: true
    },
    educationLevels: {
      type: [String],
      required: true,
      default: []
    },
    salaryRange: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    responsibilities: {
      type: [String],
      default: []
    },
    qualifications: {
      type: [String],
      default: []
    },
    benefits: {
      type: [String],
      default: []
    },
    skills: {
      type: [String],
      default: []
    },
    imageUrl: {
      type: String,
      default: ""
    },
    imageFile: {
      type: String,
      default: ""
    },
    status: {
      type: String,
       enum: ["draft", "published", "closed"],
  default: "draft"

    },
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recruiter",
      required: true

      
    }
  },
  { timestamps: true }
);

const Job = mongoose.model("Job", JobSchema);

// ================= HELPER =================
function parseJsonArray(value) {
  try {
    if (!value) return [];
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

// ================= CREATE JOB ROUTE =================
app.post(
  "/api/recruiter/create-job",
  authMiddleware,
  upload.single("jobImage"),
  async (req, res) => {
    try {
      if (req.user.role !== "recruiter") {
        return res.status(403).json({ message: "Only recruiters can create jobs" });
      }

      const recruiter = await Recruiter.findById(req.user.id);

      if (!recruiter) {
        return res.status(404).json({ message: "Recruiter not found" });
      }

      const {
        title,
        department,
        location,
        jobType,
        experienceLevel,
        salaryRange,
        description,
        imageUrl,
        status
      } = req.body;

      const educationLevels = parseJsonArray(req.body.educationLevels);
      const responsibilities = parseJsonArray(req.body.responsibilities);
      const qualifications = parseJsonArray(req.body.qualifications);
      const benefits = parseJsonArray(req.body.benefits);
      const skills = parseJsonArray(req.body.skills);

      if (
        !title ||
        !department ||
        !location ||
        !jobType ||
        !experienceLevel ||
        !salaryRange ||
        !description
      ) {
        return res.status(400).json({
          message: "Please fill all required fields"
        });
      }

      if (!educationLevels.length) {
        return res.status(400).json({
          message: "Please select at least one education level"
        });
      }

      const uploadedFilePath = req.file
        ? `https://gronxtiy-backend.onrender.com/uploads/${req.file.filename}`
        : "";


        console.log("req.user =", req.user);


      const job = await Job.create({
        title,
        department,
        location,
        jobType,
        experienceLevel,
        educationLevels,
        salaryRange,
        description,
        responsibilities,
        qualifications,
        benefits,
        skills,
        imageUrl: imageUrl || "",
        imageFile: uploadedFilePath,
        status: status || "draft",
        recruiterId: recruiter._id
      });
  console.log("saved job =", job);

      recommender.onJobUpsert(job);

      res.status(201).json({
        message:
          job.status === "published"
            ? "Job published successfully"
            : "Draft saved successfully",
        job
      });
    } catch (err) {
      console.error("Create job error:", err);
      res.status(500).json({
        message: err.message || "Server error"
      });
    }
  }
);

// ================= RECRUITER MY JOBS =================
app.get("/api/recruiter/my-jobs", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "recruiter") {
      return res.status(403).json({ message: "Only recruiters allowed" });
    }

    const recruiter = await Recruiter.findById(req.user.id);
    if (!recruiter) {
      return res.status(404).json({ message: "Recruiter not found" });
    }

    const jobs = await Job.find({ recruiterId: recruiter._id }).sort({ createdAt: -1 });

    res.json(jobs);
  } catch (err) {
    console.error("My jobs error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});




// ================= GET ALL JOBS =================
app.get("/api/student/jobs", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Only students allowed" });
    }

    const jobs = await Job.find({ status: "published" })
      .populate("recruiterId", "name company email")
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (err) {
    console.error("Fetch jobs error:", err);
    res.status(500).json({ message: err.message });
  }
});







// ================= GET SINGLE JOB FOR EDIT =================
app.get("/api/recruiter/job/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "recruiter") {
      return res.status(403).json({ message: "Only recruiters allowed" });
    }

    const recruiter = await Recruiter.findById(req.user.id);
    if (!recruiter) {
      return res.status(404).json({ message: "Recruiter not found" });
    }

    const job = await Job.findOne({
      _id: req.params.id,
      recruiterId: recruiter._id,
    });

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json(job);
  } catch (err) {
    console.error("Get single job error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});





// ================= UPDATE JOB ROUTE =================
app.put(
  "/api/recruiter/job/:id",
  authMiddleware,
  upload.single("jobImage"),
  async (req, res) => {
    try {
      if (req.user.role !== "recruiter") {
        return res.status(403).json({ message: "Only recruiters can update jobs" });
      }

      const recruiter = await Recruiter.findById(req.user.id);
      if (!recruiter) {
        return res.status(404).json({ message: "Recruiter not found" });
      }

      const existingJob = await Job.findOne({
        _id: req.params.id,
        recruiterId: recruiter._id,
      });

      if (!existingJob) {
        return res.status(404).json({ message: "Job not found" });
      }

      const {
        title,
        department,
        location,
        jobType,
        experienceLevel,
        salaryRange,
        description,
        imageUrl,
        status
      } = req.body;

      const educationLevels = parseJsonArray(req.body.educationLevels);
      const responsibilities = parseJsonArray(req.body.responsibilities);
      const qualifications = parseJsonArray(req.body.qualifications);
      const benefits = parseJsonArray(req.body.benefits);
      const skills = parseJsonArray(req.body.skills);

      if (
        !title ||
        !department ||
        !location ||
        !jobType ||
        !experienceLevel ||
        !salaryRange ||
        !description
      ) {
        return res.status(400).json({ message: "Please fill all required fields" });
      }

      if (!educationLevels.length) {
        return res.status(400).json({
          message: "Please select at least one education level"
        });
      }

      let uploadedFilePath = existingJob.imageFile;

      if (req.file) {
        uploadedFilePath = `https://gronxtiy-backend.onrender.com/uploads/${req.file.filename}`;
      }

      existingJob.title = title;
      existingJob.department = department;
      existingJob.location = location;
      existingJob.jobType = jobType;
      existingJob.experienceLevel = experienceLevel;
      existingJob.educationLevels = educationLevels;
      existingJob.salaryRange = salaryRange;
      existingJob.description = description;
      existingJob.responsibilities = responsibilities;
      existingJob.qualifications = qualifications;
      existingJob.benefits = benefits;
      existingJob.skills = skills;
      existingJob.imageUrl = imageUrl || "";
      existingJob.imageFile = uploadedFilePath;
      existingJob.status = status || existingJob.status;

      await existingJob.save();

      recommender.onJobUpsert(existingJob);

      res.json({
        message: "Job updated successfully",
        job: existingJob
      });
    } catch (err) {
      console.error("Update job error:", err);
      res.status(500).json({ message: err.message || "Server error" });
    }
  }
);



// ================= DELETE JOB ROUTE =================
app.delete("/api/recruiter/job/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "recruiter") {
      return res.status(403).json({ message: "Only recruiters allowed" });
    }

    const recruiter = await Recruiter.findById(req.user.id);
    if (!recruiter) {
      return res.status(404).json({ message: "Recruiter not found" });
    }

    const deletedJob = await Job.findOneAndDelete({
      _id: req.params.id,
      recruiterId: recruiter._id,
    });

    if (!deletedJob) {
      return res.status(404).json({ message: "Job not found" });
    }

    recommender.onJobDelete(deletedJob._id);

    res.json({ message: "Job deleted successfully" });
  } catch (err) {
    console.error("Delete job error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});



const JobApplicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recruiter",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["applied", "reviewing", "shortlisted", "rejected", "selected"],
      default: "applied",
    },

    atsResumeHtml: {
      type: String,
      default: "",
    },

    studentSnapshot: {
      name: String,
      email: String,
      headline: String,
      location: String,
      about: String,
      careerGoal: String,
      avatar: String,
      coverImage: String,
      introVideoUrl: String,
      introVideoDuration: String,
      introVideoViews: Number,
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

const JobApplication = mongoose.model("JobApplication", JobApplicationSchema);

// ================= RECOMMENDER MOUNT =================
// Registers /api/recommender/* routes and kicks off initial indexing
// of published jobs + student profiles in the background.
recommender.mount(app, {
  authMiddleware,
  UserModel,
  Job,
  JobApplication,
});







app.get("/api/recruiter/job/:jobId/applications", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "recruiter") {
      return res.status(403).json({ message: "Only recruiters allowed" });
    }

    const recruiter = await Recruiter.findById(req.user.id);
    if (!recruiter) {
      return res.status(404).json({ message: "Recruiter not found" });
    }

    const job = await Job.findOne({
      _id: req.params.jobId,
      recruiterId: recruiter._id,
    });

    if (!job) {
      return res.status(404).json({ message: "Job not found or access denied" });
    }

    const applications = await JobApplication.find({ jobId: job._id })
      .populate("studentId", "name email")
      .sort({ createdAt: -1 });

    return res.json(applications);
  } catch (err) {
    console.error("Fetch applications error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});


app.put(
  "/api/recruiter/application/:applicationId/status",
  authMiddleware,
  async (req, res) => {
    try {
      if (req.user.role !== "recruiter") {
        return res.status(403).json({ message: "Only recruiters allowed" });
      }

      const { status } = req.body;

      const allowedStatuses = [
        "applied",
        "reviewing",
        "shortlisted",
        "rejected",
        "selected",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }

      const recruiter = await Recruiter.findById(req.user.id);
      if (!recruiter) {
        return res.status(404).json({ message: "Recruiter not found" });
      }

      const application = await JobApplication.findById(req.params.applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      const job = await Job.findOne({
        _id: application.jobId,
        recruiterId: recruiter._id,
      });

      if (!job) {
        return res.status(403).json({ message: "Access denied" });
      }

      application.status = status;
      await application.save();



      await createNotification({
  receiverId: application.studentId,
  receiverModel: "User",
  senderId: recruiter._id,
  senderModel: "Recruiter",
  type: "application_status",
  title: "Application updated",
  message: `Your application status changed to ${status}`,
  applicationId: application._id,
});



      return res.json({
        message: `Application marked as ${status}`,
        application,
      });
    } catch (err) {
      console.error("Update application status error:", err);
      return res.status(500).json({ message: err.message || "Server error" });
    }
  }
);




app.get("/api/recruiter/dashboard-stats", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "recruiter") {
      return res.status(403).json({ message: "Only recruiters allowed" });
    }

    const recruiter = await Recruiter.findById(req.user.id);
    if (!recruiter) {
      return res.status(404).json({ message: "Recruiter not found" });
    }

    const jobs = await Job.find({ recruiterId: req.user.id }).lean();
    const jobIds = jobs.map((j) => j._id);

    const [
      totalApplications,
      shortlisted,
      reviewing,
      rejected,
      selected,
      recentRaw,
    ] = await Promise.all([
      JobApplication.countDocuments({ jobId: { $in: jobIds } }),
      JobApplication.countDocuments({ jobId: { $in: jobIds }, status: "shortlisted" }),
      JobApplication.countDocuments({ jobId: { $in: jobIds }, status: "reviewing" }),
      JobApplication.countDocuments({ jobId: { $in: jobIds }, status: "rejected" }),
      JobApplication.countDocuments({ jobId: { $in: jobIds }, status: "selected" }),
      JobApplication.find({ jobId: { $in: jobIds } })
        .populate("jobId", "title department location")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    const recentApplications = recentRaw.map((app) => ({
      _id: app._id,
      status: app.status,
      appliedAt: app.createdAt,
      jobTitle: app.jobId?.title || "",
      jobDepartment: app.jobId?.department || "",
      jobLocation: app.jobId?.location || "",
      studentSnapshot: app.studentSnapshot || {},
    }));

    return res.json({
      totalApplications,
      shortlisted,
      reviewing,
      rejected,
      selected,
      hired: selected,
      aiMatches: totalApplications,
      totalJobs: jobs.length,
      publishedJobs: jobs.filter((j) => j.status === "published").length,
      recentApplications,
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});

app.get("/api/student/my-applications", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Only students allowed" });
    }

    const applications = await JobApplication.find({ studentId: req.user.id })
      .populate({
        path: "jobId",
        populate: {
          path: "recruiterId",
          select: "name company email",
        },
      })
      .sort({ createdAt: -1 });

    const formatted = applications
      .filter((app) => app.jobId)
      .map((app) => ({
        _id: app._id,
        status: app.status,
        appliedAt: app.createdAt,
        atsResumeHtml: app.atsResumeHtml || "",
        studentSnapshot: app.studentSnapshot || {},

        job: {
          _id: app.jobId._id,
          title: app.jobId.title || "",
          department: app.jobId.department || "",
          location: app.jobId.location || "",
          salaryRange: app.jobId.salaryRange || "",
          jobType: app.jobId.jobType || "",
          experienceLevel: app.jobId.experienceLevel || "",
          educationLevels: app.jobId.educationLevels || [],
          skills: app.jobId.skills || [],
          description: app.jobId.description || "",
          responsibilities: app.jobId.responsibilities || [],
          qualifications: app.jobId.qualifications || [],
          benefits: app.jobId.benefits || [],
          imageUrl: app.jobId.imageUrl || "",
          imageFile: app.jobId.imageFile || "",
          recruiter: {
            name: app.jobId.recruiterId?.name || "",
            company: app.jobId.recruiterId?.company || "Company Name",
            email: app.jobId.recruiterId?.email || "",
          },
        },
      }));

    return res.json(formatted);
  } catch (err) {
    console.error("Fetch student applications error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});







// ================= RECRUITER SETTINGS =================

// recruiter only middleware
const recruiterOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "recruiter") {
    return res.status(403).json({ message: "Only recruiters allowed" });
  }
  next();
};

// GET recruiter settings/profile
app.get("/api/recruiter/settings", authMiddleware, recruiterOnly, async (req, res) => {
  try {
    const recruiter = await Recruiter.findById(req.user.id).select("-password -otp -otpExpiry");

    if (!recruiter) {
      return res.status(404).json({ message: "Recruiter not found" });
    }

    return res.json({
      recruiter: {
        _id: recruiter._id,
        name: recruiter.name || "",
        email: recruiter.email || "",
        company: recruiter.company || "",
        phone: recruiter.phone || "",
      },
    });
  } catch (err) {
    console.error("Get recruiter settings error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});

// UPDATE recruiter company / email / phone
app.put("/api/recruiter/settings", authMiddleware, recruiterOnly, async (req, res) => {
  try {
    const { company, email, phone } = req.body;

    const recruiter = await Recruiter.findById(req.user.id);

    if (!recruiter) {
      return res.status(404).json({ message: "Recruiter not found" });
    }

    // email validation + uniqueness
    if (email && email.trim() !== recruiter.email) {
      const cleanedEmail = email.trim().toLowerCase();

      const emailExistsInRecruiter = await Recruiter.findOne({
        email: cleanedEmail,
        _id: { $ne: recruiter._id },
      });

      if (emailExistsInRecruiter) {
        return res.status(400).json({ message: "Email already exists as recruiter" });
      }

      const emailExistsInStudent = await UserModel.findOne({ email: cleanedEmail });
      if (emailExistsInStudent) {
        return res.status(400).json({ message: "This email already exists as student" });
      }

      recruiter.email = cleanedEmail;
    }

    if (company !== undefined) {
      recruiter.company = company.trim();
    }

    if (phone !== undefined) {
      recruiter.phone = phone.trim();
    }

    await recruiter.save();

    return res.json({
      message: "Recruiter settings updated successfully",
      recruiter: {
        _id: recruiter._id,
        name: recruiter.name || "",
        email: recruiter.email || "",
        company: recruiter.company || "",
        phone: recruiter.phone || "",
      },
    });
  } catch (err) {
    console.error("Update recruiter settings error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});

// CHANGE recruiter password
app.put("/api/recruiter/change-password", authMiddleware, recruiterOnly, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "Current password, new password and confirm password are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New passwords do not match" });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;

    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message: "Password must contain uppercase, lowercase & special character",
      });
    }

    const recruiter = await Recruiter.findById(req.user.id);

    if (!recruiter) {
      return res.status(404).json({ message: "Recruiter not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, recruiter.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    recruiter.password = hashedPassword;

    await recruiter.save();

    return res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Recruiter change password error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});
























app.get("/api/recruiter/dashboard", authMiddleware, (req, res) => {

  if (req.user.role !== "recruiter")
    return res.status(403).json({ message: "Access denied" });

  res.json({ message: "Recruiter dashboard access granted" });

});


app.get("/api/student/dashboard", authMiddleware, (req, res) => {

  if (req.user.role !== "student")
    return res.status(403).json({ message: "Access denied" });

  res.json({ message: "Student dashboard access granted" });

});
















app.get("/", (req, res) => {
  res.send("Server working ✅");
});


const FriendRequestSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending"
  }
}, { timestamps: true });

const FriendRequest = mongoose.model("FriendRequest", FriendRequestSchema);















const studentOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "student") {
    return res.status(403).json({ message: "Only students allowed" });
  }
  next();
};















const buildProfileResponse = (user) => {
  return {
    _id: user._id,
    name: user.name || "",
    headline: user.headline || "",
    location: user.location || "",
    openTo: user.openTo || "Open to Work",
    profileType: user.profileType || "Student",
    mainSkills: Array.isArray(user.mainSkills) ? user.mainSkills : [],
    noticePeriod: user.noticePeriod || "Immediate",
    yearsOfExperience: user.yearsOfExperience || "",
    preferredLocations: Array.isArray(user.preferredLocations) ? user.preferredLocations : [],
    connections: Array.isArray(user.connections) ? user.connections.length : 0,
    followers: Array.isArray(user.followers) ? user.followers.length : 0,
    recruiterViews: Array.isArray(user.recruiterProfileViews)
  ? user.recruiterProfileViews.length
  : 0,
    about: user.about || "",
    careerGoal: user.careerGoal || "",
    avatar: user.avatar || "",
    coverImage: user.coverImage || "",
    introVideoUrl: user.introVideoUrl || "",
    introVideoDuration: user.introVideoDuration || "",
    introVideoViews: user.introVideoViews || 0,
    skills: Array.isArray(user.skills) ? user.skills : [],
    topSkill: user.topSkill || "",
    bestArea: user.bestArea || "",
    experience: Array.isArray(user.experience) ? user.experience : [],
    projects: Array.isArray(user.projects) ? user.projects : [],

    education: Array.isArray(user.education) ? user.education : [],
    reelsContent: Array.isArray(user.reelsContent) ? user.reelsContent : [],
    postsContent: Array.isArray(user.postsContent) ? user.postsContent : [],
    achievements: Array.isArray(user.achievements) ? user.achievements : [],
  };
};

app.get("/api/student/profile/me", authMiddleware, studentOnly, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id).select(
      "-password -otp -resetToken -resetTokenExpiry"
    );

    if (!user) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json({
      profile: {
        _id: user._id,
        name: user.name || "",
        headline: user.headline || "",
        location: user.location || "",
        openTo: user.openTo || "Open to Work",
        profileType: user.profileType || "Student",
        mainSkills: user.mainSkills || [],
        noticePeriod: user.noticePeriod || "Immediate",
preferredLocations: user.preferredLocations || [],
        connections: user.connections?.length || 0,
        followers: user.followers?.length || 0,

            recruiterViews: user.recruiterProfileViews?.length || 0, // add this

        about: user.about || "",
        careerGoal: user.careerGoal || "",
        avatar: user.avatar || "",
        coverImage: user.coverImage || "",
        introVideoUrl: user.introVideoUrl || "",
        introVideoDuration: user.introVideoDuration || "",
        introVideoViews: user.introVideoViews || 0,
        skills: user.skills || [],
        topSkill: user.topSkill || "",
        bestArea: user.bestArea || "",
        experience: user.experience || [],
        projects: user.projects || [],

        education: user.education || [],
        reelsContent: user.reelsContent || [],
        postsContent: user.postsContent || [],
        achievements: user.achievements || [],
      },
    });
  } catch (err) {
    console.error("Get my profile error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

app.put("/api/student/profile/me", authMiddleware, studentOnly, async (req, res) => {
  try {
    const {
      name,
      headline,
      location,
      openTo,
      profileType,
      mainSkills,
      noticePeriod,
      yearsOfExperience,
      preferredLocations,
      about,
      careerGoal,
      skills,
      topSkill,
      bestArea,
      experience,
      projects,
      education,
      reelsContent,
      postsContent,
      achievements,
    } = req.body;

    const user = await UserModel.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "Student not found" });
    }

    user.name = name ?? user.name;
    user.headline = headline ?? "";
    user.location = location ?? "";
    user.openTo = openTo ?? "Open to Work";
    user.profileType = profileType ?? "Student";
    user.mainSkills = Array.isArray(mainSkills) ? mainSkills.slice(0, 6) : [];
    user.noticePeriod = noticePeriod ?? "Immediate";
    user.yearsOfExperience = yearsOfExperience ?? "";
    user.preferredLocations = Array.isArray(preferredLocations)
      ? preferredLocations.slice(0, 3)
      : [];
    user.about = about ?? "";
    user.careerGoal = careerGoal ?? "";
    user.skills = Array.isArray(skills) ? skills : [];
    user.topSkill = topSkill ?? "";
    user.bestArea = bestArea ?? "";
    user.experience = Array.isArray(experience) ? experience : [];
    user.projects = Array.isArray(projects) ? projects : [];
    user.education = Array.isArray(education) ? education : [];
    user.reelsContent = Array.isArray(reelsContent) ? reelsContent : [];
    user.postsContent = Array.isArray(postsContent) ? postsContent : [];
    user.achievements = Array.isArray(achievements) ? achievements : [];

    await user.save();

    recommender.onUserUpsert(user);

    return res.json({
      message: "Profile updated successfully",
      profile: buildProfileResponse(user),
    });
  } catch (err) {
    console.error("Update profile/me error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});





app.post(
  "/api/recruiter/view-student-profile/:studentId",
  authMiddleware,
  async (req, res) => {
    try {
      if (!req.user || req.user.role !== "recruiter") {
        return res.status(403).json({ message: "Only recruiters allowed" });
      }

      const student = await UserModel.findById(req.params.studentId);

      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      if (!Array.isArray(student.recruiterProfileViews)) {
        student.recruiterProfileViews = [];
      }

      const alreadyViewed = student.recruiterProfileViews.some(
        (item) => String(item.recruiterId) === String(req.user.id)
      );

      if (!alreadyViewed) {
        student.recruiterProfileViews.push({
          recruiterId: req.user.id,
          viewedAt: new Date(),
        });

        await student.save();
      }

      return res.json({
        message: "Profile view tracked successfully",
        recruiterViews: student.recruiterProfileViews.length,
      });
    } catch (err) {
      console.error("Track recruiter profile view error:", err);
      return res.status(500).json({ message: err.message || "Server error" });
    }
  }
);







































/*app.get("/api/student/profile/:id", authMiddleware, studentOnly, async (req, res) => {
  try {
    cById(req.params.id).select(
      "-password -otp -resetToken -resetTokenExpiry"
    );

    if (!user) {
      return res.status(404).json({ message: "Student not found" });
    }

    return res.json({
      message: "Student profile fetched successfully",
      profile: buildProfileResponse(user),
    });
  } catch (err) {
    console.error("Get profile by id error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});*/ 




// GET STUDENT PROFILE BY ID (for recruiter view)
app.get("/api/student/profile/:id", authMiddleware,  async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id).select(
      "-password -otp -resetToken -resetTokenExpiry"
    );

    if (!user) {
      return res.status(404).json({ message: "Student not found" });
    }

    return res.json({
      profile: {
        _id: user._id,
        name: user.name || "",
        headline: user.headline || "",
        location: user.location || "",
        openTo: user.openTo || "Open to Work",
        profileType: user.profileType || "Student",
        mainSkills: user.mainSkills || [],
        noticePeriod: user.noticePeriod || "Immediate",
        yearsOfExperience: user.yearsOfExperience || "",
        preferredLocations: user.preferredLocations || [],
        connections: user.connections?.length || 0,
        followers: user.followers?.length || 0,

        // ⭐ IMPORTANT LINE
        recruiterViews: user.recruiterProfileViews?.length || 0,

        about: user.about || "",
        careerGoal: user.careerGoal || "",
        avatar: user.avatar || "",
        coverImage: user.coverImage || "",
        introVideoUrl: user.introVideoUrl || "",
        introVideoDuration: user.introVideoDuration || "",
        introVideoViews: user.introVideoViews || 0,
        skills: user.skills || [],
        topSkill: user.topSkill || "",
        bestArea: user.bestArea || "",
        experience: user.experience || [],
        projects: user.projects || [],
        education: user.education || [],
        reelsContent: user.reelsContent || [],
        postsContent: user.postsContent || [],
        achievements: user.achievements || [],
      },
    });
  } catch (err) {
    console.error("Get student profile error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});



app.post("/api/student/apply/:jobId", authMiddleware, studentOnly, async (req, res) => {
  try {
    const { atsResumeHtml } = req.body;

    const student = await UserModel.findById(req.user.id).select("-password");
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const job = await Job.findById(req.params.jobId).populate("recruiterId");
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.status !== "published") {
      return res.status(400).json({ message: "This job is not open for applications" });
    }

    const alreadyApplied = await JobApplication.findOne({
      jobId: job._id,
      studentId: student._id,
    });

    if (alreadyApplied) {
      return res.status(400).json({ message: "You already applied for this job" });
    }

    const application = await JobApplication.create({
      jobId: job._id,
      recruiterId: job.recruiterId._id,
      studentId: student._id,
      atsResumeHtml: atsResumeHtml || "",
      studentSnapshot: {
        name: student.name || "",
        email: student.email || "",
        headline: student.headline || "",
        location: student.location || "",
        about: student.about || "",
        careerGoal: student.careerGoal || "",
        avatar: student.avatar || "",
        coverImage: student.coverImage || "",
        introVideoUrl: student.introVideoUrl || "",
        introVideoDuration: student.introVideoDuration || "",
        introVideoViews: student.introVideoViews || 0,
        mainSkills: Array.isArray(student.mainSkills) ? student.mainSkills : [],
        skills: Array.isArray(student.skills) ? student.skills : [],
        topSkill: student.topSkill || "",
        bestArea: student.bestArea || "",
        noticePeriod: student.noticePeriod || "Immediate",
        yearsOfExperience: student.yearsOfExperience || "",
        preferredLocations: Array.isArray(student.preferredLocations) ? student.preferredLocations : [],
        experience: Array.isArray(student.experience) ? student.experience : [],
        education: Array.isArray(student.education) ? student.education : [],
        projects: Array.isArray(student.projects) ? student.projects : [],
      },
    });

    return res.status(201).json({
      message: "Applied successfully",
      application,
    });
  } catch (err) {
    console.error("Apply job error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});




















app.post("/api/student/request/:receiverId", authMiddleware, studentOnly, async (req, res) => {
  try {
    const senderId = req.user.id;
    const receiverId = req.params.receiverId;

    if (senderId === receiverId) {
      return res.status(400).json({ message: "You cannot send request to yourself" });
    }

    const sender = await UserModel.findById(senderId);
    const receiver = await UserModel.findById(receiverId);

    if (!sender || !receiver) {
      return res.status(404).json({ message: "Student not found" });
    }

    const alreadyConnected = sender.connections.some(
      (id) => id.toString() === receiverId
    );

    if (alreadyConnected) {
      return res.status(400).json({ message: "Already connected" });
    }

    const existingRequest = await FriendRequest.findOne({
      sender: senderId,
      receiver: receiverId,
      status: "pending"
    });

    if (existingRequest) {
      return res.status(400).json({ message: "Request already sent" });
    }

    const reversePending = await FriendRequest.findOne({
      sender: receiverId,
      receiver: senderId,
      status: "pending"
    });

    if (reversePending) {
      return res.status(400).json({ message: "This user already sent you a request" });
    }

    const request = await FriendRequest.create({
      sender: senderId,
      receiver: receiverId
    });

    await createNotification({
  receiverId: receiver._id,
  receiverModel: "User",
  senderId: sender._id,
  senderModel: "User",
  type: "friend_request",
  title: "New connection request",
  message: `${sender.name || "Someone"} sent you a connection request`,
  requestId: request._id,
});

    res.status(201).json({
      message: "Friend request sent successfully",
      request
    });
  } catch (err) {
    console.error("Send request error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});


app.get("/api/student/requests/incoming", authMiddleware, studentOnly, async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      receiver: req.user.id,
      status: "pending"
    })
      .populate("sender", "name email profileImage headline")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    console.error("Incoming requests error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});


app.get("/api/student/requests/outgoing", authMiddleware, studentOnly, async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      sender: req.user.id,
      status: "pending"
    })
      .populate("receiver", "name email profileImage headline")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    console.error("Outgoing requests error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});



app.put("/api/student/request/accept/:requestId", authMiddleware, studentOnly, async (req, res) => {
  try {
    const request = await FriendRequest.findById(req.params.requestId);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.receiver.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not allowed to accept this request" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: "Request already handled" });
    }

    request.status = "accepted";
    await request.save();

    const sender = await UserModel.findById(request.sender);
    const receiver = await UserModel.findById(request.receiver);

    if (!sender || !receiver) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (!sender.connections.includes(receiver._id)) {
      sender.connections.push(receiver._id);
    }

    if (!receiver.connections.includes(sender._id)) {
      receiver.connections.push(sender._id);
    }

    if (!sender.following.some((id) => String(id) === String(receiver._id))) {
  sender.following.push(receiver._id);
}

if (!receiver.followers.some((id) => String(id) === String(sender._id))) {
  receiver.followers.push(sender._id);
}

if (!receiver.following.some((id) => String(id) === String(sender._id))) {
  receiver.following.push(sender._id);
}

if (!sender.followers.some((id) => String(id) === String(receiver._id))) {
  sender.followers.push(receiver._id);
}



    await sender.save();
    await receiver.save();

    let conversation = await Conversation.findOne({
      members: { $all: [sender._id, receiver._id], $size: 2 }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        members: [sender._id, receiver._id],
        isAcceptedConnection: true,
            blockedBy: null,
    deletedFor: [],
    lastMessage: "",
    lastMessageType: "text",
    lastMessageSender: null,
    lastMessageAt: new Date(),

      });
    }

    res.json({
      message: "Friend request accepted",
      conversation
    });
  } catch (err) {
    console.error("Accept request error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});



app.put("/api/student/request/reject/:requestId", authMiddleware, studentOnly, async (req, res) => {
  try {
    const request = await FriendRequest.findById(req.params.requestId);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.receiver.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not allowed to reject this request" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: "Request already handled" });
    }

    request.status = "rejected";
    await request.save();

    res.json({ message: "Friend request rejected" });
  } catch (err) {
    console.error("Reject request error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});


app.get("/api/student/connections", authMiddleware, studentOnly, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id)
      .populate("connections", "name email profileImage headline");

    if (!user) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json(user.connections);
  } catch (err) {
    console.error("Connections error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});



app.delete("/api/student/connection/:studentId", authMiddleware, studentOnly, async (req, res) => {
  try {
    const myId = req.user.id;
    const otherId = req.params.studentId;

    if (String(myId) === String(otherId)) {
      return res.status(400).json({ message: "You cannot remove yourself" });
    }

    const me = await UserModel.findById(myId);
    const other = await UserModel.findById(otherId);

    if (!me || !other) {
      return res.status(404).json({ message: "Student not found" });
    }

    me.connections = (me.connections || []).filter(
      (id) => String(id) !== String(otherId)
    );
    other.connections = (other.connections || []).filter(
      (id) => String(id) !== String(myId)
    );

    me.following = (me.following || []).filter(
      (id) => String(id) !== String(otherId)
    );
    other.followers = (other.followers || []).filter(
      (id) => String(id) !== String(myId)
    );

    me.followers = (me.followers || []).filter(
      (id) => String(id) !== String(otherId)
    );
    other.following = (other.following || []).filter(
      (id) => String(id) !== String(myId)
    );

    await me.save();
    await other.save();

    await FriendRequest.deleteMany({
      $or: [
        { sender: myId, receiver: otherId },
        { sender: otherId, receiver: myId },
      ],
    });

    return res.json({ message: "Connection removed successfully" });
  } catch (err) {
    console.error("Remove connection error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});






app.get("/api/student/search", authMiddleware, studentOnly, async (req, res) => {
  try {
    const query = req.query.query?.trim() || "";

    const currentUser = await UserModel.findById(req.user.id).select("connections");
    if (!currentUser) {
      return res.status(404).json({ message: "Student not found" });
    }

    let filter = {
      role: "student",
      _id: { $ne: req.user.id }
    };

    if (query) {
      filter.name = { $regex: query, $options: "i" };
    }

    const students = await UserModel.find(filter)
      .select("name avatar profileImage headline location college skills connections")
      .sort({ createdAt: -1 });

    const outgoingRequests = await FriendRequest.find({
      sender: req.user.id,
      status: "pending"
    }).select("receiver");

    const outgoingReceiverIds = outgoingRequests.map((item) => String(item.receiver));
    const myConnectionIds = (currentUser.connections || []).map((id) => String(id));

    const formattedStudents = students.map((student) => ({
      _id: student._id,
      name: student.name || "",
      avatar: student.avatar || "",
      profileImage: student.profileImage || "",
      headline: student.headline || "",
      location: student.location || "",
      college: student.college || "",
      skills: student.skills || [],
      isConnected: myConnectionIds.includes(String(student._id)),
      isRequested: outgoingReceiverIds.includes(String(student._id)),
    }));

    res.json(formattedStudents);
  } catch (err) {
    console.error("Search students error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});



// ================= FOLLOWING LIST =================
app.get("/api/student/following", authMiddleware, studentOnly, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id)
      .populate("following", "name email avatar headline location");

    if (!user) {
      return res.status(404).json({ message: "Student not found" });
    }

    return res.json({
      count: user.following?.length || 0,
      following: user.following || [],
    });
  } catch (err) {
    console.error("Following list error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});

// ================= FOLLOWERS LIST =================
app.get("/api/student/followers", authMiddleware, studentOnly, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id)
      .populate("followers", "name email avatar headline location");

    if (!user) {
      return res.status(404).json({ message: "Student not found" });
    }

    return res.json({
      count: user.followers?.length || 0,
      followers: user.followers || [],
    });
  } catch (err) {
    console.error("Followers list error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});

// ================= UNFOLLOW / REMOVE FOLLOWING =================
app.delete("/api/student/following/:studentId", authMiddleware, studentOnly, async (req, res) => {
  try {
    const myId = req.user.id;
    const otherId = req.params.studentId;

    const me = await UserModel.findById(myId);
    const other = await UserModel.findById(otherId);

    if (!me || !other) {
      return res.status(404).json({ message: "Student not found" });
    }

    me.following = (me.following || []).filter(
      (id) => String(id) !== String(otherId)
    );

    other.followers = (other.followers || []).filter(
      (id) => String(id) !== String(myId)
    );

    await me.save();
    await other.save();

    return res.json({ message: "Unfollowed successfully" });
  } catch (err) {
    console.error("Unfollow error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});

// ================= REMOVE FOLLOWER =================
app.delete("/api/student/follower/:studentId", authMiddleware, studentOnly, async (req, res) => {
  try {
    const myId = req.user.id;
    const otherId = req.params.studentId;

    const me = await UserModel.findById(myId);
    const other = await UserModel.findById(otherId);

    if (!me || !other) {
      return res.status(404).json({ message: "Student not found" });
    }

    me.followers = (me.followers || []).filter(
      (id) => String(id) !== String(otherId)
    );

    other.following = (other.following || []).filter(
      (id) => String(id) !== String(myId)
    );

    await me.save();
    await other.save();

    return res.json({ message: "Follower removed successfully" });
  } catch (err) {
    console.error("Remove follower error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});


// ================= conversation =================//



const ReplySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      default: "",
    },
    profileImage: {
      type: String,
      default: "",
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const CommentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      default: "",
    },
    profileImage: {
      type: String,
      default: "",
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    replies: [ReplySchema],
  },
  { timestamps: true }
);

// Extract hashtags from free text. Preserves the original case of the first
// occurrence so the UI can display `#ReactJS` even when matching is case-insensitive.
/*function extractHashtags(text) {
  if (!text || typeof text !== "string") return [];
  const matches = text.match(/#[A-Za-z0-9_]{2,50}/g) || [];
  const seen = new Set();
  const out = [];
  for (const m of matches) {
    const key = m.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(m);
    }
  }
  return out;
}*/


function extractHashtags(text) {
  if (!text || typeof text !== "string") return [];

  const matches = text.match(/#[A-Za-z0-9_]{2,50}/g) || [];

  const seen = new Set();
  const out = [];

  for (const m of matches) {
    const tag = m.toLowerCase();

    if (!seen.has(tag)) {
      seen.add(tag);
      out.push(tag);   // <-- store lowercase
    }
  }

  return out;
} 




function formatPostCount(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M posts`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K posts`;
  return `${n} post${n === 1 ? "" : "s"}`;
}

const PostSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    author: {
      type: String,
      default: "",
    },
    profileImage: {
      type: String,
      default: "",
    },
    content: {
      type: String,
      default: "",
    },

    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },


    postType: {
      type: String,
      enum: ["text", "image", "video"],
      default: "text",
    },

    // NEW
postCategory: {
  type: String,
  enum: ["post", "reel"],
  default: "post",
},


    imageUrl: {
      type: String,
      default: "",
    },
    videoUrl: {
      type: String,
      default: "",
    },
    thumbnail: {
      type: String,
      default: "",
    },
    duration: {
      type: String,
      default: "",
    },

    cloudinaryPublicId: {
      type: String,
      default: "",
    },
    cloudinaryResourceType: {
      type: String,
      enum: ["image", "video", ""],
      default: "",
    },

    schedule: {
      type: Date,
      default: null,
    },

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    comments: [CommentSchema],

    // Hashtags extracted from `content`. Stored with original case; matched
    // case-insensitively by the trending aggregation. Indexed for fast lookup.
    tags: {
      type: [String],
      default: [],
      index: true,
    },
  },
  { timestamps: true }
);

const Post = mongoose.model("Post", PostSchema);

// ---- Trending topics: in-memory cache + one-time backfill ----
// We recompute the trending aggregation at most once every TRENDING_TTL_MS, and
// also bust the cache whenever a new tagged post is created so freshly used
// hashtags surface quickly. For multi-instance deployments this should move to
// Redis, but in-process is sufficient for current scale.
const TRENDING_TTL_MS = 5 * 60 * 1000;
const TRENDING_WINDOW_DAYS = 7;
let trendingCache = { data: null, computedAt: 0 };

function invalidateTrendingCache() {
  trendingCache = { data: null, computedAt: 0 };
}

async function backfillPostTags() {
  try {
    const candidates = await Post.find({
      $and: [
        { $or: [{ tags: { $exists: false } }, { tags: { $size: 0 } }] },
        { content: { $regex: /#[A-Za-z0-9_]{2,50}/ } },
      ],
    }).select("_id content");

    if (!candidates.length) {
      console.log("[trending] No posts need hashtag backfill.");
      return;
    }

    console.log(`[trending] Backfilling hashtags for ${candidates.length} post(s)...`);
    let updated = 0;
    for (const p of candidates) {
      const tags = extractHashtags(p.content);
      if (tags.length > 0) {
        await Post.updateOne({ _id: p._id }, { $set: { tags } });
        updated++;
      }
    }
    console.log(`[trending] Hashtag backfill complete. Updated ${updated} post(s).`);
    invalidateTrendingCache();
  } catch (err) {
    console.error("[trending] Backfill error:", err.message);
  }
}

// Run backfill once Mongo is connected. If already connected at this point
// (model was just created, connection promise already resolved), schedule it
// immediately; otherwise wait for the next `connected` event.
if (mongoose.connection.readyState === 1) {
  setImmediate(backfillPostTags);
} else {
  mongoose.connection.once("connected", () => {
    setImmediate(backfillPostTags);
  });
}

// ================= STUDENT POSTS =================

app.post(
  "/api/student/posts",
  authMiddleware,
  studentOnly,
  upload.single("media"),
  async (req, res) => {
    try {
      const { content, schedule , visibility } = req.body;

      const user = await UserModel.findById(req.user.id);

      if (!user) {
        return res.status(404).json({ message: "Student not found" });
      }

      const cleanContent = content?.trim() || "";

      if (!cleanContent && !req.file) {
        return res.status(400).json({
          message: "Post content or media is required",
        });
      }

      let detectedPostType = "text";
      let imageUrl = "";
      let videoUrl = "";
      let thumbnail = "";
      let duration = "";
      let cloudinaryPublicId = "";
      let cloudinaryResourceType = "";

if (req.file) {
  const isVideo = req.file.mimetype.startsWith("video/");
  const isImage = req.file.mimetype.startsWith("image/");

  if (!isVideo && !isImage) {
    return res.status(400).json({
      message: "Only image or video files are allowed",
    });
  }

  const uploadResult = await uploadToCloudinary(
    req.file.buffer,
    "gronxtiy/posts",
    isVideo ? "video" : "image"
  );

  cloudinaryPublicId = uploadResult.public_id || "";
  cloudinaryResourceType = isVideo ? "video" : "image";

  if (isImage) {
    detectedPostType = "image";
    imageUrl = uploadResult.secure_url;
    thumbnail = uploadResult.secure_url;
  }

  if (isVideo) {
    detectedPostType = "video";
    videoUrl = uploadResult.secure_url;
    thumbnail = uploadResult.secure_url;
  }
}

      const tags = extractHashtags(cleanContent);

      const newPost = await Post.create({
        userId: user._id,
        author: user.name || "Student",
        profileImage: user.avatar || "",
        content: cleanContent,
        visibility: visibility || "public",
        postType: detectedPostType,
        postCategory: "post",
        imageUrl,
        videoUrl,
        thumbnail,
        duration,
        cloudinaryPublicId,
        cloudinaryResourceType,
        schedule: schedule ? new Date(schedule) : null,
        likes: [],
        comments: [],
        tags,
      });

      if (tags.length > 0) {
        invalidateTrendingCache();
      }

      if (!Array.isArray(user.postsContent)) {
        user.postsContent = [];
      }

      

      if (!Array.isArray(user.reelsContent)) {
        user.reelsContent = [];
      }

    if (!Array.isArray(user.reelsContent)) {
  user.reelsContent = [];
}

if (newPost.postType === "image") {
  user.postsContent.unshift({
    id: newPost._id.toString(),
    title: newPost.content || "Image Post",
    thumbnail: newPost.imageUrl || newPost.thumbnail || "",
    type: "post",
    date: new Date().toLocaleDateString(),
  });
}

if (newPost.postType === "video") {
  user.postsContent.unshift({
    id: newPost._id.toString(),
    title: newPost.content || "Video Post",
    thumbnail: newPost.thumbnail || newPost.videoUrl || "",
    type: "post",
    date: new Date().toLocaleDateString(),
  });
}

if (newPost.postType === "text") {
  user.postsContent.unshift({
    id: newPost._id.toString(),
    title: newPost.content || "Text Post",
    thumbnail: "",
    type: "post",
    date: new Date().toLocaleDateString(),
  });
}

      await user.save();

      res.status(201).json({
        message: "Post created successfully",
        post: newPost,
      });
    } catch (err) {
      console.error("Create student post error:", err);
      res.status(500).json({ message: err.message || "Server error" });
    }
  }
);

// get all feed posts
/*app.get("/api/student/posts", authMiddleware, studentOnly, async (req, res) => {
  try {



    const user = await UserModel.findById(req.user.id)
  .select("savedPosts following connections");

const savedIds = (user?.savedPosts || []).map((id) => id.toString());

const allowedUsers = [
  ...(user.following || []).map((id) => id.toString()),
  ...(user.connections || []).map((id) => id.toString()),
  req.user.id,
];

let filter = {};

if (feed === "All") {
  // Everyone's public posts only
  filter = {
    visibility: "public",
  };
} else {
  // For You
  filter = {
    $or: [
      {
        visibility: "public",
      },
      {
        visibility: "private",
        userId: { $in: allowedUsers },
      },
    ],
  };
}

const posts = await Post.find(filter).sort({ createdAt: -1 });








    const formattedPosts = posts.map((post) => {
      const postObj = post.toObject();

      return {
        ...postObj,
        likesCount: post.likes?.length || 0,
        commentsCount: post.comments?.length || 0,
        isLiked: post.likes?.some((id) => id.toString() === req.user.id) || false,
        isSaved: savedIds.includes(post._id.toString()),
      };
    });

    res.json(formattedPosts);
  } catch (err) {
    console.error("Fetch student posts error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});*/ 


// ================= GET FEED POSTS =================
app.get("/api/student/posts", authMiddleware, studentOnly, async (req, res) => {
  try {
    const feed = req.query.feed || "For You";

    const user = await UserModel.findById(req.user.id).select(
      "savedPosts following connections"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const savedIds = (user.savedPosts || []).map((id) => id.toString());

    const networkUsers = [
      ...(user.following || []).map((id) => id.toString()),
      ...(user.connections || []).map((id) => id.toString()),
      req.user.id.toString(), // include own posts
    ];

let filter = {};






if (feed === "All") {
  filter = {
    visibility: "public",
    $or: [
      { postCategory: "post" },
      {
        postCategory: "reel",
        sharedToFeed: true,
      },
    ],
  };
} else {
  filter = {
    userId: {
      $in: networkUsers,
    },
    $or: [
      { postCategory: "post" },
      {
        postCategory: "reel",
        sharedToFeed: true,
      },
    ],
  };
}






    const posts = await Post.find(filter).sort({ createdAt: -1 });

    const formattedPosts = posts.map((post) => {
      const postObj = post.toObject();

      return {
        ...postObj,
        likesCount: post.likes?.length || 0,
        commentsCount: post.comments?.length || 0,
        isLiked:
          post.likes?.some((id) => id.toString() === req.user.id) || false,
        isSaved: savedIds.includes(post._id.toString()),
      };
    });

    res.json(formattedPosts);
  } catch (err) {
    console.error("Fetch student posts error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});








// Trending hashtags surfaced on the student home page right sidebar.
// Aggregates posts created within the last TRENDING_WINDOW_DAYS, groups by
// lowercased tag (so #ReactJS and #reactjs merge), then ranks by a simple
// engagement score: posts * 1 + likes * 2 + comments * 3.
app.get(
  "/api/student/trending-topics",
  authMiddleware,
  studentOnly,
  async (req, res) => {
    try {
      const now = Date.now();
      const limit = Math.min(parseInt(req.query.limit, 10) || 8, 20);

      if (
        trendingCache.data &&
        now - trendingCache.computedAt < TRENDING_TTL_MS
      ) {
        return res.json(trendingCache.data.slice(0, limit));
      }

      const cutoff = new Date(now - TRENDING_WINDOW_DAYS * 24 * 60 * 60 * 1000);

      const raw = await Post.aggregate([
        {
          $match: {
            createdAt: { $gte: cutoff },
            tags: { $exists: true, $ne: [] },
          },
        },
        { $unwind: "$tags" },
        {
          $group: {
            _id: { $toLower: "$tags" },
            displayTag: { $first: "$tags" },
            postCount: { $sum: 1 },
            totalLikes: {
              $sum: { $size: { $ifNull: ["$likes", []] } },
            },
            totalComments: {
              $sum: { $size: { $ifNull: ["$comments", []] } },
            },
          },
        },
        {
          $addFields: {
            engagementScore: {
              $add: [
                "$postCount",
                { $multiply: ["$totalLikes", 2] },
                { $multiply: ["$totalComments", 3] },
              ],
            },
          },
        },
        { $sort: { engagementScore: -1, postCount: -1, _id: 1 } },
        { $limit: 20 },
      ]);

      const formatted = raw.map((row, idx) => ({
        id: idx + 1,
        tag: row.displayTag,
        posts: formatPostCount(row.postCount),
        postCount: row.postCount,
        engagementScore: row.engagementScore,
      }));

      trendingCache = { data: formatted, computedAt: now };

      res.json(formatted.slice(0, limit));
    } catch (err) {
      console.error("Trending topics error:", err);
      res.status(500).json({ message: err.message || "Server error" });
    }
  }
);



app.delete("/api/student/posts/:postId", authMiddleware, studentOnly, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findOne({
  _id: postId,
  userId: req.user.id,
  postCategory: "post",
});

    if (!post) {
      return res.status(404).json({ message: "Post not found or access denied" });
    }

    // delete cloudinary media if exists
    if (post.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(post.cloudinaryPublicId, {
          resource_type: post.cloudinaryResourceType || "image",
        });
      } catch (cloudErr) {
        console.error("Cloudinary delete error:", cloudErr);
      }
    }

    await Post.deleteOne({ _id: postId });

    const user = await UserModel.findById(req.user.id);
    if (user) {
      user.postsContent = (user.postsContent || []).filter(
        (item) => String(item.id) !== String(postId)
      );

      user.reelsContent = (user.reelsContent || []).filter(
        (item) => String(item.id) !== String(postId)
      );

      await user.save();
    }

    return res.json({ message: "Post and media deleted successfully" });
  } catch (err) {
    console.error("Delete post error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});



app.post(
  "/api/student/reels",
  authMiddleware,
  studentOnly,
  upload.single("media"),
  async (req, res) => {
    try {
           const { content, schedule, sharedToFeed } = req.body;
      const user = await UserModel.findById(req.user.id);

      if (!user) {
        return res.status(404).json({ message: "Student not found" });
      }

      const cleanContent = content?.trim() || "";

      if (!cleanContent && !req.file) {
        return res.status(400).json({
          message: "Reel content or media is required",
        });
      }

      let detectedPostType = "text";
      let imageUrl = "";
      let videoUrl = "";
      let thumbnail = "";
      let duration = "";
      let cloudinaryPublicId = "";
      let cloudinaryResourceType = "";

      if (req.file) {
        const isVideo = req.file.mimetype.startsWith("video/");
        const isImage = req.file.mimetype.startsWith("image/");

        if (!isVideo && !isImage) {
          return res.status(400).json({
            message: "Only image or video files are allowed",
          });
        }

        const uploadResult = await uploadToCloudinary(
          req.file.buffer,
          "gronxtiy/reels",
          isVideo ? "video" : "image"
        );

        cloudinaryPublicId = uploadResult.public_id || "";
        cloudinaryResourceType = isVideo ? "video" : "image";

        if (isImage) {
          detectedPostType = "image";
          imageUrl = uploadResult.secure_url;
          thumbnail = uploadResult.secure_url;
        }

        if (isVideo) {
          detectedPostType = "video";
          videoUrl = uploadResult.secure_url;
          thumbnail = uploadResult.secure_url;
        }
      }

      const newReel = await Post.create({
        userId: user._id,
        author: user.name || "Student",
        profileImage: user.avatar || "",
        content: cleanContent,
        postType: detectedPostType,
          postCategory: "reel",
  sharedToFeed: sharedToFeed === "true",

        imageUrl,
        videoUrl,
        thumbnail,
        duration,
        cloudinaryPublicId,
        cloudinaryResourceType,
        schedule: schedule ? new Date(schedule) : null,
        likes: [],
        comments: [],
      });

      if (!Array.isArray(user.reelsContent)) {
        user.reelsContent = [];
      }

      user.reelsContent.unshift({
        id: newReel._id.toString(),
        title:
          newReel.content ||
          (detectedPostType === "video" ? "Video Reel" : "Image Reel"),
        thumbnail:
          newReel.thumbnail || newReel.videoUrl || newReel.imageUrl || "",
        type: "reel",
        views: 0,
        duration: newReel.duration || "",
      });

      await user.save();

      return res.status(201).json({
        message: "Reel created successfully",
        reel: newReel,
      });
    } catch (err) {
      console.error("Create reel error:", err);
      return res.status(500).json({ message: err.message || "Server error" });
    }
  }
);


// ================= GET ALL REELS =================


app.get("/api/student/reels", authMiddleware, studentOnly, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id).select("savedPosts");

    if (!user) {
      return res.status(404).json({ message: "Student not found" });
    }

    const savedIds = (user.savedPosts || []).map((id) => id.toString());

    const reels = await Post.find({
  postCategory: "reel",
}).sort({ createdAt: -1 });

    const formattedReels = reels.map((reel) => {
      const reelObj = reel.toObject();

      return {
        ...reelObj,
        likesCount: reel.likes?.length || 0,
        commentsCount: reel.comments?.length || 0,
        isLiked: reel.likes?.some((id) => id.toString() === req.user.id) || false,
        isSaved: savedIds.includes(reel._id.toString()),
      };
    });

    res.json(formattedReels);
  } catch (err) {
    console.error("Fetch student reels error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});



// ======================= this reel see only other not see our own reel =============//

/*app.get("/api/student/reels", authMiddleware, studentOnly, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id).select("savedPosts");

    if (!user) {
      return res.status(404).json({ message: "Student not found" });
    }

    const savedIds = (user.savedPosts || []).map((id) => id.toString());

    const reels = await Post.find({
      userId: { $ne: req.user.id },
      $or: [
        { videoUrl: { $ne: "" } },
        { imageUrl: { $ne: "" } }
      ]
    }).sort({ createdAt: -1 });

    const formattedReels = reels.map((reel) => {
      const reelObj = reel.toObject();

      return {
        ...reelObj,
        likesCount: reel.likes?.length || 0,
        commentsCount: reel.comments?.length || 0,
        isLiked:
          reel.likes?.some((id) => id.toString() === req.user.id) || false,
        isSaved: savedIds.includes(reel._id.toString()),
      };
    });

    res.json(formattedReels);
  } catch (err) {
    console.error("Fetch student reels error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});*/














// ================= DELETE REEL =================


app.delete("/api/student/reels/:reelId", authMiddleware, studentOnly, async (req, res) => {
  try {
    const { reelId } = req.params;

    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "Student not found" });
    }

    const reel = await Post.findOne({
  _id: reelId,
  userId: req.user.id,
  postCategory: "reel",
});
    if (!reel) {
      return res.status(404).json({ message: "Reel not found or access denied" });
    }

    if (reel.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(reel.cloudinaryPublicId, {
          resource_type: reel.cloudinaryResourceType || "image",
        });
      } catch (cloudErr) {
        console.error("Cloudinary reel delete error:", cloudErr);
      }
    }

    await Post.deleteOne({ _id: reelId });

    user.reelsContent = (user.reelsContent || []).filter(
      (item) => String(item.id) !== String(reelId)
    );

    await user.save();

    return res.json({ message: "Reel and media deleted successfully" });
  } catch (err) {
    console.error("Delete reel error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});








app.put("/api/student/posts/:postId/like", authMiddleware, studentOnly, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const alreadyLiked = post.likes.some(
      (id) => id.toString() === req.user.id
    );

    if (alreadyLiked) {
      post.likes = post.likes.filter(
        (id) => id.toString() !== req.user.id
      );
    } else {
      post.likes.push(req.user.id);
    }

    await post.save();

    if (!alreadyLiked && String(post.userId) !== String(req.user.id)) {
  const sender = await UserModel.findById(req.user.id).select("name");

  await createNotification({
    receiverId: post.userId,
    receiverModel: "User",
    senderId: req.user.id,
    senderModel: "User",
    type: "post_like",
    title: "New like",
    message: `${sender?.name || "Someone"} liked your post`,
    postId: post._id,
  });
}



    res.json({
      message: alreadyLiked ? "Post unliked" : "Post liked",
      likesCount: post.likes.length,
      isLiked: !alreadyLiked,
    });
  } catch (err) {
    console.error("Like post error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});


app.post("/api/student/posts/:postId/comments", authMiddleware, studentOnly, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const user = await UserModel.findById(req.user.id);
    const post = await Post.findById(req.params.postId);

    if (!user) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    post.comments.unshift({
      userId: user._id,
      name: user.name || "Student",
      profileImage: user.avatar || "",
      text: text.trim(),
      likes: [],
      replies: [],
    });

    await post.save();

    if (String(post.userId) !== String(user._id)) {
  const latestComment = post.comments[0];

  await createNotification({
    receiverId: post.userId,
    receiverModel: "User",
    senderId: user._id,
    senderModel: "User",
    type: "post_comment",
    title: "New comment",
    message: `${user.name || "Someone"} commented on your post`,
    postId: post._id,
    commentId: latestComment?._id || null,
  });
}

    res.status(201).json({
      message: "Comment added successfully",
      comments: post.comments,
    });
  } catch (err) {
    console.error("Add comment error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});


app.post("/api/student/posts/:postId/comments/:commentId/replies", authMiddleware, studentOnly, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Reply text is required" });
    }

    const user = await UserModel.findById(req.user.id);
    const post = await Post.findById(req.params.postId);

    if (!user) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = post.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    comment.replies.push({
      userId: user._id,
      name: user.name || "Student",
      profileImage: user.avatar || "",
      text: text.trim(),
    });

    await post.save();

if (String(comment.userId) !== String(user._id)) {
  await createNotification({
    receiverId: comment.userId,
    receiverModel: "User",
    senderId: user._id,
    senderModel: "User",
    type: "comment_reply",
    title: "New reply",
    message: `${user.name || "Someone"} replied to your comment`,
    postId: post._id,
    commentId: comment._id,
  });
}


    res.status(201).json({
      message: "Reply added successfully",
      comments: post.comments,
    });
  } catch (err) {
    console.error("Add reply error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

app.put("/api/student/posts/:postId/comments/:commentId/like", authMiddleware, studentOnly, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = post.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const alreadyLiked = comment.likes.some(
      (id) => id.toString() === req.user.id
    );

    if (alreadyLiked) {
      comment.likes = comment.likes.filter(
        (id) => id.toString() !== req.user.id
      );
    } else {
      comment.likes.push(req.user.id);
    }

    await post.save();

    if (!alreadyLiked && String(comment.userId) !== String(req.user.id)) {
  const sender = await UserModel.findById(req.user.id).select("name");

  await createNotification({
    receiverId: comment.userId,
    receiverModel: "User",
    senderId: req.user.id,
    senderModel: "User",
    type: "comment_like",
    title: "Comment liked",
    message: `${sender?.name || "Someone"} liked your comment`,
    postId: post._id,
    commentId: comment._id,
  });
}

    res.json({
      message: alreadyLiked ? "Comment unliked" : "Comment liked",
      commentLikesCount: comment.likes.length,
      isLiked: !alreadyLiked,
    });
  } catch (err) {
    console.error("Like comment error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});



app.get("/api/student/posts/:postId", authMiddleware, studentOnly, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate("userId", "name avatar")
      .populate("comments.userId", "name avatar")
      .populate("comments.replies.userId", "name avatar");

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json({
      post: {
        _id: post._id,
        author: post.author || "",
        profileImage: post.profileImage || "",
        content: post.content || "",
        postType: post.postType || "text",
        imageUrl: post.imageUrl || "",
        videoUrl: post.videoUrl || "",
        thumbnail: post.thumbnail || "",
        duration: post.duration || "",
        likes: post.likes || [],
        likesCount: post.likes?.length || 0,
        comments: post.comments || [],
        createdAt: post.createdAt,
      },
    });
  } catch (err) {
    console.error("Fetch single post error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});









// get only video posts
app.get("/api/student/videos", authMiddleware, studentOnly, async (req, res) => {
  try {
    const videos = await Post.find({
      videoUrl: { $exists: true, $ne: "" }
    }).sort({ createdAt: -1 });

    res.json(videos);
  } catch (err) {
    console.error("Fetch student videos error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});




app.put("/api/student/posts/:id/save", authMiddleware, studentOnly, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post or reel not found" });
    }

    if (!Array.isArray(user.savedPosts)) {
      user.savedPosts = [];
    }

    const alreadySaved = user.savedPosts.some(
      (id) => id.toString() === postId.toString()
    );

    if (alreadySaved) {
      user.savedPosts = user.savedPosts.filter(
        (id) => id.toString() !== postId.toString()
      );
    } else {
      user.savedPosts.push(postId);
    }

    await user.save();

    return res.json({
      message: alreadySaved ? "Removed from saved" : "Saved successfully",
      isSaved: !alreadySaved,
      savedPosts: user.savedPosts,
    });
  } catch (error) {
    console.log("Save post/reel error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/student/saved-posts", authMiddleware, studentOnly, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id).populate("savedPosts");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const savedItems = (user.savedPosts || []).map((item) => {
      const obj = item.toObject();

      const isReel = (user.reelsContent || []).some(
        (reel) => String(reel.id) === String(item._id)
      );

      return {
        ...obj,
        itemType: isReel ? "reel" : "post",
      };
    });

    return res.json(savedItems);
  } catch (error) {
    console.log("Fetch saved posts error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});



app.get("/api/student/saved-posts", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("savedPosts");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user.savedPosts || []);
  } catch (error) {
    console.log("Fetch saved posts error:", error);
    res.status(500).json({ message: "Server error" });
  }
});




// ================= STATUS SCHEMA =================
const StatusSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    author: {
      type: String,
      default: "",
    },
    profileImage: {
      type: String,
      default: "",
    },

    mediaType: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },

    imageUrl: {
      type: String,
      default: "",
    },
    videoUrl: {
      type: String,
      default: "",
    },

    cloudinaryPublicId: {
      type: String,
      default: "",
    },
    cloudinaryResourceType: {
      type: String,
      enum: ["image", "video", ""],
      default: "",
    },

    caption: {
      type: String,
      default: "",
    },

    viewers: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        name: {
          type: String,
          default: "",
        },
        profileImage: {
          type: String,
          default: "",
        },
        viewedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    reactions: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        name: {
          type: String,
          default: "",
        },
        profileImage: {
          type: String,
          default: "",
        },
        emoji: {
          type: String,
          default: "❤️",
        },
        reactedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    replies: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        name: {
          type: String,
          default: "",
        },
        profileImage: {
          type: String,
          default: "",
        },
        text: {
          type: String,
          default: "",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
  },
  { timestamps: true }
);

const Status = mongoose.model("Status", StatusSchema);


// ================= CREATE STATUS =================
app.post(
  "/api/student/status",
  authMiddleware,
  studentOnly,
  upload.single("statusMedia"),
  async (req, res) => {
    try {
      const caption = req.body?.caption || "";

      const student = await UserModel.findById(req.user.id);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "Image or video file is required" });
      }

      const mimeType = req.file.mimetype || "";
      const isImage = mimeType.startsWith("image/");
      const isVideo = mimeType.startsWith("video/");

      if (!isImage && !isVideo) {
        return res.status(400).json({
          message: "Only image and video files are allowed",
        });
      }

      const uploadedMedia = await uploadToCloudinary(
        req.file.buffer,
        "gronxtiy/status",
        isVideo ? "video" : "image"
      );

      const status = await Status.create({
        userId: student._id,
        author: student.name || "Student",
        profileImage: student.avatar || "",
        mediaType: isImage ? "image" : "video",
        imageUrl: isImage ? uploadedMedia.secure_url : "",
        videoUrl: isVideo ? uploadedMedia.secure_url : "",
        cloudinaryPublicId: uploadedMedia.public_id || "",
        cloudinaryResourceType: isVideo ? "video" : "image",
        caption,
        viewers: [],
        reactions: [],
        replies: [],
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      res.status(201).json({
        message: "Status posted successfully",
        status,
      });
    } catch (err) {
      console.error("Create status error:", err);
      res.status(500).json({ message: err.message || "Server error" });
    }
  }
);


// ================= GET ALL ACTIVE STATUS =================
app.get("/api/student/status", authMiddleware, studentOnly, async (req, res) => {
  try {
    const statuses = await Status.find({
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    res.json(statuses);
  } catch (err) {
    console.error("Fetch status error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});


// ================= GET MY STATUS ONLY =================
app.get("/api/student/status/me", authMiddleware, studentOnly, async (req, res) => {
  try {
    const now = new Date();

    const myStatuses = await Status.find({
      userId: req.user.id,
      expiresAt: { $gt: now },
    }).sort({ createdAt: -1 });

    res.json(myStatuses);
  } catch (err) {
    console.error("Fetch my status error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// ================= DELETE STATUS =================
app.delete("/api/student/status/:id", authMiddleware, studentOnly, async (req, res) => {
  try {
    const status = await Status.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!status) {
      return res.status(404).json({ message: "Status not found" });
    }

    if (status.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(status.cloudinaryPublicId, {
        resource_type: status.cloudinaryResourceType || "image",
      });
    }

    await Status.deleteOne({ _id: status._id });

    res.json({ message: "Status deleted permanently" });
  } catch (err) {
    console.error("Delete status error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});





app.post("/api/student/status/:statusId/view", authMiddleware, studentOnly, async (req, res) => {
  try {
    const status = await Status.findById(req.params.statusId);
    if (!status) {
      return res.status(404).json({ message: "Status not found" });
    }

    const student = await UserModel.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // owner should never be counted in own views
    if (String(status.userId) === String(student._id)) {
      return res.json({
        message: "Own status view ignored",
        viewersCount: status.viewers?.length || 0,
      });
    }

    if (!Array.isArray(status.viewers)) {
      status.viewers = [];
    }

    const alreadyViewed = status.viewers.some(
      (item) => String(item.userId) === String(student._id)
    );

    if (!alreadyViewed) {
      status.viewers.push({
        userId: student._id,
        name: student.name || "",
        profileImage: student.avatar || "",
        viewedAt: new Date(),
      });

      await status.save();
    }

    res.json({
      message: "View tracked successfully",
      viewersCount: status.viewers.length,
    });
  } catch (err) {
    console.error("Status view error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});



app.post("/api/student/status/:statusId/react", authMiddleware, studentOnly, async (req, res) => {
  try {
    const { emoji } = req.body;

    const status = await Status.findById(req.params.statusId);
    if (!status) {
      return res.status(404).json({ message: "Status not found" });
    }

    const student = await UserModel.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const existingReactionIndex = status.reactions.findIndex(
      (item) => String(item.userId) === String(student._id)
    );

    if (existingReactionIndex !== -1) {
      status.reactions[existingReactionIndex].emoji = emoji || "❤️";
      status.reactions[existingReactionIndex].reactedAt = new Date();
    } else {
      status.reactions.push({
        userId: student._id,
        name: student.name || "",
        profileImage: student.avatar || "",
        emoji: emoji || "❤️",
        reactedAt: new Date(),
      });
    }

    await status.save();

    res.json({
      message: "Reaction sent successfully",
      reactions: status.reactions,
    });
  } catch (err) {
    console.error("Status reaction error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

app.post("/api/student/status/:statusId/reply", authMiddleware, studentOnly, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Reply text is required" });
    }

    const status = await Status.findById(req.params.statusId);
    if (!status) {
      return res.status(404).json({ message: "Status not found" });
    }

    const sender = await UserModel.findById(req.user.id);
    const owner = await UserModel.findById(status.userId);

    if (!sender || !owner) {
      return res.status(404).json({ message: "User not found" });
    }

   {/* status.replies.push({
      userId: sender._id,
      name: sender.name || "",
      profileImage: sender.avatar || "",
      text: text.trim(),
      createdAt: new Date(),
    }); */}

    await status.save();

    let conversation = await Conversation.findOne({
      members: { $all: [sender._id, owner._id], $size: 2 },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        members: [sender._id, owner._id],
        isAcceptedConnection: true,
        lastMessage: "",
      });
    }

    const chatText = `Reply to your status: ${text.trim()}`;

    const chatMessage = await Message.create({
      conversationId: conversation._id,
      sender: sender._id,
      receiver: owner._id,
      text: chatText,
      image: "",
      video: "",
      audio: "",
      sticker: "",
      thumbnail: "",
      duration: "",
      messageType: "text",
      seenBy: [sender._id],
    });

    conversation.lastMessage = chatText;
    conversation.lastMessageType = "text";
    conversation.lastMessageSender = sender._id;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    res.status(201).json({
      message: "Reply sent successfully",
      reply: status.replies[status.replies.length - 1],
      chatMessage,
    });
  } catch (err) {
    console.error("Status reply error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});




app.get("/api/student/my-status", authMiddleware, studentOnly, async (req, res) => {
  try {
    const myStatuses = await Status.find({
      userId: req.user.id,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    res.json(myStatuses);
  } catch (err) {
    console.error("Fetch my status error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});








// ================ Admin =====================//



const AdminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, unique: true, required: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, default: "admin" },
    isVerified: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Admin = mongoose.model("Admin", AdminSchema);

// ================= ADMIN ONLY =================
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admin allowed" });
  }
  next();
};

// ================= ADMIN REGISTER =================
app.post("/api/admin/register", async (req, res) => {
  try {
    let { name, email, password, confirmPassword } = req.body;

    email = email?.trim().toLowerCase();

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await Admin.create({
      name,
      email,
      password: hashedPassword,
      role: "admin",
      isVerified: true,
    });

    return res.status(201).json({
      message: "Admin registered successfully",
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isVerified: admin.isVerified,
      },
    });
  } catch (err) {
    console.error("Admin register error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});

// ================= ADMIN LOGIN =================
app.post("/api/admin/login", async (req, res) => {
  try {
    let { email, password } = req.body;

    email = email?.trim().toLowerCase();

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      {
        id: admin._id,
        email: admin.email,
        role: admin.role,
      },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "1d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.json({
      message: "Admin login successful",
      role: admin.role,
      user: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    console.error("Admin login error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});

// ================= ADMIN DASHBOARD =================
app.get("/api/admin/dashboard", authMiddleware, adminOnly, async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).select("-password");

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    return res.json({
      message: "Admin dashboard access granted",
      admin,
    });
  } catch (err) {
    console.error("Admin dashboard error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});

// ================= ADMIN PROFILE =================
app.get("/api/admin/me", authMiddleware, adminOnly, async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).select("-password");

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    return res.json(admin);
  } catch (err) {
    console.error("Admin me error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});

// ================= ADMIN LOGOUT =================
app.post("/api/admin/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });

  return res.json({ message: "Logged out successfully" });
});

// ================= TEST =================


app.get("/", (req, res) => {
  res.send("Server working ✅");
});



// ================== notication ========================/

const  NotificationSchema = new mongoose.Schema(

  {
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "receiverModel",
      required: true,
    },
    receiverModel: {
      type: String,
      enum: ["User", "Recruiter"],
      required: true,
      default: "User",
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "senderModel",
      default: null,
    },
    senderModel: {
      type: String,
      enum: ["User", "Recruiter"],
      default: "User",
    },

    type: {
      type: String,
      enum: [
        "friend_request",
        "post_like",
        "post_comment",
        "comment_like",
        "comment_reply",
        "application_status",
      ],
      required: true,
    },

    title: {
      type: String,
      default: "",
      trim: true,
    },

    message: {
      type: String,
      default: "",
      trim: true,
    },

    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },

    commentId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobApplication",
      default: null,
    },

    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FriendRequest",
      default: null,
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", NotificationSchema);



async function createNotification({
  receiverId,
  receiverModel = "User",
  senderId = null,
  senderModel = "User",
  type,
  title,
  message,
  postId = null,
  commentId = null,
  applicationId = null,
  requestId = null,
}) {
  try {
    if (!receiverId || !type) return null;

    const notification = await Notification.create({
      receiverId,
      receiverModel,
      senderId,
      senderModel,
      type,
      title,
      message,
      postId,
      commentId,
      applicationId,
      requestId,
    });

    const populatedNotification = await Notification.findById(notification._id)
      .populate("senderId", "name email avatar company")
.populate("postId")
.lean();

    io.to(String(receiverId)).emit("new_notification", populatedNotification);

    return populatedNotification;
  } catch (error) {
    console.error("Create notification error:", error);
    return null;
  }
}


app.get("/api/notifications", authMiddleware, async (req, res) => {
  try {
    const receiverModel = req.user.role === "recruiter" ? "Recruiter" : "User";

    const notifications = await Notification.find({
  receiverId: req.user.id,
  receiverModel,
})
.populate("senderId", "name email avatar company")
.populate("postId")
.sort({ createdAt: -1 });

    res.json(notifications);
  } catch (err) {
    console.error("Fetch notifications error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

app.get("/api/notifications/unread-count", authMiddleware, async (req, res) => {
  try {
    const receiverModel = req.user.role === "recruiter" ? "Recruiter" : "User";

    const count = await Notification.countDocuments({
      receiverId: req.user.id,
      receiverModel,
      isRead: false,
    });

    res.json({ unreadCount: count });
  } catch (err) {
    console.error("Unread notification count error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

app.put("/api/notifications/:id/read", authMiddleware, async (req, res) => {
  try {
    const receiverModel = req.user.role === "recruiter" ? "Recruiter" : "User";

    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        receiverId: req.user.id,
        receiverModel,
      },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({
      message: "Notification marked as read",
      notification,
    });
  } catch (err) {
    console.error("Mark notification read error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

app.put("/api/notifications/read-all", authMiddleware, async (req, res) => {
  try {
    const receiverModel = req.user.role === "recruiter" ? "Recruiter" : "User";

    await Notification.updateMany(
      {
        receiverId: req.user.id,
        receiverModel,
        isRead: false,
      },
      { isRead: true }
    );

    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    console.error("Read all notifications error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

app.delete("/api/notifications/:id", authMiddleware, async (req, res) => {
  try {
    const receiverModel = req.user.role === "recruiter" ? "Recruiter" : "User";

    const deleted = await Notification.findOneAndDelete({
      _id: req.params.id,
      receiverId: req.user.id,
      receiverModel,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification deleted successfully" });
  } catch (err) {
    console.error("Delete notification error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});




// ================= ADMIN MANAGEMENT APIs =================

// ===== GET ALL STUDENTS =====
app.get("/api/admin/students", authMiddleware, adminOnly, async (req, res) => {
  try {
    const students = await UserModel.find()
      .select("-password -otp -otpExpiry -resetToken -resetTokenExpiry")
      .sort({ createdAt: -1 });

    res.json({
      message: "Students fetched successfully",
      students,
    });
  } catch (err) {
    console.error("Get students error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// ===== GET SINGLE STUDENT =====
app.get("/api/admin/students/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const student = await UserModel.findById(req.params.id)
      .select("-password -otp -otpExpiry -resetToken -resetTokenExpiry");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json({
      message: "Student fetched successfully",
      student,
    });
  } catch (err) {
    console.error("Get single student error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// ===== DELETE STUDENT =====
app.delete("/api/admin/students/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const student = await UserModel.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // delete related data
    await Post.deleteMany({ userId: student._id });
    await Status.deleteMany({ userId: student._id });
    await FriendRequest.deleteMany({
      $or: [{ sender: student._id }, { receiver: student._id }]
    });
    await Conversation.deleteMany({
      members: student._id
    });
    await Message.deleteMany({
      sender: student._id
    });

    await UserModel.findByIdAndDelete(req.params.id);

    res.json({ message: "Student deleted successfully" });
  } catch (err) {
    console.error("Delete student error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});


// ===== GET ALL RECRUITERS =====
app.get("/api/admin/recruiters", authMiddleware, adminOnly, async (req, res) => {
  try {
    const recruiters = await Recruiter.find()
      .select("-password -otp -otpExpiry")
      .sort({ createdAt: -1 });

    res.json({
      message: "Recruiters fetched successfully",
      recruiters,
    });
  } catch (err) {
    console.error("Get recruiters error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// ===== GET SINGLE RECRUITER =====
app.get("/api/admin/recruiters/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const recruiter = await Recruiter.findById(req.params.id)
      .select("-password -otp -otpExpiry");

    if (!recruiter) {
      return res.status(404).json({ message: "Recruiter not found" });
    }

    const jobs = await Job.find({ recruiterId: recruiter._id }).sort({ createdAt: -1 });

    res.json({
      message: "Recruiter fetched successfully",
      recruiter,
      jobs,
    });
  } catch (err) {
    console.error("Get single recruiter error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// ===== DELETE RECRUITER =====
app.delete("/api/admin/recruiters/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const recruiter = await Recruiter.findById(req.params.id);

    if (!recruiter) {
      return res.status(404).json({ message: "Recruiter not found" });
    }

    // delete related jobs
    await Job.deleteMany({ recruiterId: recruiter._id });

    await Recruiter.findByIdAndDelete(req.params.id);

    res.json({ message: "Recruiter deleted successfully" });
  } catch (err) {
    console.error("Delete recruiter error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});


// ===== GET ALL JOBS =====
app.get("/api/admin/jobs", authMiddleware, adminOnly, async (req, res) => {
  try {
    const jobs = await Job.find()
      .populate("recruiterId", "name email company")
      .sort({ createdAt: -1 });

    res.json({
      message: "Jobs fetched successfully",
      jobs,
    });
  } catch (err) {
    console.error("Get jobs error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// ===== GET SINGLE JOB =====
app.get("/api/admin/jobs/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate("recruiterId", "name email company");

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json({
      message: "Job fetched successfully",
      job,
    });
  } catch (err) {
    console.error("Get single job error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// ===== DELETE JOB =====
app.delete("/api/admin/jobs/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    await Job.findByIdAndDelete(req.params.id);

    recommender.onJobDelete(req.params.id);

    res.json({ message: "Job deleted successfully" });
  } catch (err) {
    console.error("Delete job error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

//=========================== course =================================/

{/*
const CourseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["Python", "AI", "ML", "AI and ML", "Java", "JavaScript", "React", "Node.js", "MongoDB"],
    },
    mediaType: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },
    imageUrl: {
      type: String,
      default: "",
      trim: true,
    },
    videoUrl: {
      type: String,
      default: "",
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Course = mongoose.model("Course", CourseSchema);



// ===== CREATE COURSE =====
app.post("/api/admin/courses", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { title, description, category, imageUrl, videoUrl } = req.body;

    if (!title || !category) {
      return res.status(400).json({ message: "Title and category are required" });
    }

    const cleanImageUrl = imageUrl?.trim() || "";
    const cleanVideoUrl = videoUrl?.trim() || "";

    if (!cleanImageUrl && !cleanVideoUrl) {
      return res.status(400).json({ message: "Please provide image URL or video URL" });
    }

    if (cleanImageUrl && cleanVideoUrl) {
      return res.status(400).json({ message: "Only one media allowed: image or video" });
    }

    const mediaType = cleanImageUrl ? "image" : "video";

    const course = await Course.create({
      title: title.trim(),
      description: description?.trim() || "",
      category,
      mediaType,
      imageUrl: mediaType === "image" ? cleanImageUrl : "",
      videoUrl: mediaType === "video" ? cleanVideoUrl : "",
      createdBy: req.user.id,
    });

    res.status(201).json({
      message: "Course created successfully",
      course,
    });
  } catch (err) {
    console.error("Create course error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});


// ===== GET ALL COURSES =====
app.get("/api/admin/courses", authMiddleware, adminOnly, async (req, res) => {
  try {
    const courses = await Course.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json({
      message: "Courses fetched successfully",
      courses,
    });
  } catch (err) {
    console.error("Get courses error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});


// ===== GET SINGLE COURSE =====
app.get("/api/admin/courses/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate("createdBy", "name email");

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json({
      message: "Course fetched successfully",
      course,
    });
  } catch (err) {
    console.error("Get single course error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// ===== UPDATE COURSE =====
app.put("/api/admin/courses/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { title, description, category, imageUrl, videoUrl, isActive } = req.body;

    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const cleanImageUrl = imageUrl?.trim() || "";
    const cleanVideoUrl = videoUrl?.trim() || "";

    if (!title || !category) {
      return res.status(400).json({ message: "Title and category are required" });
    }

    if (!cleanImageUrl && !cleanVideoUrl) {
      return res.status(400).json({ message: "Please provide image URL or video URL" });
    }

    if (cleanImageUrl && cleanVideoUrl) {
      return res.status(400).json({ message: "Only one media allowed: image or video" });
    }

    const mediaType = cleanImageUrl ? "image" : "video";

    course.title = title.trim();
    course.description = description?.trim() || "";
    course.category = category;
    course.mediaType = mediaType;
    course.imageUrl = mediaType === "image" ? cleanImageUrl : "";
    course.videoUrl = mediaType === "video" ? cleanVideoUrl : "";
    course.isActive = typeof isActive === "boolean" ? isActive : course.isActive;

    await course.save();

    res.json({
      message: "Course updated successfully",
      course,
    });
  } catch (err) {
    console.error("Update course error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});


// ===== DELETE COURSE =====
app.delete("/api/admin/courses/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    await Course.findByIdAndDelete(req.params.id);

    res.json({ message: "Course deleted successfully" });
  } catch (err) {
    console.error("Delete course error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// ===== GET COURSES FOR STUDENTS =====
app.get("/api/student/courses", authMiddleware, studentOnly, async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true })
      .sort({ createdAt: -1 });

    res.json({
      message: "Courses fetched successfully",
      courses,
    });
  } catch (err) {
    console.error("Fetch courses error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
}); */} 








const CourseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    profileName: {
      type: String,
      default: "",
      trim: true,
    },

    author: {
      type: String,
      default: "",
    },

    profileImage: {
      type: String,
      default: "",
    },

    videoUrl: {
      type: String,
      required: true,
      default: "",
    },

    thumbnail: {
      type: String,
      required: true,
      default: "",
    },

    cloudinaryVideoPublicId: {
      type: String,
      default: "",
    },

    cloudinaryThumbnailPublicId: {
      type: String,
      default: "",
    },

    views: {
      type: Number,
      default: 0,
    },

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    comments: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        text: {
          type: String,
          required: true,
          trim: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    sharesCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const Course = mongoose.model("Course", CourseSchema);




const CourseNotificationSchema = new mongoose.Schema(
  {
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    type: {
      type: String,
      enum: ["course_like", "course_comment", "course_save"],
      required: true,
    },
    title: {
      type: String,
      default: "",
      trim: true,
    },
    message: {
      type: String,
      default: "",
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const CourseNotification = mongoose.model(
  "CourseNotification",
  CourseNotificationSchema
);



async function createCourseNotification({
  receiverId,
  senderId = null,
  courseId,
  type,
  title,
  message,
}) {
  try {
    if (!receiverId || !courseId || !type) return null;

    const notification = await CourseNotification.create({
      receiverId,
      senderId,
      courseId,
      type,
      title,
      message,
    });

    const populatedNotification = await CourseNotification.findById(
      notification._id
    )
      .populate("senderId", "name email avatar")
      .populate("courseId", "title thumbnail videoUrl")
      .lean();

    io.to(`course_notify_${String(receiverId)}`).emit(
      "new_course_notification",
      populatedNotification
    );

    return populatedNotification;
  } catch (error) {
    console.error("Create course notification error:", error);
    return null;
  }
}






















app.put(
  "/api/student/course-profile/me",
  authMiddleware,
  studentOnly,
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "backgroundImage", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        name,
        about,
        instagram,
        linkedin,
        telegram,
        customLink1Label,
        customLink1Url,
        customLink2Label,
        customLink2Url,
      } = req.body;

      const user = await UserModel.findById(req.user.id);

      if (!user) {
        return res.status(404).json({ message: "Student not found" });
      }

      if (!user.courseProfile) {
        user.courseProfile = {};
      }

      user.courseProfile.name = name ?? "";
      user.courseProfile.about = about ?? "";
      user.courseProfile.instagram = instagram ?? "";
      user.courseProfile.linkedin = linkedin ?? "";
      user.courseProfile.telegram = telegram ?? "";
      user.courseProfile.customLink1Label = customLink1Label ?? "";
      user.courseProfile.customLink1Url = customLink1Url ?? "";
      user.courseProfile.customLink2Label = customLink2Label ?? "";
      user.courseProfile.customLink2Url = customLink2Url ?? "";

      const avatarFile = req.files?.avatar?.[0];
      const backgroundFile = req.files?.backgroundImage?.[0];

      console.log("req.files =", req.files);
      console.log("avatarFile =", avatarFile);
      console.log("backgroundFile =", backgroundFile);

      // upload avatar
      if (avatarFile) {
        if (user.courseProfile.avatarPublicId) {
          await cloudinary.uploader.destroy(user.courseProfile.avatarPublicId, {
            resource_type: "image",
          });
        }

        const avatarResult = await uploadToCloudinary(
          avatarFile.buffer,
          "gronxtiy/course_profile/avatar",
          "image"
        );

        user.courseProfile.avatar = avatarResult.secure_url || "";
        user.courseProfile.avatarPublicId = avatarResult.public_id || "";
      }

      // upload background
      if (backgroundFile) {
        if (user.courseProfile.backgroundImagePublicId) {
          await cloudinary.uploader.destroy(
            user.courseProfile.backgroundImagePublicId,
            {
              resource_type: "image",
            }
          );
        }

        const bgResult = await uploadToCloudinary(
          backgroundFile.buffer,
          "gronxtiy/course_profile/background",
          "image"
        );

        user.courseProfile.backgroundImage = bgResult.secure_url || "";
        user.courseProfile.backgroundImagePublicId = bgResult.public_id || "";
      }

      await user.save();

      return res.json({
        message: "Course profile updated successfully",
        courseProfile: user.courseProfile,
      });
    } catch (err) {
      console.error("Update course profile error:", err);
      return res.status(500).json({ message: err.message || "Server error" });
    }
  }
);


















app.get("/api/student/course-profile/me", authMiddleware, studentOnly, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id).select("name avatar courseProfile");

    if (!user) {
      return res.status(404).json({ message: "Student not found" });
    }

    return res.json({
      courseProfile: {
        name: user.courseProfile?.name || user.name || "",
        about: user.courseProfile?.about || "",
        avatar: user.courseProfile?.avatar || "",
        backgroundImage: user.courseProfile?.backgroundImage || "",
        instagram: user.courseProfile?.instagram || "",
        linkedin: user.courseProfile?.linkedin || "",
        telegram: user.courseProfile?.telegram || "",
        customLink1Label: user.courseProfile?.customLink1Label || "",
        customLink1Url: user.courseProfile?.customLink1Url || "",
        customLink2Label: user.courseProfile?.customLink2Label || "",
        customLink2Url: user.courseProfile?.customLink2Url || "",
      },
    });
  } catch (err) {
    console.error("Fetch my course profile error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});








































app.post(
  "/api/student/courses",
  authMiddleware,
  studentOnly,
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { title, description, profileName } = req.body;

      const user = await UserModel.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "Student not found" });
      }

      if (!title?.trim()) {
        return res.status(400).json({ message: "Course title is required" });
      }

      const videoFile = req.files?.video?.[0];
      const thumbnailFile = req.files?.thumbnail?.[0];

      if (!videoFile) {
        return res.status(400).json({ message: "Video file is required" });
      }

      if (!thumbnailFile) {
        return res.status(400).json({ message: "Thumbnail image is required" });
      }

      if (!videoFile.mimetype.startsWith("video/")) {
        return res.status(400).json({ message: "Only video file is allowed" });
      }

      if (!thumbnailFile.mimetype.startsWith("image/")) {
        return res.status(400).json({ message: "Only image thumbnail is allowed" });
      }

      const uploadedVideo = await uploadToCloudinary(
        videoFile.buffer,
        "gronxtiy/courses/videos",
        "video"
      );

      const uploadedThumbnail = await uploadToCloudinary(
        thumbnailFile.buffer,
        "gronxtiy/courses/thumbnails",
        "image"
      );

      const course = await Course.create({
        userId: user._id,
        title: title.trim(),
        description: description?.trim() || "",
        profileName: profileName?.trim() || user.name || "Student",
        author: user.name || "Student",
        profileImage: user.avatar || "",
        videoUrl: uploadedVideo.secure_url || "",
        thumbnail: uploadedThumbnail.secure_url || "",
        cloudinaryVideoPublicId: uploadedVideo.public_id || "",
        cloudinaryThumbnailPublicId: uploadedThumbnail.public_id || "",
      });

      if (!Array.isArray(user.coursesContent)) {
        user.coursesContent = [];
      }

      user.coursesContent.unshift({
        id: course._id.toString(),
        title: course.title || "",
        thumbnail: course.thumbnail || "",
        type: "course",
        views: 0,
      });

      await user.save();

      return res.status(201).json({
        message: "Course uploaded successfully",
        course,
      });
    } catch (err) {
      console.error("Create course error:", err);
      return res.status(500).json({ message: err.message || "Server error" });
    }
  }
);




app.get("/api/student/courses", authMiddleware, studentOnly, async (req, res) => {
  try {
    const me = await UserModel.findById(req.user.id).select("savedCourses");

    const courses = await Course.find()
      .populate("userId", "name avatar headline")
      .sort({ createdAt: -1 });

    const savedSet = new Set((me?.savedCourses || []).map((id) => String(id)));

    const formatted = courses.map((course) => ({
      _id: course._id,
      title: course.title || "",
      description: course.description || "",
      profileName: course.profileName || "",
      author: course.author || "",
      profileImage: course.profileImage || "",
      videoUrl: course.videoUrl || "",
      thumbnail: course.thumbnail || "",
      views: course.views || 0,
      likesCount: course.likes?.length || 0,
      commentsCount: course.comments?.length || 0,
      sharesCount: course.sharesCount || 0,
      isLiked: (course.likes || []).some(
        (id) => String(id) === String(req.user.id)
      ),
      isSaved: savedSet.has(String(course._id)),
      createdAt: course.createdAt,
      owner: {
        _id: course.userId?._id || "",
        name: course.userId?.name || course.author || "Student",
        avatar: course.userId?.avatar || course.profileImage || "",
        headline: course.userId?.headline || "",
      },
      isOwner: String(course.userId?._id) === String(req.user.id),
    }));

    return res.json(formatted);
  } catch (err) {
    console.error("Fetch courses error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});




app.get("/api/student/courses/user/:userId", authMiddleware, studentOnly, async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.userId).select("name avatar courseProfile");

    if (!user) {
      return res.status(404).json({ message: "Student not found" });
    }

    const courses = await Course.find({ userId: req.params.userId }).sort({ createdAt: -1 });

    return res.json({
      profile: {
        _id: user._id,
        name: user.courseProfile?.name || user.name || "Student",
        about: user.courseProfile?.about || "",
        avatar: user.courseProfile?.avatar || "",
        backgroundImage: user.courseProfile?.backgroundImage || "",
        instagram: user.courseProfile?.instagram || "",
        linkedin: user.courseProfile?.linkedin || "",
        telegram: user.courseProfile?.telegram || "",
        customLink1Label: user.courseProfile?.customLink1Label || "",
        customLink1Url: user.courseProfile?.customLink1Url || "",
        customLink2Label: user.courseProfile?.customLink2Label || "",
        customLink2Url: user.courseProfile?.customLink2Url || "",
      },
      courses,
    });
  } catch (err) {
    console.error("Fetch user course profile error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});



app.delete("/api/student/course-profile/avatar", authMiddleware, studentOnly, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (user.courseProfile?.avatarPublicId) {
      await cloudinary.uploader.destroy(user.courseProfile.avatarPublicId);
    }

    user.courseProfile.avatar = "";
    user.courseProfile.avatarPublicId = "";

    await user.save();

    return res.json({ message: "Course profile avatar removed successfully" });
  } catch (err) {
    console.error("Delete course avatar error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});



app.delete("/api/student/course-profile/background", authMiddleware, studentOnly, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (user.courseProfile?.backgroundImagePublicId) {
      await cloudinary.uploader.destroy(
        user.courseProfile.backgroundImagePublicId
      );
    }

    user.courseProfile.backgroundImage = "";
    user.courseProfile.backgroundImagePublicId = "";

    await user.save();

    return res.json({ message: "Course profile background removed successfully" });
  } catch (err) {
    console.error("Delete course background error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});










app.get("/api/student/course/:courseId", authMiddleware, studentOnly, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId)
      .populate("userId", "name avatar headline")
      .populate("comments.userId", "name avatar");

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    course.views = (course.views || 0) + 1;
    await course.save();

    const me = await UserModel.findById(req.user.id).select("savedCourses");

    return res.json({
      course: {
        ...course.toObject(),
        likesCount: course.likes?.length || 0,
        commentsCount: course.comments?.length || 0,
        isLiked: (course.likes || []).some(
          (id) => String(id) === String(req.user.id)
        ),
        isSaved: (me?.savedCourses || []).some(
          (id) => String(id) === String(course._id)
        ),
      },
      isOwner: String(course.userId?._id) === String(req.user.id),
    });
  } catch (err) {
    console.error("Fetch single course error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});


app.put("/api/student/course/:courseId/like", authMiddleware, studentOnly, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId).populate(
      "userId",
      "name"
    );

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const myId = String(req.user.id);
    const alreadyLiked = (course.likes || []).some(
      (id) => String(id) === myId
    );

    if (alreadyLiked) {
      course.likes = course.likes.filter((id) => String(id) !== myId);
    } else {
      course.likes.push(req.user.id);

      if (String(course.userId?._id) !== myId) {
        const me = await UserModel.findById(req.user.id).select("name");

        await createCourseNotification({
          receiverId: course.userId._id,
          senderId: req.user.id,
          courseId: course._id,
          type: "course_like",
          title: "Course liked",
          message: `${me?.name || "Someone"} liked your course "${course.title}"`,
        });
      }
    }

    await course.save();

    return res.json({
      message: alreadyLiked ? "Like removed" : "Course liked",
      isLiked: !alreadyLiked,
      likesCount: course.likes.length,
    });
  } catch (err) {
    console.error("Like course error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});

app.post("/api/student/course/:courseId/comment", authMiddleware, studentOnly, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const course = await Course.findById(req.params.courseId).populate(
      "userId",
      "name"
    );

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const newComment = {
      userId: req.user.id,
      text: text.trim(),
      createdAt: new Date(),
    };

    course.comments.push(newComment);
    await course.save();

    await course.populate("comments.userId", "name avatar");
    const savedComment = course.comments[course.comments.length - 1];

    if (String(course.userId?._id) !== String(req.user.id)) {
      const me = await UserModel.findById(req.user.id).select("name");

      await createCourseNotification({
        receiverId: course.userId._id,
        senderId: req.user.id,
        courseId: course._id,
        type: "course_comment",
        title: "New course comment",
        message: `${me?.name || "Someone"} commented on your course "${course.title}"`,
      });
    }

    return res.status(201).json({
      message: "Comment added successfully",
      comment: savedComment,
      commentsCount: course.comments.length,
    });
  } catch (err) {
    console.error("Comment course error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});


app.put("/api/student/course/:courseId/save", authMiddleware, studentOnly, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId).populate(
      "userId",
      "name"
    );

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const user = await UserModel.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (!Array.isArray(user.savedCourses)) {
      user.savedCourses = [];
    }

    const alreadySaved = user.savedCourses.some(
      (id) => String(id) === String(course._id)
    );

    if (alreadySaved) {
      user.savedCourses = user.savedCourses.filter(
        (id) => String(id) !== String(course._id)
      );
    } else {
      user.savedCourses.push(course._id);

      if (String(course.userId?._id) !== String(req.user.id)) {
        const me = await UserModel.findById(req.user.id).select("name");

        await createCourseNotification({
          receiverId: course.userId._id,
          senderId: req.user.id,
          courseId: course._id,
          type: "course_save",
          title: "Course saved",
          message: `${me?.name || "Someone"} saved your course "${course.title}"`,
        });
      }
    }

    await user.save();

    return res.json({
      message: alreadySaved ? "Removed from saved" : "Saved successfully",
      isSaved: !alreadySaved,
    });
  } catch (err) {
    console.error("Save course error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});

app.get("/api/student/saved-courses", authMiddleware, studentOnly, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id).populate({
      path: "savedCourses",
      populate: {
        path: "userId",
        select: "name avatar headline",
      },
    });

    if (!user) {
      return res.status(404).json({ message: "Student not found" });
    }

    const formatted = (user.savedCourses || []).map((course) => ({
      _id: course._id,
      title: course.title || "",
      description: course.description || "",
      thumbnail: course.thumbnail || "",
      videoUrl: course.videoUrl || "",
      views: course.views || 0,
      likesCount: course.likes?.length || 0,
      commentsCount: course.comments?.length || 0,
      sharesCount: course.sharesCount || 0,
      isLiked: (course.likes || []).some(
        (id) => String(id) === String(req.user.id)
      ),
      isSaved: true,
      owner: {
        _id: course.userId?._id || "",
        name: course.userId?.name || course.author || "Student",
        avatar: course.userId?.avatar || course.profileImage || "",
        headline: course.userId?.headline || "",
      },
    }));

    return res.json(formatted);
  } catch (err) {
    console.error("Fetch saved courses error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});

app.post("/api/student/course/:courseId/share", authMiddleware, studentOnly, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    course.sharesCount = (course.sharesCount || 0) + 1;
    await course.save();

    return res.json({
      message: "Share tracked",
      sharesCount: course.sharesCount,
      shareUrl: `http://localhost:5176/student/course/${course._id}`,
    });
  } catch (err) {
    console.error("Share course error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});


app.get("/api/student/course-notifications", authMiddleware, studentOnly, async (req, res) => {
  try {
    const notifications = await CourseNotification.find({
      receiverId: req.user.id,
    })
      .populate("senderId", "name avatar")
      .populate("courseId", "title thumbnail")
      .sort({ createdAt: -1 });

    return res.json(notifications);
  } catch (err) {
    console.error("Fetch course notifications error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});

app.get("/api/student/course-notifications/unread-count", authMiddleware, studentOnly, async (req, res) => {
  try {
    const unreadCount = await CourseNotification.countDocuments({
      receiverId: req.user.id,
      isRead: false,
    });

    return res.json({ unreadCount });
  } catch (err) {
    console.error("Course notification unread count error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});


app.put("/api/student/course-notifications/read-all", authMiddleware, studentOnly, async (req, res) => {
  try {
    await CourseNotification.updateMany(
      { receiverId: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );

    return res.json({ message: "All course notifications marked as read" });
  } catch (err) {
    console.error("Read all course notifications error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});


app.put("/api/student/course-notification/:notificationId/read", authMiddleware, studentOnly, async (req, res) => {
  try {
    const notification = await CourseNotification.findOne({
      _id: req.params.notificationId,
      receiverId: req.user.id,
    });

    if (!notification) {
      return res.status(404).json({ message: "Course notification not found" });
    }

    notification.isRead = true;
    await notification.save();

    return res.json({ message: "Course notification marked as read" });
  } catch (err) {
    console.error("Read course notification error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});





app.delete("/api/student/course/:courseId", authMiddleware, studentOnly, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (String(course.userId) !== String(req.user.id)) {
      return res.status(403).json({ message: "You can delete only your own course" });
    }

    if (course.cloudinaryVideoPublicId) {
      try {
        await cloudinary.uploader.destroy(course.cloudinaryVideoPublicId, {
          resource_type: "video",
        });
      } catch (cloudErr) {
        console.error("Delete course video from Cloudinary error:", cloudErr);
      }
    }

    if (course.cloudinaryThumbnailPublicId) {
      try {
        await cloudinary.uploader.destroy(course.cloudinaryThumbnailPublicId, {
          resource_type: "image",
        });
      } catch (cloudErr) {
        console.error("Delete course thumbnail from Cloudinary error:", cloudErr);
      }
    }

    await Course.deleteOne({ _id: course._id });

    const user = await UserModel.findById(req.user.id);
    if (user) {
      user.coursesContent = (user.coursesContent || []).filter(
        (item) => String(item.id) !== String(course._id)
      );
      await user.save();
    }

    return res.json({ message: "Course deleted successfully" });
  } catch (err) {
    console.error("Delete course error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});



app.get("/api/admin/courses", authMiddleware, adminOnly, async (req, res) => {
  try {
    const courses = await Course.find()
      .populate("userId", "name email avatar")
      .sort({ createdAt: -1 });

    const formatted = courses.map((course) => ({
      _id: course._id,
      title: course.title || "",
      description: course.description || "",
      profileName: course.profileName || "",
      author: course.author || "",
      profileImage: course.profileImage || "",
      videoUrl: course.videoUrl || "",
      thumbnail: course.thumbnail || "",
      views: course.views || 0,
      likesCount: course.likes?.length || 0,
      commentsCount: course.comments?.length || 0,
      sharesCount: course.sharesCount || 0,
      createdAt: course.createdAt,
      uploader: {
        _id: course.userId?._id || "",
        name: course.userId?.name || course.author || "Student",
        email: course.userId?.email || "",
        avatar: course.userId?.avatar || "",
      },
    }));

    return res.json(formatted);
  } catch (err) {
    console.error("Admin fetch all courses error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});




app.get("/api/admin/course/:courseId", authMiddleware, adminOnly, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId)
      .populate("userId", "name email avatar")
      .populate("comments.userId", "name avatar");

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    return res.json({
      course: {
        ...course.toObject(),
        likesCount: course.likes?.length || 0,
        commentsCount: course.comments?.length || 0,
        sharesCount: course.sharesCount || 0,
        uploader: {
          _id: course.userId?._id || "",
          name: course.userId?.name || course.author || "Student",
          email: course.userId?.email || "",
          avatar: course.userId?.avatar || "",
        },
      },
    });
  } catch (err) {
    console.error("Admin fetch single course error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});



app.delete("/api/admin/course/:courseId", authMiddleware, adminOnly, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.cloudinaryVideoPublicId) {
      try {
        await cloudinary.uploader.destroy(course.cloudinaryVideoPublicId, {
          resource_type: "video",
        });
      } catch (cloudErr) {
        console.error("Admin delete course video from Cloudinary error:", cloudErr);
      }
    }

    if (course.cloudinaryThumbnailPublicId) {
      try {
        await cloudinary.uploader.destroy(course.cloudinaryThumbnailPublicId, {
          resource_type: "image",
        });
      } catch (cloudErr) {
        console.error("Admin delete course thumbnail from Cloudinary error:", cloudErr);
      }
    }

    const ownerId = course.userId;

    await Course.deleteOne({ _id: course._id });

    const user = await UserModel.findById(ownerId);
    if (user) {
      user.coursesContent = (user.coursesContent || []).filter(
        (item) => String(item.id) !== String(course._id)
      );

      user.savedCourses = (user.savedCourses || []).filter(
        (id) => String(id) !== String(course._id)
      );

      await user.save();
    }

    await UserModel.updateMany(
      { savedCourses: course._id },
      { $pull: { savedCourses: course._id } }
    );

    await CourseNotification.deleteMany({ courseId: course._id });

    return res.json({ message: "Course deleted successfully by admin" });
  } catch (err) {
    console.error("Admin delete course error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});





























































//================setting ======================//

const SupportRequestSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["new", "in-progress", "resolved"],
      default: "new",
    },
  },
  { timestamps: true }
);

const SupportRequest = mongoose.model("SupportRequest", SupportRequestSchema);



app.post("/api/student/help-support", authMiddleware, studentOnly, async (req, res) => {
  try {
    const { phone, email, message } = req.body;

    if (!phone || !email || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const student = await UserModel.findById(req.user.id);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const support = await SupportRequest.create({
      studentId: student._id,
      name: student.name || "",
      phone,
      email,
      message,
    });

    res.status(201).json({
      message: "Support request submitted successfully",
      support,
    });
  } catch (err) {
    console.error("Help support create error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});


app.get("/api/admin/support-requests", authMiddleware, adminOnly, async (req, res) => {
  try {
    const requests = await SupportRequest.find()
      .populate("studentId", "name email")
      .sort({ createdAt: -1 });

    res.json({
      message: "Support requests fetched successfully",
      requests,
    });
  } catch (err) {
    console.error("Admin fetch support requests error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

app.put("/api/admin/support-requests/:id/status", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;

    if (!["new", "in-progress", "resolved"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const request = await SupportRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Support request not found" });
    }

    request.status = status;
    await request.save();

    res.json({
      message: "Support request status updated successfully",
      request,
    });
  } catch (err) {
    console.error("Update support request status error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});


const UserReportSchema = new mongoose.Schema(
  {
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reporterName: {
      type: String,
      default: "",
    },
    reporterEmail: {
      type: String,
      default: "",
    },
    profileId: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "action-taken"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const UserReport = mongoose.model("UserReport", UserReportSchema);



app.post("/api/student/report-user", authMiddleware, studentOnly, async (req, res) => {
  try {
    const { profileId, description } = req.body;

    if (!profileId || !description) {
      return res.status(400).json({ message: "Profile ID and description are required" });
    }

    const student = await UserModel.findById(req.user.id);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const report = await UserReport.create({
      reportedBy: student._id,
      reporterName: student.name || "",
      reporterEmail: student.email || "",
      profileId,
      description,
    });

    res.status(201).json({
      message: "User report submitted successfully",
      report,
    });
  } catch (err) {
    console.error("Report user error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

app.get("/api/admin/user-reports", authMiddleware, adminOnly, async (req, res) => {
  try {
    const reports = await UserReport.find()
      .populate("reportedBy", "name email")
      .sort({ createdAt: -1 });

    res.json({
      message: "User reports fetched successfully",
      reports,
    });
  } catch (err) {
    console.error("Fetch user reports error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});


app.put("/api/admin/user-reports/:id/status", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;

    if (!["pending", "reviewed", "action-taken"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const report = await UserReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    report.status = status;
    await report.save();

    res.json({
      message: "Report status updated successfully",
      report,
    });
  } catch (err) {
    console.error("Update report status error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});


const AccountDeletionRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const AccountDeletionRequest = mongoose.model(
  "AccountDeletionRequest",
  AccountDeletionRequestSchema
);



app.put("/api/student/account-settings", authMiddleware, studentOnly, async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    const updatedUser = await UserModel.findByIdAndUpdate(
      req.user.id,
      {
        ...(name && { name }),
        ...(email && { email }),
        ...(phone && { phone }),
      },
      { new: true }
    ).select("-password");

    res.json({
      message: "Account settings updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Update account settings error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});



app.put("/api/student/change-password", authMiddleware, studentOnly, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required" });
    }

    const user = await UserModel.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});


app.post("/api/student/account-deletion-request", authMiddleware, studentOnly, async (req, res) => {
  try {
    const { reason, description, email, phone } = req.body;

    if (!reason || !email || !phone) {
      return res.status(400).json({ message: "Reason, email, and phone are required" });
    }

    const user = await UserModel.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const request = await AccountDeletionRequest.create({
      userId: user._id,
      name: user.name || "",
      email,
      phone,
      reason,
      description,
    });

    res.status(201).json({
      message: "Account deletion request sent successfully",
      request,
    });
  } catch (err) {
    console.error("Account deletion request error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});


app.get("/api/admin/account-deletion-requests", authMiddleware, adminOnly, async (req, res) => {
  try {
    const requests = await AccountDeletionRequest.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.json({
      message: "Account deletion requests fetched successfully",
      requests,
    });
  } catch (err) {
    console.error("Fetch deletion requests error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});












// ================= CHAT SCHEMAS =================

const ConversationSchema = new mongoose.Schema(
  {
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    isAcceptedConnection: {
      type: Boolean,
      default: true,
    },

    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    blockReason: {
      type: String,
      default: "",
    },

    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    lastMessage: {
      type: String,
      default: "",
    },

    lastMessageType: {
      type: String,
      enum: ["text", "image", "video", "audio", "sticker", "call", "system"],
      default: "text",
    },

    lastMessageSender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

ConversationSchema.index({ members: 1 });

const Conversation = mongoose.model("Conversation", ConversationSchema);

const MessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    messageType: {
      type: String,
      enum: ["text", "image", "video", "audio", "sticker", "call", "system"],
      default: "text",
    },

    text: {
      type: String,
      default: "",
    },

    image: {
      type: String,
      default: "",
    },

    video: {
      type: String,
      default: "",
    },

    audio: {
      type: String,
      default: "",
    },

    sticker: {
      type: String,
      default: "",
    },

    thumbnail: {
      type: String,
      default: "",
    },

    duration: {
      type: String,
      default: "",
    },

    callData: {
      callType: {
        type: String,
        enum: ["voice", "video", ""],
        default: "",
      },
      status: {
        type: String,
        enum: ["missed", "answered", "rejected", "ended", ""],
        default: "",
      },
      startedAt: {
        type: Date,
        default: null,
      },
      endedAt: {
        type: Date,
        default: null,
      },
    },

    seenBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", MessageSchema);

const ReportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      default: null,
    },
    reason: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "closed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Report = mongoose.model("Report", ReportSchema);

// ================= CHAT HELPERS =================

async function getConversationOrFail(conversationId) {
  return await Conversation.findById(conversationId);
}

function isConversationMember(conversation, userId) {
  return conversation.members.some(
    (memberId) => String(memberId) === String(userId)
  );
}

function getOtherMember(conversation, userId) {
  return conversation.members.find(
    (memberId) => String(memberId) !== String(userId)
  );
}

// ================= CHAT ROUTES =================

// get all my conversations
app.get("/api/chat/conversations", authMiddleware, studentOnly, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      members: req.user.id,
      deletedFor: { $ne: req.user.id },
    })
      .populate("members", "name email avatar headline")
      .sort({ lastMessageAt: -1 });

    const formatted = await Promise.all(
      conversations.map(async (conv) => {
        const otherUser = conv.members.find(
          (member) => String(member._id) !== String(req.user.id)
        );

        const unseenCount = await Message.countDocuments({
          conversationId: conv._id,
          sender: otherUser?._id,
          seenBy: { $ne: req.user.id },
          deletedFor: { $ne: req.user.id },
          isDeleted: false,
        });

        return {
          _id: conv._id,
          otherUser: otherUser
            ? {
                _id: otherUser._id,
                name: otherUser.name || "",
                email: otherUser.email || "",
                avatar: otherUser.avatar || "",
                headline: otherUser.headline || "",
              }
            : null,
          blockedBy: conv.blockedBy,
          lastMessage: conv.lastMessage || "",
          lastMessageType: conv.lastMessageType || "text",
          lastMessageAt: conv.lastMessageAt,
          unseenCount,
        };
      })
    );

    res.json(formatted);
  } catch (err) {
    console.error("Get conversations error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// get single conversation messages
app.get("/api/chat/:conversationId/messages", authMiddleware, studentOnly, async (req, res) => {
  try {
    const conversation = await getConversationOrFail(req.params.conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!isConversationMember(conversation, req.user.id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const messages = await Message.find({
      conversationId: conversation._id,
      deletedFor: { $ne: req.user.id },
      isDeleted: false,
    })
      .populate("sender", "name avatar")
      .sort({ createdAt: 1 });

    res.json({
      conversation: {
        _id: conversation._id,
        blockedBy: conversation.blockedBy,
        blockReason: conversation.blockReason,
        lastMessage: conversation.lastMessage,
        lastMessageAt: conversation.lastMessageAt,
      },
      messages,
    });
  } catch (err) {
    console.error("Get messages error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// send message
app.post("/api/chat/:conversationId/message", authMiddleware, studentOnly, async (req, res) => {
  try {
    const {
      text = "",
      image = "",
      video = "",
      audio = "",
      sticker = "",
      thumbnail = "",
      duration = "",
      messageType = "text",
    } = req.body;

    const conversation = await getConversationOrFail(req.params.conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!isConversationMember(conversation, req.user.id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (conversation.blockedBy && String(conversation.blockedBy) !== String(req.user.id)) {
      return res.status(403).json({ message: "You are blocked. Cannot send message." });
    }

    const otherUserId = getOtherMember(conversation, req.user.id);

    if (!otherUserId) {
      return res.status(400).json({ message: "Invalid conversation" });
    }

    const cleanText = String(text || "").trim();
    const cleanImage = String(image || "").trim();
    const cleanVideo = String(video || "").trim();
    const cleanAudio = String(audio || "").trim();
    const cleanSticker = String(sticker || "").trim();

    if (!cleanText && !cleanImage && !cleanVideo && !cleanAudio && !cleanSticker) {
      return res.status(400).json({ message: "Message content is required" });
    }

    const allowedTypes = ["text", "image", "video", "audio", "sticker"];
    if (!allowedTypes.includes(messageType)) {
      return res.status(400).json({ message: "Invalid message type" });
    }

    const newMessage = await Message.create({
      conversationId: conversation._id,
      sender: req.user.id,
      receiver: otherUserId,
      text: cleanText,
      image: cleanImage,
      video: cleanVideo,
      audio: cleanAudio,
      sticker: cleanSticker,
      thumbnail: thumbnail || "",
      duration: duration || "",
      messageType,
      seenBy: [req.user.id],
    });

    let preview = cleanText;
    if (messageType === "image") preview = "📷 Image";
    if (messageType === "video") preview = "🎥 Video";
    if (messageType === "audio") preview = "🎤 Voice message";
    if (messageType === "sticker") preview = "😊 Sticker";

    conversation.lastMessage = preview || "New message";
    conversation.lastMessageType = messageType;
    conversation.lastMessageSender = req.user.id;
    conversation.lastMessageAt = new Date();

    if (Array.isArray(conversation.deletedFor) && conversation.deletedFor.length) {
      conversation.deletedFor = [];
    }

    await conversation.save();

    const populatedMessage = await Message.findById(newMessage._id).populate(
      "sender",
      "name avatar"
    );

    io.to(String(conversation._id)).emit("new_message", populatedMessage);
    io.to(String(otherUserId)).emit("conversation_updated");

    res.status(201).json({
      message: "Message sent successfully",
      chatMessage: populatedMessage,
    });
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// mark seen
app.put("/api/chat/:conversationId/seen", authMiddleware, studentOnly, async (req, res) => {
  try {
    const conversation = await getConversationOrFail(req.params.conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!isConversationMember(conversation, req.user.id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    await Message.updateMany(
      {
        conversationId: conversation._id,
        seenBy: { $ne: req.user.id },
        sender: { $ne: req.user.id },
      },
      {
        $push: { seenBy: req.user.id },
      }
    );

    io.to(String(conversation._id)).emit("messages_seen", {
      conversationId: conversation._id,
      seenBy: req.user.id,
    });

    res.json({ message: "Messages marked as seen" });
  } catch (err) {
    console.error("Seen messages error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// block user
app.put("/api/chat/:conversationId/block", authMiddleware, studentOnly, async (req, res) => {
  try {
    const { reason = "" } = req.body;

    const conversation = await getConversationOrFail(req.params.conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!isConversationMember(conversation, req.user.id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    conversation.blockedBy = req.user.id;
    conversation.blockReason = reason || "";
    conversation.lastMessage = "User blocked";
    conversation.lastMessageType = "system";
    conversation.lastMessageSender = req.user.id;
    conversation.lastMessageAt = new Date();

    await conversation.save();

    io.to(String(conversation._id)).emit("conversation_blocked", {
      conversationId: conversation._id,
      blockedBy: req.user.id,
    });

    res.json({ message: "User blocked successfully" });
  } catch (err) {
    console.error("Block user error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// unblock user
app.put("/api/chat/:conversationId/unblock", authMiddleware, studentOnly, async (req, res) => {
  try {
    const conversation = await getConversationOrFail(req.params.conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!isConversationMember(conversation, req.user.id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (String(conversation.blockedBy) !== String(req.user.id)) {
      return res.status(403).json({ message: "Only blocker can unblock" });
    }

    conversation.blockedBy = null;
    conversation.blockReason = "";
    await conversation.save();

    io.to(String(conversation._id)).emit("conversation_unblocked", {
      conversationId: conversation._id,
    });

    res.json({ message: "User unblocked successfully" });
  } catch (err) {
    console.error("Unblock user error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// report user
app.post("/api/chat/:conversationId/report", authMiddleware, studentOnly, async (req, res) => {
  try {
    const { reason = "", description = "" } = req.body;

    const conversation = await getConversationOrFail(req.params.conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!isConversationMember(conversation, req.user.id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const otherUserId = getOtherMember(conversation, req.user.id);

    const report = await Report.create({
      reporter: req.user.id,
      reportedUser: otherUserId,
      conversationId: conversation._id,
      reason,
      description,
      status: "pending",
    });

    res.status(201).json({
      message: "User reported successfully",
      report,
    });
  } catch (err) {
    console.error("Report user error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// delete chat for me
app.delete("/api/chat/:conversationId/delete", authMiddleware, studentOnly, async (req, res) => {
  try {
    const conversation = await getConversationOrFail(req.params.conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!isConversationMember(conversation, req.user.id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const alreadyDeleted = Array.isArray(conversation.deletedFor)
      ? conversation.deletedFor.some((id) => String(id) === String(req.user.id))
      : false;

    if (!alreadyDeleted) {
      conversation.deletedFor.push(req.user.id);
      await conversation.save();
    }

    await Message.updateMany(
      { conversationId: conversation._id },
      { $addToSet: { deletedFor: req.user.id } }
    );

    res.json({ message: "Chat deleted for you" });
  } catch (err) {
    console.error("Delete chat error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// save call log
app.post("/api/chat/:conversationId/call-log", authMiddleware, studentOnly, async (req, res) => {
  try {
    const {
      callType = "voice",
      status = "missed",
      startedAt = null,
      endedAt = null,
    } = req.body;

    const conversation = await getConversationOrFail(req.params.conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!isConversationMember(conversation, req.user.id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (conversation.blockedBy && String(conversation.blockedBy) !== String(req.user.id)) {
      return res.status(403).json({ message: "You are blocked. Cannot call." });
    }

    const otherUserId = getOtherMember(conversation, req.user.id);

    const callMessage = await Message.create({
      conversationId: conversation._id,
      sender: req.user.id,
      receiver: otherUserId,
      messageType: "call",
      text: `${callType} call ${status}`,
      callData: {
        callType,
        status,
        startedAt,
        endedAt,
      },
      seenBy: [req.user.id],
    });

    conversation.lastMessage = `${callType} call ${status}`;
    conversation.lastMessageType = "call";
    conversation.lastMessageSender = req.user.id;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    const populatedCallMessage = await Message.findById(callMessage._id).populate(
      "sender",
      "name avatar"
    );

    io.to(String(conversation._id)).emit("new_message", populatedCallMessage);

    res.status(201).json({
      message: "Call log saved",
      callMessage: populatedCallMessage,
    });
  } catch (err) {
    console.error("Call log error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});




io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join_user_room", (userId) => {
    socket.join(String(userId));
  });

  socket.on("join_conversation", (conversationId) => {
    socket.join(String(conversationId));
  });

  socket.on("typing", ({ conversationId, userId }) => {
    socket.to(String(conversationId)).emit("typing", { conversationId, userId });
  });

  socket.on("stop_typing", ({ conversationId, userId }) => {
    socket.to(String(conversationId)).emit("stop_typing", { conversationId, userId });
  });

  socket.on("call_user", ({ toUserId, offer, conversationId, callType, fromUser }) => {
    io.to(String(toUserId)).emit("incoming_call", {
      offer,
      conversationId,
      callType,
      fromUser,
    });
  });

  socket.on("answer_call", ({ toUserId, answer, conversationId }) => {
    io.to(String(toUserId)).emit("call_answered", {
      answer,
      conversationId,
    });
  });

  socket.on("ice_candidate", ({ toUserId, candidate, conversationId }) => {
    io.to(String(toUserId)).emit("ice_candidate", {
      candidate,
      conversationId,
    });
  });

  socket.on("reject_call", ({ toUserId, conversationId }) => {
    io.to(String(toUserId)).emit("call_rejected", { conversationId });
  });

  socket.on("end_call", ({ toUserId, conversationId }) => {
    io.to(String(toUserId)).emit("call_ended", { conversationId });
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});


app.post("/api/chat/create", authMiddleware, studentOnly, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    if (String(userId) === String(req.user.id)) {
      return res.status(400).json({ message: "You cannot chat with yourself" });
    }

    const targetUser = await UserModel.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const me = await UserModel.findById(req.user.id);
    const isConnected = me.connections.some(
      (id) => String(id) === String(userId)
    );

    if (!isConnected) {
      return res.status(403).json({ message: "Only connected users can chat" });
    }

    let conversation = await Conversation.findOne({
      members: { $all: [req.user.id, userId] },
    }).populate("members", "name email avatar headline");

    if (!conversation) {
      conversation = await Conversation.create({
        members: [req.user.id, userId],
        isAcceptedConnection: true,
      });

      conversation = await Conversation.findById(conversation._id).populate(
        "members",
        "name email avatar headline"
      );
    }

    const otherUser = conversation.members.find(
      (m) => String(m._id) !== String(req.user.id)
    );

    return res.status(201).json({
      conversation: {
        _id: conversation._id,
        otherUser,
        blockedBy: conversation.blockedBy,
        lastMessage: conversation.lastMessage || "",
        lastMessageType: conversation.lastMessageType || "text",
        lastMessageAt: conversation.lastMessageAt,
        unseenCount: 0,
      },
    });
  } catch (err) {
    console.error("Create conversation error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});


// =========== cloudanary=============//


app.put(
  "/api/student/profile/upload-media",
  authMiddleware,
  studentOnly,
  upload.single("media"),
  async (req, res) => {
    try {
      const { mediaType } = req.body;

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      if (!["avatar", "coverImage", "introVideo"].includes(mediaType)) {
        return res.status(400).json({ message: "Invalid mediaType" });
      }

      const user = await UserModel.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "Student not found" });
      }

      let folder = "gronxtiy/profile";
      let resourceType = "image";

      if (mediaType === "avatar") {
        folder = "gronxtiy/profile/avatar";
        resourceType = "image";
      } else if (mediaType === "coverImage") {
        folder = "gronxtiy/profile/cover";
        resourceType = "image";
      } else if (mediaType === "introVideo") {
        folder = "gronxtiy/profile/intro-video";
        resourceType = "video";
      }

      const result = await uploadToCloudinary(
        req.file.buffer,
        folder,
        resourceType
      );

      if (mediaType === "avatar") user.avatar = result.secure_url;
      if (mediaType === "coverImage") user.coverImage = result.secure_url;
      if (mediaType === "introVideo") user.introVideoUrl = result.secure_url;

      await user.save();

      return res.json({
        message: `${mediaType} uploaded successfully`,
        profile: buildProfileResponse(user),
      });
    } catch (err) {
      console.error("Upload profile media error:", err);
      return res.status(500).json({ message: err.message || "Server error" });
    }
  }
);

savedPosts: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post"
  }
]


app.get(
  "/api/student/posts/hashtag/:tag",
  authMiddleware,
  studentOnly,
  async (req, res) => {
    try {
      const requestedTag = "#" + req.params.tag.toLowerCase();

      // Logged-in user's saved posts
      const user = await UserModel.findById(req.user.id).select("savedPosts");
      const savedIds = (user?.savedPosts || []).map((id) => id.toString());

      // Find posts with this hashtag
      //const posts = await Post.find({
        //tags: { $in: [requestedTag] },
      //}).sort({ createdAt: -1 });



      const posts = await Post.find({
  tags: {
    $elemMatch: {
      $regex: new RegExp(`^${requestedTag}$`, "i"),
    },
  },
}).sort({ createdAt: -1 });

      const formattedPosts = posts.map((post) => {
        const postObj = post.toObject();

        return {
          ...postObj,
          likesCount: post.likes?.length || 0,
          commentsCount: post.comments?.length || 0,
          isLiked:
            post.likes?.some((id) => id.toString() === req.user.id) || false,
          isSaved: savedIds.includes(post._id.toString()),
        };
      });

      res.json({
        hashtag: requestedTag,
        totalPosts: formattedPosts.length,
        posts: formattedPosts,
      });
    } catch (err) {
      console.error("Hashtag posts error:", err);
      res.status(500).json({
        message: err.message || "Server Error",
      });
    }
  }
);


app.get("/api/student/posts/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    return res.json(post);   // <-- Return the post directly
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: err.message,
    });
  }
});

// ======================================================
// GET ALL HASHTAGS (ALL TIME)
// Used by Navbar -> Trending page
// ======================================================
app.get(
  "/api/student/all-hashtags",
  authMiddleware,
  studentOnly,
  async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit, 10) || 500, 1000);

      const hashtags = await Post.aggregate([
        {
          $match: {
            tags: {
              $exists: true,
              $ne: [],
            },
          },
        },

        {
          $unwind: "$tags",
        },

        {
          $group: {
            _id: {
              $toLower: "$tags",
            },
            displayTag: {
              $first: "$tags",
            },
            postCount: {
              $sum: 1,
            },
            totalLikes: {
              $sum: {
                $size: {
                  $ifNull: ["$likes", []],
                },
              },
            },
            totalComments: {
              $sum: {
                $size: {
                  $ifNull: ["$comments", []],
                },
              },
            },
          },
        },

        {
          $addFields: {
            engagementScore: {
              $add: [
                "$postCount",
                {
                  $multiply: ["$totalLikes", 2],
                },
                {
                  $multiply: ["$totalComments", 3],
                },
              ],
            },
          },
        },

        {
          $sort: {
            engagementScore: -1,
            postCount: -1,
            _id: 1,
          },
        },

        {
          $limit: limit,
        },
      ]);

      res.json(
        hashtags.map((item, index) => ({
          id: index + 1,
          tag: item.displayTag,
          postCount: item.postCount,
          posts: formatPostCount(item.postCount),
          engagementScore: item.engagementScore,
        }))
      );
    } catch (err) {
      console.error(err);
      res.status(500).json({
        message: err.message,
      });
    }
  }
);



const PORT = process.env.PORT || 3006;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
