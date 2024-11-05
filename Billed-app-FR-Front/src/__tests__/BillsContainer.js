/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import Bills from "../containers/Bills.js";
import { bills as mockBills } from "../fixtures/bills.js"; // Using mockBills
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router.js";

// Mocking the store
jest.mock("../app/store", () => ({
  bills: jest.fn(() => ({
    list: jest.fn(() => Promise.resolve(mockBills)),
  })),
}));

describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    // Mocking localStorage to simulate an employee user
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
      })
    );
    // Setting up the DOM and router for navigation
    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.append(root);
    router();
  });

  describe("When I am on Bills Page", () => {
    test("Then bills should be ordered from earliest to latest", () => {
      // Render the Bills UI with mock data
      document.body.innerHTML = BillsUI({ data: mockBills });

      // Extracting dates from the rendered UI and sorting them in descending order
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);

      // Assert that the dates are sorted in descending order
      expect(dates).toEqual(datesSorted);
    });

    test("Then clicking on the New Bill button should navigate to NewBill Page", () => {
      // Mock navigation function
      const onNavigate = jest.fn();

      // Create a Bills container instance with mocks
      const billsContainer = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      // Mock the handleClickNewBill function
      const handleClickNewBill = jest.fn(billsContainer.handleClickNewBill);
      const newBillButton = screen.getByTestId("btn-new-bill");

      // Add event listener and simulate button click
      newBillButton.addEventListener("click", handleClickNewBill);
      newBillButton.click();

      // Assert that handleClickNewBill and onNavigate were called
      expect(handleClickNewBill).toHaveBeenCalled();
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["NewBill"]);
    });

    test("Then clicking on the eye icon should open the modal", () => {
      // Render the Bills UI with mock data
      document.body.innerHTML = BillsUI({ data: mockBills });

      // Create a Bills container instance with mocks
      const billsContainer = new Bills({
        document,
        onNavigate: jest.fn(),
        store: null,
        localStorage: window.localStorage,
      });

      // Mock jQuery modal function
      $.fn.modal = jest.fn();

      // Select the first eye icon and mock the handleClickIconEye function
      const eyeIcon = screen.getAllByTestId("icon-eye")[0];
      const handleClickIconEye = jest.fn(() =>
        billsContainer.handleClickIconEye(eyeIcon)
      );

      // Add event listener and simulate icon click
      eyeIcon.addEventListener("click", handleClickIconEye);
      eyeIcon.click();

      // Assert that handleClickIconEye was called and the modal was opened
      expect(handleClickIconEye).toHaveBeenCalled();
      expect($.fn.modal).toHaveBeenCalled();
    });
  });
});
