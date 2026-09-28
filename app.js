/* =========================================================
   TASKFLOW
   Supabase + JavaScript
========================================================= */


/* =========================================================
   SUPABASE CONFIGURATION
========================================================= */

const SUPABASE_URL =
    "https://kvpjgxunqypudcvyvcgs.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_BxOrxgPGVwpoKOTGIBfAAw_ktONsvHN";


/* Create Supabase client ONLY ONCE */
const sb = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);


/* =========================================================
   GLOBAL VARIABLES
========================================================= */

let currentUser = null;
let tasks = [];
let editingTaskId = null;
let countdownTimer = null;


/* =========================================================
   DOM ELEMENTS
========================================================= */

const authPage = document.getElementById("authPage");
const appPage = document.getElementById("appPage");

const loginBox = document.getElementById("loginBox");
const registerBox = document.getElementById("registerBox");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const showRegisterBtn =
    document.getElementById("showRegisterBtn");

const showLoginBtn =
    document.getElementById("showLoginBtn");

const loginEmail =
    document.getElementById("loginEmail");

const loginPassword =
    document.getElementById("loginPassword");

const registerEmail =
    document.getElementById("registerEmail");

const registerPassword =
    document.getElementById("registerPassword");


const userEmail =
    document.getElementById("userEmail");

const dropdownEmail =
    document.getElementById("dropdownEmail");

const accountBtn =
    document.getElementById("accountBtn");

const accountDropdown =
    document.getElementById("accountDropdown");

const logoutBtn =
    document.getElementById("logoutBtn");


const addTaskBtn =
    document.getElementById("addTaskBtn");

const taskModal =
    document.getElementById("taskModal");

const closeModalBtn =
    document.getElementById("closeModalBtn");

const cancelTaskBtn =
    document.getElementById("cancelTaskBtn");

const taskForm =
    document.getElementById("taskForm");

const modalTitle =
    document.getElementById("modalTitle");

const taskName =
    document.getElementById("taskName");

const taskDescription =
    document.getElementById("taskDescription");

const taskCategory =
    document.getElementById("taskCategory");

const taskDueDate =
    document.getElementById("taskDueDate");


const searchInput =
    document.getElementById("searchInput");

const categoryFilter =
    document.getElementById("categoryFilter");

const sortSelect =
    document.getElementById("sortSelect");


const totalCount =
    document.getElementById("totalCount");

const pendingCount =
    document.getElementById("pendingCount");

const dueCount =
    document.getElementById("dueCount");

const completedCount =
    document.getElementById("completedCount");


const dueTasksContainer =
    document.getElementById("dueTasksContainer");

const upcomingTasksContainer =
    document.getElementById("upcomingTasksContainer");

const completedTasksContainer =
    document.getElementById("completedTasksContainer");


const dueSection =
    document.getElementById("dueSection");

const upcomingSection =
    document.getElementById("upcomingSection");

const completedSection =
    document.getElementById("completedSection");


const dueSectionCount =
    document.getElementById("dueSectionCount");

const upcomingSectionCount =
    document.getElementById("upcomingSectionCount");

const completedSectionCount =
    document.getElementById("completedSectionCount");


const toastContainer =
    document.getElementById("toastContainer");


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    setupEventListeners();

    /*
       Default sorting:
       Earliest due date/time first
    */
    if (sortSelect) {
        sortSelect.value = "due_asc";
    }

    await checkUser();

    startCountdownTimer();

});


/* =========================================================
   EVENT LISTENERS
========================================================= */

