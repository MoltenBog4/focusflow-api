

# 🧠 **FocusFlowV2**

### *Smart Productivity App — Manage, Focus, Achieve*

---

## 📘 **Overview**

**FocusFlowV2** is a mobile productivity application built using **Android Studio**, **Firebase**, and **MongoDB**, with the backend hosted on **Render**.
It enables users to **create, manage, and track daily tasks** while staying organized and motivated.

Developed with **Jetpack Compose**, the app offers a clean, responsive, and modern interface designed to enhance user experience through **smooth performance** and **UX-driven design principles**.

This repository contains the **Android frontend**, while the API backend is hosted separately.

---

## 🎯 **Portfolio of Evidence (POE) Context**

This project was developed as part of the **PROG7314** Portfolio of Evidence (POE).
The POE demonstrates skills in **mobile app development**, **RESTful API integration**, and **cloud-based database management**.

### 🔍 **POE Requirements & Implementations**

| **POE Requirement**    | **Implementation**                                                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SSO Authentication** | Integrated **Google Sign-In (OAuth 2.0)** via **Firebase** for secure and seamless login.                                                                     |
| **Settings Feature**   | Added a 1. **Dark Mode / Light Mode Toggle  + 2. **Delete Account** button that removes user credentials and associated task data permanently from both **Firebase Authentication** and **MongoDB**** to enhance usability and accessibility + 3.Export CSV file through email containing all the tasks in an excel file.                                                                             |

---

## 💡 ** PART 1 STATED  Student-Implemented Features**

In addition to POE requirements, the following features were designed and developed by the team to improve functionality and engagement:

| # | **Feature**                | **Description**                                                                                    |
| - | -------------------------- | -------------------------------------------------------------------------------------------------- |
| 1 | **Add a Task**             | Users can create tasks by entering a name, location, due date, and time.                           |
| 2 | **Task Filtering**         | Filter tasks based on priority levels for quick navigation.                                        |
| 3 | **Sorting Options**        | Sort tasks by **Oldest**, **Newest**, or **Priority (High → Low)**.                                |
| 4 | **Priority Setter**        | Tag tasks with urgency levels — *Low, Medium, High, Critical* — to stay focused.                   |
| 5 | **Reminder Notifications** | Set reminders minutes before tasks begin; notifications pop up automatically using Android alarms. |
| 6 | **Task Counter**           | Displays the total number of pending tasks to track user progress visually.                        |
| 7 | **Update Tasks**           | Modify existing task information (title, priority, etc.).                                          |
| 8 | **Delete Tasks**           | Remove tasks permanently at any time.                                                              |
| 9 | **Mark as Complete**       | Tick off tasks as completed and move them to the “Completed” list instantly.                       |

---

## 🎨 **Design & User Experience**

**FocusFlowV2** uses a vibrant **purple gradient theme** symbolizing creativity, focus, and calmness.
Designed following **Material 3 guidelines**, ensuring:

* 🎨 Adaptive light/dark color schemes
* ✏️ Consistent typography and spacing
* ⚡ Smooth animations for transitions and task updates

Every screen was designed with **clarity and usability** in mind — optimized for a **mobile-first experience**.

---

## ⚙️ **Technology Stack**

| **Layer**          | **Technology**                           | **Description**                                                           |
| ------------------ | ---------------------------------------- | ------------------------------------------------------------------------- |
| **Frontend**       | **Kotlin (Jetpack Compose)**             | Declarative UI for Android, providing modern performance and flexibility. |
| **Backend**        | **Node.js + Express**                    | API layer for CRUD operations and authentication routing.                 |
| **Database**       | **MongoDB (Cloud)**                      | Stores user data and task details efficiently.                            |
| **Authentication** | **Firebase Authentication + Google SSO** | Secure, user-friendly login using Google accounts.                        |
| **Hosting**        | **Render.com**                           | Deployed backend with continuous cloud hosting.                           |
| **IDE**            | **Android Studio**                       | For Kotlin development, Gradle management, and UI design.                 |

---

## 🧠 **Architecture**

The app follows the **MVVM (Model-View-ViewModel)** architecture pattern:

* **Model** → Defines data entities and handles network communication.
* **ViewModel** → Manages business logic and interacts between data and UI.
* **View** → Reactive UI layer built with Jetpack Compose.

