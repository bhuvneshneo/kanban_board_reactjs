import { AppBar, Toolbar, Container, Box, Typography, Link as MuiLink } from "@mui/material";
import { styled } from "@mui/system";
import logoImage from "../assets/logo.jpg"; 
const ABOUT_TEXT = `NeoSOFT is a global technology and digital engineering company providing software development, IT consulting and digital transformation services. Headquartered in Mumbai, NeoSOFT has a large global footprint and multi-industry experience, helping enterprises with product engineering, cloud, data & AI and enterprise solutions.`;

const Main = styled("main")(({ theme }) => ({
  paddingTop: theme.spacing(3),
  paddingBottom: theme.spacing(6),
  minHeight: "calc(100vh - 128px)",
}));

export default function Layout({ children}) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppBar position="static" color="inherit" elevation={1}>
          <Toolbar disableGutters sx={{ display: "flex", justifyContent: "space-between", marginInline:4 }}>
                          <img
                src={logoImage}
                alt="Neosoft Logo"
                style={{
                  height: "80px",
                  width: "auto",
                  objectFit: "contain",
                  borderRadius: "4px",
                }}
              />
                <Box sx={{ ml: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Neosoft Kanban Board
                  </Typography>
                </Box>
          </Toolbar>
      </AppBar>
      <Main>
        <Container maxWidth="lg">{children}</Container>
      </Main>
    </Box>
  );
}
