import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import helmet from "helmet";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// For development only - completely disable CSP for WalletConnect integration testing
app.use((req, res, next) => {
  // Remove any existing CSP headers
  res.removeHeader('Content-Security-Policy');
  res.removeHeader('Content-Security-Policy-Report-Only');

  // Set extremely permissive CORS headers for wallet connections
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Disable other security policies that might interfere with wallet embeds
  res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

  // Allow iframes to be loaded from anywhere
  res.setHeader('X-Frame-Options', 'ALLOWALL');

  // Set permissive referrer policy
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');

  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Add CORS middleware for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use the PORT environment variable if available, or fall back to 5002
  // This serves both the API and the client
  const basePort = process.env.PORT ? parseInt(process.env.PORT) : 5002;
  console.log(`Server configured to use port: ${basePort} (from env: ${process.env.PORT})`);

  let currentPort = basePort;
  let retryCount = 0;
  const maxRetries = 5;

  const startServer = () => {
    if (retryCount >= maxRetries) {
      log(`Failed to start server after ${maxRetries} attempts`);
      return;
    }

    try {
      server.listen(currentPort, "0.0.0.0", () => {
        log(`serving on port ${currentPort}`);
        retryCount = 0; // Reset on success
      });

      server.on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          retryCount++;
          currentPort = basePort + retryCount;
          log(`Port ${currentPort - 1} is busy, trying port ${currentPort} (attempt ${retryCount}/${maxRetries})`);
          
          setTimeout(() => {
            server.close();
            startServer();
          }, 1000);
        } else {
          log(`Server error: ${error.message}`);
        }
      });
    } catch (err) {
      log(`Failed to start server: ${err}`);
    }
  };

  startServer();
})();