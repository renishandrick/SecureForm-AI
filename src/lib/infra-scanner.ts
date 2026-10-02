import { InfraScannerResult } from "../types";
import net from "net";

const COMMON_PORTS = [21, 22, 23, 80, 443, 3306, 5432, 8080, 27017];

export async function scanInfrastructure(target: string): Promise<InfraScannerResult> {
  // Strip http:// or https:// if present
  const hostname = target.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0];
  const urlForFetch = target.startsWith("http") ? target : `https://${target}`;

  const result: InfraScannerResult = {
    target: hostname,
    status: "secure",
    open_ports: [],
    security_headers: {
      cors: false,
      csp: false,
      hsts: false,
      details: {}
    }
  };

  try {
    // 1. Port Scanning
    const portChecks = COMMON_PORTS.map(port => checkPort(hostname, port));
    const portResults = await Promise.allSettled(portChecks);
    
    portResults.forEach((res, index) => {
      if (res.status === "fulfilled" && res.value === true) {
        result.open_ports.push(COMMON_PORTS[index]);
      }
    });

    if (result.open_ports.length > 2) {
      // Just a naive heuristic: if many ports are open, maybe it's not super secure
      result.status = "vulnerable"; 
    }

    // 2. HTTP Header Analysis
    try {
      const response = await fetch(urlForFetch, { method: "HEAD", cache: 'no-store' });
      
      const cors = response.headers.get("access-control-allow-origin");
      const csp = response.headers.get("content-security-policy");
      const hsts = response.headers.get("strict-transport-security");

      if (cors === "*") {
         result.security_headers.cors = false; // insecure CORS
         result.security_headers.details.cors = "Wildcard (*) allowed for origins";
         result.status = "vulnerable";
      } else if (cors) {
         result.security_headers.cors = true;
      }

      if (csp) {
        result.security_headers.csp = true;
      } else {
        result.security_headers.details.csp = "Missing Content-Security-Policy";
        result.status = "vulnerable";
      }

      if (hsts) {
        result.security_headers.hsts = true;
      } else {
        result.security_headers.details.hsts = "Missing Strict-Transport-Security";
        result.status = "vulnerable";
      }
    } catch (fetchError: any) {
      result.security_headers.details.fetch_error = "Could not fetch target for header analysis. It might be down or not responding to HTTP.";
    }

    return result;
  } catch (error: any) {
    return {
      ...result,
      status: "error",
      security_headers: {
        ...result.security_headers,
        details: { error: error.message }
      }
    };
  }
}

function checkPort(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(2000); // 2 second timeout for faster scanning

    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });

    socket.on("error", () => {
      socket.destroy();
      resolve(false);
    });

    socket.connect(port, host);
  });
}
