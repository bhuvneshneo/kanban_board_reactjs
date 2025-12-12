import { useLayoutEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Container,
  Typography,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import ReCAPTCHA from "react-google-recaptcha";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const useStyles = makeStyles(() => ({
  root: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh"},
  formContainer: { width: "100%", maxWidth: 420, padding: 28, background: "#fff", boxShadow: "0px 4px 10px rgba(0,0,0,0.08)", borderRadius: 8 },
  input: { marginBottom: "14px !important" },
  switchText: { marginTop: 12, textAlign: "center", cursor: "pointer", color: "#1976d2" },
}));

const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";
const JSON_SERVER = process.env.REACT_APP_JSON_SERVER || "http://localhost:5000";

export default function Auth() {
  const classes = useStyles();
  const navigate = useNavigate();
  const recaptchaRef = useRef(null);
  const [mode, setMode] = useState("login");
  const [loader, setLoader] = useState(false);
  const [error, setError] = useState("");
  const [loginForm, setLoginForm] = useState({ usernameOrEmail: "", password: "" });
  const [signupForm, setSignupForm] = useState({
    name: "",
    username: "",
    email: "",
    contactNumber: "",
    password: "",
    profileImage: null,
  });
  const [signupErrors, setSignupErrors] = useState({});

  // Alert dialog state
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState("Alert");
  const [alertMessage, setAlertMessage] = useState("");

  const updateLogin = (e) => {
    const { name, value } = e.target;
    setLoginForm((p) => ({ ...p, [name]: value }));
  };
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setSignupForm((p) => ({ ...p, profileImage: file }));
  };

  const updateSignup = (e) => {
    const { name, value } = e.target;
    setSignupForm((p) => ({ ...p, [name]: value }));
    if (signupErrors[name]) setSignupErrors((s) => ({ ...s, [name]: "" }));
  };
  const createDemoToken = (user) => btoa(`${user.id}:${user.username}:${Date.now()}`);

  const validateSignup = () => {
    const v = {};
    if (!signupForm.name || signupForm.name.trim().length < 2) v.name = "Name required (min 2 chars).";
    if (!signupForm.username || !/^[a-zA-Z0-9._-]{3,20}$/.test(signupForm.username)) v.username = "Username 3-20 chars.";
    if (!signupForm.email || !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(signupForm.email)) v.email = "Valid email required.";
    if (!signupForm.contactNumber || !/^[0-9]{10}$/.test(signupForm.contactNumber)) v.contactNumber = "Contact must be 10 digits.";
    if (!signupForm.password || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(signupForm.password)) v.password = "Password min 8 chars, include upper, lower & number.";
    setSignupErrors(v);
    return Object.keys(v).length === 0;
  };

  const showAlert = (message, title = "Alert") => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertOpen(true);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    if (!validateSignup()) return;

    setLoader(true);
    try {
      let base64 = "";
      if (signupForm.profileImage) {
        base64 = await new Promise((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result);
          r.onerror = reject;
          r.readAsDataURL(signupForm.profileImage);
        });
      }

      const baseUrl = `${JSON_SERVER}/users`;
      const [emailRes, usernameRes] = await Promise.all([
        fetch(`${baseUrl}?email=${encodeURIComponent(signupForm.email.trim().toLowerCase())}`),
        fetch(`${baseUrl}?username=${encodeURIComponent(signupForm.username.trim())}`),
      ]);
      const [emailMatches, usernameMatches] = await Promise.all([emailRes.json(), usernameRes.json()]);
      if (emailMatches.length > 0) {
        setSignupErrors({ email: "Email already in use." });
        setLoader(false);
        return;
      }
      if (usernameMatches.length > 0) {
        setSignupErrors({ username: "Username already taken." });
        setLoader(false);
        return;
      }

      const payload = {
        name: signupForm.name.trim(),
        username: signupForm.username.trim(),
        email: signupForm.email.trim().toLowerCase(),
        contactNumber: signupForm.contactNumber.trim(),
        password: signupForm.password,
        profileImageBase64: base64,
        createdAt: new Date().toISOString(),
      };

      const postRes = await fetch(baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!postRes.ok) throw new Error(`Failed to create user: ${postRes.status}`);

      showAlert("Registration successful. Please login.", "Success");
      setMode("login");
      setLoginForm((p) => ({ ...p, usernameOrEmail: signupForm.email || signupForm.username }));
      setSignupForm({ name: "", username: "", email: "", contactNumber: "", password: "", profileImage: null });

    } catch (err) {
      console.error("Signup error:", err);
      setError("Registration failed. Check console.");
    } finally {
      setLoader(false);
    }
  };

  //  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  useLayoutEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [loading, isAuthenticated, navigate]);


  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!loginForm.usernameOrEmail || !loginForm.password) {
      setError("Please fill all fields.");
      return;
    }

    setLoader(true);
    try {
      const token = recaptchaRef.current && recaptchaRef.current.getValue();
      if (!token) {
        setError("Please complete the CAPTCHA.");
        setLoader(false);
        return;
      }

      const emailQueryUrl = `${JSON_SERVER}/users?email=${encodeURIComponent(
        loginForm.usernameOrEmail.trim().toLowerCase()
      )}`;

      const usernameQueryUrl = `${JSON_SERVER}/users?username=${encodeURIComponent(
        loginForm.usernameOrEmail.trim()
      )}`;

      const [emailRes, usernameRes] = await Promise.all([
        fetch(emailQueryUrl),
        fetch(usernameQueryUrl),
      ]);

      const [emailMatches, usernameMatches] = await Promise.all([
        emailRes.json(),
        usernameRes.json(),
      ]);

      let user = null;

      if (emailMatches.length > 0) {
        user = emailMatches[0];
      } else if (usernameMatches.length > 0) {
        user = usernameMatches[0];
      }

      if (!user) {
        setError("Username/Email not found.");
        try { recaptchaRef.current.reset(); } catch (_) {}
        setLoader(false);
        return;
      }

      if (user.password !== loginForm.password) {
        setError("Invalid password.");
        try { recaptchaRef.current.reset(); } catch (_) {}
        setLoader(false);
        return;
      }

      const demoToken = createDemoToken(user);
      const sessionPayload = { userId: user.id, token: demoToken, createdAt: new Date().toISOString() };
      try {
        await fetch(`${JSON_SERVER}/sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sessionPayload),
        });
      } catch (err) {
        console.warn("Could not persist session to server:", err);
      }

      localStorage.setItem("authToken", demoToken);
      localStorage.setItem("authUser", JSON.stringify({ id: user.id, name: user.name, username: user.username, email: user.email }));

      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed. Check console.");
    } finally {
      setLoader(false);
    }
  };

  return (
   <div className={classes.root}>
      <Container className={classes.formContainer}>
        {mode === "login" ? (
          <>
            <Typography variant="h5" align="center" gutterBottom>Login</Typography>
            <form onSubmit={handleLogin} noValidate>
              <TextField
                fullWidth label="Username or Email" variant="outlined" name="usernameOrEmail"
                value={loginForm.usernameOrEmail} onChange={updateLogin} required className={classes.input}
              />
              <TextField
                fullWidth label="Password" variant="outlined" name="password" type="password"
                value={loginForm.password} onChange={updateLogin} required className={classes.input}
              />

              <Box mb={2}>
                <ReCAPTCHA sitekey={RECAPTCHA_SITE_KEY} onChange={() => {}} ref={recaptchaRef} />
              </Box>

              {error && <Box mb={2} style={{ color: "red" }}>{error}</Box>}

              <Button type="submit" variant="contained" color="primary" fullWidth disabled={loader}>
                Login
              </Button>
            </form>

            <Typography className={classes.switchText} onClick={() => { setMode("signup"); setError(""); }}>
              Don't have an account? Sign up
            </Typography>
          </>
        ) : (
          <>
            <Typography variant="h5" align="center" gutterBottom>Sign Up</Typography>

            <form onSubmit={handleSignup} noValidate>
              <TextField fullWidth label="Name" name="name" value={signupForm.name} onChange={updateSignup} className={classes.input} error={!!signupErrors.name} helperText={signupErrors.name} />
              <TextField fullWidth label="Username" name="username" value={signupForm.username} onChange={updateSignup} className={classes.input} error={!!signupErrors.username} helperText={signupErrors.username} />
              <TextField fullWidth label="Email" name="email" value={signupForm.email} onChange={updateSignup} className={classes.input} error={!!signupErrors.email} helperText={signupErrors.email} />
              <TextField fullWidth label="Contact Number" name="contactNumber" value={signupForm.contactNumber} onChange={updateSignup} className={classes.input} error={!!signupErrors.contactNumber} helperText={signupErrors.contactNumber} />
              <TextField fullWidth label="Password" name="password" type="password" value={signupForm.password} onChange={updateSignup} className={classes.input} error={!!signupErrors.password} helperText={signupErrors.password || "Min 8 chars, include uppercase & number"} />

              <input type="file" accept="image/*" onChange={handleImageChange} style={{ margin: 12 }} />

              {error && <Box mb={2} style={{ color: "red" }}>{error}</Box>}

              <Button type="submit" variant="contained" color="primary" fullWidth disabled={loader}>
                 Sign Up
              </Button>
            </form>

            <Typography className={classes.switchText} onClick={() => { setMode("login"); setError(""); }}>
              Already have an account? Login
            </Typography>
          </>
        )}
      </Container>

      <Dialog open={alertOpen} onClose={() => setAlertOpen(false)}>
        <DialogTitle>{alertTitle}</DialogTitle>
        <DialogContent>
          <Typography>{alertMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAlertOpen(false)} autoFocus>
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
