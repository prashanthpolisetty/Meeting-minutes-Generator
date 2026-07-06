# 🚀 Cloud Deployment Guide: Split Hosting (Atlas + Render + Vercel)

This guide walks you through deploying the **Meeting Minutes Generator** to the cloud, utilizing:
1. **MongoDB Atlas** (Free Database Cloud Hosting)
2. **Render** (For the Python FastAPI Backend with Docker and Persistent Disk)
3. **Vercel** (For the React Frontend)

---

## 1. Database Setup (MongoDB Atlas)

To host your database in the cloud:
1. Sign up/Log in at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new **Free Cluster** (shared tier) in your preferred region.
3. **Database Access**: Create a database user (e.g., `db_user`) and set a secure password. Make a note of it.
4. **Network Access**: Add an IP access rule for `0.0.0.0/0` (Allow Access from Anywhere) to let Render's backend containers connect to it.
5. **Get Connection URL**: Click **Connect** -> **Drivers** -> Copy the connection string. Replace `<db_password>` with your database user password. The string will look like this:
   ```ini
   mongodb+srv://<username>:<password>@<your-cluster-address>/meeting_minutes_db?retryWrites=true&w=majority
   ```

---

## 2. Backend Deployment (Render)

Render will build your backend container using the `backend/Dockerfile` and run it in the cloud.

### Step-by-Step Setup:
1. Sign up or log in at [Render.com](https://render.com).
2. Connect your GitHub account and select your repository.
3. Click **New +** and select **Web Service**.
4. Configure the Web Service settings:
   * **Name**: `minutely-backend` (or any preferred name)
   * **Root Directory**: `backend`
   * **Runtime**: `Docker`
   * **Branch**: `main`
   * **Instance Type**: Choose an instance with at least **2GB RAM** (e.g., Starter plan). *Note: The free tier only offers 512MB RAM, which will cause OpenAI Whisper to crash with an Out of Memory (OOM) error during transcription.*
5. Scroll down and click **Advanced** -> **Add Disk**:
   * **Name**: `storage`
   * **Mount Path**: `/app/storage`
   * **Size**: `1 GiB` (or more depending on how much audio you plan to upload). This ensures audio files, transcripts, and database exports are safely preserved across server restarts.
6. **Environment Variables**: Add the following keys:
   * `MONGO_URI`: The MongoDB Atlas connection string copied in Step 1.
   * `CORS_ORIGINS`: `https://YOUR_FRONTEND.vercel.app` (You will update this once the Vercel app is deployed).
   * `LLM_PROVIDER`: `gemini` (or `groq`)
   * `GEMINI_API_KEY`: Your Google Gemini API Key.
   * `GROQ_API_KEY`: Your Groq Cloud API Key (if using Groq).
   * `SMTP_HOST`: `smtp.gmail.com`
   * `SMTP_PORT`: `587`
   * `SMTP_USER`: Your Gmail address.
   * `SMTP_PASS`: Your Gmail App Password.
7. Click **Create Web Service**. Render will start building the Docker container and start the API server. Copy your backend URL once it's deployed (e.g., `https://minutely-backend.onrender.com`).

---

## 3. Frontend Deployment (Vercel)

Vercel will compile and host your React static files globally.

### Step-by-Step Setup:
1. Sign up or log in at [Vercel.com](https://vercel.com).
2. Click **Add New** -> **Project** -> Import your GitHub repository.
3. Configure the Project settings:
   * **Framework Preset**: `Vite`
   * **Root Directory**: Click Edit, select the `frontend` folder, and click Continue.
   * **Build & Development Settings**: Keep defaults (`npm run build` and `dist`).
4. **Environment Variables**: Add a new key:
   * `VITE_API_URL`: `https://YOUR_BACKEND.onrender.com/api` (Use the Render Web Service URL you copied in the previous section, making sure to append `/api` at the end).
5. Click **Deploy**. Vercel will build the frontend and provide you with a production URL (e.g., `https://minutely-frontend.vercel.app`).

---

## 4. Final Verification

1. Copy your new Vercel frontend URL (e.g., `https://minutely-frontend.vercel.app`).
2. Go to your **Render Dashboard** -> Select your backend service -> **Environment** -> Update `CORS_ORIGINS` to include your Vercel URL.
3. Save the changes. Render will automatically redeploy the backend with the updated CORS policy.
4. Open the Vercel URL in your browser, register/login, and try uploading an audio file to test the full cloud pipeline!
