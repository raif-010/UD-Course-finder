import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Verification endpoint
app.post("/api/verify-account", async (req, res) => {
  const { id, password } = req.body;
  if (!id || !password) {
    return res.status(400).json({ success: false, error: "Missing ID or password" });
  }

  try {
    // 1. GET login page to obtain Cookie and RequestVerificationToken
    const getRes = await fetch("https://online.uttoron.academy/Account/Login", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8"
      }
    });

    const getHtml = await getRes.text();
    const setCookieHeaders = getRes.headers.getSetCookie 
      ? getRes.headers.getSetCookie() 
      : (getRes.headers.get("set-cookie") ? [getRes.headers.get("set-cookie")!] : []);

    // Extract Antiforgery cookie
    const antiforgeryCookie = setCookieHeaders.find(c => c.includes(".AspNetCore.Antiforgery"));
    const cookieValue = antiforgeryCookie ? antiforgeryCookie.split(";")[0] : "";

    // Extract RequestVerificationToken value using a regex
    const tokenRegex = /name="__RequestVerificationToken"\s+type="hidden"\s+value="([^"]+)"/;
    const match = getHtml.match(tokenRegex);
    const token = match ? match[1] : "";

    // 2. POST to verify login
    const bodyParams = new URLSearchParams();
    bodyParams.append("returnUrl", "");
    bodyParams.append("RememberMe", "true");
    bodyParams.append("RegistrationNumber", id.toString());
    bodyParams.append("Password", password.toString());
    if (token) {
      bodyParams.append("__RequestVerificationToken", token);
    }

    const postHeaders: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Origin": "https://online.uttoron.academy",
      "Referer": "https://online.uttoron.academy/Account/Login"
    };

    if (cookieValue) {
      postHeaders["Cookie"] = cookieValue;
    }

    const postRes = await fetch("https://online.uttoron.academy/Account/Login", {
      method: "POST",
      headers: postHeaders,
      body: bodyParams.toString(),
      redirect: "manual" // We inspect redirect status manually
    });

    // Check status: ASP.NET login redirects (302) to returnUrl or home page on successful login
    const isRedirect = postRes.status === 302 || postRes.status === 301 || postRes.status === 307 || postRes.status === 308;
    const location = postRes.headers.get("location") || "";

    // If it's a redirect to "/" or home page, it's successful!
    // But if it redirects back to "/Account/Login" or "/Account/Password" with error, it failed.
    const isFailedRedirect = location.toLowerCase().includes("account/login") || location.toLowerCase().includes("account/password") || location.toLowerCase().includes("error");

    if (isRedirect && !isFailedRedirect) {
      return res.json({
        success: true,
        message: "Login verified! Account is active & correct."
      });
    }

    // If it's a 200 or failed redirect, read HTML to see if there's any validation message
    const responseText = await postRes.text();
    let errorMessage = "Incorrect registration number or password";

    // Match validation summary or error message in HTML
    const errorMatch = responseText.match(/class="[^"]*text-danger[^"]*"[^>]*>([^<]+)</) ||
                       responseText.match(/class="[^"]*validation-summary-errors[^"]*"[^>]*>[\s\S]*?<li>([\s\S]*?)<\/li>/);

    if (errorMatch) {
      errorMessage = errorMatch[1].trim();
    }

    return res.json({
      success: false,
      error: errorMessage
    });

  } catch (err: any) {
    console.error("Verification error:", err);
    return res.status(500).json({
      success: false,
      error: `Verification error: ${err.message || err}`
    });
  }
});

// Internet connectivity check endpoint
app.get("/api/check-internet", async (req, res) => {
  const startTime = Date.now();
  try {
    // Attempting to fetch a highly robust external site with a short timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const checkRes = await fetch("https://www.google.com", {
      method: "HEAD", // HEAD is extremely fast and lightweight
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      }
    });

    clearTimeout(timeoutId);
    const endTime = Date.now();
    const latency = endTime - startTime;

    return res.json({
      success: true,
      status: checkRes.status,
      latencyMs: latency,
      timestamp: new Date().toLocaleTimeString(),
      provider: "Google Cloud DNS Resolver"
    });
  } catch (err: any) {
    const endTime = Date.now();
    const latency = endTime - startTime;
    let errorMsg = err.message || String(err);
    if (err.name === 'AbortError') {
      errorMsg = "Connection timed out (no response within 6.0 seconds)";
    }
    
    return res.json({
      success: false,
      latencyMs: latency,
      error: errorMsg,
      timestamp: new Date().toLocaleTimeString()
    });
  }
});

// Serve assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
