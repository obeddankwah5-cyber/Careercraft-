document.querySelector(".menu-toggle")?.addEventListener("click",()=>document.querySelector(".main-nav")?.classList.toggle("open"));document.querySelectorAll(".reveal").forEach(el=>new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add("visible");e.target.style.opacity=1;e.target.style.transform="translateY(0)"}}),{threshold:.1}).observe(el));

/* The welcome advert runs for 15 seconds, with an accessible skip option. */
const introSplash=document.getElementById("introSplash");
if(introSplash){
 const finishIntro=()=>{introSplash.classList.add("is-leaving");window.setTimeout(()=>introSplash.remove(),800)};
 document.getElementById("introSkip")?.addEventListener("click",finishIntro);
 const reducedMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
 window.setTimeout(finishIntro,reducedMotion?1200:10000);
}


/* Mobile navigation and cinematic scroll motion enhancements */
const ccMenu=document.querySelector(".menu-toggle");
const ccNav=document.querySelector(".main-nav");
if(ccMenu&&ccNav){
  ccMenu.setAttribute("aria-expanded","false");
  ccMenu.addEventListener("click",()=>{
    const opened=ccNav.classList.contains("open");
    ccMenu.setAttribute("aria-expanded",String(!opened));
    ccMenu.setAttribute("aria-label",opened?"Open navigation":"Close navigation");
  });
  ccNav.querySelectorAll("a").forEach(link=>link.addEventListener("click",()=>{
    ccNav.classList.remove("open");
    ccMenu.setAttribute("aria-expanded","false");
    ccMenu.setAttribute("aria-label","Open navigation");
  }));
}
if("IntersectionObserver" in window){
  document.querySelectorAll(".service-card,.video-card,.steps-grid>div").forEach((el,index)=>{
    el.classList.add("reveal");
    el.style.transitionDelay=(index%3)*110+"ms";
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){entry.target.classList.add("visible");observer.unobserve(entry.target);}
      });
    },{threshold:.14});
    observer.observe(el);
  });
}


/* Pointer-driven 3D tilt: subtle on desktop, disabled for touch/reduced motion. */
(()=> {
 const reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
 const fine=window.matchMedia("(hover: hover) and (pointer: fine)").matches;
 if(reduce||!fine)return;
 const targets=document.querySelectorAll(".service-card,.video-card,.hero-stage,.card");
 targets.forEach(el=>{
   el.addEventListener("pointermove",event=>{
     const r=el.getBoundingClientRect();
     const x=(event.clientX-r.left)/r.width;
     const y=(event.clientY-r.top)/r.height;
     const ry=(x-.5)*9, rx=(.5-y)*7;
     el.style.transform="perspective(950px) rotateX("+rx+"deg) rotateY("+ry+"deg) translateY(-3px)";
   });
   el.addEventListener("pointerleave",()=>{el.style.transform="";});
 });
})();


/* Keep brand motion polished and reveal the page in clear, staggered sections. */
document.querySelectorAll(".feature-ribbon-grid article").forEach((el,i)=>{
 el.style.animationDelay=(i*100)+"ms";
 el.classList.add("reveal");
});
document.querySelectorAll(".cinematic-videos video").forEach(video=>{
 video.addEventListener("error",()=>{video.style.display="none";});
});
