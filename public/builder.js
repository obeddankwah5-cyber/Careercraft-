const $=id=>document.getElementById(id);
const ids=["fullName","email","phone","location","targetRole","summary","experience","education","skills","references","recipient","subject","letterReason","letterExperience","letterSkills","body","landlord","tenant","propertyAddress","rent","period","terms"];
const names={
cv:["Classic Professional","Modern Sidebar","Elegant Executive","Minimal Clean","Creative Profile","Academic Focus","Corporate Bold","Graduate Starter","Professional Compact","Contemporary","Technical Specialist","Healthcare Professional","Finance Executive","Marketing Creative","Two Column Modern","Clean Monochrome","Navy Executive","Plain Standard CV","Simple Text CV","Traditional No-Design CV"],
letter:["Traditional Formal","Modern Green Accent","Minimal Business Letter","Executive Correspondence","Classic Serif","Clean Contemporary","Bold Header","Elegant Editorial","Graduate Application","Creative Agency","Professional Navy","Warm Neutral","Academic Letter","Finance Formal","Healthcare Application","Compact Business","Modern Accent","Plain Standard Letter","Simple Text Letter","Traditional No-Design Letter"],
tenancy:["Classic Agreement","Modern Property","Formal Legal Layout","Clean Minimal","Executive Property","Residential Standard","Bold Sectioned","Elegant Contract","Compact Agreement","Contemporary Lease","Professional Rental","Neutral Property","Premium Tenancy","Simple Legal","Structured Lease","Modern Landlord","Tenant Friendly","Plain Standard Agreement","Simple Text Agreement","Traditional No-Design Agreement"]
};
const colors=["#263b68","#315d72","#80604b","#41414b","#7544dc","#17675e","#252b38","#8a593c","#44516a","#365d86","#245b70","#6a4d7c","#3f5960","#9a563d","#4d547d","#353535","#183f68","#7b5a49","#285b50","#63438d"];
let photoDataUrl="",template="";
const themeColors={plain:"#222222",navy:"#263b68",green:"#17675e",burgundy:"#783b4b",charcoal:"#353535",sand:"#80604b",purple:"#7544dc"};
function appearance(){return {pageTheme:$("pageTheme")?.value||"plain",fontSize:Number($("fontSize")?.value||12),headingSize:Number($("headingSize")?.value||14),watermarkEnabled:!!$("watermarkEnabled")?.checked,watermarkText:v("watermarkText")||"CAREERCRAFT"};}
function applyAppearance(){const a=appearance(),p=$("paperPreview"),c=themeColors[a.pageTheme]||themeColors.plain;p.style.fontFamily="'Times New Roman', Times, serif";p.style.setProperty("--template-accent",c);p.style.color="#222";p.style.background=a.pageTheme==="plain"?"#fff":"linear-gradient(180deg, "+c+"12 0, #fff 145px)";p.querySelectorAll("p,li").forEach(x=>x.style.fontSize=a.fontSize+"pt");p.querySelectorAll("h4").forEach(x=>{x.style.fontFamily="'Times New Roman', Times, serif";x.style.fontSize=a.headingSize+"pt";x.style.fontWeight="700"});}

