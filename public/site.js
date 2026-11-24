document.querySelector(".menu-toggle")?.addEventListener("click",()=>document.querySelector(".main-nav")?.classList.toggle("open"));document.querySelectorAll(".reveal").forEach(el=>new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add("visible");e.target.style.opacity=1;e.target.style.transform="translateY(0)"}}),{threshold:.1}).observe(el));

/* The welcome advert runs for 15 seconds, with an accessible skip option. */
const introSplash=document.getElementById("introSplash");
if(introSplash){
 const finishIntro=()=>{introSplash.classList.add("is-leaving");window.setTimeout(()=>introSplash.remove(),800)};
 document.getElementById("introSkip")?.addEventListener("click",finishIntro);
 const reducedMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
 window.setTimeout(finishIntro,reducedMotion?1200:15000);
}
