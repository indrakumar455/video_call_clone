import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import CssBaseline from "@mui/material/CssBaseline";
import FormControlLabel from "@mui/material/FormControlLabel";
import Divider from "@mui/material/Divider";
import FormLabel from "@mui/material/FormLabel";
import FormControl from "@mui/material/FormControl";
import Link from "@mui/material/Link";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import MuiCard from "@mui/material/Card";
import { styled } from "@mui/material/styles";
import Avatar from "@mui/material/Avatar";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { AuthContext } from "../contexts/authContext";
import Snackbar from "@mui/material/Snackbar";

const Card = styled(MuiCard)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignSelf: "center",
  width: "100%",
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: "auto",
  [theme.breakpoints.up("sm")]: {
    maxWidth: "450px",
  },
  boxShadow:
    "hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px",
  ...theme.applyStyles("dark", {
    boxShadow:
      "hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px",
  }),
}));

const SignInContainer = styled(Stack)(({ theme }) => ({
  height: "calc((1 - var(--template-frame-height, 0)) * 100dvh)",
  minHeight: "100%",
  padding: theme.spacing(2),
  [theme.breakpoints.up("sm")]: {
    padding: theme.spacing(4),
  },
  "&::before": {
    content: '""',
    display: "block",
    position: "absolute",
    zIndex: -1,
    inset: 0,
    backgroundImage:
      "radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))",
    backgroundRepeat: "no-repeat",
    ...theme.applyStyles("dark", {
      backgroundImage:
        "radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))",
    }),
  },
}));

export default function Authentication(props) {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState("");
  const [messages, setMessages] = React.useState([]);

  const [formState, setFormState] = React.useState(0);

  const { handleRegister, handleLogin } = React.useContext(AuthContext);
  let handleAuth = async () => {
    try {
      if (formState === 0) {
        let result = await handleLogin(username, password);
        console.log(result);
        setMessages(result);
        setUsername("");
        setOpen(true);
        setError("");
        setFormState(0);
        setPassword("");
      }
      if (formState === 1) {
        let result = await handleRegister(name, username, password);
        console.log(result);
        setMessages(result);
        setUsername("");
        setName("");
        setOpen(true);
        setError("");
        setFormState(0);
        setPassword("");
      }
    } catch (err) {
      const message = err?.response?.data?.message || "Something went wrong!";
      setError(message);
    }
  };
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <CssBaseline enableColorScheme />
      <SignInContainer direction="column" justifyContent="space-between">
        <Card variant="outlined">
          <Avatar
            sx={{ m: 1, bgcolor: "secondary.main" }}
            style={{ marginLeft: "10.5rem" }}
          >
            <LockOutlinedIcon />
          </Avatar>
          <div style={{ textAlign: "center" }}>
            <Button
              variant={formState == 0 ? "contained" : ""}
              onClick={() => setFormState(0)}
            >
              sign in
            </Button>
            <Button
              variant={formState == 1 ? "contained" : ""}
              onClick={() => setFormState(1)}
            >
              sign up
            </Button>
          </div>
          <Box
            component="form"
            noValidate
            sx={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              gap: 2,
            }}
          >
            {formState == 1 && (
              <FormControl>
                <FormLabel htmlFor="email">Full Name</FormLabel>
                <TextField
                  id="name"
                  type="text"
                  name="name"
                  placeholder="full name"
                  autoFocus
                  required
                  fullWidth
                  value={name || ""}
                  variant="outlined"
                  onChange={(e) => setName(e.target.value)}
                />
              </FormControl>
            )}
            <FormControl>
              <FormLabel htmlFor="username">Username</FormLabel>

              <TextField
                id="username"
                type="username"
                name="username"
                placeholder="username"
                autoFocus
                required
                value={username || ""}
                fullWidth
                variant="outlined"
                onChange={(e) => setUsername(e.target.value)}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="password">Password</FormLabel>
              <TextField
                name="password"
                placeholder="passoword"
                type="password"
                id="password"
                autoFocus
                required
                fullWidth
                value={password || ""}
                variant="outlined"
                onChange={(e) => setPassword(e.target.value)}
              />
            </FormControl>

            <p style={{ color: "red" }}>{error}</p>
            <Button
              type="button"
              fullWidth
              variant="contained"
              onClick={handleAuth}
            >
              {formState === 0 ? "Login" : "Register"}
            </Button>
          </Box>
        </Card>
        <Snackbar
          open={open}
          autoHideDuration={4000}
          message={messages}
          sx={{
            "& .MuiSnackbarContent-root": {
              backgroundColor: "black", // background
              color: "white", // text color
            },
          }}
        />
      </SignInContainer>
    </>
  );
}
