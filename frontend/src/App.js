import { BrowserRouter as Router } from "react-router-dom";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import store, { persistor } from "./app/store";
import AppRoutes from "./routes/AppRoutes";
import Layout from "./components/Layout";

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <Router>
          <Layout>
          <AppRoutes />
          </Layout>
        </Router>
      </PersistGate>
    </Provider>
  );
}

export default App;
