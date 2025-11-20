(() => {
  const STORAGE_KEY = "pm_activities_v1";

  // DOM
  const form = document.getElementById("activity-form");
  const inputText = document.getElementById("activity-text");
  const inputDate = document.getElementById("activity-date");
  const list = document.getElementById("activities-list");
  const emptyMsg = document.getElementById("empty-msg");
  const filterEl = document.getElementById("filter");
  const clearDoneBtn = document.getElementById("clear-done");

  if (!list) return; // only run on activities page

  let activities = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
  }

  function render() {
    const filter = filterEl.value || "all";
    list.innerHTML = "";
    const filtered = activities.filter(a => {
      if (filter === "all") return true;
      if (filter === "done") return a.done;
      if (filter === "active") return !a.done;
    });

    if (filtered.length === 0) {
      emptyMsg.classList.remove("d-none");
    } else {
      emptyMsg.classList.add("d-none");
    }

    for (const a of filtered) {
      const li = document.createElement("li");
      li.className = "list-group-item d-flex justify-content-between align-items-start";
      li.dataset.id = a.id;

      const left = document.createElement("div");
      left.className = "ms-2 me-auto";

      const title = document.createElement("div");
      title.className = "fw-semibold";
      title.textContent = a.text;
      if (a.done) title.style.textDecoration = "line-through";

      const small = document.createElement("div");
      small.className = "small text-muted";
      small.textContent = a.date ? `Vence: ${a.date}` : "";

      left.appendChild(title);
      left.appendChild(small);

      const btns = document.createElement("div");
      btns.className = "btn-group btn-group-sm";
      const toggle = document.createElement("button");
      toggle.className = "btn btn-outline-success";
      toggle.innerHTML = a.done ? '<i class="fas fa-check-circle"></i>' : '<i class="far fa-circle"></i>';
      toggle.title = a.done ? "Marcar como pendiente" : "Marcar como realizada";
      toggle.addEventListener("click", () => toggleDone(a.id));

      const del = document.createElement("button");
      del.className = "btn btn-outline-danger";
      del.innerHTML = '<i class="fas fa-trash"></i>';
      del.title = "Eliminar";
      del.addEventListener("click", () => deleteActivity(a.id));

      btns.appendChild(toggle);
      btns.appendChild(del);

      li.appendChild(left);
      li.appendChild(btns);
      list.appendChild(li);
    }
  }

  function addActivity(text, date) {
    const activity = {
      id: Date.now().toString(),
      text: text.trim(),
      date: date || "",
      done: false
    };
    activities.unshift(activity);
    save();
    render();
  }

  function toggleDone(id) {
    activities = activities.map(a => a.id === id ? { ...a, done: !a.done } : a);
    save();
    render();
  }

  function deleteActivity(id) {
    activities = activities.filter(a => a.id !== id);
    save();
    render();
  }

  function clearDone() {
    activities = activities.filter(a => !a.done);
    save();
    render();
  }

  form.addEventListener("submit", e => {
    e.preventDefault();
    const text = inputText.value;
    const date = inputDate.value;
    if (!text.trim()) return;
    addActivity(text, date);
    form.reset();
    inputText.focus();
  });

  filterEl.addEventListener("change", render);
  clearDoneBtn.addEventListener("click", () => {
    if (confirm("Eliminar todas las actividades realizadas?")) clearDone();
  });

  // initial render
  render();
})();