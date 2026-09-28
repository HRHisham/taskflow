// ============================================================
// TASKFLOW - SUPABASE APP
// ============================================================

// -------------------------
// 1. SUPABASE CONFIGURATION
// -------------------------

const SUPABASE_URL =
    "https://kvpjgxunqypudcvyvcgs.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_BxOrxgPGVwpoKOTGIBfAAw_ktONsvHN";

const sb = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);


// -------------------------
// 2. GLOBAL VARIABLES
// -------------------------

let currentUser = null;
let tasks = [];
let editingTaskId = null;
let countdownInterval = null;


// -------------------------
// 3. GET HTML ELEMENTS
// -------------------------

const authPage = document.getElementById("authPage");
const appPage = document.getElementById("appPage");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");

const registerEmail = document.getElementById("registerEmail");
const registerPassword = document.getElementById("registerPassword");

const showRegister = document.getElementById("showRegister");
const showLogin = document.getElementById("showLogin");

const logoutBtn = document.getElementById("logoutBtn");

const userEmail = document.getElementById("userEmail");

const totalTasks = document.getElementById("totalTasks");
const pendingTasks = document.getElementById("pendingTasks");
const completedTasks = document.getElementById("completedTasks");
const dueSoonTasks = document.getElementById("dueSoonTasks");

const addTaskBtn = document.getElementById("addTaskBtn");

const taskModal = document.getElementById("taskModal");
const closeModalBtn = document.getElementById("closeModal");

const taskForm = document.getElementById("taskForm");

const modalTitle = document.getElementById("modalTitle");

const taskName = document.getElementById("taskName");
const taskDescription = document.getElementById("taskDescription");
const taskCategory = document.getElementById("taskCategory");
const taskDueDate = document.getElementById("taskDueDate");

const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const sortSelect = document.getElementById("sortSelect");

const tasksContainer = document.getElementById("tasksContainer");
const emptyState = document.getElementById("emptyState");


// ============================================================
// 4. PAGE INITIALIZATION
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {

    // Check current session
    const {
        data: { session },
        error
    } = await sb.auth.getSession();

    if (error) {
        console.error("Session error:", error);
        showAuthPage();
        return;
    }

    if (session) {
        currentUser = session.user;
        showAppPage();
        await loadTasks();
    } else {
        showAuthPage();
    }

    startCountdownTimer();
});


// ============================================================
// 5. AUTH STATE LISTENER
// ============================================================

sb.auth.onAuthStateChange(async (event, session) => {

    console.log("Auth event:", event);

    if (session) {

        currentUser = session.user;

        showAppPage();

        if (
            event === "SIGNED_IN" ||
            event === "INITIAL_SESSION"
        ) {
            await loadTasks();
        }

    } else {

        currentUser = null;
        tasks = [];

        showAuthPage();
    }
});


// ============================================================
// 6. SHOW LOGIN PAGE
// ============================================================

function showAuthPage() {

    if (authPage) {
        authPage.style.display = "flex";
    }

    if (appPage) {
        appPage.style.display = "none";
    }
}


// ============================================================
// 7. SHOW APP PAGE
// ============================================================

function showAppPage() {

    if (authPage) {
        authPage.style.display = "none";
    }

    if (appPage) {
        appPage.style.display = "block";
    }

    if (userEmail && currentUser) {
        userEmail.textContent =
            currentUser.email || "";
    }
}


// ============================================================
// 8. LOGIN / REGISTER TOGGLE
// ============================================================

if (showRegister) {

    showRegister.addEventListener("click", (e) => {

        e.preventDefault();

        if (loginForm) {
            loginForm.style.display = "none";
        }

        if (registerForm) {
            registerForm.style.display = "block";
        }
    });
}


if (showLogin) {

    showLogin.addEventListener("click", (e) => {

        e.preventDefault();

        if (registerForm) {
            registerForm.style.display = "none";
        }

        if (loginForm) {
            loginForm.style.display = "block";
        }
    });
}


// ============================================================
// 9. REGISTER
// ============================================================

