

# 🧠 **FocusFlowV2**

### *Smart Productivity App — Manage, Focus, Achieve*

---

## 📘 **Overview**

**FocusFlowV2** is a comprehensive, offline-capable Android productivity application designed to help users effectively manage tasks in a responsive, secure, and user-friendly environment. Built with **Kotlin**, **Jetpack Compose**, **Firebase Authentication**, **RoomDB**, and a custom **Node.js + MongoDB REST API**, it provides seamless task management both online and offline.

The application incorporates modern mobile development techniques such as **MVVM architecture**, **real-time notifications**, **multi-language support**, and **biometric authentication**, ensuring a professional, scalable, and future-ready mobile solution.

FocusFlowV2 was developed as part of the **PROG7314 Mobile Development POE**, showcasing advanced skills in mobile UX design, cloud integration, offline-first systems, API communication, and secure authentication mechanisms.

---

# 🎯 **PROG7314 POE Context**

The POE requires students to build a feature-rich Android application that integrates:

* Cloud-based APIs
* Offline capability
* Real-time notifications
* Biometric authentication
* Multi-language support
* Settings & user preference management
* Secure login through SSO
* Modern design practices

FocusFlowV2 exceeds these expectations by implementing a complete task management ecosystem, combining POE requirements with additional real-world productivity features.

---

# 🟦 **A. Official PROG7314 POE Features (Required)**

The following features are implemented exactly according to the official PROG7314 POE brief:

| # | **POE Feature**              | **Description**                                                                                                                                                 |
| - | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | **Single Sign-On (SSO)**     | Users register and log in through Google Sign-In using Firebase Authentication (OAuth 2.0). Provides secure identity management and token-based authentication. |
| 2 | **Biometric Authentication** | Fingerprint authentication implemented to protect sensitive operations (e.g., editing, deleting, completing tasks),also to login into our application in their own account with finger print                                             |
| 3 | **Settings Management**      | Users can modify app settings including theme , export custom feasture , Biometric Authetication,Finger Print register, language, and account management.                                                                        |
| 4 | **REST API Integration**     | App connects to a custom Node.js + Express REST API, storing all user tasks in MongoDB Atlas.                                                                   |
| 5 | **Offline Mode with Sync**   | Users can add, edit, delete, and complete tasks offline. Automatic synchronisation occurs when internet is detected.                                            |
| 6 | **Real-Time Notifications**  | Push-style notifications implemented using AlarmManager. Includes instant task creation alerts plus scheduled reminders.                                        |
| 7 | **Multi-Language Support**   | Full support for English 🇬🇧, Afrikaans 🇿🇦, and isiZulu 🇿🇦. Automatically adapts based on device language.                                                 |

---

#  **B. Custom Student-Implemented Features  from Part 1 to Summative(Task Management System)**

All task-related features were designed and implemented by the development team and **are not required by the POE**.
Features 1 to 14 available below 

| #  | **Custom Feature**        | **Description**                                                            |
| -- | ------------------------- | -------------------------------------------------------------------------- |
| 1  | **Add Task**              | Create tasks with title, location, date, time, and priority.               |
| 2  | **Edit Task**             | Modify task details.                                                       |
| 3  | **Delete Task**           | Remove tasks permanently (requires biometric verification).                |
| 4  | **Mark as Complete**      | Moves tasks instantly to Completed section.                                |
| 5  | **Priority Levels**       | Low, Medium, High, Critical priority options.                              |
| 6  | **Task Filtering**        | Filter tasks by priority or completion status.                             |
| 7  | **Task Sorting**          | Sort tasks by Newest, Oldest, or Priority.                                 |
| 8  | **Task Counter**          | Displays the number of active tasks.                                       |
| 9  | **Share Task Button**     | Share task details via WhatsApp, SMS.                                      |
| 10 | **Export CV**             | Send tasks through an advanced exportation feature through email           |
| 11 | **Advanced Reminders**    | Scheduled notifications before task deadlines.                             |
| 12 | **Enhanced UI/UX**        | Material 3 design, gradient theme, animations, accessibility improvements. |
| 13 | **Deep Account Deletion** | Deletes user from Firebase and MongoDB cloud storage.                      |
| 15 | **Gamification**          | Progress bar to let the user know their progress                           |
| 16 | **Fingerprint Register**  | Allows the user to record a new finger print for their Biometric authetication|

---

# 🎨 **Design & User Experience**

FocusFlowV2 prioritises clean, modern, and accessible UI using **Jetpack Compose**:

### 🌈 Material 3 Design

* Dynamic colour support
* Adaptive UI components
* Consistent spacing and typography

### 🎨 Visual Identity

A customised **purple gradient theme** reflects calmness, creativity, and focus—ideal for task management tools.

