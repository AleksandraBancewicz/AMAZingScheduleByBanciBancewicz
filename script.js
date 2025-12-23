const PASSWORD = "Forum2026";

let employees = [];
let absences = [];
let schedule = [];

const daysPL = ["NIEDZIELA","PONIEDZIAŁEK","WTOREK","ŚRODA","CZWARTEK","PIĄTEK","SOBOTA"];
const polishHolidays = ["01-01","01-06","05-01","05-03","08-15","11-01","11-11","12-25","12-26"];

function login(){
  if(passwordInput.value===PASSWORD){
    loginBox.style.display="none";
    app.classList.remove("hidden");
    loadData();
  } else alert("BŁĘDNE HASŁO");
}

function showTab(id){
  document.querySelectorAll(".tab").forEach(t=>t.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

function saveData(){
  localStorage.setItem("employees",JSON.stringify(employees));
  localStorage.setItem("absences",JSON.stringify(absences));
}

function loadData(){
  employees=JSON.parse(localStorage.getItem("employees")||"[]");
  absences=JSON.parse(localStorage.getItem("absences")||"[]");
  renderEmployees();
  renderAbsences();
}

// Dodawanie nowego pracownika
function addEmployee(){
  const days=[...document.querySelectorAll(".days input:checked")].map(c=>+c.value);
  if(!firstName.value || !lastName.value) return alert("Podaj imię i nazwisko");
  employees.push({
    first:firstName.value.toUpperCase(),
    last:lastName.value.toUpperCase(),
    dept:department.value.toUpperCase(),
    days,
    day:dayShift.checked,
    night:nightShift.checked,
    countDay:0,
    countNight:0,
    editing:false
  });
  saveData();
  renderEmployees();
}

// Renderowanie listy pracowników
function renderEmployees(){
  employeeCards.innerHTML="";
  absenceEmployee.innerHTML='<option value="">BRAK</option>';

  employees.forEach((e,i)=>{
    if(e.editing){
      // Tryb edycji
      const daysCheckboxes = daysPL.map((d,j)=>{
        return `<label><input type="checkbox" ${e.days.includes(j)?'checked':''} onchange="editEmployeeDays(${i},${j},this.checked)">${d.slice(0,3)}</label>`;
      }).join('');

      employeeCards.innerHTML+=`
        <div class="employee-card">
          <div class="name">${e.first} ${e.last}</div>
          <input value="${e.dept}" onchange="editEmployee(${i}, 'dept', this.value)">
          <div class="days spaced">${daysCheckboxes}</div>
          <div class="shifts spaced">
            <label><input type="checkbox" ${e.day?'checked':''} onchange="editEmployee(${i}, 'day', this.checked)">DZIEŃ</label>
            <label><input type="checkbox" ${e.night?'checked':''} onchange="editEmployee(${i}, 'night', this.checked)">NOC</label>
          </div>
          <button onclick="saveEdit(${i})">ZATWIERDŹ</button>
          <button onclick="deleteEmployee(${i})">USUŃ</button>
        </div>`;
    } else {
      // Tryb podglądu
      const dayNames = e.days.map(d => daysPL[d].slice(0,3)).join(", ");
      employeeCards.innerHTML+=`
        <div class="employee-card">
          <div class="name">${e.first} ${e.last}</div>
          <div>Dział: ${e.dept}</div>
          <div>Dni: ${dayNames}</div>
          <div>Zmiana: ${(e.day?'DZIEŃ ':'')+(e.night?'NOC':'')}</div>
          <button onclick="editEmployeeMode(${i})">EDYTUJ</button>
          <button onclick="deleteEmployee(${i})">USUŃ</button>
        </div>`;
    }
    absenceEmployee.innerHTML+=`<option value="${i}">${e.first} ${e.last}</option>`;
  });
}

// Edycja działu i zmian
function editEmployee(i,field,value){
  if(field==='dept') employees[i][field]=value.toUpperCase();
  if(field==='day' || field==='night') employees[i][field]=value;
  saveData();
}

// Edycja dni tygodnia
function editEmployeeDays(i,dayIndex,checked){
  const idx = employees[i].days.indexOf(dayIndex);
  if(checked && idx===-1) employees[i].days.push(dayIndex);
  if(!checked && idx!==-1) employees[i].days.splice(idx,1);
  saveData();
}

// Tryb edycji
function editEmployeeMode(i){
  employees[i].editing = true;
  renderEmployees();
}

// Zatwierdzenie zmian
function saveEdit(i){
  employees[i].editing = false;
  saveData();
  renderEmployees();
}

// Usuwanie pracownika
function deleteEmployee(i){
  employees.splice(i,1);
  saveData();
  renderEmployees();
}

// WYJĄTKI
function addAbsence(){
  if(absenceEmployee.value==="") return;
  absences.push({
    emp:+absenceEmployee.value,
    from:absenceFrom.value,
    to:absenceTo.value,
    shift:absenceShift.value
  });
  saveData();
  renderAbsences();
}

function renderAbsences(){
  if(absences.length===0){
    absenceList.innerHTML="<li>BRAK</li>";
    return;
  }
  absenceList.innerHTML=absences.map((a,i)=>`
    <li>
      ${employees[a.emp].first} ${employees[a.emp].last} | ${a.from} – ${a.to} | ${a.shift}
      <button onclick="removeAbsence(${i})">USUŃ</button>
    </li>`).join("");
}

function removeAbsence(i){
  absences.splice(i,1);
  saveData();
  renderAbsences();
}

// GENEROWANIE GRAFIKU
function generateSchedule(){
  schedule=[];
  scheduleTable.innerHTML=`
    <tr><th>IMIĘ</th><th>NAZWISKO</th><th>DZIAŁ</th>
    <th>DATA</th><th>DZIEŃ</th><th>ZMIANA</th></tr>`;

  const start=new Date(startDate.value);
  const end=new Date(endDate.value);

  for(let d=new Date(start); d<=end; d.setDate(d.getDate()+1)){
    const dateStr=d.toISOString().slice(0,10);
    if(polishHolidays.includes(dateStr.slice(5))) continue;

    ["Dzień","Noc"].forEach(shift=>{
      let available=employees.filter((e,i)=>{
        if(!e.days.includes(d.getDay())) return false;
        if(shift==="Dzień" && !e.day) return false;
        if(shift==="Noc" && !e.night) return false;
        return !absences.some(a=>a.emp===i && dateStr>=a.from && dateStr<=a.to && (a.shift==="ALL"||a.shift===shift));
      }).sort((a,b)=>(shift==="Dzień"?a.countDay-b.countDay:a.countNight-b.countNight));

      const needed=twoPeople.checked?2:1;
      for(let i=0;i<needed && i<available.length;i++){
        const e=available[i];
        shift==="Dzień"?e.countDay++:e.countNight++;
        schedule.push({e,d:new Date(d),shift});
        scheduleTable.innerHTML+=`
          <tr>
            <td>${e.first}</td><td>${e.last}</td><td>${e.dept}</td>
            <td>${dateStr.split("-").reverse().join(".")}</td>
            <td>${daysPL[d.getDay()]}</td><td>${shift.toUpperCase()}</td>
          </tr>`;
      }
    });
  }
  renderStats();
}

// USUWANIE GRAFIKU
function clearSchedule(){
  schedule=[];
  scheduleTable.innerHTML="";
  statsTable.innerHTML="";
}

// STATYSTYKI
function renderStats(){
  statsTable.innerHTML="<tr><th>PRACOWNIK</th><th>DZIEŃ</th><th>NOC</th></tr>";
  employees.forEach(e=>{
    statsTable.innerHTML+=`
      <tr><td>${e.first} ${e.last}</td><td>${e.countDay}</td><td>${e.countNight}</td></tr>`;
  });
}

// EKSPORT DO WORD
function exportWord(){
  let html="<table border='1'><tr><th>IMIĘ</th><th>NAZWISKO</th><th>DZIAŁ</th><th>DATA</th><th>DZIEŃ</th><th>ZMIANA</th></tr>";
  schedule.forEach(s=>{
    html+=`<tr><td>${s.e.first}</td><td>${s.e.last}</td><td>${s.e.dept}</td>
      <td>${s.d.toISOString().slice(0,10).split("-").reverse().join(".")}</td>
      <td>${daysPL[s.d.getDay()]}</td><td>${s.shift.toUpperCase()}</td></tr>`;
  });
  html+="</table>";
  const blob=new Blob(['\ufeff'+html],{type:"application/msword"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="GRAFIK.doc";
  a.click();
}

// Logowanie ENTEREM
document.addEventListener("DOMContentLoaded", () => {
  passwordInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      login();
    }
  });
});