if (registerForm) {

    registerForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const email =
            registerEmail.value.trim();

        const password =
            registerPassword.value;

        if (!email || !password) {

            alert("Please enter email and password.");

            return;
        }

        if (password.length < 6) {

            alert("Password must be at least 6 characters.");

            return;
        }

        try {

            const {
                data,
                error
            } = await sb.auth.signUp({
                email: email,
                password: password
            });

            if (error) {

                console.error("Register error:", error);

                alert(
                    "Registration failed:\n" +
                    error.message
                );

                return;
            }

            console.log("Register result:", data);

            alert(
                "Registration successful!\n\n" +
                "You can now login."
            );

            registerForm.reset();

            if (showLogin) {
                showLogin.click();
            }

        } catch (error) {

            console.error(error);

            alert(
                "Something went wrong:\n" +
                error.message
            );
        }
    });
}


// ============================================================
// 10. LOGIN
// ============================================================

if (loginForm) {

    loginForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const email =
            loginEmail.value.trim();

        const password =
            loginPassword.value;

        if (!email || !password) {

            alert("Please enter email and password.");

            return;
        }

        try {

            const {
                data,
                error
            } = await sb.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {

                console.error("Login error:", error);

                alert(
                    "Login failed:\n" +
                    error.message
                );

                return;
            }

            console.log("Login successful:", data);

            currentUser = data.user;

            showAppPage();

            await loadTasks();

            loginForm.reset();

        } catch (error) {

            console.error(error);

            alert(
                "Something went wrong:\n" +
                error.message
            );
        }
    });
}


// ============================================================
// 11. LOGOUT
// ============================================================

if (logoutBtn) {

    logoutBtn.addEventListener("click", async () => {

        const {
            error
        } = await sb.auth.signOut();

        if (error) {

            console.error("Logout error:", error);

            alert(
                "Logout failed:\n" +
                error.message
            );

            return;
        }

        currentUser = null;
        tasks = [];

        showAuthPage();
    });
}


// ============================================================
// 12. LOAD TASKS
// ============================================================

async function loadTasks() {

    if (!currentUser) {
        return;
    }

    try {

        const {
            data,
            error
        } = await sb
            .from("tasks")
            .select("*")
            .order("due_date", {
                ascending: true
            });

        if (error) {

            console.error(
                "Load tasks error:",
                error
            );

            alert(
                "Could not load tasks:\n" +
                error.message
            );

            return;
        }

        tasks = data || [];

        populateCategoryFilter();

        updateDashboard();

        renderTasks();

    } catch (error) {

        console.error(error);
    }
}


// ============================================================
// 13. CATEGORY FILTER
// ============================================================

function populateCategoryFilter() {

    if (!categoryFilter) {
        return;
    }

    const currentValue =
        categoryFilter.value;

    const categories = [
        ...new Set(
            tasks.map(task => task.category)
        )
    ].sort();

    categoryFilter.innerHTML =
        `<option value="all">All Categories</option>`;

    categories.forEach(category => {

        const option =
            document.createElement("option");

        option.value = category;

        option.textContent = category;

        categoryFilter.appendChild(option);
    });

    if (
        categories.includes(currentValue)
    ) {
        categoryFilter.value =
            currentValue;
    }
}


// ============================================================
// 14. DASHBOARD STATISTICS
// ============================================================

function updateDashboard() {

    const total =
        tasks.length;

    const completed =
        tasks.filter(
            task => task.is_completed
        ).length;

    const pending =
        total - completed;

    const now =
        new Date();

    const soon =
        new Date(
            now.getTime() +
            24 * 60 * 60 * 1000
        );

    const dueSoon =
        tasks.filter(task => {

            if (task.is_completed) {
                return false;
            }

            const due =
                new Date(task.due_date);

            return (
                due > now &&
                due <= soon
            );
        }).length;

    if (totalTasks) {
        totalTasks.textContent =
            total;
    }

    if (pendingTasks) {
        pendingTasks.textContent =
            pending;
    }

    if (completedTasks) {
        completedTasks.textContent =
            completed;
    }

    if (dueSoonTasks) {
        dueSoonTasks.textContent =
            dueSoon;
    }
}


// ============================================================
// 15. SEARCH / FILTER / SORT
// ============================================================

