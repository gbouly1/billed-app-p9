import { screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import Bills from "../containers/Bills.js";
import { bills as mockBills } from "../fixtures/bills.js"; // Utilisation de mockBills
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router.js";

// Mock du store
jest.mock("../app/store", () => ({
  bills: jest.fn(() => ({
    list: jest.fn(() => Promise.resolve(mockBills)),
  })),
}));

describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
      })
    );
    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.append(root);
    router();
  });

  describe("When I am on Bills Page", () => {
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: mockBills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });

    test("Then clicking on the New Bill button should navigate to NewBill Page", () => {
      const onNavigate = jest.fn();
      const billsContainer = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });
      const handleClickNewBill = jest.fn(billsContainer.handleClickNewBill);
      const newBillButton = screen.getByTestId("btn-new-bill");
      newBillButton.addEventListener("click", handleClickNewBill);
      newBillButton.click();
      expect(handleClickNewBill).toHaveBeenCalled();
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["NewBill"]);
    });

    test("Then clicking on the eye icon should open the modal", () => {
      document.body.innerHTML = BillsUI({ data: mockBills });
      const billsContainer = new Bills({
        document,
        onNavigate: jest.fn(),
        store: null,
        localStorage: window.localStorage,
      });
      $.fn.modal = jest.fn(); // Mock jQuery modal function
      const eyeIcon = screen.getAllByTestId("icon-eye")[0];
      const handleClickIconEye = jest.fn(() =>
        billsContainer.handleClickIconEye(eyeIcon)
      );
      eyeIcon.addEventListener("click", handleClickIconEye);
      eyeIcon.click();
      expect(handleClickIconEye).toHaveBeenCalled();
      expect($.fn.modal).toHaveBeenCalled();
    });
  });

  // Test d'intégration GET Bills
  describe("When I navigate to Bills", () => {
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "a@a" })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);

      await waitFor(() => screen.getByText("Mes notes de frais"));
      const content = await waitFor(() => screen.getByTestId("tbody"));
      expect(content).toBeTruthy();

      // Récupère tous les éléments ayant le texte "test1" si plusieurs existent
      const billsElements = screen.getAllByText("test1");
      expect(billsElements.length).toBeGreaterThan(0); // Vérifie qu'il y a au moins un élément avec "test1"
    });

    test("fetches bills and fails with 404 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => ({
        list: jest.fn(() => Promise.reject(new Error("Erreur 404"))),
      }));

      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });

    test("fetches bills and fails with 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => ({
        list: jest.fn(() => Promise.reject(new Error("Erreur 500"))),
      }));

      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });
});
