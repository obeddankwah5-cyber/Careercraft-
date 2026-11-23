const $=id=>document.getElementById(id);
const ids=["fullName","email","phone","location","targetRole","summary","experience","education","skills","references","recipient","subject","letterReason","letterExperience","letterSkills","body","landlord","tenant","propertyAddress","rent","period","terms"];
const names={
cv:["Classic Professional","Modern Sidebar","Elegant Executive","Minimal Clean","Creative Profile","Academic Focus","Corporate Bold","Graduate Starter","Professional Compact","Contemporary","Technical Specialist","Healthcare Professional","Finance Executive","Marketing Creative","Two Column Modern","Clean Monochrome","Navy Executive","Plain Standard CV","Simple Text CV","Traditional No-Design CV"],
letter:["Traditional Formal","Modern Green Accent","Minimal Business Letter","Executive Correspondence","Classic Serif","Clean Contemporary","Bold Header","Elegant Editorial","Graduate Application","Creative Agency","Professional Navy","Warm Neutral","Academic Letter","Finance Formal","Healthcare Application","Compact Business","Modern Accent","Plain Standard Letter","Simple Text Letter","Traditional No-Design Letter"],
tenancy:["Classic Agreement","Modern Property","Formal Legal Layout","Clean Minimal","Executive Property","Residential Standard","Bold Sectioned","Elegant Contract","Compact Agreement","Contemporary Lease","Professional Rental","Neutral Property","Premium Tenancy","Simple Legal","Structured Lease","Modern Landlord","Tenant Friendly","Plain Standard Agreement","Simple Text Agreement","Traditional No-Design Agreement"]
};
const colors=["#263b68","#315d72","#80604b","#41414b","#7544dc","#17675e","#252b38","#8a593c","#44516a","#365d86","#245b70","#6a4d7c","#3f5960","#9a563d","#4d547d","#353535","#183f68","#7b5a49","#285b50","#63438d"];
let photoDataUrl="",template="";
const v=id=>$(id)?.value.trim()||"",esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function typeKey(){return $("type").value==="cv"?"cv":$("type").value==="letter"?"letter":"tenancy"}
function templateList(){const key=typeKey(),select=$("templateSelect"),current=template;select.innerHTML=names[key].map((name,i)=>'<option value="'+key+'-'+String(i+1).padStart(2,"0")+'">'+String(i+1).padStart(2,"0")+' · '+name+'</option>').join("");template=names[key].some((_,i)=>key+"-"+String(i+1).padStart(2,"0")===current)?current:key+"-01";select.value=template;stylePreview()}
function stylePreview(){const n=Math.max(0,Number(template.split("-").pop())-1),key=typeKey(),paper=$("paperPreview");paper.style.setProperty("--template-accent",colors[n]);paper.dataset.design=template;paper.dataset.accent=colors[n];paper.dataset.layout=n>=17?"plain":String(n%5);paper.style.borderTop=n>=17?"0":(n%4===0?"8px solid ":"4px solid ")+colors[n];paper.style.borderRadius=n%3===1?"14px":"3px";paper.style.fontFamily=n%4===2?"Georgia,serif":"Arial,sans-serif"}
function render(){let t=$("type").value;$("photoField").hidden=t!=="cv";$("roleField").hidden=t==="tenancy";const photo=$("pvPhoto");photo.hidden=!photoDataUrl;if(photoDataUrl)photo.src=photoDataUrl;$("cv").hidden=t!=="cv";$("letter").hidden=t!=="letter";$("tenancy").hidden=t!=="tenancy";const paper=$("paperPreview");paper.classList.toggle("letter-preview",t==="letter");$("pvName").textContent=v("fullName")||"YOUR NAME";$("pvContact").textContent=[v("email"),v("phone"),v("location")].filter(Boolean).join(" · ");if(t==="letter"){const sender=esc(v("fullName")||"YOUR NAME")+"<br>"+esc(v("location")||"Your location")+"<br>"+esc(v("phone")||"Phone number")+"<br>"+esc(v("email")||"Email address");const recipient=esc(v("recipient")||"The Hiring Manager<br>Company Name<br>Accra, Ghana");const subject=esc(v("subject")||"APPLICATION FOR EMPLOYMENT");const paragraphs=(v("body")||"Write your application letter here. Explain why you are applying, the skills and experience you bring, and your interest in the role.").split(/\n\s*\n/).map(p=>"<p>"+esc(p).replace(/\n/g,"<br>")+"</p>").join("");$("pv").innerHTML='<div class="letter-topline"><span></span>APPLICATION LETTER</div><div class="letter-sender">'+sender+'</div><div class="letter-recipient">'+recipient+'</div><div class="letter-greeting">Dear Sir/Madam,</div><div class="letter-subject">'+subject+'</div><div class="letter-body">'+paragraphs+'</div><div class="letter-closing">Yours faithfully,<br><br><b>'+(esc(v("fullName")||"YOUR NAME"))+'</b></div>';return}let cvSummary=v("summary")||[v("targetRole")?"Candidate for "+v("targetRole")+" opportunities.":"Motivated candidate presenting relevant experience and qualifications.",v("experience")?"Experience includes "+sentenceList(v("experience"))+".":"",v("education")?"Education includes "+sentenceList(v("education"))+".":"",v("skills")?"Key skills include "+sentenceList(v("skills"))+".":""] .filter(Boolean).join(" ");
let letterDraft=v("body")||["I am writing to apply for the "+(v("targetRole")||"available")+" position at "+(v("recipient")||"your organisation")+".",v("letterReason")?"I am interested in this opportunity because "+v("letterReason")+".":"",v("letterExperience")?"My relevant experience includes "+v("letterExperience")+".":"",v("letterSkills")?"My relevant skills include "+v("letterSkills")+".":"",v("education")?"My educational background includes "+v("education")+".":"","Thank you for considering my application."].filter(Boolean).join("\\n\\n");
let tenancyTerms=v("terms")||"The tenant agrees to pay rent as agreed, keep the property reasonably clean, and report repairs promptly. Both parties should confirm deposits, utilities, maintenance responsibilities and notice arrangements in writing before signing.";
let a=t==="cv"?[["PROFILE",cvSummary],["EXPERIENCE",v("experience")],["EDUCATION",v("education")],["SKILLS",v("skills")||suggestedSkills(v("targetRole")).join(" · ")],["REFERENCES","Available upon request"]]:t==="letter"?[["APPLICATION LETTER",letterDraft]]:[["LANDLORD",v("landlord")],["TENANT",v("tenant")],["PROPERTY ADDRESS",v("propertyAddress")],["RENT AND PAYMENT",v("rent")],["TENANCY PERIOD",v("period")],["TERMS",tenancyTerms]];
$("pv").innerHTML=a.map(([h,x])=>"<h4 style='color:var(--template-accent)'>"+h+"</h4><p>"+(esc(x)||"Your details will appear here.")+"</p>").join("")}

