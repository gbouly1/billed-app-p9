/**
 * @jest-environment jsdom
 */

import { screen, fireEvent } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import "@testing-library/jest-dom/extend-expect";
import { ROUTES_PATH } from "../constants/routes.js";

describe("Given im connected as employee", () => {
  describe("When im on NewBill page", () => {
    test("Then the file should be uploaded and the bill information should be set", async () => {
      // Mock localStorage
      const mockLocalStorage = {
        getItem: jest
          .fn()
          .mockReturnValue(JSON.stringify({ email: "test@example.com" })),
      };
      Object.defineProperty(window, "localStorage", {
        value: mockLocalStorage,
      });

      // Mock store with the create method of bills
      const mockCreate = jest
        .fn()
        .mockResolvedValue({ fileUrl: "http://example.com/file", key: "123" });
      const mockStore = {
        bills: jest.fn(() => ({ create: mockCreate })),
      };

      // Set up the DOM with NewBillUI
      document.body.innerHTML = NewBillUI();
      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage,
      });

      // Create a dummy file for the test
      const file = new File(["dummy content"], "test.jpg", {
        type: "image/jpeg",
      });

      // Select the file input and trigger a change to simulate the upload
      const fileInput = screen.getByTestId("file");
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Submit the form is simulated by calling handleChangeFile
      // `handleChangeFile` is the method that should be called when the file is selected
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
      fileInput.addEventListener("change", handleChangeFile);
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Wait for all promises to resolve to ensure that `mockCreate` is called
      await new Promise(process.nextTick);

      // Assertions
      // Check that the handleChangeFile method has been called
      expect(handleChangeFile).toHaveBeenCalled();

      // Check that the store's create method has been called with the correct arguments
      // This directly tests the POST call to the API to create a bill
      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.any(FormData), // Check that the data sent is of type FormData
        headers: { noContentType: true }, // Check that the headers are correct
      });

      // Retrieve the FormData from the mock calls to the create method
      const formData = mockCreate.mock.calls[0][0].data;

      // Check that the FormData contains the correct file
      expect(formData.get("file")).toEqual(file);

      // Check that the FormData contains the user's email
      expect(formData.get("email")).toEqual("test@example.com");

      // Check that the bill properties are correctly set after the POST call
      expect(newBill.billId).toBe("123");
      expect(newBill.fileUrl).toBe("http://example.com/file");
      expect(newBill.fileName).toBe("test.jpg");
    });

    test("Then the file extension validation should work when the file extension is not allowed", () => {
      // Create a NewBill instance with the appropriate mocks
      const mockLocalStorage = {
        getItem: jest
          .fn()
          .mockReturnValue(JSON.stringify({ email: "test@example.com" })),
      };
      const mockStore = {
        bills: jest.fn().mockReturnValue({
          create: jest
            .fn()
            .mockResolvedValue({ fileUrl: "example.com", key: "123" }),
        }),
      };
      document.body.innerHTML = NewBillUI();
      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: mockLocalStorage,
      });

      // Spy on the `alert` method
      const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});

      // Create a file with a disallowed extension (e.g., a text file)
      const file = new File(["dummy content"], "test.txt", {
        type: "text/plain",
      });

      // Select the file input element and assign the created file
      const fileInput = screen.getByTestId("file");
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Check that the alert was shown
      expect(alertSpy).toHaveBeenCalledWith("fichier non accepté");

      // Clean up the mock for `alert` after the test
      alertSpy.mockRestore();
    });

    test("Then the file should be uploaded and the bill information should be set", async () => {
      // Mock localStorage
      const mockLocalStorage = {
        getItem: jest
          .fn()
          .mockReturnValue(JSON.stringify({ email: "test@example.com" })),
      };
      Object.defineProperty(window, "localStorage", {
        value: mockLocalStorage,
      });

      // Mock store with the create method of bills
      const mockCreate = jest
        .fn()
        .mockResolvedValue({ fileUrl: "http://example.com/file", key: "123" });
      const mockStore = {
        bills: jest.fn(() => ({ create: mockCreate })),
      };

      // Spy on console.error
      const consoleErrorSpy = jest.spyOn(console, "error");

      // Set up the DOM with NewBillUI
      document.body.innerHTML = NewBillUI();
      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage,
      });

      // File input change event
      const file = new File(["dummy content"], "test.jpg", {
        type: "image/jpeg",
      });
      const fileInput = screen.getByTestId("file");
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Simulated form submission
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
      fileInput.addEventListener("change", handleChangeFile);
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Wait for promises to resolve
      await new Promise(process.nextTick);

      // Assertions
      expect(handleChangeFile).toHaveBeenCalled();
      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.any(FormData),
        headers: { noContentType: true },
      });

      const formData = mockCreate.mock.calls[0][0].data;
      expect(formData.get("file")).toEqual(file);
      expect(formData.get("email")).toEqual("test@example.com");
      expect(newBill.billId).toBe("123");
      expect(newBill.fileUrl).toBe("http://example.com/file");
      expect(newBill.fileName).toBe("test.jpg");

      // Verify that console.error is not called
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    test("Then the form should be submitted with the correct data", () => {
      // Mock localStorage
      const mockLocalStorage = {
        getItem: jest
          .fn()
          .mockReturnValue(JSON.stringify({ email: "test@example.com" })),
      };
      Object.defineProperty(window, "localStorage", {
        value: mockLocalStorage,
      });

      // Mock store and onNavigate
      const mockStore = {
        bills: jest.fn(() => ({
          create: jest.fn().mockResolvedValue({
            fileUrl: "http://example.com/file",
            key: "123",
          }),
          update: jest.fn().mockResolvedValue({}), // Add this line
        })),
      };
      const mockOnNavigate = jest.fn();

      // Set up the DOM with NewBillUI
      document.body.innerHTML = NewBillUI();
      const newBill = new NewBill({
        document,
        onNavigate: mockOnNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      // Define fileUrl and fileName
      newBill.fileUrl = "http://example.com/file";
      newBill.fileName = "test.jpg";

      // Fill the form
      screen.getByTestId("expense-type").value = "Transports";
      screen.getByTestId("expense-name").value = "Train ticket";
      screen.getByTestId("amount").value = "50";
      screen.getByTestId("datepicker").value = "2022-12-01";
      screen.getByTestId("vat").value = "10";
      screen.getByTestId("pct").value = "20";
      screen.getByTestId("commentary").value = "Business trip";

      // Spy on updateBill
      const updateBillSpy = jest.spyOn(newBill, "updateBill");

      // Simulate form submission
      const form = screen.getByTestId("form-new-bill");
      fireEvent.submit(form);

      // Verify that updateBill is called with the correct data
      expect(updateBillSpy).toHaveBeenCalledWith({
        email: "test@example.com",
        type: "Transports",
        name: "Train ticket",
        amount: 50,
        date: "2022-12-01",
        vat: "10",
        pct: 20,
        commentary: "Business trip",
        fileUrl: "http://example.com/file",
        fileName: "test.jpg",
        status: "pending",
      });

      // Verify that onNavigate is called with the correct path
      expect(mockOnNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"]);
    });

    test("Then updateBill should call update from the store with the correct data and navigate to the Bills page", async () => {
      // Mock store and onNavigate
      const mockUpdate = jest.fn().mockResolvedValue({});
      const mockStore = {
        bills: jest.fn(() => ({
          update: mockUpdate,
        })),
      };
      const mockOnNavigate = jest.fn();

      // Create a NewBill instance
      const newBill = new NewBill({
        document: document,
        onNavigate: mockOnNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      // Define billId
      newBill.billId = "123";

      // Create a bill object to update
      const bill = {
        email: "test@example.com",
        type: "Transports",
        name: "Train ticket",
        amount: 50,
        date: "2022-12-01",
        vat: "10",
        pct: 20,
        commentary: "Business trip",
        fileUrl: "http://example.com/file",
        fileName: "test.jpg",
        status: "pending",
      };

      // Call updateBill
      await newBill.updateBill(bill);

      // Verify that update is called with the correct arguments
      expect(mockUpdate).toHaveBeenCalledWith({
        data: JSON.stringify(bill),
        selector: "123",
      });

      // Verify that onNavigate is called with the correct path
      expect(mockOnNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"]);
    });
  });
});