function setupEventListeners() {

    /* Auth */

    showRegisterBtn.addEventListener(
        "click",
        showRegister
    );

    showLoginBtn.addEventListener(
        "click",
        showLogin
    );

    loginForm.addEventListener(
        "submit",
        login
    );

    registerForm.addEventListener(
        "submit",
        register
    );


    /* Account */

    accountBtn.addEventListener(
        "click",
        toggleAccountDropdown
    );

    logoutBtn.addEventListener(
        "click",
        logout
    );


    /* Task */

    addTaskBtn.addEventListener(
        "click",
        openAddTaskModal
    );

    closeModalBtn.addEventListener(
        "click",
        closeTaskModal
    );

    cancelTaskBtn.addEventListener(
        "click",
        closeTaskModal
    );

    taskForm.addEventListener(
        "submit",
        saveTask
    );


    /* Search / Filter */

    searchInput.addEventListener(
        "input",
        renderAllTasks
    );

    categoryFilter.addEventListener(
        "change",
        renderAllTasks
    );

    sortSelect.addEventListener(
        "change",
        renderAllTasks
    );


    /* Close modal when clicking outside */

    taskModal.addEventListener(
        "click",
        (event) => {

            if (event.target === taskModal) {
                closeTaskModal();
            }

        }
    );


    /* Close account dropdown */

    document.addEventListener(
        "click",
        (event) => {

            if (
                !accountBtn.contains(event.target) &&
                !accountDropdown.contains(event.target)
            ) {
                accountDropdown.classList.add("hidden");
            }

        }
    );


    /* Auth state listener */

    sb.auth.onAuthStateChange(
        async (event, session) => {

            if (session && session.user) {

                currentUser = session.user;

                showApp();

                await loadTasks();

            } else {

                currentUser = null;

                showAuth();

            }

        }
    );
}


/* =========================================================
   AUTH
========================================================= */

async function checkUser() {

    try {

        const {
            data,
            error
        } = await sb.auth.getSession();

        if (error) {
            console.error(error);
            showToast(
                "Supabase connection error: " + error.message,
                "error"
            );
            return;
        }

        if (data.session) {

            currentUser = data.session.user;

            showApp();

            await loadTasks();

        } else {

            showAuth();

        }

    } catch (error) {

        console.error(error);

        showToast(
            "Unable to connect to Supabase.",
            "error"
        );

    }
}


/* =========================================================
   SHOW LOGIN
========================================================= */

function showLogin() {

    loginBox.classList.remove("hidden");
    registerBox.classList.add("hidden");

}


/* =========================================================
   SHOW REGISTER
========================================================= */

function showRegister() {

    loginBox.classList.add("hidden");
    registerBox.classList.remove("hidden");

}


/* =========================================================
   LOGIN
========================================================= */

async function login(event) {

    event.preventDefault();

    const email =
        loginEmail.value.trim();

    const password =
        loginPassword.value;


    if (!email || !password) {

        showToast(
            "Please enter email and password.",
            "error"
        );

        return;
    }


    const button =
        loginForm.querySelector("button[type='submit']");

    button.disabled = true;
    button.textContent = "Logging in...";


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

            showToast(
                error.message,
                "error"
            );

            return;
        }


        if (data.user) {

            currentUser = data.user;

            showApp();

            await loadTasks();

            loginForm.reset();

            showToast(
                "Login successful!",
                "success"
            );

        }

    } catch (error) {

        console.error(error);

        showToast(
            "Something went wrong during login.",
            "error"
        );

    } finally {

        button.disabled = false;
        button.textContent = "Login";

    }
}


/* =========================================================
   REGISTER
========================================================= */

async function register(event) {

    event.preventDefault();

    const email =
        registerEmail.value.trim();

    const password =
        registerPassword.value;


    if (!email || !password) {

        showToast(
            "Please enter email and password.",
            "error"
        );

        return;
    }


    if (password.length < 6) {

        showToast(
            "Password must be at least 6 characters.",
            "error"
        );

        return;
    }


    const button =
        registerForm.querySelector(
            "button[type='submit']"
        );

    button.disabled = true;
    button.textContent = "Creating...";


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

            showToast(
                error.message,
                "error"
            );

            return;
        }


        if (data.session) {

            currentUser = data.user;

            showApp();

            await loadTasks();

            registerForm.reset();

            showToast(
                "Account created successfully!",
                "success"
            );

        } else {

            showToast(
                "Account created. Please check your email for confirmation.",
                "success"
            );

            showLogin();

        }

    } catch (error) {

        console.error(error);

        showToast(
            "Something went wrong during registration.",
            "error"
        );

    } finally {

        button.disabled = false;
        button.textContent = "Create Account";

    }
}


/* =========================================================
   LOGOUT
========================================================= */

