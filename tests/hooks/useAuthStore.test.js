import { act, renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore, current } from "@reduxjs/toolkit";
import { authSlice } from "../../src/store";
import { useAuthStore } from "../../src/hooks/useAuthStore";
import { initialState, notAuthenticatedState } from "../fixtures/authStates";
import { testUserCredentials } from "../fixtures/testUser";
import { calendarApi } from "../../src/api";

const getMockStore = (initialState) => {
  return configureStore({
    reducer: {
      auth: authSlice.reducer,
    },
    preloadedState: {
      auth: { ...initialState },
    },
  });
};

describe("Pruebas en useAuthStore", () => {
  beforeEach(() => localStorage.clear());

  test("debe de regresar los valores por defecto", () => {
    const mockStore = getMockStore({ ...initialState });

    const { result } = renderHook(() => useAuthStore(), {
      wrapper: ({ children }) => (
        <Provider store={mockStore}>{children}</Provider>
      ),
    });

    expect(result.current).toEqual({
      ...initialState,
      startLogin: expect.any(Function),
      startLogout: expect.any(Function),
      startRegister: expect.any(Function),
      checkAuthToken: expect.any(Function),
    });
  });

  test("starLogin debe de realizar el login correctamente", async () => {
    const mockStore = getMockStore({ ...notAuthenticatedState });

    const { result } = renderHook(() => useAuthStore(), {
      wrapper: ({ children }) => (
        <Provider store={mockStore}>{children}</Provider>
      ),
    });

    await act(async () => {
      try {
        await result.current.startLogin(testUserCredentials);
      } catch (error) {
        console.log(error);
      }
    });

    const { errorMessage, status, user } = result.current;

    expect({ errorMessage, status, user }).toEqual({
      errorMessage: undefined,
      status: "authenticated",
      user: { name: "Test User", uid: "67db4307a9b9a1f65225fd4d" },
    });
    expect(localStorage.getItem("token")).toEqual(expect.any(String));
    expect(localStorage.getItem("token-init-date")).toEqual(expect.any(String));
  });

  test("startLogin debe de fallar la autenticación", async () => {
    const mockStore = getMockStore({ ...notAuthenticatedState });

    const { result } = renderHook(() => useAuthStore(), {
      wrapper: ({ children }) => (
        <Provider store={mockStore}>{children}</Provider>
      ),
    });

    await act(async () => {
      try {
        await result.current.startLogin({
          email: "algo@google.com",
          password: "123456789",
        });
      } catch (error) {
        console.log(error);
      }
    });

    const { errorMessage, status, user } = result.current;

    expect(localStorage.getItem("token")).toBe(null);
    expect(localStorage.getItem("token-init-date")).toBe(null);

    expect({ errorMessage, status, user }).toEqual({
      errorMessage: expect.any(String),
      status: "not-authenticated",
      user: {},
    });

    await waitFor(() => expect(result.current.errorMessage).toBe(undefined));
  });

  test("startRegister debe de crear un usuario", async () => {
    const newUser = {
      email: "algo@google.com",
      password: "123456789",
      name: "Test User 2",
    };

    const mockStore = getMockStore({ ...notAuthenticatedState });

    const { result } = renderHook(() => useAuthStore(), {
      wrapper: ({ children }) => (
        <Provider store={mockStore}>{children}</Provider>
      ),
    });

    // Creamos un spy para hacer un mock del return del post de calendarApi.
    const spy = jest.spyOn(calendarApi, "post").mockReturnValue({
      data: {
        ok: true,
        uid: "test-id",
        name: "test-user",
        token: "test-token",
      },
    });

    await act(async () => {
      try {
        await result.current.startRegister(newUser);
      } catch (error) {
        console.log(error);
      }
    });

    const { errorMessage, status, user } = result.current;

    expect({ errorMessage, status, user }).toEqual({
      errorMessage: undefined,
      status: "authenticated",
      user: { name: "test-user", uid: "test-id" },
    });

    // Restaurar el spy para que si otro test utilizar el post de calendarApi, pueda llegar tranquilamente al backend y no utilizar este mock.
    spy.mockRestore();
  });

  test("startRegister debe de fallar la creación", async () => {
    const mockStore = getMockStore({ ...notAuthenticatedState });

    const { result } = renderHook(() => useAuthStore(), {
      wrapper: ({ children }) => (
        <Provider store={mockStore}>{children}</Provider>
      ),
    });

    await act(async () => {
      try {
        await result.current.startRegister(testUserCredentials);
      } catch (error) {
        console.log(error);
      }
    });

    const { status, user, errorMessage } = result.current;

    expect({ status, user, errorMessage }).toEqual({
      status: "not-authenticated",
      user: {},
      errorMessage: "El email ingresado ya se encuentra en uso",
    });
  });

  test("checkOutToken debe de fallar si no hay token", async () => {
    const mockStore = getMockStore({ ...initialState });

    const { result } = renderHook(() => useAuthStore(), {
      wrapper: ({ children }) => (
        <Provider store={mockStore}>{children}</Provider>
      ),
    });

    await act(async () => {
      try {
        await result.current.checkAuthToken();
      } catch (error) {
        console.log(error);
      }
    });

    const { errorMessage, status, user } = result.current;

    expect({ errorMessage, status, user }).toEqual({
      status: "not-authenticated",
      user: {},
      errorMessage: undefined,
    });
  });

  test("checkAuthToken debe de autenticar el usuario si hay un token (con spy y mocks)", async () => {
    localStorage.setItem("token", "test-token");

    const mockStore = getMockStore({ ...initialState });

    const { result } = renderHook(() => useAuthStore(), {
      wrapper: ({ children }) => (
        <Provider store={mockStore}>{children}</Provider>
      ),
    });

    const spy = jest.spyOn(calendarApi, "get").mockReturnValue({
      data: {
        ok: true,
        uid: "test-id",
        name: "test-user",
        token: "test-token",
      },
    });

    await act(async () => {
      try {
        await result.current.checkAuthToken();
      } catch (error) {
        console.log(error);
      }
    });

    const { errorMessage, user, status } = result.current;

    expect({ errorMessage, user, status }).toEqual({
      status: "authenticated",
      user: { name: "test-user", uid: "test-id" },
      errorMessage: undefined,
    });

    spy.mockRestore();
  });

  test("checkAuthToken debe de autenticar el usuario si hay un token (usuario real de la db)", async () => {
    const { data } = await calendarApi.post("/auth", testUserCredentials);

    localStorage.setItem("token", data?.token);

    const mockStore = getMockStore({ ...initialState });

    const { result } = renderHook(() => useAuthStore(), {
      wrapper: ({ children }) => (
        <Provider store={mockStore}>{children}</Provider>
      ),
    });

    await act(async () => {
      try {
        await result.current.checkAuthToken();
      } catch (error) {
        console.log(error);
      }
    });

    const { errorMessage, user, status } = result.current;

    expect({ errorMessage, user, status }).toEqual({
      status: "authenticated",
      user: { name: "Test User", uid: testUserCredentials.uid },
      errorMessage: undefined,
    });
  });
});
