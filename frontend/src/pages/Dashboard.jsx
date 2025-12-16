import React, { useEffect, useMemo, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Avatar
} from "@mui/material";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const STAGE_LABELS = ["Backlog", "To Do", "Ongoing", "Done"];
const JSON_SERVER = process.env.REACT_APP_JSON_SERVER || "http://localhost:5000";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const allTasks = useSelector((s) => s.tasks.tasks || []); 

  const [deletingSession, setDeletingSession] = useState(false);

  const userId = user?.id ?? null;
  const userTasks = useMemo(() => {
    if (!userId) return [];
    return allTasks.filter((t) => String(t.userId) === String(userId));
  }, [allTasks, userId]);

  const total = userTasks.length;
  const byStage = [0, 1, 2, 3].map((s) => userTasks.filter((t) => Number(t.stage) === s).length);
  const upcoming = userTasks
    .filter((t) => t.deadline)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 8);

  console.log(upcoming,"upcoming")
  const handleLogout = async () => {
    setDeletingSession(true);
    try {
      const sessionId = localStorage.getItem("sessionId");
      if (sessionId) {
        await fetch(`${JSON_SERVER}/sessions/${encodeURIComponent(sessionId)}`, {
          method: "DELETE",
        }).catch(() => {});
      }
    } catch (err) {
      console.warn("Failed to delete session:", err);
    } finally {
      localStorage.removeItem("authToken");
      localStorage.removeItem("sessionId");
      localStorage.removeItem("authUser");
      setDeletingSession(false);
      navigate("/login", { replace: true });
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  if (authLoading) {
    return (
      <Container sx={{ py: 6 }}>
        <Box display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!isAuthenticated) {
    return (
      <Container sx={{ py: 6 }}>
        <Typography>Please login to view the dashboard.</Typography>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4">Dashboard</Typography>
                  <Box display={"flex"} flexDirection={"column"} justifyContent={"center"} alignItems={"flex-start"}>
          {user?.profileImageBase64 || user?.profileImage ? (
    <Avatar
      src={user.profileImageBase64 || user.profileImage}
      alt={user.name}
      sx={{ width: 40, height: 40 }}
    />
  ) : (
    <Avatar sx={{ width: 40, height: 40 }}>
      {user?.name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase()}
    </Avatar>
  )}
        {/* <Typography variant="body2" color="textSecondary">User: {user?.name || user?.username}</Typography> */}
          <Typography color="textSecondary">
            Welcome, {user?.name ?? user?.username}
          </Typography>
        </Box>
        </Box>

        <Box display="flex" gap={1}>
          <Button variant="outlined" onClick={() => navigate("/tasks")}>
            Open Task Board
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleLogout}
            disabled={deletingSession}
          >
          Logout
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="textSecondary">Total Tasks</Typography>
            <Typography variant="h5">{total}</Typography>
          </Paper>
        </Grid>

        {byStage.map((count, idx) => (
          <Grid item xs={12} sm={2.25} key={idx}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="textSecondary">{STAGE_LABELS[idx]}</Typography>
              <Typography variant="h6">{count}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Box mt={3}>
        <Typography variant="h6" gutterBottom>Upcoming Deadlines</Typography>

        {upcoming.length === 0 ? (
          <Typography color="textSecondary">No upcoming deadlines.</Typography>
        ) : (
          <Paper sx={{ maxHeight: 350, overflowY: "auto" }}>
            <List>
              {upcoming.map((t) => (
                <React.Fragment key={t.id}>
                  <ListItem>
                    <ListItemText
                      primary={t.name}
                      secondary={`${t.deadline} • ${t.priority ?? "n/a"} • ${STAGE_LABELS[t.stage] ?? "n/a"}`}
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        )}
      </Box>
    </Container>
  );
}