async function logout() {

    try {

        const {
            error
        } = await sb.auth.signOut();

        if (error) {

            showToast(
                error.message,
                "error"
            );

            return;
        }

        currentUser = null;
        tasks = [];

        showAuth();

        showToast(
            "Logged out successfully.",
            "success"
        );

    } catch (error) {

        console.error(error);

    }
}


/* =========================================================
   SHOW AUTH PAGE
========================================================= */

function showAuth() {

    authPage.classList.remove("hidden");

    appPage.classList.add("hidden");

}


/* =========================================================
   SHOW APPLICATION
========================================================= */

function showApp() {

    authPage.classList.add("hidden");

    appPage.classList.remove("hidden");


    if (currentUser) {

        const email =
            currentUser.email || "User";

        userEmail.textContent = email;

        dropdownEmail.textContent = email;

    }

}


/* =========================================================
   ACCOUNT DROPDOWN
========================================================= */

function toggleAccountDropdown(event) {

    event.stopPropagation();

    accountDropdown.classList.toggle("hidden");

}


/* =========================================================
   LOAD TASKS
========================================================= */

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
            .eq("user_id", currentUser.id)
            .order("created_at", {
                ascending: false
            });


        if (error) {

            console.error(
                "Load tasks error:",
                error
            );

            showToast(
                "Could not load tasks: " +
                error.message,
                "error"
            );

            return;
        }


        tasks = data || [];

        renderAllTasks();

    } catch (error) {

        console.error(error);

        showToast(
            "Could not load tasks.",
            "error"
        );

    }

}


/* =========================================================
   OPEN ADD TASK MODAL
========================================================= */

function openAddTaskModal() {

    editingTaskId = null;

    modalTitle.textContent =
        "Add New Task";

    taskForm.reset();

    taskCategory.value =
        "General";

    taskModal.classList.remove(
        "hidden"
    );

    setTimeout(() => {
        taskName.focus();
    }, 100);

}


/* =========================================================
   OPEN EDIT MODAL
========================================================= */

function openEditTask(taskId) {

    const task =
        tasks.find(
            item => item.id === taskId
        );

    if (!task) {
        return;
    }


    editingTaskId = taskId;

    modalTitle.textContent =
        "Edit Task";


    taskName.value =
        task.task_name || "";


    taskDescription.value =
        task.description || "";


    taskCategory.value =
        task.category || "General";


    taskDueDate.value =
        formatForDateTimeLocal(
            task.due_date
        );


    taskModal.classList.remove(
        "hidden"
    );

}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeTaskModal() {

    taskModal.classList.add(
        "hidden"
    );

    editingTaskId = null;

    taskForm.reset();

}


/* =========================================================
   SAVE TASK
========================================================= */