function getFilteredTasks() {

    let result = [...tasks];

    const search =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";

    const category =
        categoryFilter
            ? categoryFilter.value
            : "all";

    const sort =
        sortSelect
            ? sortSelect.value
            : "due_asc";


    // Search
    if (search) {

        result =
            result.filter(task => {

                const name =
                    task.task_name
                        ?.toLowerCase() || "";

                const description =
                    task.description
                        ?.toLowerCase() || "";

                const taskCategory =
                    task.category
                        ?.toLowerCase() || "";

                return (
                    name.includes(search) ||
                    description.includes(search) ||
                    taskCategory.includes(search)
                );
            });
    }


    // Category filter
    if (
        category &&
        category !== "all"
    ) {

        result =
            result.filter(
                task =>
                    task.category === category
            );
    }


    // Sorting
    result.sort((a, b) => {

        switch (sort) {

            case "due_asc":

                return (
                    new Date(a.due_date) -
                    new Date(b.due_date)
                );


            case "due_desc":

                return (
                    new Date(b.due_date) -
                    new Date(a.due_date)
                );


            case "category_asc":

                return (
                    (a.category || "")
                        .localeCompare(
                            b.category || ""
                        )
                );


            case "category_desc":

                return (
                    (b.category || "")
                        .localeCompare(
                            a.category || ""
                        )
                );


            case "name_asc":

                return (
                    (a.task_name || "")
                        .localeCompare(
                            b.task_name || ""
                        )
                );


            case "name_desc":

                return (
                    (b.task_name || "")
                        .localeCompare(
                            a.task_name || ""
                        )
                );


            case "recent":

                return (
                    new Date(b.created_at) -
                    new Date(a.created_at)
                );


            case "oldest":

                return (
                    new Date(a.created_at) -
                    new Date(b.created_at)
                );


            default:

                return (
                    new Date(a.due_date) -
                    new Date(b.due_date)
                );
        }
    });

    return result;
}


// ============================================================
// 16. RENDER TASKS
// ============================================================

function renderTasks() {

    if (!tasksContainer) {
        return;
    }

    const filteredTasks =
        getFilteredTasks();

    tasksContainer.innerHTML = "";


    if (filteredTasks.length === 0) {

        if (emptyState) {
            emptyState.style.display =
                "block";
        }

        return;
    }


    if (emptyState) {
        emptyState.style.display =
            "none";
    }


    filteredTasks.forEach(task => {

        const card =
            createTaskCard(task);

        tasksContainer.appendChild(card);
    });


    updateCountdowns();
}


// ============================================================
// 17. CREATE TASK CARD
// ============================================================

function createTaskCard(task) {

    const card =
        document.createElement("div");

    card.className =
        "task-card";

    if (task.is_completed) {

        card.classList.add(
            "completed"
        );
    }


    const dueDate =
        new Date(task.due_date);

    const now =
        new Date();

    const isOverdue =
        !task.is_completed &&
        dueDate < now;

    if (isOverdue) {

        card.classList.add(
            "overdue"
        );
    }


    const description =
        task.description
            ? escapeHTML(task.description)
            : "No description";


    const category =
        escapeHTML(
            task.category || "General"
        );


    const taskNameText =
        escapeHTML(
            task.task_name
        );


    card.innerHTML = `

        <div class="task-card-top">

            <div class="task-info">

                <h3>
                    ${taskNameText}
                </h3>

                <p class="task-description">
                    ${description}
                </p>

            </div>

            <span class="category-badge">
                ${category}
            </span>

        </div>


        <div class="task-meta">

            <div class="due-info">

                <span>
                    📅
                </span>

                <span>
                    ${formatDate(task.due_date)}
                </span>

            </div>

            <div
                class="countdown"
                data-due="${task.due_date}"
                data-completed="${task.is_completed}"
            >
                ${getCountdownText(task)}
            </div>

        </div>


        <div class="task-actions">

            <button
                class="btn-complete"
                onclick="toggleComplete(${task.id})"
            >
                ${
                    task.is_completed
                        ? "↩ Reopen"
                        : "✓ Complete"
                }
            </button>


            <button
                class="btn-edit"
                onclick="editTask(${task.id})"
            >
                ✏ Edit
            </button>


            <button
                class="btn-delete"
                onclick="deleteTask(${task.id})"
            >
                🗑 Delete
            </button>

        </div>
    `;

    return card;
}


// ============================================================
// 18. ADD TASK BUTTON
// ============================================================

if (addTaskBtn) {

    addTaskBtn.addEventListener("click", () => {

        editingTaskId = null;

        if (modalTitle) {
            modalTitle.textContent =
                "Add New Task";
        }

        if (taskForm) {
            taskForm.reset();
        }

        openModal();
    });
}


