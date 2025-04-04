// This file contains the JavaScript logic for handling local storage, adding, editing, and displaying employee information.

document.addEventListener('DOMContentLoaded', () => {
    const addEmployeeBtn = document.getElementById('addEmployeeBtn');
    const printBtn = document.getElementById('printBtn');
    const popup = document.getElementById('popup');
    const closePopupBtn = document.getElementById('closePopupBtn');
    const employeeForm = document.getElementById('employeeForm');
    const employeeTable = document.getElementById('employeeTable').getElementsByTagName('tbody')[0];
    const appointmentCondition = document.getElementById('appointmentCondition');
    const endDate = document.getElementById('endDate');
    const overlay = document.getElementById('overlay');

    let employees = JSON.parse(localStorage.getItem('employees')) || [];

    function getLastName(fullName) {
        const names = fullName.trim().split(' ');
        return names[names.length - 1];
    }

    function formatDate(dateString) {
        if (!dateString) {
            return ' ';
        }
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return ' ';
        }
        const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
        return date.toLocaleDateString('es-ES', options);
    }

    function renderTable() {
        employeeTable.innerHTML = '';
        employees.sort((a, b) => getLastName(a.fullName).localeCompare(getLastName(b.fullName), 'es'));
        employees.forEach((employee, index) => {
            const row = employeeTable.insertRow();
            row.innerHTML = `
                <td>${employee.id}</td>
                <td>${employee.fullName}</td>
                <td>${employee.birthDate}</td>
                <td>${employee.jobClass}</td>
                <td>${employee.specialty}</td>
                <td>${employee.position}</td>
                <td>${formatDate(employee.startDate)}</td>
                <td>${formatDate(employee.endDate)}</td>
                <td>${employee.appointmentCondition}</td>
                <td>${employee.status}</td>
                <td>
                    <button onclick="editEmployee(${index})">Editar</button>
                    <button onclick="deleteEmployee(${index})">Eliminar</button>
                </td>
            `;
        });
    }

    function saveEmployee(event) {
        event.preventDefault();
        const employee = {
            id: document.getElementById('id').value,
            fullName: document.getElementById('fullName').value,
            birthDate: document.getElementById('birthDate').value,
            jobClass: document.getElementById('jobClass').value,
            specialty: document.getElementById('specialty').value,
            position: document.getElementById('position').value,
            startDate: document.getElementById('startDate').value,
            endDate: document.getElementById('endDate').value,
            appointmentCondition: document.getElementById('appointmentCondition').value,
            status: document.getElementById('status').value
        };

        const index = employeeForm.dataset.index;
        if (index === undefined) {
            employees.push(employee);
        } else {
            employees[index] = employee;
            delete employeeForm.dataset.index;
        }

        localStorage.setItem('employees', JSON.stringify(employees));
        renderTable();
        popup.style.display = 'none';
        overlay.style.display = 'none';
    }

    window.editEmployee = function(index) {
        const employee = employees[index];
        document.getElementById('id').value = employee.id;
        document.getElementById('fullName').value = employee.fullName;
        document.getElementById('birthDate').value = employee.birthDate;
        document.getElementById('jobClass').value = employee.jobClass;
        document.getElementById('specialty').value = employee.specialty;
        document.getElementById('position').value = employee.position;
        document.getElementById('startDate').value = employee.startDate;
        document.getElementById('endDate').value = employee.endDate;
        document.getElementById('appointmentCondition').value = employee.appointmentCondition;
        document.getElementById('status').value = employee.status;
        employeeForm.dataset.index = index;
        popup.style.display = 'block';
        overlay.style.display = 'block';
        toggleEndDateField();
    }

    window.deleteEmployee = function(index) {
        employees.splice(index, 1);
        localStorage.setItem('employees', JSON.stringify(employees));
        renderTable();
    }

    addEmployeeBtn.addEventListener('click', () => {
        employeeForm.reset();
        delete employeeForm.dataset.index;
        popup.style.display = 'block';
        overlay.style.display = 'block';
        toggleEndDateField();
    });

    closePopupBtn.addEventListener('click', () => {
        popup.style.display = 'none';
        overlay.style.display = 'none';
    });

    employeeForm.addEventListener('submit', saveEmployee);

    appointmentCondition.addEventListener('change', toggleEndDateField);

    function toggleEndDateField() {
        if (appointmentCondition.value === 'propiedad') {
            endDate.disabled = true;
            endDate.value = '';
        } else {
            endDate.disabled = false;
        }
    }

    printBtn.addEventListener('click', () => {
        const printContent = document.getElementById('employeeTable').outerHTML;
        const originalContent = document.body.innerHTML;
        document.body.innerHTML = printContent;
        window.print();
        document.body.innerHTML = originalContent;
        location.reload();
    });

    // Restrict input to digits and '.' by using a regular expression filter.
    document.getElementById('id').addEventListener('input', function (e) {
        this.value = this.value.replace(/[^0-10]/g, '');
    });

    renderTable();
});

