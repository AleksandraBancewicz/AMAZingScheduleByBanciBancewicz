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

function addEmployee(){
  const days=[...document.querySelectorAll(".days input:checked")].map(c=>+c.value);
  employees.push({
    first:firstName.value.toUpperCase(),
    last:lastName.value.toUpperCase(),
    dept:department.value.toUpperCase(),
    days,
    day:dayShift.checked,
    night:nightShift.checked,
    countDay:0,
    countNight:0
  });
  saveData();
  renderEmployees();
}

function renderEmployees(){
  employeeCards.innerHTML="";
  absenceEmployee.innerHTML='<option value="">BRAK</option>';

  employees.forEach((e,i)=>{
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
        <button onclick="deleteEmployee(${i})">USUŃ</button>
      </div>`;
    absenceEmployee.innerHTML+=`<option value="${i}">${e.first} ${e.last}</option>`;
  });

  employees.push({
  first:firstName.value.toUpperCase(),
  last:lastName.value.toUpperCase(),
  dept:department.value.toUpperCase(),
  days,
  day:dayShift.checked,
  night:nightShift.checked,
  countDay:0,
  countNight:0,
  editing:false  // nowa flaga
});
}

function editEmployee(i,field,value){
  if(field==='dept') employees[i][field]=value.toUpperCase();
  if(field==='day' || field==='night') employees[i][field]=value;
  saveData();
  renderEmployees();
}

function editEmployeeDays(i,dayIndex,checked){
  const idx = employees[i].days.indexOf(dayIndex);
  if(checked && idx===-1) employees[i].days.push(dayIndex);
  if(!checked && idx!==-1) employees[i].days.splice(idx,1);
  saveData();
  renderEmployees();
}

function deleteEmployee(i){
  employees.splice(i,1);
  saveData();
  renderEmployees();
}

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
    ${employees[a.emp].first} ${employees[a.emp].last}
    | ${a.from} – ${a.to} | ${a.shift}
    <button onclick="removeAbsence(${i})">USUŃ</button>
  </li>`).join("");
}

function removeAbsence(i){
  absences.splice(i,1);
  saveData();
  renderAbsences();
}

// Funkcje generowania grafiku i eksport Word pozostają bez zmian (dzień + noc automatycznie)