function sentenceList(value){return value.split(/\n+/).map(x=>x.trim()).filter(Boolean).join("; ")}
function suggestedSkills(role){
 const r=(role||"").toLowerCase();
 if(/admin|secretary|office|reception/.test(r)) return ["Communication","Organisation","Time management","Record keeping","Customer service","Computer literacy"];
 if(/teacher|education|tutor/.test(r)) return ["Communication","Lesson preparation","Classroom support","Patience","Organisation","Learner engagement"];
 if(/sales|marketing|business development/.test(r)) return ["Customer relations","Communication","Product presentation","Negotiation","Teamwork","Goal orientation"];
 if(/account|finance|cashier|bank/.test(r)) return ["Numeracy","Attention to detail","Record keeping","Confidentiality","Computer literacy","Customer service"];
 if(/driver|delivery|logistic|warehouse/.test(r)) return ["Time management","Safety awareness","Route planning","Reliability","Teamwork","Record keeping"];
 if(/nurse|health|care|clinic/.test(r)) return ["Communication","Compassionate service","Attention to detail","Teamwork","Confidentiality","Organisation"];
 if(/it|software|computer|technician|developer/.test(r)) return ["Problem solving","Technical support","Troubleshooting","Communication","Teamwork","Continuous learning"];
 return ["Communication","Teamwork","Problem solving","Time management","Organisation","Willingness to learn"];
}
function generateDocument(){
 const kind=typeKey(),name=v("fullName"),role=v("targetRole"),company=v("recipient")||"the organisation";
 const experience=sentenceList(v("experience")),education=sentenceList(v("education")),skills=sentenceList(v("skills"));
 if(!name){$("error").textContent="Please enter your full name first.";return}
 if(kind==="cv"){
   const focus=role||"the position you are applying for";
   const profile=[name+" is presenting an application for "+focus+".",experience?"Relevant background includes "+experience+".":"The candidate is encouraged to add employment, internship, volunteer or practical project experience where applicable.",education?"Education and training include "+education+".":"Education, training and relevant certificates can be added to strengthen this section.",skills?"Relevant skills include "+skills+".":"Suggested transferable strengths include "+suggestedSkills(role).join(", ")+". Please keep only the skills that genuinely describe you."].join(" ");
   $("summary").value=profile;
   if(!skills) $("skills").value=suggestedSkills(role).join(" · ");
 }else if(kind==="letter"){
   const reason=v("letterReason")||("I am interested in this opportunity because it matches my career goals and offers an opportunity to contribute, learn and grow professionally");
   const relevant=v("letterExperience")||experience;
   const highlights=v("letterSkills")||skills||suggestedSkills(role).join(", ");
   const subject=v("subject")||("APPLICATION FOR "+(role||"EMPLOYMENT").toUpperCase());
   $("subject").value=subject;
   const paras=[
    "Dear Hiring Manager,",
    "I am writing to express my interest in the "+(role||"available")+" position at "+company+". "+reason+".",
    relevant?"My background includes "+relevant+".":"Although my application details are brief, I am prepared to bring commitment, a professional attitude and a willingness to learn. I would welcome the opportunity to demonstrate my abilities and develop further within your organisation.",
    "The strengths I can bring include "+highlights+". I value clear communication, teamwork, reliability and completing responsibilities with care.",
    education?"My education and training include "+education+".":"",
    "I would appreciate the opportunity to discuss my application and explain how I could contribute to your team. Thank you for your time and consideration.",
    "Yours faithfully,\n"+name
   ].filter(Boolean);
   $("body").value=paras.join("\n\n");
 }else{
   const landlord=v("landlord"),tenant=v("tenant"),property=v("propertyAddress"),rent=v("rent"),period=v("period");
   if(!landlord||!tenant||!property||!rent||!period){$("error").textContent="For a useful tenancy draft, please provide the landlord, tenant, property address, rent and tenancy period.";return}
   if(!v("terms")) $("terms").value="1. Rent: The tenant shall pay the agreed rent of "+rent+" in the manner and on the dates agreed by both parties.\n2. Use and care: The tenant shall use the premises responsibly, keep them reasonably clean and promptly report damage or repairs.\n3. Utilities: The parties should record in writing who is responsible for water, electricity, internet and other utility charges.\n4. Repairs and access: The landlord and tenant should agree on repair responsibilities and reasonable notice before non-emergency access.\n5. Deposit: Any security deposit, its purpose and conditions for refund should be recorded in writing.\n6. Ending the tenancy: The parties must comply with the notice requirements and applicable Ghanaian law.\n7. Changes: Any variation to this agreement should be written and acknowledged by both parties.\n8. Disputes: The parties should first attempt to resolve disputes amicably and may seek appropriate legal advice.";
 }
 $("error").textContent="";
 render();
 $("generate").textContent="Regenerate document ↻";
}
$("generate").addEventListener("click",generateDocument);
ids.forEach(id=>$(id)?.addEventListener("input",render));
$("photo").addEventListener("change",()=>{const file=$("photo").files?.[0];if(!file){photoDataUrl="";render();return}if(!["image/jpeg","image/png"].includes(file.type)){$("error").textContent="Please choose a JPG or PNG image.";$("photo").value="";return}if(file.size>8*1024*1024){$("error").textContent="Choose a photo smaller than 8 MB.";$("photo").value="";return}const img=new Image(),url=URL.createObjectURL(file);img.onload=()=>{const scale=Math.min(1,1000/Math.max(img.width,img.height)),canvas=document.createElement("canvas");canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);photoDataUrl=canvas.toDataURL("image/jpeg",.82);URL.revokeObjectURL(url);$("error").textContent="";render()};img.onerror=()=>{$("error").textContent="That picture could not be opened. Try another JPG or PNG.";URL.revokeObjectURL(url)};img.src=url});
$("removePhoto").addEventListener("click",()=>{photoDataUrl="";$("photo").value="";$("error").textContent="";render()});
$("type").addEventListener("change",()=>{templateList();render()});
$("templateSelect").addEventListener("change",()=>{template=$("templateSelect").value;stylePreview()});
const params=new URLSearchParams(location.search),wanted=params.get("template");templateList();if(wanted&&/^(cv|letter|tenancy)-(0[1-9]|1[0-9]|20)$/.test(wanted)){template=wanted;if(typeKey()!==wanted.split("-")[0])$("type").value=wanted.startsWith("cv-")?"cv":wanted.startsWith("letter-")?"letter":"tenancy";templateList();$("templateSelect").value=template;stylePreview()}

