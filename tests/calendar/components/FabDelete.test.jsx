import { Provider } from "react-redux";
import { render, screen } from "@testing-library/react";
import { FabDelete } from "../../../src/calendar/components/FabDelete";
import { store } from "../../../src/store/store";

describe("Pruebas en <FabDelete />", () => {
  test("debe de mostrar el componente correctamente", () => {
    render(
      <Provider store={store}>
        <FabDelete />
      </Provider>
    );
    screen.debug();
  });
});
