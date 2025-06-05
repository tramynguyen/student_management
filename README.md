# SECONDARY SCHOOL MANAGEMENT SYSTEM

## 1. Project Overview

The Secondary School Management System is a web application built on Node.js and Express platform, using JSON as the data storage medium. The system is designed with a 2-tier architecture: Client and Service, helping to manage student information, attendance, and grade point averages for secondary schools with 4 grade levels (6, 7, 8, 9), each grade having an average of 6 classes and each class having a maximum of 20 students.

### Main Functions

**Students:** View their own profile, update phone number, address, and photo.
**Academic Affairs:** Look up students, update student information, transfer classes, record grade point averages, statistics by class and grades.
**Proctors:** Look up students, record attendance.

### System Forms

- **BM1:** Student profile
- **BM2A:** Attendance sheet
- **BM2B:** Subject grade sheet
- **BM3:** Statistics of students by class
- **BM4:** Statistics of students by grade point average

## 2. Complete Directory Structure

```
school-management-system/
│
├── service/                    # Backend service (Port 3001)
│   ├── DichVu.js              # Main comprehensive service
│   ├── XL_HOCSINH.js          # API for students
│   ├── XL_GIAMTHI.js          # API for proctors
│   ├── XL_GIAOVU.js           # API for academic affairs
│   ├── package.json           # Dependencies: express, cors
│   └── data/                  # JSON data
│       ├── Hocsinh/          # HS001.json, HS002.json, ...
│       ├── Giamthi/          # GT001.json, ...
│       └── Giaovu/           # GV001.json, ...
│
├── client-hocsinh/            # Student client system (Port 3000)
│   ├── HeThongHocSinh.js     # Student server
│   ├── package.json          # Dependencies: express, node-fetch
│   └── views/
│       └── login.html        # Login page
│
├── client-giamthi/           # Proctor client system (Port 3010)
│   ├── HeThongGiamThi.js     # Proctor server
│   ├── package.json         # Dependencies: express, node-fetch
│   └── views/
│       └── login.html       # Login page
│
├── client-giaovu/            # Academic affairs client system (Port 3002)
│   ├── HeThongGiaoVu.js      # Academic affairs server
│   ├── package.json         # Dependencies: express, node-fetch
│   └── views/
│       └── login.html       # Login page
│
└── README.md                 # Documentation guide
```

## 3. System Requirements

- Node.js (>= 14.x)
- npm (>= 6.x)

## 4. Installation

### Step 1: Clone or extract the project

### Step 2: Install libraries for backend

```bash
cd 22880099/service
npm install
```

### Step 3: Install libraries for frontend

```bash
cd ../client-hocsinh
npm install
cd ../client-giamthi
npm install
cd ../client-giaovu
npm install
```

## 5. Running the Application

### Step 1: Run backend

```bash
cd service
node DichVu.js
```

Backend will run on port 3001: http://localhost:3001

### Step 2: Run frontend

Open new terminal:

**For students:**

```bash
cd client-hocsinh
node HeThongHocSinh.js
```

Student page will run on port 3000: http://localhost:3000

**For proctors:**

```bash
cd client-giamthi
node HeThongGiamThi.js
```

Proctor page will run on port 3010: http://localhost:3010

**For academic affairs:**

```bash
cd client-giaovu
node HeThongGiaoVu.js
```

Academic affairs page will run on port 3002: http://localhost:3002

### Step 3: Access the application

Open browser and access: http://localhost:8080

## 6. User Guide

### 6.1. Homepage and Login

Open browser and access corresponding to the role of each user object.

**Example credentials:**

- Student: username=hs001, password=123456
- Proctor: username=gt001, password=123456
- Academic Affairs: username=gv001, password=123456

### 6.2. Student Functions

**View Profile:**

- After logging in, students are redirected to the profile page
- This page displays BM1 (Student Profile) with complete personal information

**Update Information:**

- Click the "Update Information" button
- Enter new information for Phone and Address
- Upload new image if needed
- Click "Update Information" to save

### 6.3. Proctor Functions

**Attendance:**

- After logging in, select "Attendance" on the menu
- Choose class and attendance date
- Click "Get Class List" to display students
- Mark absent students and enter reasons
- Click "Save Attendance" to complete

**Student Lookup:**

- Select "Student Lookup" on the menu
- Enter student ID to look up
- Click "Lookup" to view information and attendance history

### 6.4. Academic Affairs Functions

**Student Lookup:**

- After logging in, select "Student Lookup" on the menu
- Enter student ID to look up
- Click "Lookup" to view information, grades, and attendance history

**Update Student Information:**

- After looking up student, click "Update Information"
- Enter new information for Phone and Address
- Upload new image if needed
- Click "Update Information" to save

**Transfer Class:**

- After looking up student, click "Transfer Class"
- Select new class from the list
- Click "Transfer Class" to complete

**Record Grade Point Average:**

- Select "Record Grades" on the menu
- Choose class, subject, and semester
- Click "Get List" to display students
- Select student to record grades for
- Enter grade point average
- Click "Record Grade" to save

**Statistics by Class:**

- Select "Statistics by Class" on the menu
- Page displays BM3 with number of students by each class

**Statistics by Grade:**

- Select "Statistics by Grade" on the menu
- Choose class (or all classes) and subject
- Click "Statistics" to display BM4 with number of students and percentage by each grade level