$("closePdfPreview").addEventListener("click",()=>{ $("pdfPreviewModal").hidden=true; $("previewCanvas").innerHTML=""; });
$("previewPdf").onclick=async()=>{
  if(!v("fullName")){$("error").textContent="Enter your name before previewing.";return}
  $("error").textContent="";
  const button=$("previewPdf"),canvas=$("previewCanvas");
  button.disabled=true;button.textContent="Preparing your document preview…";
  canvas.innerHTML='<div style="min-height:260px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;color:#34264b;font:600 15px Arial,sans-serif"><div style="width:34px;height:34px;border:4px solid #e7def2;border-top-color:#6943a8;border-radius:50%;animation:ccSpin .8s linear infinite"></div>Preparing your document preview…</div>';
  $("pdfPreviewModal").hidden=false;
  if(!document.getElementById("ccPreviewSpinnerStyle")){const style=document.createElement("style");style.id="ccPreviewSpinnerStyle";style.textContent="@keyframes ccSpin{to{transform:rotate(360deg)}}";document.head.appendChild(style)}
  await new Promise(resolve=>setTimeout(resolve,3000));
  canvas.innerHTML="";
  const page=$("paperPreview").cloneNode(true);page.removeAttribute("id");
  page.style.width="100%";page.style.maxWidth="794px";page.style.minHeight="1050px";page.style.margin="0 auto";page.style.boxSizing="border-box";
  const wrap=document.createElement("div");
  wrap.style.cssText="position:relative;max-width:794px;margin:0 auto;overflow:hidden;background:#fff";
  wrap.appendChild(page);
  const watermark=document.createElement("div");
  watermark.setAttribute("aria-hidden","true");
  watermark.style.cssText="position:absolute;inset:0;z-index:20;pointer-events:none;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:repeat(5,minmax(0,1fr));place-items:center;overflow:hidden";
  for(let i=0;i<10;i++){
    const mark=document.createElement("span");
    mark.textContent="UNPAID PREVIEW";
    mark.style.cssText="display:block;white-space:nowrap;transform:rotate(-32deg);font:700 clamp(18px,3vw,30px) Arial,sans-serif;letter-spacing:2px;color:rgba(150,20,20,.25);border:2px solid rgba(150,20,20,.20);padding:8px 12px";
    watermark.appendChild(mark);
  }
  wrap.appendChild(watermark);
  canvas.appendChild(wrap);
  button.disabled=false;button.innerHTML='Preview your document <span style="float:right">Open temporary PDF preview ↗</span>';
};

$("pay").onclick=async()=>{if(!v("fullName")||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v("email"))){$("error").textContent="Enter your name and a valid email address.";return}let d=Object.fromEntries(ids.map(id=>[id,v(id)]));d.documentType=$("type").value;d.template=template;d.photoDataUrl=photoDataUrl;let b=$("pay");b.disabled=true;b.textContent="Connecting to Paystack…";try{let r=await fetch("/api/payments/initialize",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(d)}),j=await r.json();if(!r.ok)throw Error(j.error||"Payment could not start");location.href=j.authorization_url}catch(e){$("error").textContent=e.message;b.disabled=false;b.textContent="Continue to checkout · GH₵10 →"}};
render();