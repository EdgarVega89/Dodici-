
const STORAGE_KEY = "dodici-manager-console-web-v1";
const NAV = [
  ["Service", null],
  ["Dashboard","dashboard"],
  ["Guest Arrival","arrival"],
  ["Guest Profiles","profiles"],
  ["Operations",null],
  ["86 Center","stock"],
  ["Menu & Wine","menu"],
  ["What If?","whatif"],
  ["Admin",null],
  ["Settings","settings"]
];

let currentView = "dashboard";
let currentMenuCategory = "Pizzas";
let state = loadState();

function deepClone(v){ return JSON.parse(JSON.stringify(v)); }
function loadState(){
  try{
    const saved = localStorage.getItem(STORAGE_KEY);
    if(saved){
      const parsed = JSON.parse(saved);
      return {...deepClone(window.DODICI_DEFAULTS), ...parsed};
    }
  }catch(e){}
  return deepClone(window.DODICI_DEFAULTS);
}
function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
function esc(v){
  return String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}
function toast(msg){
  const t=document.getElementById("toast");
  t.textContent=msg;t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"),1500);
}
function navigate(view){
  currentView=view;
  renderNav();
  render();
  window.scrollTo({top:0,behavior:"smooth"});
  history.replaceState(null,"","#"+view);
}
function renderNav(){
  const desktop=document.getElementById("desktopNav");
  const mobile=document.getElementById("mobileNav");
  desktop.innerHTML = NAV.map(([label,view]) => view
    ? `<button class="nav-btn ${currentView===view?"active":""}" data-view="${view}">${label}</button>`
    : `<div class="nav-group">${label}</div>`).join("");
  mobile.innerHTML = NAV.filter(x=>x[1]).map(([label,view]) =>
    `<button class="nav-btn ${currentView===view?"active":""}" data-view="${view}">${label}</button>`).join("");
  document.querySelectorAll("[data-view]").forEach(b=>b.onclick=()=>navigate(b.dataset.view));
}
function header(kicker,title,right="Web App"){
  return `<div class="page-top"><div><div class="kicker">${kicker}</div><h1>${title}</h1></div><div class="pill">${right}</div></div>`;
}
function inventoryStatus(i){
  if(i.qty<=0) return ["86","b-crit"];
  if(i.qty<=i.critical) return ["CRITICAL","b-crit"];
  if(i.qty<=i.low) return ["LOW","b-low"];
  return ["OK","b-ok"];
}
function renderAlerts(){
  const box=document.getElementById("alertBar");
  const alerts=state.inventory.map(i=>{
    if(i.qty<=0) return `<div class="alert red">86: ${esc(i.name)}</div>`;
    if(i.qty<=i.critical) return `<div class="alert red">CRITICAL: ${esc(i.name)} · ${i.qty} left</div>`;
    if(i.qty<=i.low) return `<div class="alert orange">LOW: ${esc(i.name)} · ${i.qty} left</div>`;
    return "";
  }).join("");
  box.innerHTML=alerts;
}
function affectedItems(ingredientId){
  const result=[];
  Object.values(window.DODICI_MENU).flat().forEach(item=>{
    if((item.ingredients||[]).includes(ingredientId)) result.push(item.name);
  });
  return result;
}
function render(){
  renderAlerts();
  const view=document.getElementById("view");
  if(currentView==="dashboard") renderDashboard(view);
  if(currentView==="arrival") renderArrival(view);
  if(currentView==="profiles") renderProfiles(view);
  if(currentView==="stock") renderStock(view);
  if(currentView==="menu") renderMenu(view);
  if(currentView==="whatif") renderWhatIf(view);
  if(currentView==="settings") renderSettings(view);
}
function renderDashboard(view){
  const first=state.guests.filter(g=>g.firstVisit).length;
  const celeb=state.guests.filter(g=>g.celebration && g.celebration!=="No").length;
  const crit=state.inventory.filter(i=>i.qty<=i.critical).length;
  const guests = state.guests.length ? state.guests.slice().reverse().map(g=>{
    const tags=[];
    if(g.firstVisit) tags.push(`<span class="badge b-first">FIRST VISIT</span>`);
    if(g.celebration && g.celebration!=="No") tags.push(`<span class="badge b-vip">${esc(g.celebration).toUpperCase()}</span>`);
    if(g.allergy && g.allergy!=="None") tags.push(`<span class="badge b-crit">ALLERGY</span>`);
    return `<div class="item item-flex"><div><b>${esc(g.name)}</b> · Party ${g.party}<div class="muted tiny">Table ${esc(g.table||"TBD")} · ${esc(g.server||"Server TBD")} · ${esc(g.type)}</div></div><div class="row">${tags.join("")}</div></div>`;
  }).join("") : `<div class="muted">No arrivals recorded yet.</div>`;
  view.innerHTML = header("Dodici Pizza & Wine","Manager Console","Persistent data") + `
  <div class="grid">
    <div class="card hero s8"><img src="/assets/interior.jpeg"><div class="hero-copy"><div class="kicker" style="color:#ffe477">Hospitality starts before the table</div><h2>Know the guest. Prepare the team. Protect the experience.</h2><p>Guest intelligence, product knowledge and operational awareness in one place.</p></div></div>
    <div class="card s4"><h3>Today</h3><div class="list">
      <div class="item item-flex"><span>First-Time Guests</span><b>${first}</b></div>
      <div class="item item-flex"><span>Celebrations</span><b>${celeb}</b></div>
      <div class="item item-flex"><span>86 / Critical</span><b>${crit}</b></div>
      <div class="item item-flex"><span>Sales Goal</span><b>${esc(state.settings.salesGoal)}</b></div>
    </div></div>
    <div class="card s7"><div class="item-flex"><h3 style="margin:0">Guest Intelligence</h3><span class="badge b-first">${state.guests.length} SAVED</span></div><div class="hr"></div><div class="list">${guests}</div></div>
    <div class="card s5"><h3>Quick Actions</h3><div class="list">
      <button class="item item-flex" data-go="arrival"><span>Seat a guest</span><b>→</b></button>
      <button class="item item-flex" data-go="stock"><span>Review 86 Center</span><b>→</b></button>
      <button class="item item-flex" data-go="menu"><span>Open Menu Knowledge</span><b>→</b></button>
      <button class="item item-flex" data-go="whatif"><span>Open What If?</span><b>→</b></button>
    </div></div>
  </div>`;
  view.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>navigate(b.dataset.go));
}
function renderArrival(view){
  view.innerHTML = header("Service","Guest Arrival","Host intake") + `
  <div class="grid">
    <div class="card s7">
      <h3>Host Intake</h3>
      <form id="arrivalForm">
        <div class="form-grid">
          <div><label>Guest / Reservation Name</label><input id="gName" required></div>
          <div><label>Party Size</label><input id="gParty" type="number" min="1" value="2"></div>
          <div><label>Reservation / Walk-in</label><select id="gType"><option>Reservation</option><option>Walk-in</option></select></div>
          <div><label>Table</label><input id="gTable"></div>
          <div><label>First Visit?</label><select id="gFirst"><option value="yes">Yes</option><option value="no">No</option></select></div>
          <div><label>Celebrating?</label><select id="gCelebration"><option>No</option><option>Birthday</option><option>Anniversary</option><option>Date Night</option><option>Engagement</option><option>Graduation</option><option>Other</option></select></div>
          <div><label>Allergy / Dietary Concern</label><input id="gAllergy" placeholder="None / describe"></div>
          <div><label>Assigned Server</label><input id="gServer"></div>
        </div>
        <div class="hr"></div><button class="btn yellow">Create Handoff Card</button>
      </form>
      <div id="handoffResult" style="margin-top:14px"></div>
    </div>
    <div class="card s5">
      <h3>First-Time Guest Standard</h3>
      <div class="callout"><b>Host captures context before seating.</b> The server approaches the table already knowing whether it is a first visit, celebration or dietary concern.</div>
      <div class="hr"></div>
      <div class="list">
        <div class="item"><b>1 · Welcome with context</b><div class="muted tiny">Do not make the guest repeat information.</div></div>
        <div class="item"><b>2 · Tell the Dodici story</b><div class="muted tiny">Short and conversational.</div></div>
        <div class="item"><b>3 · Guide the menu</b><div class="muted tiny">Explain key pizzas and products.</div></div>
        <div class="item"><b>4 · Recommend wine</b><div class="muted tiny">Connect one pizza to one wine and explain why.</div></div>
      </div>
    </div>
  </div>`;
  document.getElementById("arrivalForm").onsubmit=e=>{
    e.preventDefault();
    const guest={
      id:crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      name:gName.value.trim(),party:Number(gParty.value)||1,type:gType.value,table:gTable.value.trim(),
      firstVisit:gFirst.value==="yes",celebration:gCelebration.value,
      allergy:gAllergy.value.trim()||"None",server:gServer.value.trim(),createdAt:new Date().toISOString()
    };
    state.guests.push(guest);saveState();renderAlerts();
    const tags=[
      guest.firstVisit?`<span class="badge b-first">FIRST VISIT</span>`:"",
      guest.celebration!=="No"?`<span class="badge b-vip">${esc(guest.celebration).toUpperCase()}</span>`:"",
      guest.allergy!=="None"?`<span class="badge b-crit">ALLERGY</span>`:""
    ].join("");
    handoffResult.innerHTML=`<div class="handoff"><div class="item-flex"><div><div class="kicker">SERVER HANDOFF</div><div class="handoff-title">${esc(guest.name)} · Party ${guest.party}</div></div><div class="row">${tags}</div></div>
      <div class="muted tiny" style="margin-top:8px"><b>Table:</b> ${esc(guest.table||"TBD")} · <b>Server:</b> ${esc(guest.server||"TBD")} · <b>Arrival:</b> ${esc(guest.type)}<br><b>Allergy / concern:</b> ${esc(guest.allergy)}</div>
      <div class="callout" style="margin-top:11px"><b>Next action:</b> ${guest.allergy!=="None"?"ALLERGY PRIORITY — notify manager/kitchen and verify ingredients.":guest.firstVisit?"Give the first-time Dodici introduction, guide the menu, and offer a wine pairing.":"Standard welcome with known guest context."}</div>
      <div class="row" style="margin-top:11px"><button id="toDashboard" class="btn light">View Dashboard →</button><button id="newGuest" class="btn light">New Guest</button></div></div>`;
    toDashboard.onclick=()=>navigate("dashboard");
    newGuest.onclick=()=>renderArrival(view);
    toast("Guest saved");
  };
}
function renderProfiles(view){
  const profiles=state.profiles.length?state.profiles.map((p,i)=>`
    <div class="item item-flex"><div><b>${esc(p.name)}</b> <span class="badge ${p.status==="VIP"?"b-vip":"b-first"}">${esc(p.status).toUpperCase()}</span>
    <div class="muted tiny">Usual: ${esc(p.order||"—")} · Wine: ${esc(p.wine||"—")} · Table: ${esc(p.table||"—")} · Birthday: ${esc(p.birthday||"—")}</div></div>
    <button class="btn light" data-delprofile="${i}">Delete</button></div>`).join(""):`<div class="muted">No guest profiles yet.</div>`;
  view.innerHTML=header("Guest Intelligence","Guest Profiles","Returning / VIP") + `
  <div class="grid">
    <div class="card s5"><h3>Create / Update Profile</h3><form id="profileForm"><div class="form-grid">
      <div><label>Name</label><input id="pName" required></div><div><label>Status</label><select id="pStatus"><option>Returning Guest</option><option>VIP</option></select></div>
      <div><label>Birthday</label><input id="pBirthday" placeholder="MM/DD"></div><div><label>Preferred Table</label><input id="pTable"></div>
      <div style="grid-column:1/-1"><label>Usual Order</label><input id="pOrder"></div><div style="grid-column:1/-1"><label>Wine Preference</label><input id="pWine"></div>
      <div style="grid-column:1/-1"><label>Service Notes</label><textarea id="pNotes"></textarea></div></div>
      <div class="hr"></div><button class="btn yellow">Save Profile</button></form></div>
    <div class="card s7"><h3>Returning / VIP Guests</h3><div class="list">${profiles}</div></div>
  </div>`;
  profileForm.onsubmit=e=>{
    e.preventDefault();
    state.profiles.push({name:pName.value.trim(),status:pStatus.value,birthday:pBirthday.value.trim(),table:pTable.value.trim(),order:pOrder.value.trim(),wine:pWine.value.trim(),notes:pNotes.value.trim()});
    saveState();toast("Profile saved");renderProfiles(view);
  };
  view.querySelectorAll("[data-delprofile]").forEach(b=>b.onclick=()=>{state.profiles.splice(Number(b.dataset.delprofile),1);saveState();renderProfiles(view)});
}
function renderStock(view){
  const rows=state.inventory.map((i,idx)=>{
    const [st,cl]=inventoryStatus(i);
    const affected=affectedItems(i.id);
    return `<div class="item stock-grid">
      <div><b>${esc(i.name)}</b><div class="muted tiny">${affected.length?"Affects: "+affected.map(esc).join(", "):"No menu dependency mapped yet."}</div></div>
      <input type="number" min="0" value="${i.qty}" data-qty="${idx}">
      <button class="btn light" data-sold="${idx}">Sold 1</button>
      <div class="status"><span class="badge ${cl}">${st} · ${i.qty}</span></div>
    </div>`;
  }).join("");
  view.innerHTML=header("Operations","86 Center","Inventory awareness") + `
  <div class="grid"><div class="card s12"><div class="item-flex"><div><h3 style="margin:0">Live Inventory</h3><div class="muted tiny">Manual V1 tracking; Toast integration can replace manual decrements later.</div></div><button id="addInventory" class="btn light">+ Add Item</button></div>
  <div class="hr"></div><div class="list">${rows}</div></div></div>`;
  view.querySelectorAll("[data-qty]").forEach(input=>input.onchange=()=>{
    const i=state.inventory[Number(input.dataset.qty)],prev=i.qty;i.qty=Math.max(0,Number(input.value)||0);saveState();
    if(prev>0&&i.qty===0) show86(i); else renderStock(view);
  });
  view.querySelectorAll("[data-sold]").forEach(btn=>btn.onclick=()=>{
    const i=state.inventory[Number(btn.dataset.sold)],prev=i.qty;i.qty=Math.max(0,i.qty-1);saveState();
    if(prev>0&&i.qty===0) show86(i); else renderStock(view);
  });
  addInventory.onclick=()=>{
    const name=prompt("Item name");if(!name)return;
    state.inventory.push({id:name.toLowerCase(),name,qty:5,low:3,critical:1});saveState();renderStock(view);
  };
}
function show86(item){
  const affected=affectedItems(item.id);
  const modal=document.getElementById("modal");
  modal.className="modal open";
  modal.innerHTML=`<div class="modal-box"><div class="kicker">NEW 86 ALERT</div><h3>${esc(item.name)} is now 86</h3><p class="muted">${affected.length?"Affected menu items: "+affected.map(esc).join(", "):"No menu dependencies are mapped yet."}</p>
  <button id="ack86" class="btn yellow">I UNDERSTAND</button></div>`;
  ack86.onclick=()=>{modal.className="modal";modal.innerHTML="";renderAlerts();render();};
}
function renderMenu(view){
  const categories=Object.keys(window.DODICI_MENU);
  const cards=window.DODICI_MENU[currentMenuCategory].map(m=>{
    const blocked=(m.ingredients||[]).some(id=>state.inventory.find(i=>i.id===id)?.qty<=0);
    const low=(m.ingredients||[]).some(id=>{const x=state.inventory.find(i=>i.id===id);return x&&x.qty>0&&x.qty<=x.low});
    return `<div class="menu-item"><b><span>${esc(m.name)}</span><span>${esc(m.price)}</span></b><p>${esc(m.desc)}</p>${blocked?'<div class="badge b-crit" style="margin-top:7px">86 AFFECTED</div>':low?'<div class="badge b-low" style="margin-top:7px">LOW STOCK RISK</div>':""}</div>`;
  }).join("");
  const wines=window.DODICI_WINES.map(w=>`<div class="wine"><b>${esc(w[0])}</b><span>${esc(w[3])}</span><small>${esc(w[1])} · ${esc(w[2])}</small></div>`).join("");
  view.innerHTML=header("Product Knowledge","Menu & Wine","Guest guidance") + `
  <div class="grid">
    <div class="card s8"><div class="item-flex"><div><h3 style="margin:0">Menu Knowledge</h3><div class="muted tiny">Menu-linked 86 awareness is active.</div></div><button id="foodScan" class="btn light">Original Menu</button></div>
      <div class="hr"></div><div class="menu-tabs">${categories.map(c=>`<button class="tab-btn ${c===currentMenuCategory?"active":""}" data-cat="${esc(c)}">${esc(c)}</button>`).join("")}</div><div class="menu-grid">${cards}</div></div>
    <div class="card s4"><h3>First-Visit Product Story</h3><div class="list">
      <div class="item"><b>Oven</b><div class="muted tiny">${esc(state.settings.oven)}</div></div>
      <div class="item"><b>Dough</b><div class="muted tiny">${esc(state.settings.dough)}</div></div>
      <div class="item"><b>Pepperoni</b><div class="muted tiny">${esc(state.settings.pepperoni)}</div></div>
      <div class="item"><b>Mozzarella</b><div class="muted tiny">${esc(state.settings.mozzarella)}</div></div>
    </div></div>
    <div class="card s12"><div class="item-flex"><h3 style="margin:0">Wine List</h3><button id="wineScan" class="btn light">Original Wine Menu</button></div><div class="hr"></div><div class="wine-grid">${wines}</div></div>
  </div>`;
  view.querySelectorAll("[data-cat]").forEach(b=>b.onclick=()=>{currentMenuCategory=b.dataset.cat;renderMenu(view)});
  foodScan.onclick=()=>showImage("/assets/food-menu.jpeg","Original Food Menu");
  wineScan.onclick=()=>showImage("/assets/wine-menu.jpeg","Original Wine Menu");
}
function showImage(src,title){
  const modal=document.getElementById("modal");modal.className="modal open";
  modal.innerHTML=`<div class="modal-box" style="max-width:850px;max-height:90vh;overflow:auto"><div class="item-flex"><h3>${esc(title)}</h3><button id="closeModal" class="btn light">Close</button></div><img class="scan" src="${src}"></div>`;
  closeModal.onclick=()=>{modal.className="modal";modal.innerHTML=""};
}
function renderWhatIf(view){
  view.innerHTML=header("Playbook","What If?","Editable standards") + `<div class="grid"><div class="card s12"><div class="list">${state.scenarios.map(s=>`<details><summary>${esc(s.title)}</summary><p class="muted">${esc(s.body)}</p></details>`).join("")}</div></div></div>`;
}
function renderSettings(view){
  view.innerHTML=header("Admin","Settings","Editable") + `
  <div class="grid">
    <div class="card s6"><h3>Product Story</h3><form id="storyForm">
      <label>Oven</label><textarea id="sOven">${esc(state.settings.oven)}</textarea>
      <label>Dough</label><textarea id="sDough">${esc(state.settings.dough)}</textarea>
      <label>Pepperoni</label><textarea id="sPepperoni">${esc(state.settings.pepperoni)}</textarea>
      <label>Mozzarella</label><textarea id="sMozzarella">${esc(state.settings.mozzarella)}</textarea>
      <label>Wine Guidance</label><textarea id="sWine">${esc(state.settings.wine)}</textarea>
      <button class="btn yellow">Save Story</button></form></div>
    <div class="card s6"><h3>Operational Targets</h3><form id="targetsForm">
      <label>Daily Sales Goal</label><input id="sSales" value="${esc(state.settings.salesGoal)}">
      <label>Labor % Target</label><input id="sLabor" value="${esc(state.settings.laborTarget)}">
      <label>Food Cost % Target</label><input id="sFood" value="${esc(state.settings.foodCostTarget)}">
      <label>Ticket Time Target</label><input id="sTicket" value="${esc(state.settings.ticketTarget)}">
      <button class="btn yellow">Save Targets</button></form>
      <div class="hr"></div><button id="resetApp" class="btn danger">Reset Local Data</button></div>
  </div>`;
  storyForm.onsubmit=e=>{e.preventDefault();Object.assign(state.settings,{oven:sOven.value,dough:sDough.value,pepperoni:sPepperoni.value,mozzarella:sMozzarella.value,wine:sWine.value});saveState();toast("Story saved")};
  targetsForm.onsubmit=e=>{e.preventDefault();Object.assign(state.settings,{salesGoal:sSales.value||"TBD",laborTarget:sLabor.value||"TBD",foodCostTarget:sFood.value||"TBD",ticketTarget:sTicket.value||"TBD"});saveState();toast("Targets saved")};
  resetApp.onclick=()=>{if(confirm("Reset all Dodici Manager Console data stored on this device?")){state=deepClone(window.DODICI_DEFAULTS);saveState();toast("Data reset");navigate("dashboard")}};
}

const initial=(location.hash||"#dashboard").slice(1);
if(NAV.some(x=>x[1]===initial)) currentView=initial;
renderNav();render();

if("serviceWorker" in navigator){
  window.addEventListener("load",()=>navigator.serviceWorker.register("/sw.js").catch(()=>{}));
}