// ============================================================
// 19. OPEN MODAL
// ============================================================

function openModal() {

    if (taskModal) {

        taskModal.style.display =
            "flex";
    }
}


// ============================================================
// 20. CLOSE MODAL
// ============================================================

function closeModal() {

    if (taskModal) {

        taskModal.style.display =
            "none";
    }

    editingTaskId = null;
}


if (closeModalBtn) {

    closeModalBtn.addEventListener(
        "click",
        closeModal
    );
}


// Close modal when clicking outside
if (taskModal) {

    taskModal.addEventListener(
        "click",
        (e) => {

            if (e.target === taskModal) {
                closeModal();
            }
        }
    );
}


// ============================================================
// 21. ADD / UPDATE TASK
// ============================================================

if (taskForm) {

    taskForm.addEventListener(
        "submit",
        async (e) => {

            e.preventDefault();

            if (!currentUser) {

                alert(
                    "Please login first."
                );

                return;
            }


            const name =
                taskName.value.trim();

            const description =
                taskDescription.value.trim();

            const category =
                taskCategory.value;

            const dueDate =
                taskDueDate.value;


            if (!name) {

                alert(
                    "Please enter task name."
                );

                return;
            }


            if (!dueDate) {

                alert(
                    "Please select due date and time."
                );

                return;
            }


            try {

                // -------------------------
                // UPDATE EXISTING TASK
                // -------------------------

                if (editingTaskId) {

                    const {
                        error
                    } = await sb
                        .from("tasks")
                        .update({

                            task_name: name,

                            description:
                                description || null,

                            category:
                                category,

                            due_date:
                                new Date(
                                    dueDate
                                ).toISOString(),

                            updated_at:
                                new Date().toISOString()

                        })
                        .eq(
                            "id",
                            editingTaskId
                        )
                        .eq(
                            "user_id",
                            currentUser.id
                        );


                    if (error) {

                        console.error(
                            "Update error:",
                            error
                        );

                        alert(
                            "Could not update task:\n" +
                            error.message
                        );

                        return;
                    }


                    alert(
                        "Task updated successfully!"
                    );

                }

                // -------------------------
                // INSERT NEW TASK
                // -------------------------

                else {

                    const {
                        error
                    } = await sb
                        .from("tasks")
                        .insert({

                            user_id:
                                currentUser.id,

                            task_name:
                                name,

                            description:
                                description || null,

                            category:
                                category,

                            due_date:
                                new Date(
                                    dueDate
                                ).toISOString(),

                            is_completed:
                                false
                        });


                    if (error) {

                        console.error(
                            "Insert error:",
                            error
                        );

                        alert(
                            "Could not add task:\n" +
                            error.message
                        );

                        return;
                    }


                    alert(
                        "Task added successfully!"
                    );
                }


                closeModal();

                taskForm.reset();

                await loadTasks();

            } catch (error) {

                console.error(error);

                alert(
                    "Something went wrong:\n" +
                    error.message
                );
            }
        }
    );
}


// ============================================================
// 22. EDIT TASK
// ============================================================

async function editTask(id) {

    const task =
        tasks.find(
            t => Number(t.id) === Number(id)
        );

    if (!task) {

        alert("Task not found.");

        return;
    }


    editingTaskId =
        task.id;


    if (modalTitle) {

        modalTitle.textContent =
            "Edit Task";
    }


    if (taskName) {

        taskName.value =
            task.task_name || "";
    }


    if (taskDescription) {

        taskDescription.value =
            task.description || "";
    }


    if (taskCategory) {

        taskCategory.value =
            task.category || "General";
    }


    if (taskDueDate) {

        taskDueDate.value =
            toDatetimeLocal(
                task.due_date
            );
    }


    openModal();
}


// ============================================================
// 23. COMPLETE / REOPEN TASK
// ============================================================

async function toggleComplete(id) {

    const task =
        tasks.find(
            t => Number(t.id) === Number(id)
        );

    if (!task) {
        return;
    }


    try {

        const {
            error
        } = await sb
            .from("tasks")
            .update({

                is_completed:
                    !task.is_completed,

                updated_at:
                    new Date().toISOString()

            })
            .eq(
                "id",
                id
            )
            .eq(
                "user_id",
                currentUser.id
            );


        if (error) {

            console.error(
                "Complete error:",
                error
            );

            alert(
                "Could not update task:\n" +
                error.message
            );

            return;
        }


        await loadTasks();

    } catch (error) {

        console.error(error);
    }
}


