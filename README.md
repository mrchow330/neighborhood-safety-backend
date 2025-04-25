# Neighborhood Safety Backend

This repository contains the backend API for the Neighborhood Safety App. The backend is built using Node.js and Express.js and is responsible for handling user-submitted safety reports and user data, storing them in a MongoDB database. This backend server also provides endpoints for interacting with the data. The main goal of this backend website is to act as a server to create the main connection and communication between the app and our MongoDB database remotely. That way, our team can test its functionalities locally without starting a local MongoDB connection as well every time.

## Dependencies

The following dependencies are required to run this project:

- **Required**:
  - `express`: For building the server and handling API routes.
  - `mongoose`: For connecting to and interacting with the MongoDB database.
  - `dotenv`: For managing environment variables securely.
  - `cors`: For enabling cross-origin resource sharing.
  - `bcryptjs`: For hashing passwords in the MongoDb database
  - `Node-fetch`: Used in Node.js environments to make HTTPS requests

- **Optional**:
  - `nodemon`: For automatically restarting the server during development when file changes are detected.

## Features

- **Database Integration**: Reports are stored in a MongoDB database for persistence.
- **API Endpoints**: Provides RESTful API endpoints for submitting and managing reports.
- **Health Check**: A `/api/health` endpoint provides real-time server status, including database connection status and uptime tracking.
- **Admin Dashboard**: A central hub for administrators to manage users and reports.
- **Frontend Integration**: Displays server status and uptime on the frontend, with real-time updates (if need be).
- **Manage users and reports**: Allows users with admin privaleges to manage regular users and submitted reports easily. 

## Project Structure

- `server.js`: The main entry point of the application, which sets up the Express server, connects to MongoDB, and handles API routes.
- `/api`: Contains the main connections for user, report, google maps, and admin databasing.
  - `admin.js`: API used to login admin users
  - `google-maps-api.js` (UNUSED): API used to test and - create the map interface.
  - `reports.js`: API used to create or update reports
  - `users.js`: API used to create or update existing users
- `/features`: Contains frontend pages for interacting with the backend.
  - `/admin/`: Contains admin-related pages:
    - `admin-dashboard.html`: The main admin dashboard with links to manage users and reports.
    - `manage-users.html`: Allows admins to view and modify user roles (`isModerator`).
    - `manage-reports.html`: Allows admins to view and delete reports.
- `schemas/`: Contains Mongoose schemas for the database models.
- `vercel.json`: Configuration for deploying the backend on Vercel.

### Archived Features
These features are in the features folder but are not implemented in the current version of this website.
- `/api-report-tester.html`: A frontend page to test report submission.
- `/api-user-tester.html`: A frontend page to test user-related APIs.
- `/api-map-tester.html`: A frontend page to test mapping API.

## Installation

1. Clone the repository:
   ```bash
   git clone <github.com/mrchow330/neighborhood-safety-backend>
   cd neighborhood-safety-backend
   ```

2. Install dependencies using:
   ```bash
   npm install
   ```

   Dependencies to install:
   - `express`
   - `mongoose`
   - `dotenv`
   - `cors`
   - `bcryptjs`
   - `node-fetch`
   - `nodemon` (optional)


3. Set up environment variables:
   - Create a `.env` file in the root directory.
   - Add the following variables:
     ```env
     MONGO_URI=<your-mongodb-connection-string>
     PORT=3000
     ```
   - **WARNING**: Ensure your `.env` file is added to `.gitignore` to prevent it from being uploaded to the repository and running into security risks (since your MongoDB connection will contain your password).

4. Start the server:
   ```bash
   npm start
   ```

   or 

   ```bash
   node server.js
   ```

## API Endpoints

### Health Check
- **Endpoint**: `/api/health`
- **Method**: `GET`
- **Description**: Returns the server's health status in real time. Also returns the server's uptime.
- **Response**:
  ```json
  {
    "status": "Server is running",
    "database": "Connected",
    "uptime": 12345.678,
    "lastUpTime": "2025-04-04T12:34:56.789Z",
    "timestamp": "2025-04-04T12:35:56.789Z"
  }
  ```

