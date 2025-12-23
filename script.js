const PASSWORD = "Forum2026"; // ← ZMIEŃ HASŁO

let employees = [];
let absences = [];
let schedule = [];

const daysPL = ["NIEDZIELA","PONIEDZIAŁEK","WTOREK","ŚRODA","CZWARTEK","PIĄTEK","SOBOTA"];
const polishHolidays = ["01-01","01-06","05-01","05-03","08-15","11-01","11-11","12-25","12-26"];

function login(){
  if(passwordInput.value === PASSWORD){
    loginBox.style.display = "none";
    app.classList.remove("hidden");
    loadData();
  } else alert("BŁĘDNE HASŁO");
}

function showTab(id){
  document.querySelectorAll(".tab").forEach(t => t.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

function saveData(){
  localStorage.setItem("employees", JSON.stringify(employees));
  localStorage.setItem("absences", JSON.stringify(absences));
  localStorage.setItem("schedule", JSON.stringify(schedule));
}

function loadData(){
  employees = JSON.parse(localStorage.getItem("employees") || "[]");
  absences = JSON.parse(localStorage.getItem("absences") || "[]");
  renderEmployees();
  renderAbsences();
}

function addEmployee(){
  const days = [...document.querySelectorAll(".days input:checked")].map(c => +c.value);
  employees.push({
    first: firstName.value.toUpperCase(),
    last: lastName.value.toUpperCase(),
    dept: department.value.toUpperCase(),
    days,
    day: dayShift.checked,
    night: nightShift.checked,
    count: 0
  });
  saveData();
  renderEmployees();
}

function renderEmployees(){
  employeeCards.innerHTML = "";
  absenceEmployee.innerHTML = "";

  employees.forEach((e,i)=>{
    employeeCards.innerHTML += `
      <div class="employee-card">
        <strong>${e.first} ${e.last}</strong> (${e.dept})<br>
        DNI: ${e.days.map(d => daysPL[d].slice(0,3)).join(", ")}<br>
        ZMIANY: ${(e.day?"DZIEŃ ":"")}${(e.night?"NOC":"")}
      </div>`;
    absenceEmployee.innerHTML += `<option value="${i}">${e.first} ${e.last}</option>`;
  });
}

function addAbsence(){
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
  absenceList.innerHTML = absences.map(a =>
    `<li>${employees[a.emp].first} ${employees[a.emp].last} | ${a.from} – ${a.to} | ${a.shift}</li>`
  ).join("");
}

function generateSchedule(){
  schedule = [];
  scheduleTable.innerHTML = `
    <tr>
      <th>IMIĘ</th><th>NAZWISKO</th><th>DZIAŁ</th>
      <th>DATA</th><th>DZIEŃ</th><th>ZMIANA</th>
    </tr>`;

  const start = new Date(startDate.value);
  const end = new Date(endDate.value);
  const shift = globalShift.value;

  for(let d = new Date(start); d <= end; d.setDate(d.getDate()+1)){
    const dateStr = d.toISOString().slice(0,10);
    if(polishHolidays.includes(dateStr.slice(5))) continue;

    let available = employees.filter((e,i)=>{
      if(!e.days.includes(d.getDay())) return false;
      if(shift==="Dzień" && !e.day) return false;
      if(shift==="Noc" && !e.night) return false;

      return !absences.some(a =>
        a.emp===i &&
        dateStr>=a.from &&
        dateStr<=a.to &&
        (a.shift==="ALL" || a.shift===shift)
      );
    }).sort((a,b)=>a.count-b.count);

    const needed = twoPeople.checked ? 2 : 1;
    for(let i=0;i<needed && i<available.length;i++){
      const e = available[i];
      e.count++;
      schedule.push({e, d:new Date(d), shift});
      scheduleTable.innerHTML += `
        <tr>
          <td>${e.first}</td>
          <td>${e.last}</td>
          <td>${e.dept}</td>
          <td>${dateStr.split("-").reverse().join(".")}</td>
          <td>${daysPL[d.getDay()]}</td>
          <td>${shift.toUpperCase()}</td>
        </tr>`;
    }
  }
  saveData();
  renderStats();
}

function clearSchedule(){
  schedule = [];
  scheduleTable.innerHTML = "";
  statsTable.innerHTML = "";
  saveData();
}

function renderStats(){
  const map = {};
  schedule.forEach(s=>{
    const k = s.e.first+" "+s.e.last;
    map[k] = (map[k]||0) + 1;
  });
  statsTable.innerHTML = "<tr><th>PRACOWNIK</th><th>LICZBA DYŻURÓW</th></tr>";
  Object.entries(map).forEach(([k,v])=>{
    statsTable.innerHTML += `<tr><td>${k}</td><td>${v}</td></tr>`;
  });
}

function exportWord(){
  let html="<table border='1'><tr><th>IMIĘ</th><th>NAZWISKO</th><th>DZIAŁ</th><th>DATA</th><th>DZIEŃ</th><th>ZMIANA</th></tr>";
  schedule.forEach(s=>{
    html+=`<tr><td>${s.e.first}</td><td>${s.e.last}</td><td>${s.e.dept}</td>
    <td>${s.d.toISOString().slice(0,10).split("-").reverse().join(".")}</td>
    <td>${daysPL[s.d.getDay()]}</td><td>${s.shift.toUpperCase()}</td></tr>`;
  });
  html+="</table>";

  const blob = new Blob(['\ufeff'+html],{type:"application/msword"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "GRAFIK.doc";
  a.click();
}