### ♿ Accessibility

* High contrast text
* Large touch targets
* Structured visual hierarchy

These design choices ensure usability for all users, regardless of device or lighting environment.

---

# ⚙️ **Technology Stack**

| Layer              | Technology               | Purpose                             |
| ------------------ | ------------------------ | ----------------------------------- |
| **Frontend**       | Kotlin + Jetpack Compose | UI screens and state-driven layouts |
| **Authentication** | Firebase Authentication  | Secure Google SSO login             |
| **Backend**        | Node.js + Express        | REST API handling and validation    |
| **Database**       | MongoDB Atlas            | Cloud NoSQL data storage            |
| **Local Database** | RoomDB                   | Offline-first data handling         |
| **Networking**     | Retrofit                 | API communication                   |
| **Notifications**  | AlarmManager             | Scheduled and instant alerts        |
| **Hosting**        | Render.com               | Backend API hosting                 |

---

# 🧠 **Architecture (MVVM)**

### **Model**

* Represents task entities
* Handles RoomDB and API structures

### **ViewModel**

* Business logic
* Offline/online sync operations
* StateFlow management

### **View (Compose UI)**

* Displays real-time UI from state
* Responds to user actions

This ensures scalability, modularity, and testability.

---

# 🚀 **Core Screens**

* 🔐 Login & Authentication Screen
* 🏠 Dashboard
* 📝 Add Task Screen
* 📋 Task List Screen
* ✔ Completed Tasks Screen
* ⚙ Settings Screen

---

# 🎥 **YouTube Demonstration**

A complete walkthrough of the application—including POE-required features, task system, offline mode, notifications, and multi-language support—is available here:

👉 **Final POE Demo Video:**
https://youtu.be/toYKPBjGKIU?si=Pa16d-216c59XnCe
---

# 🌐 **API Documentation**

Base URL:

```
https://focusflow-api-ts06.onrender.com
```

| Method | Endpoint            | Description          |
| ------ | ------------------- | -------------------- |
| POST   | `/users/register`   | Register new user    |
| POST   | `/users/login`      | Authenticate user    |
| DELETE | `/users/delete/:id` | Delete all user data |
| GET    | `/tasks`            | Retrieve user tasks  |
| POST   | `/tasks`            | Create new task      |
| PUT    | `/tasks/:id`        | Update task          |
| DELETE | `/tasks/:id`        | Delete task          |

---

# 📶 **Offline Mode & Auto Sync**

FocusFlowV2 uses an **offline-first approach**:

### When Offline:

* Tasks are stored locally
* All actions (create, edit, delete) work normally

### When Online:

* Queued local changes sync automatically
* API updates MongoDB with latest changes
* Updates reflect cloud state

This ensures **zero data loss** and consistent behaviour.

---

# 🔔 **Notification System**

The app uses:

### ✔ Instant Notifications

Triggered immediately after creating a task.

### ✔ Scheduled Notifications

Generated using AlarmManager to remind users before deadlines.

Notifications remain active even if the app is closed.

---

# 🧪 **Unit Testing**

The project includes:

* ViewModel unit tests
* Validation tests
* API mock tests using Retrofit mocking
* Offline/online sync tests

This improves reliability and reduces regression risk.

---

# 📦 **Installation & Setup**

### 1. Clone Frontend

```bash
git clone https://github.com/ST10028058-Sashiel/FocusFlowV2.git
```

### 2. Clone Backend

```bash
git clone https://github.com/MoltenBog4/focusflow-api.git
```

### 3. Start API

```bash
npm install
npm start
```

### 4. Run App

* Open in Android Studio
* Connect Firebase project
* Build and run

---
## 📚 **References**

* [Android Developers. (2024). *Jetpack Compose Overview.*](https://developer.android.com/jetpack/compose)
* [Google. (2024). *Firebase Authentication.*](https://firebase.google.com/docs/auth)
* [MongoDB. (2024). *NoSQL Database Service.*](https://www.mongodb.com/)
* [Render. (2024). *Deploying Node.js Apps.*](https://render.com/docs)
* [OWASP Foundation. (2024). *Mobile Security Best Practices.*](https://owasp.org/www-project-mobile-top-10/)
* [OpenAI. (2025). *Project Documentation Support via ChatGPT.*](https://chat.openai.com)

# 🏁 **Authors**

* **Sashiel Moonsamy – ST10028058**
* **Nikhil Saroop – ST10040092**
* **Kiyashan Nadasen – ST10203525**

Module: PROG7314 — Programming 3D
Institution: Varsity College
Year: 2025

---

# 🧾 **License**

MIT License.

---

# ✨ *“Plan better. Focus deeper. Achieve more — with FocusFlowV2.”*
