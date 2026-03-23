import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/routes";
import { ensureSessionUser, getUser } from "./services/session";

const App = () => {
  useEffect(() => {
    if (getUser()?.id) return;
    void ensureSessionUser();
  }, []);

  return <RouterProvider router={router} />;
};

export default App;
