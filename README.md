# Neighborhood Safety Backend

This repository contains the backend API for the Neighborhood Safety App. The backend is built using Node.js and Express.js and is responsible for handling user-submitted safety reports, storing them in a MongoDB database, and providing endpoints for interacting with the data.

## Features

- **Submit Reports**: Users can submit safety reports, including details such as issue type, location, description, and optional photo.
- **Database Integration**: Reports are stored in a MongoDB database for persistence.
- **API Endpoints**: Provides RESTful API endpoints for submitting and managing reports.

## Project Structure

- `server.js`: The main entry point of the application, which sets up the Express server and connects to MongoDB.
- `api/reports.js`: Contains the route for handling report submissions.
- `vercel.json`: Configuration for deploying the backend on Vercel.

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd neighborhood-safety-backend

## Notes
This took way too long to make. :(