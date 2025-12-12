import { useEffect, useState } from "react";

const JSON_SERVER = process.env.REACT_APP_JSON_SERVER || "http://localhost:5000";

async function validateToken(token) {
  if (!token) return null;

  const sessRes = await fetch(`${JSON_SERVER}/sessions?token=${encodeURIComponent(token)}`);
  if (!sessRes.ok) return null;
  const sessions = await sessRes.json();
  if (!sessions || sessions.length === 0) return null;
  const session = sessions[0];

  if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
    return null;
  }

  const userRes = await fetch(`${JSON_SERVER}/users/${session.userId}`);
  if (!userRes.ok) return null;
  const user = await userRes.json();
  return { session, user };
}

export default function useAuth() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function init() {
      setLoading(true);
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          if (mounted) {
            setIsAuthenticated(false);
            setUser(null);
            setLoading(false);
          }
          return;
        }

        const validated = await validateToken(token);
        if (validated && validated.user) {
          if (mounted) {
            setIsAuthenticated(true);
            setUser(validated.user);
          }
        } else {
          localStorage.removeItem("authToken");
          localStorage.removeItem("sessionId");
          localStorage.removeItem("authUser");
          if (mounted) {
            setIsAuthenticated(false);
            setUser(null);
          }
        }
      } catch (err) {
        console.error("useAuth init error:", err);
        if (mounted) {
          setIsAuthenticated(false);
          setUser(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, []);

  return { user, isAuthenticated, loading };
}
