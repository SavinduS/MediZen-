# 🏥 MediZen Healthcare
> **Healing through Innovation, One Click at a Time.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/Frontend-React%2018-blue?logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js-green?logo=nodedotjs)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Infrastructure-Docker-blue?logo=docker)](https://www.docker.com/)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-6C47FF?logo=clerk)](https://clerk.com/)

MediZen Healthcare is a state-of-the-art, **full-stack digital healthcare platform** designed with a **Microservices Architecture**. It streamlines the connection between patients and healthcare providers, offering seamless appointment booking, AI-driven diagnostics, and secure video consultations.

---

## 🚀 Key Features

### 👤 For Patients
- **🔍 Doctor Discovery:** Search and filter doctors by specialization and availability.
- **📅 Easy Booking:** Schedule appointments and manage your medical calendar.
- **🤖 AI Symptom Checker:** Get instant health insights powered by AI.
- **📹 Video Consultations:** Secure, high-quality telehealth sessions via Agora RTC.
- **📁 Medical Reports:** Access and view digital prescriptions and reports anytime.

### 🩺 For Doctors
- **📅 Availability Manager:** Set and update weekly consultation slots.
- **📝 Digital Prescriptions:** Generate professional PDF prescriptions during calls.
- **📊 Patient History:** View patient medical records and reports before consultations.
- **💻 Interactive Dashboard:** Track upcoming appointments and daily earnings.

### ⚙️ For Administrators
- **🛡️ User Management:** Oversee patient and doctor registrations.
- **✅ Doctor Verification:** Verify credentials to ensure platform safety.
- **💳 Payment Oversight:** Monitor transactions and system-wide financial health.
- **📈 System Monitoring:** Real-time metrics via Prometheus and Grafana.

---

## 🛠️ Tech Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | React (Vite), Tailwind CSS, Lucide React, Axios |
| **Backend** | Node.js, Express.js (Microservices) |
| **Authentication** | Clerk Auth (JWT & Role-based Access) |
| **Communication** | Agora RTC (Real-time Video/Audio) |
| **Databases** | MongoDB (Distributed per service) |
| **Messaging** | RabbitMQ (Event-driven communication) |
| **Infrastructure** | Docker, Docker Compose, Kubernetes (K8s) |
| **Monitoring** | Prometheus, Grafana |

---

## 📂 Project Structure

```bash
MediZen/
├── client/                 # React Frontend (Vite + Tailwind)
├── services/               # Microservices Directory
│   ├── api-gateway/        # Central Entry Point (Port 5010)
│   ├── auth-service/       # Identity & Role Management
│   ├── doctor-service/     # Doctor Profiles & Availability
│   ├── patient-service/    # Patient Records
│   ├── appointment-service/# Booking Logic
│   └── ...                 # Payment, Notification, AI services
├── monitoring/             # Prometheus & Grafana configs
├── k8s/                    # Kubernetes Deployment Manifests
└── docker-compose.yml      # Multi-container orchestration
```

---

## ⚙️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/medizen-healthcare.git
cd medizen-healthcare
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory (or respective service folders) with the following:

**Frontend (`/client/.env`):**
```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_pub_key
VITE_GATEWAY_URL=http://localhost:5010
VITE_AGORA_APP_ID=your_agora_id
```

**Backend Services:**
```env
CLERK_SECRET_KEY=your_clerk_secret
MONGO_URI=mongodb://mongodb:27017/service_db
RABBITMQ_URL=amqp://rabbitmq
GEMINI_API_KEY=your_google_ai_key
```

### 3. Run with Docker Compose
Ensure you have Docker installed, then run:
```bash
docker-compose up --build
```
- **Frontend:** http://localhost:5173
- **API Gateway:** http://localhost:5010
- **Grafana Dashboard:** http://localhost:3000

---

## 🔒 Environment Variables Reference

| Variable | Description |
| :--- | :--- |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk public key for frontend auth. |
| `CLERK_SECRET_KEY` | Backend secret key for user verification. |
| `VITE_AGORA_APP_ID` | Agora ID for video consultation rooms. |
| `GEMINI_API_KEY` | Google Gemini API key for AI Symptom Checker. |
| `MONGO_URI` | Connection string for MongoDB instances. |

---

## 📜 License
Distributed under the **MIT License**. See `LICENSE` for more information.

---

## 🤝 Contributing
Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

**⭐ If you like this project, please give it a star!**
