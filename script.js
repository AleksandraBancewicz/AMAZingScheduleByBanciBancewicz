const PASSWORD = "Forum2026"; // ← ZMIEŃ

let employees = [];
let absences = [];
let holidays = [];
let schedule = [];

const daysPL = ["Niedziela","Poniedziałek","Wtorek","Środa","Czwartek","Piątek","Sobota"];

function login(){
  if(passwordInput.value === PASSWORD){
    loginBox.style.display="none";
    app.classList.remove("hidden");
    loadData();
  } else {
    alert("Błędne hasło");
  }
}

function showTab(id){
  document.querySelectorAll(".tab").forEach(t=>t.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

function saveData(){
  localStorage.setItem("employees", JSON.stringify(employees));
  localStorage.setItem("absences", JSON.stringify(absences));
  localStorage.setItem("holidays", JSON.stringify(holidays));
  localStorage.setItem("schedule", JSON.stringify(schedule));
}

function loadData(){
  employees = JSON.parse(localStorage.getItem("employees")||"[]");
  absences = JSON.parse(localStorage.getItem("absences")||"[]");
  holidays = JSON.parse(localStorage.getItem("holidays")||"[]");
  renderEmployees();
  renderAbsences();
  renderHolidays();
}

function addEmployee(){
  const days=[...document.querySelectorAll("fieldset input:checked")].map(c=>+c.value);
  employees.push({
    first:firstName.value,
    last:lastName.value,
    dept:department.value,
    days,
    day:dayShift.checked,
    night:nightShift.checked,
    count:0
  });
  saveData();
  renderEmployees();
}

function renderEmployees(){
  employeeList.innerHTML="";
  absenceEmployee.innerHTML="";
  employees.forEach((e,i)=>{
    employeeList.innerHTML+=`<li>${e.first} ${e.last} (${e.dept})</li>`;
    absenceEmployee.innerHTML+=`<option value="${i}">${e.first} ${e.last}</option>`;
  });
}

function addAbsence(){
  absences.push({emp:+absenceEmployee.value,date:absenceDate.value});
  saveData();
  renderAbsences();
}

function renderAbsences(){
  absenceList.innerHTML=absences.map(a=>`<li>${employees[a.emp].first} – ${a.date}</li>`).join("");
}

function addHoliday(){
  holidays.push(holidayDate.value);
  saveData();
  renderHolidays();
}

function renderHolidays(){
  holidayList.innerHTML=holidays.map(d=>`<li>${d}</li>`).join("");
}

function generateSchedule(){
  schedule=[];
  scheduleTable.innerHTML=`<tr>
  <th>Imię</th><th>Nazwisko</th><th>Dział</th>
  <th>Data</th><th>Dzień</th><th>Zmiana</th></tr>`;

  const now=new Date();
  const start=new Date(now.getFullYear(),now.getMonth(),1);
  const end=new Date(now.getFullYear(),now.getMonth()+1,0);

  for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1)){
    const dateStr=d.toISOString().slice(0,10);
    if(holidays.includes(dateStr)) continue;

    ["Dzień","Noc"].forEach(shift=>{
      let available=employees
        .filter((e,i)=>
          e.days.includes(d.getDay()) &&
          (shift==="Dzień"?e.day:e.night) &&
          !absences.some(a=>a.emp===i && a.date===dateStr)
        )
        .sort((a,b)=>a.count-b.count);

      if(!available.length) return;
      const needed=twoPeople.checked?2:1;

      for(let i=0;i<needed && i<available.length;i++){
        const e=available[i];
        e.count++;
        schedule.push({e,d:new Date(d),shift});
        scheduleTable.innerHTML+=`<tr>
          <td contenteditable>${e.first}</td>
          <td contenteditable>${e.last}</td>
          <td contenteditable>${e.dept}</td>
          <td>${dateStr}</td>
          <td>${daysPL[d.getDay()]}</td>
          <td>${shift}</td>
        </tr>`;
      }
    });
  }
  saveData();
}

function saveManual(){
  saveData();
  alert("Zmiany zapisane");
}

function exportWord(){
  let html="<table border='1'><tr><th>IMIĘ</th><th>NAZWISKO</th><th>DZIAŁ</th><th>DATA</th><th>DZIEŃ</th><th>ZMIANA</th></tr>";
  schedule.forEach(s=>{
    html+=`<tr><td>${s.e.first}</td><td>${s.e.last}</td><td>${s.e.dept}</td>
    <td>${s.d.toISOString().slice(0,10)}</td>
    <td>${daysPL[s.d.getDay()]}</td><td>${s.shift}</td></tr>`;
  });
  html+="</table>";

  const blob=new Blob(['\ufeff'+html],{type:"application/msword"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="grafik.doc";
  a.click();
}
