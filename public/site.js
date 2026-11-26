document.querySelector(".menu-toggle")?.addEventListener("click",()=>document.querySelector(".main-nav")?.classList.toggle("open"));document.querySelectorAll(".reveal").forEach(el=>new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add("visible");e.target.style.opacity=1;e.target.style.transform="translateY(0)"}}),{threshold:.1}).observe(el));

/* The welcome advert runs for 15 seconds, with an accessible skip option. */
const introSplash=document.getElementById("introSplash");
if(introSplash){
 const finishIntro=()=>{introSplash.classList.add("is-leaving");window.setTimeout(()=>introSplash.remove(),800)};
 document.getElementById("introSkip")?.addEventListener("click",finishIntro);
 const reducedMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
 window.setTimeout(finishIntro,reducedMotion?1200:15000);
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