const v=id=>$(id)?.value.trim()||"",esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function typeKey(){return $("type").value==="cv"?"cv":$("type").value==="letter"?"letter":"tenancy"}
function templateList(){const key=typeKey(),select=$("templateSelect"),current=template;select.innerHTML=names[key].map((name,i)=>'<option value="'+key+'-'+String(i+1).padStart(2,"0")+'">'+String(i+1).padStart(2,"0")+' · '+name+'</option>').join("");template=names[key].some((_,i)=>key+"-"+String(i+1).padStart(2,"0")===current)?current:key+"-01";select.value=template;stylePreview()}
function stylePreview(){const n=Math.max(0,Number(template.split("-").pop())-1),key=typeKey(),paper=$("paperPreview");paper.style.setProperty("--template-accent",colors[n]);paper.dataset.design=template;paper.dataset.accent=colors[n];paper.dataset.layout=n>=17?"plain":String(n%5);paper.style.borderTop=n>=17?"0":(n%4===0?"8px solid ":"4px solid ")+colors[n];paper.style.borderRadius=n%3===1?"14px":"3px";paper.style.fontFamily="Times New Roman,serif";applyAppearance()}
function render(){let t=$("type").value;$("photoField").hidden=t!=="cv";$("roleField").hidden=t==="tenancy";const photo=$("pvPhoto");photo.hidden=!photoDataUrl;if(photoDataUrl)photo.src=photoDataUrl;$("cv").hidden=t!=="cv";$("letter").hidden=t!=="letter";$("tenancy").hidden=t!=="tenancy";const paper=$("paperPreview");paper.classList.toggle("letter-preview",t==="letter");$("pvName").textContent=v("fullName")||"YOUR NAME";$("pvContact").textContent=[v("email"),v("phone"),v("location")].filter(Boolean).join(" · ");if(t==="letter"){const sender=esc(v("fullName")||"YOUR NAME")+"<br>"+esc(v("location")||"Your location")+"<br>"+esc(v("phone")||"Phone number")+"<br>"+esc(v("email")||"Email address");const recipient=esc(v("recipient")||"The Hiring Manager<br>Company Name<br>Accra, Ghana");const subject=esc(v("subject")||"APPLICATION FOR EMPLOYMENT");const paragraphs=(v("body")||"Write your application letter here. Explain why you are applying, the skills and experience you bring, and your interest in the role.").split(/\n\s*\n/).map(p=>"<p>"+esc(p).replace(/\n/g,"<br>")+"</p>").join("");$("pv").innerHTML='<div class="letter-topline"><span></span>APPLICATION LETTER</div><div class="letter-sender">'+sender+'</div><div class="letter-recipient">'+recipient+'</div><div class="letter-greeting">Dear Sir/Madam,</div><div class="letter-subject">'+subject+'</div><div class="letter-body">'+paragraphs+'</div><div class="letter-closing">Yours faithfully,<br><br><b>'+(esc(v("fullName")||"YOUR NAME"))+'</b></div>';return}let cvSummary=v("summary")||[v("targetRole")?"Candidate for "+v("targetRole")+" opportunities.":"Motivated candidate presenting relevant experience and qualifications.",v("experience")?"Experience includes "+sentenceList(v("experience"))+".":"",v("education")?"Education includes "+sentenceList(v("education"))+".":"",v("skills")?"Key skills include "+sentenceList(v("skills"))+".":""] .filter(Boolean).join(" ");
let letterDraft=v("body")||["I am writing to apply for the "+(v("targetRole")||"available")+" position at "+(v("recipient")||"your organisation")+".",v("letterReason")?"I am interested in this opportunity because "+v("letterReason")+".":"",v("letterExperience")?"My relevant experience includes "+v("letterExperience")+".":"",v("letterSkills")?"My relevant skills include "+v("letterSkills")+".":"",v("education")?"My educational background includes "+v("education")+".":"","Thank you for considering my application."].filter(Boolean).join("\\n\\n");
let tenancyTerms=v("terms")||"1. Rent and payment: The tenant shall pay the agreed rent on the agreed dates.\n2. Use of property: The premises shall be used for the agreed residential purpose and kept in reasonable condition.\n3. Utilities: Responsibility for water, electricity and other utility charges shall be agreed and recorded by both parties.\n4. Repairs and maintenance: The tenant shall promptly report damage; the parties shall follow their agreed and lawful repair responsibilities.\n5. Security deposit: Any deposit, deductions and refund arrangements shall be recorded in writing.\n6. Entry and inspection: The landlord shall give reasonable notice before entering, except in an emergency or as otherwise permitted by law.\n7. Subletting and alterations: The tenant shall obtain written consent before subletting or making material alterations.\n8. Termination and notice: Either party shall follow the notice requirements in this agreement and applicable Ghanaian law.\n9. Disputes: The parties shall first seek an amicable resolution and may seek legal advice where necessary.\n10. Changes to agreement: Any change shall be made in writing and acknowledged by both parties.";
let a=t==="cv"?[["PROFESSIONAL SUMMARY",cvSummary],["KEY SKILLS",v("skills")||suggestedSkills(v("targetRole")).join("\n")],["WORK EXPERIENCE",v("experience")],["EDUCATION",v("education")],["REFERENCES",v("references")||"Available upon request"]]:t==="letter"?[["APPLICATION LETTER",letterDraft]]:[["LANDLORD",v("landlord")],["TENANT",v("tenant")],["PROPERTY ADDRESS",v("propertyAddress")],["RENT AND PAYMENT",v("rent")],["TENANCY PERIOD",v("period")],["TERMS AND CONDITIONS",tenancyTerms]];
$("pv").innerHTML=a.map(([h,x])=>{const list=["KEY SKILLS","WORK EXPERIENCE","EDUCATION","REFERENCES","TERMS AND CONDITIONS"].includes(h);const items=previewListItems(x);if(list&&h==="KEY SKILLS"&&items.length===1)items[0]=items[0].split(/[·,;]/).map(z=>z.trim()).filter(Boolean);const content=list?(items.length?((h==="TERMS AND CONDITIONS"?"<ol>":"<ul>")+items.map(z=>"<li>"+esc(z)+"</li>").join("")+(h==="TERMS AND CONDITIONS"?"</ol>":"</ul>")):"<p>Your details will appear here.</p>"):"<p>"+(esc(x)||"Your details will appear here.")+"</p>";return "<h4 style='color:"+(t==="tenancy"?"#000000":"var(--template-accent)")+"'>"+h+"</h4>"+content}).join("");applyAppearance()}