// Función para mostrar el modal de confirmación
function showDeleteConfirmation() {
    $('#deleteConfirmationModal').modal('show');
}

// Función para eliminar la base de datos
async function deleteDatabase() {
    const confirmationCode = document.getElementById('confirmationCode').value;
    const storedHash = localStorage.getItem('deleteCodeHash');

    // Verificar si el código ingresado coincide con el hash almacenado
    if (storedHash && await sha256(confirmationCode) === storedHash) {
        const employees = JSON.parse(localStorage.getItem('employees')) || [];
        const deletedEmployees = [];

        employees.forEach(employee => {
            deletedEmployees.push(employee);
            localStorage.removeItem(employee.fullName + '_incidents');
        });

        localStorage.removeItem('employees');
        showDeletedEmployeesSummary(deletedEmployees);
        $('#deleteConfirmationModal').modal('hide');
    } else {
        alert('Código de confirmación incorrecto.');
    }
}

// Función para mostrar el resumen de empleados eliminados
function showDeletedEmployeesSummary(deletedEmployees) {
    const deletedEmployeesList = document.getElementById('deletedEmployeesList');
    deletedEmployeesList.innerHTML = '';

    deletedEmployees.forEach(employee => {
        const listItem = document.createElement('li');
        listItem.textContent = `Cédula: ${employee.id}, Nombre: ${employee.fullName}, Fecha de Nacimiento: ${employee.birthDate}, Clase de Puesto: ${employee.jobClass}, Especialidad: ${employee.specialty}, Plaza: ${employee.position}, Rige del Nombramiento: ${employee.startDate}, Vence del Nombramiento: ${employee.endDate}, Condición del Nombramiento: ${employee.appointmentCondition}, Estado: ${employee.status}`;
        deletedEmployeesList.appendChild(listItem);
    });

    $('#deleteSummaryModal').modal('show');
}

// Función para generar el hash SHA-256
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// Almacenar el hash del código de eliminación en localStorage (esto debe hacerse una vez)
const deleteCode = '744b93f9950fc38dad705556931ea48193b99dcb191cc9bd77097f65fbe2f0b8'; // Reemplaza esto con tu código de confirmación
localStorage.setItem('deleteCodeHash', deleteCode);

// Función para comparar el hash del código ingresado por el usuario con el hash almacenado
async function verifyDeleteCode(userInput) {
    const userInputHash = await sha256(userInput);
    const storedHash = localStorage.getItem('deleteCodeHash');
    return userInputHash === storedHash;
}

// Ejemplo de uso: verificar el código ingresado por el usuario
const userInput = 'codigoIngresadoPorElUsuario'; // Reemplaza esto con el valor real ingresado por el usuario
verifyDeleteCode(userInput).then(isValid => {
    if (isValid) {
        console.log('Código de eliminación válido');
    } else {
        console.log('Código de eliminación inválido');
    }
});

