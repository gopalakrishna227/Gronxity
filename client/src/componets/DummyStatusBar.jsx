import React, { useEffect, useState } from "react";
import "./DummyStatusBar.css";
import { Heart } from "lucide-react";


export default function DummyStatusBar() {


const stories = [

{
id:1,
name:"Rahul",
image:"https://picsum.photos/500/800?random=1",
profile:"https://i.pravatar.cc/100?img=12",
caption:"Working on my new project 🚀"
},

{
id:2,
name:"Priya",
image:"https://picsum.photos/500/800?random=2",
profile:"https://i.pravatar.cc/100?img=32",
caption:"Beautiful evening 🌅"
},

{
id:3,
name:"Arjun",
image:"https://picsum.photos/500/800?random=3",
profile:"https://i.pravatar.cc/100?img=45",
caption:"Learning React 🔥"
}

];



const [open,setOpen]=useState(false);

const [current,setCurrent]=useState(0);

const [reply,setReply]=useState("");

const [liked,setLiked]=useState(false);





// AUTO NEXT STORY

useEffect(()=>{


if(!open) return;


const timer=setTimeout(()=>{

nextStory();

},5000);



return()=>clearTimeout(timer);



},[current,open]);







// RIGHT ARROW

const nextStory=()=>{


if(current < stories.length-1){

setCurrent(current+1);

}

else{

setCurrent(0);

}


setReply("");

setLiked(false);


};







// LEFT ARROW

const prevStory=()=>{


if(current > 0){

setCurrent(current-1);

}

else{

setCurrent(stories.length-1);

}


setReply("");

setLiked(false);


};







const sendReply=()=>{


if(!reply.trim()) return;


alert(
`Reply sent to ${stories[current].name}: ${reply}`
);


setReply("");

};







return (

<div className="dummy-view-page">





{/* STATUS BAR */}


<div className="dummy-top-status">


{

stories.map((story,index)=>(


<div

className="dummy-top-story"

key={story.id}

onClick={()=>{

setCurrent(index);

setOpen(true);

}}

>


<div className="dummy-top-ring">


<img src={story.profile}/>


</div>


<span>
{story.name}
</span>



</div>



))


}



</div>









{/* STORY VIEWER */}



{

open && (



<div className="dummy-story-overlay">





<button

className="dummy-close"

onClick={()=>setOpen(false)}

>

×

</button>







<div className="dummy-story-card">





{/* PROGRESS BAR */}



<div className="dummy-progress">


{

stories.map((_,i)=>(


<div

key={i}

className={
i===current
?
"progress active"
:
"progress"
}


/>


))


}


</div>









{/* USER */}



<div className="dummy-user">


<img

src={stories[current].profile}

/>


<div>

<h4>

{stories[current].name}

</h4>


<small>
5m
</small>


</div>



</div>









{/* STORY IMAGE */}



<img

className="dummy-story-image"

src={stories[current].image}

/>



{/* LEFT ARROW BUTTON */}

<button
 className="dummy-prev"
 onClick={prevStory}
>
‹
</button>



{/* RIGHT ARROW BUTTON */}

<button
 className="dummy-next"
 onClick={nextStory}
>
›
</button>





<div className="dummy-caption">

{stories[current].caption}

</div>









{/* LEFT BUTTON */}



<button

className="dummy-prev"

onClick={prevStory}

>

‹

</button>







{/* RIGHT BUTTON */}



<button

className="dummy-next"

onClick={nextStory}

>

›

</button>









{/* MESSAGE */}



<div className="dummy-bottom">



<input

value={reply}

onChange={
e=>setReply(e.target.value)
}

placeholder={
`Reply to ${stories[current].name}...`
}

/>





<button

className={
liked
?
"heart active"
:
"heart"
}


onClick={()=>setLiked(!liked)}

>


<Heart size={24}/>


</button>






<button

className="send"

onClick={sendReply}

>

Send

</button>




</div>





</div>




</div>



)


}



</div>


);



}