function previewListItems(value){
 const raw=String(value||"").trim();
 if(!raw)return [];
 const normalized=raw.replace(/\r\n?/g,"\n").replace(/([^\n])\s+(?=\d{1,2}[.)]\s+[A-Za-z])/g,"$1\n");
 return normalized.split(/\n+/).map(item=>item.replace(/^\s*(?:[-*•▪]|\d{1,2}[.)])\s*/,"").trim()).filter(Boolean);
}
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
["pageTheme","fontSize","headingSize","watermarkEnabled","watermarkText"].forEach(id=>$(id)?.addEventListener("input",()=>{render();applyAppearance()}));
const params=new URLSearchParams(location.search),wanted=params.get("template");templateList();if(wanted&&/^(cv|letter|tenancy)-(0[1-9]|1[0-9]|20)$/.test(wanted)){template=wanted;if(typeKey()!==wanted.split("-")[0])$("type").value=wanted.startsWith("cv-")?"cv":wanted.startsWith("letter-")?"letter":"tenancy";templateList();$("templateSelect").value=template;stylePreview()}

$("closePdfPreview").addEventListener("click",()=>{ $("pdfPreviewModal").hidden=true; $("previewCanvas").innerHTML=""; });
$("previewPdf").onclick=async()=>{
  if(!v("fullName")){$("error").textContent="Enter your name before previewing.";return}
  $("error").textContent="";
  const button=$("previewPdf"),canvas=$("previewCanvas");
  button.disabled=true;button.textContent="Preparing your document preview…";
  canvas.innerHTML='<div style="min-height:260px;display:flex;align-items:center;justify-content:center;color:#34264b;font:600 15px Arial,sans-serif">Preparing your complete A4 PDF preview…</div>';
  $("pdfPreviewModal").hidden=false;
  try{
    const data=Object.fromEntries(ids.map(id=>[id,v(id)]));
    Object.assign(data,appearance());
    data.documentType=$("type").value;
    data.template=template;
    data.photoDataUrl=photoDataUrl;
    const response=await fetch("/api/preview",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
    const result=await response.json();
    if(!response.ok)throw new Error(result.error||"Could not prepare the preview.");
    canvas.innerHTML="";
    const frame=document.createElement("iframe");
    frame.title="Complete unpaid document preview";
    frame.src=result.url;
    frame.style.cssText="display:block;width:100%;height:min(78vh,1000px);min-height:520px;border:0;background:#fff";
    canvas.appendChild(frame);
  }catch(error){
    canvas.textContent=error.message||"Could not prepare the preview. Please try again.";
  }finally{
    button.disabled=false;
    button.textContent="Preview your document";
  }
};

$("pay").onclick=async()=>{if(!v("fullName")||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v("email"))){$("error").textContent="Enter your name and a valid email address.";return}let d=Object.fromEntries(ids.map(id=>[id,v(id)]));Object.assign(d,appearance());d.documentType=$("type").value;d.template=template;d.photoDataUrl=photoDataUrl;let b=$("pay");b.disabled=true;b.textContent="Connecting to Paystack…";try{let r=await fetch("/api/payments/initialize",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(d)}),j=await r.json();if(!r.ok)throw Error(j.error||"Payment could not start");location.href=j.authorization_url}catch(e){$("error").textContent=e.message;b.disabled=false;b.textContent="Continue to checkout · GH₵10 →"}};
render();