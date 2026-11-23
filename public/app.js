const $ = id => document.getElementById(id);
let currentStep = 0;
let documentType = "cv";
let template = "classic";
const fields = ["fullName","email","phone","location","summary","experience","education","skills","extra","date","recipient","subject","body","landlord","tenant","propertyAddress","rent","period","terms"];
const value = id => $(id) ? $(id).value.trim() : "";
const typeNames = { cv: "CV / Resume", letter: "Application letter", tenancy: "Tenancy agreement" };
function setType(type) {
  documentType = type;
  document.querySelectorAll(".type-card").forEach(card => card.classList.toggle("selected", card.dataset.type === type));
  $("cvFields").classList.toggle("hidden", type !== "cv");
  $("letterFields").classList.toggle("hidden", type !== "letter");
  $("tenancyFields").classList.toggle("hidden", type !== "tenancy");
  $("stepTitle").textContent = currentStep === 1 ? "Add your details" : "Choose your style";
  updatePreview();
}
document.querySelectorAll(".type-card").forEach(card => card.addEventListener("click", () => {
  setType(card.dataset.type);
  $("builder").scrollIntoView({ behavior: "smooth" });
}));
document.querySelectorAll(".template-option").forEach(button => button.addEventListener("click", () => {
  template = button.dataset.template;
  document.querySelectorAll(".template-option").forEach(b => b.classList.toggle("active", b === button));
  $("previewSheet").dataset.template = template;
}));
function updatePreview() {
  $("previewName").textContent = value("fullName") || "YOUR NAME";
  $("previewContact").textContent = [value("email"),value("phone"),value("location")].filter(Boolean).join("  |  ") || "Your contact details";
  const blocks = documentType === "cv"
    ? [["PROFESSIONAL SUMMARY",value("summary")],["EXPERIENCE",value("experience")],["EDUCATION",value("education")],["SKILLS",value("skills")],["ADDITIONAL INFORMATION",value("extra")]]
    : documentType === "letter"
      ? [["DATE",value("date")],["TO",value("recipient")],["SUBJECT",value("subject")],["LETTER",value("body")]]
      : [["LANDLORD",value("landlord")],["TENANT",value("tenant")],["PROPERTY",value("propertyAddress")],["RENT",value("rent")],["PERIOD",value("period")],["TERMS",value("terms")]];
  $("previewContent").innerHTML = blocks.map(([heading, text]) => "<b>" + heading + "</b><p>" + (text ? escapeHtml(text).replace(/\n/g,"<br>") : "Your details will appear here.") + "</p>").join("");
}
function escapeHtml(s) { return s.replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
fields.forEach(id => { if ($(id)) $(id).addEventListener("input", updatePreview); });
function showStep(step) {
  currentStep = step;
  document.querySelectorAll(".step-panel").forEach(panel => panel.classList.toggle("active", Number(panel.dataset.step) === step));
  $("stepLabel").textContent = "STEP 0" + (step + 1) + " / 03";
  $("stepTitle").textContent = ["Choose your style","Add your details","Review & checkout"][step];
  $("progressBar").style.width = ((step + 1) / 3 * 100) + "%";
  $("backBtn").disabled = step === 0;
  $("nextBtn").classList.toggle("hidden", step === 2);
  $("errorMessage").textContent = "";
  if (step === 2) updatePreview();
}
function validStep(step) {
  if (step === 0) {
    if (!value("fullName")) return "Please enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(value("email"))) return "Please enter a valid email address.";
  }
  if (step === 1) {
    if (documentType === "cv" && !value("summary") && !value("experience") && !value("education") && !value("skills")) return "Please add at least one CV section.";
    if (documentType === "letter" && (!value("recipient") || !value("body"))) return "Please add the recipient and letter content.";
    if (documentType === "tenancy" && (!value("landlord") || !value("tenant") || !value("propertyAddress"))) return "Please add the landlord, tenant and property address.";
  }
  return "";
}
$("nextBtn").addEventListener("click", () => {
  const error = validStep(currentStep);
  if (error) { $("errorMessage").textContent = error; return; }
  showStep(Math.min(2,currentStep+1));
});
$("backBtn").addEventListener("click", () => showStep(Math.max(0,currentStep-1)));
$("payBtn").addEventListener("click", async () => {
  const error = validStep(0) || validStep(1);
  if (error) { $("errorMessage").textContent = error; return; }
  const button = $("payBtn");
  button.disabled = true; button.textContent = "Connecting to Paystack…";
  $("errorMessage").textContent = "";
  const payload = Object.fromEntries(fields.map(id => [id,value(id)]));
  payload.documentType = documentType; payload.template = template;
  try {
    const response = await fetch("/api/payments/initialize", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Payment could not be started.");
    window.location.href = result.authorization_url;
  } catch (err) {
    $("errorMessage").textContent = err.message;
    button.disabled = false; button.innerHTML = 'Pay & create PDF <span>→</span>';
  }
});
$("menuBtn").addEventListener("click", () => document.querySelector(".topbar nav").classList.toggle("open"));
$("year").textContent = new Date().getFullYear();
showStep(0);
