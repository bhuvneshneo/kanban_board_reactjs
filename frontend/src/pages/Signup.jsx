import React, { useState } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  CircularProgress,
  FormHelperText,
} from "@mui/material"; // or @mui if using MUI v5
import { makeStyles } from "@mui/styles";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: "#f5f5f5",
  },
  formContainer: {
    width: "100%",
    maxWidth: "400px",
    padding: "32px !important",
    background: "#fff",
    boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
    borderRadius: "8px",
  },
  avatar: {
    margin: "auto",
    backgroundColor: "red",
  },
  input: {
    marginBottom: "16px !important"
  },
  submitBtn: {
    marginTop: "16px !important",
  },
}));
const SignupForm = ( ) => {
  const classes = useStyles();
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    contactNumber: "",
    password: "",
    profileImage: null, // File object
    profileImageBase64: "", // will hold base64 for sending
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Validation rules
  const validators = {
    name: (v) => {
      if (!v || v.trim().length < 2) return "Name must be at least 2 characters.";
      return "";
    },
    username: (v) => {
      if (!v) return "Username is required.";
      if (!/^[a-zA-Z0-9._-]{3,20}$/.test(v))
        return "Username 3-20 chars: letters, numbers, . _ - allowed.";
      return "";
    },
    email: (v) => {
      if (!v) return "Email is required.";
      // simple but effective email regex
      if (
        !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(v.trim())
      )
        return "Enter a valid email address.";
      return "";
    },
    contactNumber: (v) => {
      if (!v) return "Contact number is required.";
      // adjust rule to your locale; here we assume 10 digits
      if (!/^[0-9]{10}$/.test(v)) return "Contact must be 10 digits.";
      return "";
    },
    password: (v) => {
      if (!v) return "Password is required.";
      // At least 8 chars, upper, lower, number and special
      if (
        !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/.test(v)
      )
        return "Password must be 8+ chars with uppercase, lowercase, number and special character.";
      return "";
    },
    profileImage: (file) => {
      if (!file) return ""; // optional
      const allowed = ["image/jpeg", "image/png", "image/webp"];
      if (!allowed.includes(file.type)) return "Allowed formats: JPG, PNG, WEBP.";
      const maxMB = 2;
      if (file.size / 1024 / 1024 > maxMB) return `Image must be < ${maxMB} MB.`;
      return "";
    },
  };

  const validateAll = () => {
    const newErrors = {};
    Object.keys(validators).forEach((field) => {
      const value = field === "profileImage" ? formData.profileImage : formData[field];
      const err = validators[field](value);
      if (err) newErrors[field] = err;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // live validate single field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: validators[name](value) || "" }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setFormData((prev) => ({ ...prev, profileImage: file }));
    const imgErr = validators.profileImage(file);
    setErrors((prev) => ({ ...prev, profileImage: imgErr }));
  };

  // helper to convert file -> base64
  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      if (!file) return resolve("");
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({}); // reset
    if (!validateAll()) return;

    setLoading(true);
    try {
      // 1. convert image (if any)
      let base64 = "";
      if (formData.profileImage) {
        base64 = await fileToBase64(formData.profileImage);
      }

      // 2. check uniqueness on server
      // NOTE: json-server supports ?email=... and ?username=...
      const baseUrl = "http://localhost:5000/users";
      // check email
      const emailRes = await fetch(
        `${baseUrl}?email=${encodeURIComponent(formData.email.trim())}`
      );
      const emailMatches = await emailRes.json();
      if (emailMatches.length > 0) {
        setErrors({ email: "Email already in use." });
        setLoading(false);
        return;
      }

      // check username
      const userRes = await fetch(
        `${baseUrl}?username=${encodeURIComponent(formData.username.trim())}`
      );
      const userMatches = await userRes.json();
      if (userMatches.length > 0) {
        setErrors({ username: "Username already taken." });
        setLoading(false);
        return;
      }

      // 3. prepare payload
      const payload = {
        name: formData.name.trim(),
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        contactNumber: formData.contactNumber.trim(),
        password: formData.password, // in production hash on server
        profileImageBase64: base64, // store the base64 string
        createdAt: new Date().toISOString(),
      };

      // 4. POST to json-server
      const postRes = await fetch(baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!postRes.ok) {
        throw new Error(`Server error: ${postRes.status}`);
      }

    //   const createdUser = await postRes.json();
      // success: clear or redirect
      alert("Registration successful!");
      setFormData({
        name: "",
        username: "",
        email: "",
        contactNumber: "",
        password: "",
        profileImage: null,
        profileImageBase64: "",
      });

      
    } catch (err) {
      console.error(err);
      alert("An error occurred while registering. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={classes.root}>
      <Container className={classes.formContainer} maxWidth="sm">
        <Typography variant="h5" gutterBottom align="center">
          Sign Up
        </Typography>

        <form onSubmit={handleSubmit} noValidate>
          <TextField
            fullWidth
            label="Name"
            variant="outlined"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className={classes.input}
            error={!!errors.name}
            helperText={errors.name}
          />

          <TextField
            fullWidth
            label="Username"
            variant="outlined"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            required
            className={classes.input}
            error={!!errors.username}
            helperText={errors.username}
          />

          <TextField
            fullWidth
            label="Email"
            variant="outlined"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            className={classes.input}
            error={!!errors.email}
            helperText={errors.email}
          />

          <TextField
            fullWidth
            label="Contact Number"
            variant="outlined"
            name="contactNumber"
            type="tel"
            value={formData.contactNumber}
            onChange={handleInputChange}
            required
            className={classes.input}
            error={!!errors.contactNumber}
            helperText={errors.contactNumber}
          />

          <TextField
            fullWidth
            label="Password"
            variant="outlined"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            required
            className={classes.input}
            error={!!errors.password}
            helperText={errors.password || "Min 8 chars, include upper/lower/number/special"}
          />

          <input
            id="profileImage"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className={classes.input}
            style={{ marginTop: 12 }}
          />
          {errors.profileImage && (
            <FormHelperText error>{errors.profileImage}</FormHelperText>
          )}

          <div style={{ marginTop: 16 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              className={classes.submitBtn}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : "Sign Up"}
            </Button>
          </div>
        </form>
      </Container>
    </div>
  );
};

export default SignupForm;