async function saveTask(event) {

    event.preventDefault();


    if (!currentUser) {

        showToast(
            "Please login first.",
            "error"
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


    if (!name || !dueDate) {

        showToast(
            "Task name and due date are required.",
            "error"
        );

        return;
    }


    const saveButton =
        taskForm.querySelector(
            ".save-btn"
        );

    saveButton.disabled = true;

    saveButton.textContent =
        editingTaskId
            ? "Updating..."
            : "Saving...";


    try {

        let error;


        if (editingTaskId) {

            const result =
                await sb
                    .from("tasks")
                    .update({

                        task_name: name,

                        description:
                            description || null,

                        category: category,

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


            error = result.error;


            if (!error) {

                showToast(
                    "Task updated successfully.",
                    "success"
                );

            }

        } else {

            const result =
                await sb
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


            error = result.error;


            if (!error) {

                showToast(
                    "Task added successfully.",
                    "success"
                );

            }

        }


        if (error) {

            console.error(
                "Save task error:",
                error
            );

            showToast(
                error.message,
                "error"
            );

            return;
        }


        closeTaskModal();

        await loadTasks();


    } catch (error) {

        console.error(error);

        showToast(
            "Could not save task.",
            "error"
        );

    } finally {

        saveButton.disabled = false;

        saveButton.textContent =
            "Save Task";

    }

}


/* =========================================================
   DELETE TASK
========================================================= */

async function deleteTask(taskId) {

    const task =
        tasks.find(
            item => item.id === taskId
        );

    if (!task) {
        return;
    }


    const confirmed =
        confirm(
            `Delete "${task.task_name}"?`
        );


    if (!confirmed) {
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
                taskId
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

            showToast(
                error.message,
                "error"
            );

            return;
        }


        showToast(
            "Task deleted.",
            "success"
        );


        await loadTasks();

    } catch (error) {

        console.error(error);

        showToast(
            "Could not delete task.",
            "error"
        );

    }

}


/* =========================================================
   COMPLETE / REOPEN TASK
========================================================= */

async function toggleTaskComplete(
    taskId,
    completed
) {

    try {

        const {
            error
        } = await sb
            .from("tasks")
            .update({

                is_completed:
                    completed,

                updated_at:
                    new Date().toISOString()

            })
            .eq(
                "id",
                taskId
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

            showToast(
                error.message,
                "error"
            );

            return;
        }


        showToast(
            completed
                ? "Task completed!"
                : "Task reopened.",
            "success"
        );


        await loadTasks();

    } catch (error) {

        console.error(error);

        showToast(
            "Could not update task.",
            "error"
        );

    }

}


/* =========================================================
   FILTER + SORT TASKS
========================================================= */

function getFilteredTasks() {

    let filtered =
        [...tasks];


    const search =
        searchInput.value
            .trim()
            .toLowerCase();


    const category =
        categoryFilter.value;


    /* Search */

    if (search) {

        filtered =
            filtered.filter(task => {

                const name =
                    (
                        task.task_name || ""
                    ).toLowerCase();

                const description =
                    (
                        task.description || ""
                    ).toLowerCase();

                const cat =
                    (
                        task.category || ""
                    ).toLowerCase();


                return (
                    name.includes(search) ||
                    description.includes(search) ||
                    cat.includes(search)
                );

            });

    }


    /* Category */

    if (category !== "all") {

        filtered =
            filtered.filter(
                task =>
                    task.category === category
            );

    }


    /* =====================================================
       SORTING

       DEFAULT:
       Earliest due date/time first
    ===================================================== */

    const sort =
        sortSelect.value || "due_asc";


    filtered.sort((a, b) => {

        switch (sort) {

            case "oldest":

                return (
                    new Date(a.created_at) -
                    new Date(b.created_at)
                );


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


            case "newest":

                return (
                    new Date(b.created_at) -
                    new Date(a.created_at)
                );


            default:

                /*
                   If no valid sorting option
                   is selected, use earliest
                   due date first.
                */

                return (
                    new Date(a.due_date) -
                    new Date(b.due_date)
                );

        }

    });


    return filtered;

}


/* =========================================================
   RENDER ALL TASKS
========================================================= */

function renderAllTasks() {

    const filtered =
        getFilteredTasks();


    const now =
        new Date();


    const dueTasks =
        filtered.filter(task => {

            if (task.is_completed) {
                return false;
            }

            return (
                new Date(task.due_date) <= now
            );

        });


    const upcomingTasks =
        filtered.filter(task => {

            if (task.is_completed) {
                return false;
            }

            return (
                new Date(task.due_date) > now
            );

        });


    const completedTasks =
        filtered.filter(
            task => task.is_completed
        );


    /* Dashboard */

    totalCount.textContent =
        tasks.length;


    const pending =
        tasks.filter(
            task => !task.is_completed
        ).length;


    const due =
        tasks.filter(task => {

            if (task.is_completed) {
                return false;
            }

            return (
                new Date(task.due_date) <= now
            );

        }).length;


    const completed =
        tasks.filter(
            task => task.is_completed
        ).length;


    pendingCount.textContent =
        pending;

    dueCount.textContent =
        due;

    completedCount.textContent =
        completed;


    /* Section counts */

    dueSectionCount.textContent =
        dueTasks.length;

    upcomingSectionCount.textContent =
        upcomingTasks.length;

    completedSectionCount.textContent =
        completedTasks.length;


    /* Render */

    renderTaskList(
        dueTasksContainer,
        dueTasks,
        "due"
    );


    renderTaskList(
        upcomingTasksContainer,
        upcomingTasks,
        "upcoming"
    );


    renderTaskList(
        completedTasksContainer,
        completedTasks,
        "completed"
    );


    /* Show / hide sections */

    dueSection.classList.toggle(
        "hidden",
        dueTasks.length === 0
    );


    upcomingSection.classList.toggle(
        "hidden",
        upcomingTasks.length === 0
    );


    completedSection.classList.toggle(
        "hidden",
        completedTasks.length === 0
    );


    /* No search result */

    if (
        filtered.length === 0 &&
        tasks.length > 0
    ) {

        dueSection.classList.remove(
            "hidden"
        );

        dueSectionCount.textContent =
            "0";

        dueTasksContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⌕</div>
                <h3>No tasks found</h3>
                <p>Try changing your search or filter.</p>
            </div>
        `;

    }


    /* No tasks at all */

    if (tasks.length === 0) {

        dueSection.classList.remove(
            "hidden"
        );

        dueTasksContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">✓</div>
                <h3>No tasks yet</h3>
                <p>Create your first task to get started.</p>

                <button
                    class="empty-add-btn"
                    onclick="openAddTaskModal()"
                >
                    + Add Your First Task
                </button>
            </div>
        `;

    }

}


/* =========================================================
   RENDER TASK LIST
========================================================= */

function renderTaskList(
    container,
    taskList,
    type
) {

    if (!taskList.length) {

        container.innerHTML = "";

        return;
    }


    container.innerHTML =
        taskList
            .map(task =>
                createTaskHTML(
                    task,
                    type
                )
            )
            .join("");

}


/* =========================================================
   CREATE TASK HTML
========================================================= */

function createTaskHTML(
    task,
    type
) {

    const dueDate =
        new Date(task.due_date);


    const isOverdue =
        !task.is_completed &&
        dueDate < new Date();


    const statusClass =
        task.is_completed
            ? "completed"
            : isOverdue
                ? "overdue"
                : "upcoming";


    const category =
        task.category || "General";


    const description =
        task.description
            ? escapeHTML(task.description)
            : "No description";


    const dueText =
        formatDate(task.due_date);


    let countdownText =
        "";


    if (task.is_completed) {

        countdownText =
            "Completed";

    } else if (isOverdue) {

        countdownText =
            getCountdownText(
                task.due_date
            );

    } else {

        countdownText =
            getCountdownText(
                task.due_date
            );

    }


    return `

        <article
            class="task-card ${statusClass}"
            data-task-id="${task.id}"
        >

            <div class="task-top">

                <div class="task-title-area">

                    <button
                        class="complete-btn"
                        onclick="toggleTaskComplete(
                            ${task.id},
                            ${!task.is_completed}
                        )"
                        title="${
                            task.is_completed
                                ? "Reopen task"
                                : "Complete task"
                        }"
                    >
                        ${
                            task.is_completed
                                ? "✓"
                                : ""
                        }
                    </button>


                    <div class="task-main">

                        <h3
                            class="${
                                task.is_completed
                                    ? "task-done"
                                    : ""
                            }"
                        >
                            ${escapeHTML(
                                task.task_name
                            )}
                        </h3>


                        <span
                            class="category-badge category-${category
                                .toLowerCase()
                                .replace(
                                    /[^a-z0-9]/g,
                                    ""
                                )}"
                        >
                            ${escapeHTML(category)}
                        </span>

                    </div>

                </div>


                <div class="task-actions">

                    <button
                        class="icon-btn edit"
                        onclick="openEditTask(${task.id})"
                        title="Edit"
                    >
                        ✎
                    </button>


                    <button
                        class="icon-btn delete"
                        onclick="deleteTask(${task.id})"
                        title="Delete"
                    >
                        🗑
                    </button>

                </div>

            </div>


            <p class="task-description">
                ${description}
            </p>


            <div class="task-bottom">

                <div class="due-info">

                    <span class="due-label">
                        ${
                            isOverdue
                                ? "⚠ Overdue"
                                : task.is_completed
                                    ? "✓ Completed"
                                    : "Due"
                        }
                    </span>

                    <span class="due-date">
                        ${dueText}
                    </span>

                </div>


                <div
                    class="countdown ${
                        isOverdue
                            ? "countdown-overdue"
                            : task.is_completed
                                ? "countdown-completed"
                                : ""
                    }"
                    data-due="${task.due_date}"
                    data-completed="${task.is_completed}"
                >
                    ${countdownText}
                </div>

            </div>

        </article>

    `;

}


/* =========================================================
   LIVE COUNTDOWN
========================================================= */

function startCountdownTimer() {

    if (countdownTimer) {

        clearInterval(
            countdownTimer
        );

    }


    countdownTimer =
        setInterval(
            updateCountdowns,
            1000
        );


    updateCountdowns();

}


/* =========================================================
   UPDATE COUNTDOWNS
========================================================= */

function updateCountdowns() {

    const countdownElements =
        document.querySelectorAll(
            ".countdown"
        );


    countdownElements.forEach(
        element => {

            const due =
                element.dataset.due;

            const completed =
                element.dataset.completed === "true";


            if (completed) {

                element.textContent =
                    "Completed";

                element.classList.add(
                    "countdown-completed"
                );

                return;
            }


            const now =
                new Date();

            const dueDate =
                new Date(due);


            const difference =
                dueDate - now;


            if (difference <= 0) {

                element.textContent =
                    "Overdue by " +
                    formatDuration(
                        Math.abs(difference)
                    );

                element.classList.add(
                    "countdown-overdue"
                );

            } else {

                element.textContent =
                    formatDuration(
                        difference
                    );

                element.classList.remove(
                    "countdown-overdue"
                );

            }

        }
    );

}


/* =========================================================
   COUNTDOWN TEXT
========================================================= */

function getCountdownText(
    dueDate
) {

    const now =
        new Date();

    const due =
        new Date(dueDate);

    const difference =
        due - now;


    if (difference <= 0) {

        return (
            "Overdue by " +
            formatDuration(
                Math.abs(difference)
            )
        );

    }


    return (
        formatDuration(
            difference
        )
    );

}


/* =========================================================
   FORMAT DURATION
========================================================= */

function formatDuration(
    milliseconds
) {

    let totalSeconds =
        Math.floor(
            milliseconds / 1000
        );


    const days =
        Math.floor(
            totalSeconds / 86400
        );


    totalSeconds %= 86400;


    const hours =
        Math.floor(
            totalSeconds / 3600
        );


    totalSeconds %= 3600;


    const minutes =
        Math.floor(
            totalSeconds / 60
        );


    const seconds =
        totalSeconds % 60;


    return (
        `${days}d ` +
        `${String(hours).padStart(2, "0")}:` +
        `${String(minutes).padStart(2, "0")}:` +
        `${String(seconds).padStart(2, "0")}`
    );

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(
    dateString
) {

    const date =
        new Date(dateString);


    return date.toLocaleString(
        "en-BD",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


/* =========================================================
   DATETIME-LOCAL FORMAT
========================================================= */

function formatForDateTimeLocal(
    dateString
) {

    const date =
        new Date(dateString);


    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    const hours =
        String(
            date.getHours()
        ).padStart(2, "0");


    const minutes =
        String(
            date.getMinutes()
        ).padStart(2, "0");


    return (
        `${year}-${month}-${day}` +
        `T${hours}:${minutes}`
    );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(
    value
) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
    message,
    type = "success"
) {

    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        `toast ${type}`;


    toast.innerHTML = `

        <div class="toast-icon">
            ${
                type === "success"
                    ? "✓"
                    : "!"
            }
        </div>

        <div class="toast-message">
            ${escapeHTML(message)}
        </div>

    `;


    toastContainer.appendChild(
        toast
    );


    setTimeout(() => {

        toast.classList.add(
            "hide"
        );


        setTimeout(() => {

            toast.remove();

        }, 300);

    }, 3500);

}


/* =========================================================
   MAKE FUNCTIONS AVAILABLE FOR BUTTONS
========================================================= */

window.openAddTaskModal =
    openAddTaskModal;

window.openEditTask =
    openEditTask;

window.deleteTask =
    deleteTask;

window.toggleTaskComplete =
    toggleTaskComplete;