// ============================================================
// 24. DELETE TASK
// ============================================================

async function deleteTask(id) {

    const confirmDelete =
        confirm(
            "Are you sure you want to delete this task?"
        );

    if (!confirmDelete) {
        return;
    }


    try {

        const {
            error
        } = await sb
            .from("tasks")
            .delete()
            .eq(
                "id",
                id
            )
            .eq(
                "user_id",
                currentUser.id
            );


        if (error) {

            console.error(
                "Delete error:",
                error
            );

            alert(
                "Could not delete task:\n" +
                error.message
            );

            return;
        }


        await loadTasks();

    } catch (error) {

        console.error(error);
    }
}


// ============================================================
// 25. SEARCH
// ============================================================

if (searchInput) {

    searchInput.addEventListener(
        "input",
        renderTasks
    );
}


// ============================================================
// 26. CATEGORY FILTER
// ============================================================

if (categoryFilter) {

    categoryFilter.addEventListener(
        "change",
        renderTasks
    );
}


// ============================================================
// 27. SORT
// ============================================================

if (sortSelect) {

    sortSelect.addEventListener(
        "change",
        renderTasks
    );
}


// ============================================================
// 28. COUNTDOWN TIMER
// ============================================================

function startCountdownTimer() {

    if (countdownInterval) {

        clearInterval(
            countdownInterval
        );
    }


    countdownInterval =
        setInterval(
            updateCountdowns,
            1000
        );
}


function updateCountdowns() {

    const countdownElements =
        document.querySelectorAll(
            ".countdown"
        );


    countdownElements.forEach(
        element => {

            const dueDate =
                element.dataset.due;

            const completed =
                element.dataset.completed === "true";


            if (completed) {

                element.textContent =
                    "Completed";

                return;
            }


            element.textContent =
                getCountdownText({
                    due_date:
                        dueDate,

                    is_completed:
                        completed
                });
        }
    );
}


// ============================================================
// 29. COUNTDOWN TEXT
// ============================================================

function getCountdownText(task) {

    if (task.is_completed) {

        return "Completed";
    }


    const now =
        new Date();

    const due =
        new Date(
            task.due_date
        );

    const difference =
        due.getTime() -
        now.getTime();


    if (difference <= 0) {

        return "⚠ Overdue";
    }


    const totalSeconds =
        Math.floor(
            difference / 1000
        );


    const days =
        Math.floor(
            totalSeconds /
            (24 * 60 * 60)
        );


    const hours =
        Math.floor(
            (totalSeconds %
                (24 * 60 * 60)) /
            (60 * 60)
        );


    const minutes =
        Math.floor(
            (totalSeconds %
                (60 * 60)) /
            60
        );


    const seconds =
        totalSeconds %
        60;


    if (days > 0) {

        return (
            `${days}d ` +
            `${pad(hours)}h ` +
            `${pad(minutes)}m ` +
            `${pad(seconds)}s`
        );
    }


    return (
        `${pad(hours)}h ` +
        `${pad(minutes)}m ` +
        `${pad(seconds)}s`
    );
}


// ============================================================
// 30. FORMAT DATE
// ============================================================

function formatDate(dateString) {

    const date =
        new Date(dateString);

    return date.toLocaleString(
        undefined,
        {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit"
        }
    );
}


// ============================================================
// 31. DATETIME LOCAL FORMAT
// ============================================================

function toDatetimeLocal(dateString) {

    const date =
        new Date(dateString);

    const year =
        date.getFullYear();

    const month =
        pad(date.getMonth() + 1);

    const day =
        pad(date.getDate());

    const hours =
        pad(date.getHours());

    const minutes =
        pad(date.getMinutes());


    return (
        `${year}-${month}-${day}` +
        `T${hours}:${minutes}`
    );
}


// ============================================================
// 32. PAD NUMBER
// ============================================================

function pad(number) {

    return String(number)
        .padStart(2, "0");
}


// ============================================================
// 33. HTML ESCAPE
// ============================================================

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ============================================================
// 34. MAKE FUNCTIONS AVAILABLE TO HTML
// ============================================================

window.editTask =
    editTask;

window.toggleComplete =
    toggleComplete;

window.deleteTask =
    deleteTask;