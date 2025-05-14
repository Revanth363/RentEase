import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { resetAuthState } from "../store/slices/authSlice";

export default function GoogleAuthSuccess() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(resetAuthState());
    localStorage.setItem("isAuthenticated", "true");
    window.location.replace("/");
  }, [dispatch]);

  return <p>Signing you in with Google...</p>;
}
