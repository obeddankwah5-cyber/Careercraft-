document.querySelector(".menu-toggle")?.addEventListener("click",()=>document.querySelector(".main-nav")?.classList.toggle("open"));document.querySelectorAll(".reveal").forEach(el=>new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add("visible");e.target.style.opacity=1;e.target.style.transform="translateY(0)"}}),{threshold:.1}).observe(el));
/* Show the branded intro briefly, then reveal the homepage. */
const introSplash=document.getElementById("introSplash");
if(introSplash){
  const reducedMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.setTimeout(()=>introSplash.classList.add("is-leaving"),reducedMotion?250:2100);
  window.setTimeout(()=>introSplash.remove(),reducedMotion?650:2900);
}
