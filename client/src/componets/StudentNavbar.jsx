import React, { useState } from "react";
import { FiSearch } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import "./StudentNavbar.css";

function StudentNavbar({
  searchText,
  setSearchText,
  feedType,
  setFeedType,
  selectedTags,
  setSelectedTags
}) {

  const navigate = useNavigate();

  const [showFilter, setShowFilter] = useState(false);

  const tabs = ["For You", "All", "Trending", "Other"];


  const technologies = [
    "AI/ML",
    "Python",
    "Java",
    "React",
    "Node.js",
    "MongoDB",
    "AWS",
    "Docker",
    "Kubernetes",
    "Cyber Security"
  ];


  const toggleTechnology = (tech)=>{

    if(selectedTags.includes(tech)){
      setSelectedTags(
        selectedTags.filter(t=>t!==tech)
      );
    }
    else{
      setSelectedTags([
        ...selectedTags,
        tech
      ]);
    }

  };



  const handleTabClick=(tab)=>{

    if (tab === "Trending") {
  setFeedType("Trending");
  return;
}


    if(tab==="Other"){
      setShowFilter(!showFilter);
      return;
    }


    setFeedType(tab);

  };



return (

<div className="navbar">


<div className="logo-container">
<h1 className="logo-name">
Gronxity
</h1>
</div>



<div className="search-box">

<FiSearch className="search-icon"/>

<input
type="text"
placeholder="Search Posts, Jobs..."
className="search-input"
value={searchText}
onChange={(e)=>setSearchText(e.target.value)}
/>

</div>




<div className="nav-links">


{tabs.map((tab) => (
  <button
    key={tab}
    onClick={() => handleTabClick(tab)}
    className={feedType === tab ? "activeTab" : ""}
  >
    {tab}
  </button>
))}

</div>




{
showFilter &&

<div className="filter-dropdown">


<h3>
Filter Technologies
</h3>


<div className="filter-grid">


{
technologies.map(tech=>(

<label key={tech}>


<input

type="checkbox"

checked={
selectedTags.includes(tech)
}

onChange={()=>toggleTechnology(tech)}

/>


{tech}


</label>

))

}


</div>



<button
className="apply-filter-btn"
onClick={()=>setShowFilter(false)}
>

Apply

</button>



</div>

}




</div>

);


}


export default StudentNavbar;