// Función para mostrar el formulario de edición de empleados
function showEditEmployeeForm() {
    const employeeName = document.getElementById('menuEmployeeName').innerText;
    const employees = JSON.parse(localStorage.getItem('employees')) || [];
    const employee = employees.find(emp => emp.fullName === employeeName);

    document.getElementById('editId').value = employee.id;
    document.getElementById('editFullName').value = employee.fullName;
    document.getElementById('editBirthDate').value = employee.birthDate;
    document.getElementById('editJobClass').value = employee.jobClass;
    document.getElementById('editSpecialty').value = employee.specialty;
    document.getElementById('editPosition').value = employee.position;
    document.getElementById('editStartDate').value = employee.startDate;
    document.getElementById('editEndDate').value = employee.endDate;
    document.getElementById('editStatus').value = employee.status;
    document.getElementById('editAppointmentCondition').value = employee.appointmentCondition;

    $('#editEmployeeModal').modal('show');
    $('#overlay').show();
}

// Función para cerrar el formulario de edición de empleados
function closeEditEmployeeForm() {
    $('#editEmployeeModal').modal('hide');
    $('#overlay').hide();
}

// Función para guardar los cambios en los datos del empleado
document.getElementById('editEmployeeForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const id = document.getElementById('editId').value;
    const fullName = document.getElementById('editFullName').value;
    const birthDate = document.getElementById('editBirthDate').value;
    const jobClass = document.getElementById('editJobClass').value;
    const specialty = document.getElementById('editSpecialty').value;
    const position = document.getElementById('editPosition').value;
    const startDate = document.getElementById('editStartDate').value;
    const endDate = document.getElementById('editEndDate').value;
    const status = document.getElementById('editStatus').value;
    const appointmentCondition = document.getElementById('editAppointmentCondition').value;

    let employees = JSON.parse(localStorage.getItem('employees')) || [];
    const employeeIndex = employees.findIndex(emp => emp.id === id);

    if (employeeIndex !== -1) {
        employees[employeeIndex] = {
            id,
            fullName,
            birthDate,
            jobClass,
            specialty,
            position,
            startDate,
            endDate,
            status,
            appointmentCondition
        };

        localStorage.setItem('employees', JSON.stringify(employees));
        displayEmployees();
        closeEditEmployeeForm();
    } else {
        alert('Empleado no encontrado.');
    }
});

function loadIncidents() {
    const employeeName = localStorage.getItem('currentEmployee');
    let incidents = JSON.parse(localStorage.getItem(employeeName + '_incidents')) || [];

    // Ordenar las incidencias por fecha de inicio y luego por fecha de vencimiento
    incidents.sort((a, b) => {
        const startDateA = new Date(a.startDate);
        const startDateB = new Date(b.startDate);
        const endDateA = new Date(a.endDate);
        const endDateB = new Date(b.endDate);

        if (startDateA < startDateB) return -1;
        if (startDateA > startDateB) return 1;
        if (endDateA < endDateB) return -1;
        if (endDateA > endDateB) return 1;
        return 0;
    });

    const tbody = document.getElementById('incidentTable').getElementsByTagName('tbody')[0];
    tbody.innerHTML = '';
    incidents.forEach((incident, index) => {
        const row = tbody.insertRow();
        const cellType = row.insertCell(0);
        const cellDescription = row.insertCell(1);
        const cellStartDate = row.insertCell(2);
        const cellEndDate = row.insertCell(3);
        const cellDate = row.insertCell(4);
        const cellActions = row.insertCell(5);
        cellType.innerText = incident.type;
        cellDescription.innerText = incident.description;
        cellStartDate.innerText = new Date(incident.startDate + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
        cellEndDate.innerText = new Date(incident.endDate + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
        cellDate.innerText = incident.date;
        cellActions.innerHTML = `<button class="btn btn-warning btn-sm" onclick="editIncident(${index})">Editar</button> <button class="btn btn-success btn-sm" style="display:none;" onclick="saveIncident(${index})">Guardar</button>`;
    });
}

function viewIncidents() {
    loadIncidents(); // Llama a la función que ya ordena y carga las incidencias
    // Cualquier otra lógica adicional para visualizar incidencias
}