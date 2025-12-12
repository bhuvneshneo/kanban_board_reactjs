import { useState } from "react";
import {
  Box,
  Button,
  Container,
  Grid,
  Paper,
  TextField,
  Typography,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import useAuth from "../hooks/useAuth";
import {
  addTask,
  updateTask,
  deleteTask,
  moveBack,
  moveForward,
  moveToStage,
} from "../app/slices/tasksSlice";
import { useNavigate } from "react-router-dom";

const STAGES = ["Backlog", "To Do", "Ongoing", "Done"];

export default function TaskManagement() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const allTasks = useSelector((s) => s.tasks.tasks);

  const [form, setForm] = useState({ name: "", priority: "", deadline: "" });
  const [formError, setFormError] = useState("");

  const [editing, setEditing] = useState(null);

  const [dragging, setDragging] = useState(null);

  // Dialog states
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState(() => () => {});

  const userId = user?.id ?? null;
  const tasks = userId ? allTasks.filter((t) => t.userId === userId) : [];

  const handleDashboard = () => {
    navigate("/dashboard", { replace: true });
  };

  const showAlert = (msg) => {
    setAlertMessage(msg);
    setAlertOpen(true);
  };

  const showConfirm = ({ title = "Confirm", message = "", onConfirm = () => {} }) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmAction(() => onConfirm);
    setConfirmOpen(true);
  };

  const handleCreate = () => {
    setFormError("");
    if (!form.name.trim() || !form.priority || !form.deadline) {
      setFormError("Please enter name, priority and deadline.");
      return;
    }

    dispatch(addTask({ name: form.name.trim(), priority: form.priority, deadline: form.deadline, userId }));
    setForm({ name: "", priority: "", deadline: "" });
  };

  const openEdit = (task) => setEditing({ ...task });
  const closeEdit = () => setEditing(null);
  const saveEdit = () => {
    if (!editing.name.trim() || !editing.priority || !editing.deadline) {
      showAlert("All fields are required.");
      return;
    }
    dispatch(updateTask({ id: editing.id, updates: { name: editing.name.trim(), priority: editing.priority, deadline: editing.deadline } }));
    closeEdit();
  };

  const onBack = (id) => dispatch(moveBack(id));
  const onForward = (id) => dispatch(moveForward(id));
  const onDelete = (id) => {
    showConfirm({
      title: "Delete task",
      message: "Delete this task?",
      onConfirm: () => {
        dispatch(deleteTask(id));
      }
    });
  };

  const onDragStart = (e, task) => {
    setDragging(task);
    try {
      e.dataTransfer.setData("text/plain", task.id);
      e.dataTransfer.effectAllowed = "move";
    } catch (err) {
      // some browsers may throw if dataTransfer is unavailable in certain contexts
    }
  };

  const onDragEnd = () => setDragging(null);

  const allowDrop = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const onDropToStage = (e, stageIndex) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain") || dragging?.id;
    if (!taskId) return;
    dispatch(moveToStage({ id: taskId, stage: stageIndex }));
    setDragging(null);
  };

  const onDropToTrash = (e) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain") || dragging?.id;
    if (!taskId) return;
    showConfirm({
      title: "Delete task",
      message: "Drop to trash — confirm delete?",
      onConfirm: () => dispatch(deleteTask(taskId))
    });
    setDragging(null);
  };

  if (authLoading) return <Container><Typography>Loading...</Typography></Container>;
  if (!isAuthenticated) return <Container><Typography>Please login to access the task board.</Typography></Container>;

  return (
    <Container sx={{ py: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Task Board</Typography>
        <Box display={"flex"} flexDirection={"column"} justifyContent={"center"} alignItems={"center"}>
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
          <Typography variant="body2" color="textSecondary">{user?.name || user?.username}</Typography>
        </Box>
      </Box>

      <Box display="flex" gap={2} mb={2} flexWrap="wrap">
        <TextField
          label="Task name"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          size="small"
        />
        <TextField
          select
          label="Priority"
          value={form.priority}
          onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
          size="small"
          sx={{ width: 140 }}
        >
          <MenuItem value="high">High</MenuItem>
          <MenuItem value="medium">Medium</MenuItem>
          <MenuItem value="low">Low</MenuItem>
        </TextField>

        <TextField
          type="date"
          label="Deadline"
          InputLabelProps={{ shrink: true }}
          value={form.deadline}
          onChange={(e) => setForm((p) => ({ ...p, deadline: e.target.value }))}
          size="small"
        />

        <Button variant="contained" onClick={handleCreate}>Create task</Button>
        <Button variant="contained" onClick={handleDashboard}>Go to dashboard</Button>
      </Box>

      {formError && <Typography color="error" mb={2}>{formError}</Typography>}

      <Grid container spacing={2}>
        {STAGES.map((stageName, idx) => (
          <Grid item xs={12} sm={6} md={6} key={stageName}>
            <Paper
              elevation={1}
              sx={{ p: 2, minHeight: 420 }}
              onDragOver={allowDrop}
              onDrop={(e) => onDropToStage(e, idx)}
            >
              <Typography variant="subtitle1" mb={1}>{stageName}</Typography>
              {tasks.filter((t) => t.stage === idx).length === 0 ? (
                <Typography color="textSecondary" variant="body2">No tasks</Typography>
              ) : (
                tasks
                  .filter((t) => t.stage === idx)
                  .map((task) => (
                    <Paper
                      key={task.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, task)}
                      onDragEnd={onDragEnd}
                      sx={{ p: 1, mt: 1 }}
                    >
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography>{task.name}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            {task.priority} • {task.deadline}
                          </Typography>
                        </Box>

                        <Box display="flex" gap={1}>
                          <Button size="small" disabled={task.stage === 0} onClick={() => onBack(task.id)}>Back</Button>
                          <Button size="small" onClick={() => openEdit(task)}>Edit</Button>
                          <Button size="small" color="error" onClick={() => onDelete(task.id)}>Delete</Button>
                          <Button size="small" disabled={task.stage === 3} onClick={() => onForward(task.id)}>Forward</Button>
                        </Box>
                      </Box>
                    </Paper>
                  ))
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>

      {dragging && (
        <Paper
          elevation={6}
          onDragOver={allowDrop}
          onDrop={onDropToTrash}
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
            p: 2,
            bgcolor: "error.main",
            color: "common.white",
            cursor: "pointer",
            borderRadius: "50px",
          }}
        >
          Drop to delete
        </Paper>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editing} onClose={closeEdit}>
        <DialogTitle>Edit task</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, width: 360, paddingTop: "10px !important" }}>
          <TextField
            label="Task name"
            value={editing?.name ?? ""}
            onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))}
            size="small"
          />
          <TextField
            select
            label="Priority"
            value={editing?.priority ?? ""}
            onChange={(e) => setEditing((p) => ({ ...p, priority: e.target.value }))}
            size="small"
          >
            <MenuItem value="high">High</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="low">Low</MenuItem>
          </TextField>
          <TextField
            type="date"
            label="Deadline"
            InputLabelProps={{ shrink: true }}
            value={editing?.deadline ?? ""}
            onChange={(e) => setEditing((p) => ({ ...p, deadline: e.target.value }))}
            size="small"
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={closeEdit}>Cancel</Button>
          <Button variant="contained" onClick={saveEdit}>Save</Button>
        </DialogActions>
      </Dialog>


      <Dialog open={alertOpen} onClose={() => setAlertOpen(false)}>
        <DialogTitle>Alert</DialogTitle>
        <DialogContent>
          <Typography>{alertMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAlertOpen(false)}>OK</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>{confirmTitle}</DialogTitle>
        <DialogContent>
          <Typography>{confirmMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {

              try {
                confirmAction();
              } finally {
                setConfirmOpen(false);
              }
            }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
