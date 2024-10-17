/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import router from "../app/Router.js";
import { ROUTES_PATH } from "../constants/routes.js";

jest.mock("../app/store", () => mockStore);
jest.spyOn(window, "alert").mockImplementation(() => {}); // Mock alert
jest.spyOn(console, "error").mockImplementation(() => {}); // Mock console.error

describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));

    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.append(root);
    router();
  });

  describe("When I am on NewBill Page", () => {
    test("Then the NewBill form should be displayed", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      expect(screen.getByTestId("form-new-bill")).toBeTruthy();
    });

    test("Then submitting the form should trigger handleSubmit", async () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      const onNavigate = jest.fn();
      const store = mockStore;

      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });

      const handleSubmit = jest.spyOn(newBill, "handleSubmit");
      const form = screen.getByTestId("form-new-bill");

      form.addEventListener("submit", handleSubmit);

      fireEvent.submit(form);

      expect(handleSubmit).toHaveBeenCalled();
      await waitFor(() => expect(store.bills().create).toHaveBeenCalled());
    });

    test("Then file input should only accept jpg, jpeg, or png files", async () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      const onNavigate = jest.fn();
      const store = mockStore;

      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });

      const handleChangeFile = jest.spyOn(newBill, "handleChangeFile");
      const fileInput = screen.getByTestId("file");

      fileInput.addEventListener("change", handleChangeFile);

      // Test avec un fichier valide (jpg)
      const validFile = new File(["image"], "image.jpg", { type: "image/jpg" });
      fireEvent.change(fileInput, { target: { files: [validFile] } });

      expect(handleChangeFile).toHaveBeenCalled();
      await waitFor(() => expect(store.bills().create).toHaveBeenCalled());

      // Test avec un fichier invalide (pdf)
      const invalidFile = new File(["file"], "file.pdf", {
        type: "application/pdf",
      });
      fireEvent.change(fileInput, { target: { files: [invalidFile] } });

      expect(window.alert).toHaveBeenCalledWith(
        "Veuillez sélectionner un fichier au format jpg, jpeg ou png"
      );
    });
  });

  describe("When I submit a new bill", () => {
    test("Then the new bill should be created and stored", async () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      const onNavigate = jest.fn();
      const store = mockStore;

      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });

      const handleSubmit = jest.spyOn(newBill, "handleSubmit");
      const form = screen.getByTestId("form-new-bill");

      form.addEventListener("submit", handleSubmit);

      fireEvent.submit(form);

      expect(handleSubmit).toHaveBeenCalled();
      await waitFor(() => expect(store.bills().create).toHaveBeenCalled());
    });
  });

  describe("When I upload a file", () => {
    test("Then file upload should call store.bills().create and succeed", async () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      const onNavigate = jest.fn();
      const store = mockStore;

      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });

      const handleChangeFile = jest.spyOn(newBill, "handleChangeFile");
      const fileInput = screen.getByTestId("file");

      fileInput.addEventListener("change", handleChangeFile);

      const file = new File(["image"], "image.jpg", { type: "image/jpg" });
      fireEvent.change(fileInput, { target: { files: [file] } });

      expect(handleChangeFile).toHaveBeenCalled();
      await waitFor(() => expect(store.bills().create).toHaveBeenCalled());
    });

    test("Then file upload should fail and catch the error", async () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      const onNavigate = jest.fn();
      const store = {
        bills: jest.fn(() => ({
          create: jest.fn().mockRejectedValueOnce(new Error("Erreur API")),
        })),
      };

      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });

      const handleChangeFile = jest.spyOn(newBill, "handleChangeFile");
      const fileInput = screen.getByTestId("file");

      fileInput.addEventListener("change", handleChangeFile);

      const file = new File(["image"], "image.jpg", { type: "image/jpg" });
      fireEvent.change(fileInput, { target: { files: [file] } });

      expect(handleChangeFile).toHaveBeenCalled();
      await waitFor(() => expect(store.bills().create).toHaveBeenCalled());
      expect(console.error).toHaveBeenCalledWith(new Error("Erreur API"));
    });
  });

  // test d'intégration POST
  describe("When I submit a valid form", () => {
    test("Then a POST request should be sent to create a new bill", async () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      const onNavigate = jest.fn();
      const store = {
        bills: jest.fn(() => ({
          create: jest.fn().mockResolvedValue({}), // Mock la fonction create
        })),
      };

      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });

      // Espionner la méthode handleSubmit
      const handleSubmit = jest.spyOn(newBill, "handleSubmit");

      // Remplir le formulaire avec des données valides
      screen.getByTestId("expense-type").value = "Transports";
      screen.getByTestId("expense-name").value = "Vol Paris Londres";
      screen.getByTestId("datepicker").value = "2023-10-01";
      screen.getByTestId("amount").value = "300";
      screen.getByTestId("vat").value = "70";
      screen.getByTestId("pct").value = "20";
      screen.getByTestId("commentary").value = "Voyage d'affaires";

      const fileInput = screen.getByTestId("file");
      const file = new File(["image"], "image.jpg", { type: "image/jpg" });
      fireEvent.change(fileInput, { target: { files: [file] } });

      const form = screen.getByTestId("form-new-bill");

      // Attache manuellement l'événement
      form.addEventListener("submit", newBill.handleSubmit);

      fireEvent.submit(form);

      // Vérification
      expect(handleSubmit).toHaveBeenCalled();
      await waitFor(() => expect(store.bills().create).toHaveBeenCalled()); // Vérifie que create est bien appelé
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"]);
    });
  });

  // Test de couverture des lignes non testées
  describe("When store.bills().create is successful", () => {
    test("Then the billId, fileUrl, and fileName should be set", async () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      const onNavigate = jest.fn();
      const store = {
        bills: jest.fn(() => ({
          create: jest.fn().mockResolvedValue({
            fileUrl: "https://some-url.com",
            key: "12345",
          }),
        })),
      };

      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });

      const fileInput = screen.getByTestId("file");
      const file = new File(["image"], "image.jpg", { type: "image/jpg" });
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => expect(store.bills().create).toHaveBeenCalled());

      expect(newBill.fileUrl).toEqual("https://some-url.com");
      expect(newBill.billId).toEqual("12345");
      expect(newBill.fileName).toEqual("image.jpg");
    });
  });
});