### Submit Reports
- **Endpoint**: `/api/reports`
- **Method**: `POST`
- **Description**: Submits a new safety report. Usually done on the frontend.
- **Request Body**:
  ```json
  {
    "report_id": "12345",
    "issueType": "Pothole",
    "location": "123 Main St",
    "description": "Large pothole causing traffic issues",
    "photoUri": "http://example.com/photo.jpg"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Report submitted successfully",
    "report": {
      "report_id": "12345",
      "issueType": "Pothole",
      "location": "123 Main St",
      "description": "Large pothole causing traffic issues",
      "photoUri": "http://example.com/photo.jpg",
      "createdAt": "2025-04-04T12:34:56.789Z",
      "status": "Submitted"
    }
  }
  ```


### User Creation
- **Endpoint**: `/api/users`
- **Method**: `POST`
- **Description**: Creates a new user. Usually done on the frontend.
- **Request Body**:
  ```json
  {
    "first_name": "John",
    "last_name": "Dole",
    "username": "Thelegend27",
    "email": "email@gmail.com",
    "phone_number": "550-412-4731",
    "password": "********",
    "isModerator": false,
    "createAt": "2025-04-25T12:34:56.789Z"
  }
  ```
- **Response**:
  ```json
  {
    "message": "User account created successfully",
    "user": {
      "first_name": "John",
      "last_name": "Dole",
      "username": "Thelegend27",
      "email": "email@gmail.com",
      "phone_number": "550-412-4731",
      "password": "********",
      "isModerator": false,
      "createAt": "2025-04-25T12:34:56.789Z"
      }
  }
  ```

### Admin Endpoints
- **Fetch User**:
  - **Endpoint**: `/api/admin/users`
  - **Method**: `GET`
  - **Description**: Fetches all users (excluding passwords).
-**Toggle Moderator Status**: 
  - **Endpoint**: `/api/admin/users/:id/toggle-moderator`
  - **Method**: `PATCH`
  - **Description**: Toggles the `isModerator` status for a user
- **Fetch Reports**:
  - **Endpoint**: `/api/admin/reports`
  - **Method**: `GET`
  - **Description**: Fetches all reports.
- **Delete Reports**:
  - **Endpoint**: `/api/admin/reports/:id`
  - **Method**: `DELETE`
  - **Description**: Deletes a specific report.

## Frontend Features

- **Admin Dashboard**:
  - `admin-dashboard.html`: Provides links to manage users and reports.
  - `manage-users.html`: Allows admins to view and modify user roles (`isModerator`)
  - `manage-reports.html`: Allows admins to view and delete reports.
- **Health Status Display**: The `features/health.html` page displays the server's health status (`Server is running` or `Server is down`) and uptime in a user-friendly format.
- **Real-Time Updates**: The health status and uptime are updated every second using JavaScript.
-**Map Visualization**: The `api-map-tester.html` page displays a map using Leaflet.

## Deployment

This backend can be deployed on platforms like Vercel. Ensure that the `vercel.json` file is properly configured for deployment. When deploying with Vercel, there are two methods.

### Deployment on Vercel (Locally)

1. **Create a Vercel Account**
   - If you haven't created an account, create an account on https://vercel.com.

2. **Install the Vercel CLI**:
   - If you don’t already have the Vercel CLI installed, install it globally:
     ```bash
     npm install -g vercel
     ```

3. **Login to Vercel**:
   - Log in to your Vercel account:
     ```bash
     vercel login
     ```

4. **Set Up Environment Variables**:
   - Add your environment variables to Vercel:
     ```bash
     vercel env add MONGO_URI
     ```
   - Follow the prompts to add your MongoDB connection string.

5. **Deploy the Project**:
   - Run the following command to deploy the project:
     ```bash
     vercel
     ```
   - Follow the prompts to configure the project. Vercel will automatically detect the `vercel.json` file and deploy the backend.

6. **Test the Deployment**:
   - Once deployed, Vercel will provide a URL for your backend (e.g., `https://your-project-name.vercel.app`).
   - Test the `/api/health` endpoint:
     ```bash
     curl https://your-project-name.vercel.app/api/health
     ```
   - Note: If this doesn't work, don't worry. You can skip this step.

7. **Frontend Testing**:
   - Access the `features/health.html` page (different from `/api/health`) by navigating to:
     ```
     https://your-project-name.vercel.app/features/health.html
     ```

### Deployment on Vercel (Git)
This method is a lot more faster than the local method. This requires an existing Git repository linked to this project: https://github.com/mrchow330/neighborhood-safety-backend or your own repository.

1. Create an account or login to https://vercel.com
2. Add a new project

3. If you're logged in using GitHub, you can import the Git Repository
4. If you're on an existing project, go to settings.
5. Under "Git", connect to an existing Git Repository



## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for more details.