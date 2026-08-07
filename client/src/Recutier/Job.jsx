import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import axios from "axios";
import "./PostJob.css";

const locations = [
  "Bangalore",
  "Hyderabad",
  "Pune",
  "Chennai",
  "Khammam",
  "Mumbai",
  "Delhi",
  "Gurgaon",
  "Noida",
  "Ahmedabad",
  "Kolkata",
];

export  default function Job() {

const [title,setTitle] = useState("")
const [department,setDepartment] = useState("")
const [location,setLocation] = useState("")
const [jobType,setJobType] = useState("")
const [experience,setExperience] = useState("")
const [salary,setSalary] = useState("")
const [description,setDescription] = useState("")

const [skills,setSkills] = useState([])
const [skillInput,setSkillInput] = useState("")

const [responsibilities,setResponsibilities] = useState([])
const [responsibilityInput,setResponsibilityInput] = useState("")

const [qualifications,setQualifications] = useState([])
const [qualificationInput,setQualificationInput] = useState("")

const [benefits,setBenefits] = useState([])
const [benefitInput,setBenefitInput] = useState("")

const [selectedEducation,setSelectedEducation] = useState([])
const [educationDropdownOpen,setEducationDropdownOpen] = useState(false)

const [imageUrl,setImageUrl] = useState("")
const [previewImage,setPreviewImage] = useState("")


/* SKILLS */

const addSkill = ()=>{
if(skillInput.trim() && !skills.includes(skillInput.trim())){
setSkills([...skills,skillInput.trim()])
setSkillInput("")
}
}

const removeSkill = (skill)=>{
setSkills(skills.filter((s)=>s!==skill))
}


/* EDUCATION */

const handleEducationSelect = (level)=>{
if(selectedEducation.includes(level)){
setSelectedEducation(selectedEducation.filter((e)=>e!==level))
}else{
setSelectedEducation([...selectedEducation,level])
}
}


/* RESPONSIBILITIES */

const addResponsibility = ()=>{
if(responsibilityInput.trim()){
setResponsibilities([...responsibilities,responsibilityInput.trim()])
setResponsibilityInput("")
}
}

const removeResponsibility = (index)=>{
setResponsibilities(responsibilities.filter((_,i)=>i!==index))
}


/* QUALIFICATIONS */

const addQualification = ()=>{
if(qualificationInput.trim()){
setQualifications([...qualifications,qualificationInput.trim()])
setQualificationInput("")
}
}

const removeQualification = (index)=>{
setQualifications(qualifications.filter((_,i)=>i!==index))
}


/* BENEFITS */

const addBenefit = ()=>{
if(benefitInput.trim()){
setBenefits([...benefits,benefitInput.trim()])
setBenefitInput("")
}
}

const removeBenefit = (index)=>{
setBenefits(benefits.filter((_,i)=>i!==index))
}


/* IMAGE URL */

const handleImageUrl = (e)=>{
setImageUrl(e.target.value)
setPreviewImage(e.target.value)
}


/* PUBLISH JOB */

const publishJob = async(e)=>{

e.preventDefault()

if(
!title ||
!department ||
!location ||
!jobType ||
!experience ||
!salary ||
!description ||
selectedEducation.length === 0 ||
skills.length === 0 ||
!imageUrl
){
alert("Please fill all required fields")
return
}

try{

const data = {
title,
department,
location,
jobType,
experience,
education:selectedEducation,
salary,
description,
responsibilities,
qualifications,
benefits,
skills,
imageUrl
}

await axios.post(
`${import.meta.env.VITE_API_URL}/api/jobs/create`,
data,
{withCredentials:true}
)

alert("Job Published Successfully 🚀")

setTitle("")
setDepartment("")
setLocation("")
setJobType("")
setExperience("")
setSalary("")
setDescription("")
setSelectedEducation([])
setSkills([])
setResponsibilities([])
setQualifications([])
setBenefits([])
setImageUrl("")
setPreviewImage("")

}catch(err){
console.error(err)
alert(err.response?.data?.message || "Server error")
}

}



return(

<div className="postjob-container">

<div className="postjob-header">
<h1>Post a New Job</h1>
<p>Fill in the details to create a job posting</p>
</div>

<form className="postjob-card" onSubmit={publishJob}>


{/* Job Title */}

<div className="form-group">
<label>Job Title</label>
<input
type="text"
placeholder="e.g. Senior Product Manager"
value={title}
onChange={(e)=>setTitle(e.target.value)}
/>
</div>



{/* Department + Location */}

<div className="form-row">

<div className="form-group">
<label>Department</label>

<select
value={department}
onChange={(e)=>setDepartment(e.target.value)}
>

<option value="">Select department</option>
<option>Engineering</option>
<option>Product</option>
<option>Design</option>
<option>Marketing</option>
<option>Sales</option>
<option>Operations</option>

</select>
</div>


<div className="form-group">
<label>Location</label>

<select
value={location}
onChange={(e)=>setLocation(e.target.value)}
>

<option value="">Select Location</option>

{locations.map((city)=>(
<option key={city} value={city}>{city}</option>
))}

</select>
</div>

</div>



{/* Job Type + Experience */}

<div className="form-row">

<div className="form-group">
<label>Job Type</label>

<select
value={jobType}
onChange={(e)=>setJobType(e.target.value)}
>

<option value="">Select Job Type</option>
<option>Full-time</option>
<option>Part-time</option>
<option>Contract</option>
<option>Internship</option>

</select>

</div>


<div className="form-group">

<label>Experience Level</label>

<select
value={experience}
onChange={(e)=>setExperience(e.target.value)}
>

<option value="">Select Experience</option>
<option>Fresher</option>
<option>0-1 Years</option>
<option>1-3 Years</option>
<option>3-5 Years</option>
<option>5-8 Years</option>
<option>8+ Years</option>

</select>

</div>

</div>



{/* EDUCATION */}

<div className="form-group">

<label>Educational Level</label>

<div className="custom-dropdown">

<div
className="dropdown-header"
onClick={()=>setEducationDropdownOpen(!educationDropdownOpen)}
>

{selectedEducation.length>0
? selectedEducation.join(", ")
: "Select Education Level"}

<span>{educationDropdownOpen ? "▲":"▼"}</span>

</div>

{educationDropdownOpen && (

<div className="dropdown-content">

{[
"High School",
"Diploma",
"Bachelor's Degree",
"Master's Degree",
"MBA",
"PhD",
"B.Tech",
"B.E",
"BBA",
"B.Com",
"B.Sc",
"BA",
"M.Tech",
"M.Sc",
"M.Com",
"MA",
"CA",
"CS",
"CMA"
].map((level)=>(

<label key={level} className="dropdown-item">

<input
type="checkbox"
checked={selectedEducation.includes(level)}
onChange={()=>handleEducationSelect(level)}
/>

{level}

</label>

))}

</div>

)}

</div>

</div>



{/* Salary */}

<div className="form-group">

<label>Salary Range</label>

<select
value={salary}
onChange={(e)=>setSalary(e.target.value)}
>

<option value="">Select Salary Range</option>
<option>2-4 LPA</option>
<option>4-8 LPA</option>
<option>6-10 LPA</option>
<option>10-15 LPA</option>
<option>15-20 LPA</option>
<option>Above 20 LPA</option>

</select>

</div>



{/* Description */}

<div className="form-group">

<label>Job Description</label>

<textarea
rows={6}
value={description}
onChange={(e)=>setDescription(e.target.value)}
placeholder="Describe the role..."
></textarea>

</div>



{/* Responsibilities */}

<div className="form-group">

<label>Key Responsibilities</label>

<ul className="bullet-preview">

{responsibilities.map((item,index)=>(
<li key={index}>
{item}

<button
type="button"
onClick={()=>removeResponsibility(index)}
>✖</button>

</li>
))}

</ul>

<div className="bullet-input">

<input
type="text"
value={responsibilityInput}
placeholder="Add responsibility"
onChange={(e)=>setResponsibilityInput(e.target.value)}
onKeyDown={(e)=>{
if(e.key==="Enter"){
e.preventDefault()
addResponsibility()
}
}}
/>

<button type="button" onClick={addResponsibility}>
Add
</button>

</div>

</div>



{/* Qualifications */}

<div className="form-group">

<label>Skills & Qualification</label>

<ul className="bullet-preview">

{qualifications.map((item,index)=>(
<li key={index}>
{item}

<button
type="button"
onClick={()=>removeQualification(index)}
>✖</button>

</li>
))}

</ul>

<div className="bullet-input">

<input
type="text"
value={qualificationInput}
placeholder="Add qualification"
onChange={(e)=>setQualificationInput(e.target.value)}
onKeyDown={(e)=>{
if(e.key==="Enter"){
e.preventDefault()
addQualification()
}
}}
/>

<button type="button" onClick={addQualification}>
Add
</button>

</div>

</div>



{/* Benefits */}

<div className="form-group">

<label>Benefits</label>

<ul className="bullet-preview">

{benefits.map((item,index)=>(
<li key={index}>
{item}

<button
type="button"
onClick={()=>removeBenefit(index)}
>✖</button>

</li>
))}

</ul>

<div className="bullet-input">

<input
type="text"
value={benefitInput}
placeholder="Add benefit"
onChange={(e)=>setBenefitInput(e.target.value)}
onKeyDown={(e)=>{
if(e.key==="Enter"){
e.preventDefault()
addBenefit()
}
}}
/>

<button type="button" onClick={addBenefit}>
Add
</button>

</div>

</div>



{/* Image URL */}

<div className="form-group">

<label>Company Logo / Job Image</label>

<input
type="text"
placeholder="Paste image URL"
value={imageUrl}
onChange={handleImageUrl}
/>

{previewImage && (

<div className="image-preview">
<img src={previewImage} alt="preview"/>
</div>

)}

</div>



{/* Skills */}

<div className="form-group">

<label>Required Skills</label>

<div className="skills-list">

{skills.map((skill)=>(
<span key={skill} className="skill-badge">

{skill}

<button
type="button"
onClick={()=>removeSkill(skill)}
>
<X size={14}/>
</button>

</span>
))}

</div>


<div className="skill-input-group">

<input
type="text"
value={skillInput}
placeholder="Type skill and press Enter"
onChange={(e)=>setSkillInput(e.target.value)}
onKeyDown={(e)=>{
if(e.key==="Enter"){
e.preventDefault()
addSkill()
}
}}
/>

<button type="button" onClick={addSkill}>
Add
</button>

</div>

</div>



{/* Buttons */}

<div className="action-buttons">

<button type="button" className="ai-btn">
<Sparkles size={18}/>
Find AI Matches
</button>

<button type="button" className="draft-btn">
Save as Draft
</button>

<button type="submit" className="publish-btn">
Publish Job
</button>

</div>

</form>

</div>

)

}