Data syncs between **RoomDB (local storage)** and **MongoDB (cloud)** via RESTful API endpoints.

---

## 🚀 **Core Screens**

* 🔐 **Login / Register Screen** — Firebase + Google SSO Authentication.
* 🏠 **Home Dashboard** — Quick overview of tasks, stats, and focus insights.
* 📝 **Add Task Screen** — Create and edit tasks with time, location, and priority.
* 📋 **Task Status Screen** — View completed and outstanding tasks in one place.
* ⚙️ **Settings Screen** — Toggle dark/light mode, delete account, and manage preferences.

---

## 🔗 **Project Links**

### 💻 **Frontend (Android App)**

👉 [GitHub Repository – FocusFlowV2](https://github.com/ST10028058-Sashiel/FocusFlowV2.git)

### ⚙️ **Backend API**

👉 [API Repository – focusflow-api](https://github.com/MoltenBog4/focusflow-api.git)
👉 [Hosted API – Render](https://focusflow-api-ts06.onrender.com)

---

## 🌐 **API Documentation**

**Base URL:**

```
https://focusflow-api-ts06.onrender.com
```

| **Method** | **Endpoint**        | **Description**            |
| ---------- | ------------------- | -------------------------- |
| `POST`     | `/users/register`   | Register new user account  |
| `POST`     | `/users/login`      | Authenticate existing user |
| `DELETE`   | `/users/delete/:id` | Delete user account        |
| `GET`      | `/tasks`            | Retrieve all user tasks    |
| `POST`     | `/tasks`            | Create a new task          |
| `PUT`      | `/tasks/:id`        | Update task details        |
| `DELETE`   | `/tasks/:id`        | Delete a task              |

---

## 🎥 **YouTube Demonstration**

📺 **FocusFlowV2 – Final POE Demo Video**
🔗 [YouTube Link – Coming Soon](#)

---

## 📦 **Installation & Setup**

### 1️⃣ Clone the Frontend

```bash
git clone https://github.com/ST10028058-Sashiel/FocusFlowV2.git
```

### 2️⃣ Clone the Backend

```bash
git clone https://github.com/MoltenBog4/focusflow-api.git
```

### 3️⃣ Run the API

```bash
npm install
npm start
```

### 4️⃣ Open and Run the App

1. Open **FocusFlowV2** in Android Studio.
2. Sync Gradle and connect your Firebase project.
3. Run the app on an emulator or physical device.

---

## 🧩 **Dependencies**

### 🔹 Frontend

* Jetpack Compose (Material 3)
* Firebase Authentication
* Google Sign-In SDK
* Retrofit (API communication)
* Room Database
* Kotlin Coroutines
* Android AlarmManager (Reminders)

### 🔹 Backend

* Express.js
* Mongoose (MongoDB ODM)
* bcrypt.js (Password encryption)
* jsonwebtoken (Authentication)
* dotenv (Environment variables)

---

## 📚 **References**

* [Android Developers. (2024). *Jetpack Compose Overview.*](https://developer.android.com/jetpack/compose)
* [Google. (2024). *Firebase Authentication.*](https://firebase.google.com/docs/auth)
* [MongoDB. (2024). *NoSQL Database Service.*](https://www.mongodb.com/)
* [Render. (2024). *Deploying Node.js Apps.*](https://render.com/docs)
* [OWASP Foundation. (2024). *Mobile Security Best Practices.*](https://owasp.org/www-project-mobile-top-10/)
* [OpenAI. (2025). *Project Documentation Support via ChatGPT.*](https://chat.openai.com)

---

## 🏁 **Authors**

🏁 Authors
👨‍💻 Developers
Name	Student ID	Role
Sashiel Moonsamy	ST10028058	
Nikhil Saroop	ST10040092	
Kiyashan Nadasen	ST10203525	
🏫 Institution Details

Module: PROG7315 – Programming 3D

Institution: The IIE Varsity College

Year: 2025

## 🧾 **License**

This project is licensed under the **MIT License**.
You may modify, distribute, and reuse it with proper attribution.

---

### ✨ *“Plan better. Focus deeper. Achieve more — with FocusFlowV2.”*

